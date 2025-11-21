import axios from 'axios'
import { WeatherData } from '../types/weatherInputs'

export class WeatherService {
  private static calculateCDD0(temperatures: number[]): number {
    // Cooling Degree Days above 0°C
    return temperatures.reduce((sum, temp) => sum + Math.max(0, temp - 0), 0)
  }

  private static calculateQV2M(
    temp: number,
    rh: number,
    pressure: number
  ): number {
    // Calculate specific humidity (kg/kg)
    const es = 6.112 * Math.exp((17.67 * temp) / (temp + 243.5)) // saturation vapor pressure (hPa)
    const e = es * (rh / 100) // vapor pressure (hPa)
    return (0.622 * e) / (pressure - 0.378 * e) // specific humidity
  }

  // PRIMARY SOURCE: Open-Meteo (16-day forecasts)
  private static async getOpenMeteoForecast(
    lat: number,
    lon: number
  ): Promise<Partial<WeatherData>> {
    try {
      const url = 'https://api.open-meteo.com/v1/forecast'

      const params = {
        latitude: lat,
        longitude: lon,
        forecast_days: 16,
        hourly:
          'temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m',
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_sum',
          'et0_fao_evapotranspiration',
          'shortwave_radiation_sum',
          'soil_moisture_0_to_1cm',
          'soil_moisture_1_to_3cm',
          'soil_moisture_3_to_9cm',
          'soil_moisture_9_to_27cm',
          'soil_moisture_27_to_81cm',
        ].join(','),
        models: 'gfs_seamless',
        timezone: 'auto',
      }

      const response = await axios.get(url, { params })
      const data = response.data

      if (!data.hourly || !data.daily) {
        throw new Error('Invalid response from Open-Meteo API')
      }

      // Use TOMORROW's forecast (index 1) for better accuracy
      const forecastIndex = 1

      // Get tomorrow's hourly data (hours 24-47)
      const hourlyTemp = data.hourly.temperature_2m.slice(24, 48)
      const hourlyRh = data.hourly.relative_humidity_2m.slice(24, 48)
      const hourlyPressure = data.hourly.surface_pressure.slice(24, 48)
      const hourlyWind = data.hourly.wind_speed_10m.slice(24, 48)

      const avgTemp =
        hourlyTemp.reduce((a: number, b: number) => a + b, 0) /
        hourlyTemp.length
      const avgRh =
        hourlyRh.reduce((a: number, b: number) => a + b, 0) / hourlyRh.length
      const avgPressure =
        hourlyPressure.reduce((a: number, b: number) => a + b, 0) /
        hourlyPressure.length
      const avgWind =
        hourlyWind.reduce((a: number, b: number) => a + b, 0) /
        hourlyWind.length

      const openMeteoData: Partial<WeatherData> = {
        // Soil moisture forecasts
        GWETROOT: data.daily.soil_moisture_27_to_81cm[forecastIndex] || 0.3,
        GWETTOP: data.daily.soil_moisture_0_to_1cm[forecastIndex] || 0.25,
        GWETPROF: data.daily.soil_moisture_9_to_27cm[forecastIndex] || 0.4,

        // Core weather parameters
        PRECTOTCORR: data.daily.precipitation_sum[forecastIndex] || 0,
        EVPTRNS: data.daily.et0_fao_evapotranspiration[forecastIndex] || 0,
        T2M: avgTemp,
        TS_MAX: data.daily.temperature_2m_max[forecastIndex] || avgTemp,
        TS_MIN: data.daily.temperature_2m_min[forecastIndex] || avgTemp,
        ALLSKY_SFC_SW_DWN:
          data.daily.shortwave_radiation_sum[forecastIndex] || 0,
        RH2M: avgRh,
        WS10M: avgWind,
        PS: avgPressure,
        EVLAND: data.daily.et0_fao_evapotranspiration[forecastIndex] || 0, // Same as EVPTRNS

        // Calculated parameters
        CDD0: this.calculateCDD0(hourlyTemp),
        QV2M: this.calculateQV2M(avgTemp, avgRh, avgPressure),
      }

      console.log('=== OPEN-METEO FORECAST DATA ===')
      console.log('Precipitation:', openMeteoData.PRECTOTCORR, 'mm')
      console.log('Soil Moisture (Root):', openMeteoData.GWETROOT)
      console.log('Temperature (Avg):', openMeteoData.T2M, '°C')
      console.log('Evapotranspiration:', openMeteoData.EVPTRNS, 'mm')
      console.log('Solar Radiation:', openMeteoData.ALLSKY_SFC_SW_DWN, 'MJ/m²')

      return openMeteoData
    } catch (error) {
      console.error('Open-Meteo forecast error:', error)
      return {}
    }
  }

  // SECONDARY SOURCE: WeatherAPI.com (for validation and missing data)
  private static async getWeatherAPIBackup(
    lat: number,
    lon: number
  ): Promise<Partial<WeatherData>> {
    try {
      // Sign up for free at https://www.weatherapi.com/
      const API_KEY = process.env.WEATHERAPI_KEY

      const response = await axios.get(
        `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=7&aqi=no&alerts=no`
      )

      const data = response.data
      const forecastDay = data.forecast.forecastday[1] // Tomorrow's forecast

      const weatherAPIData: Partial<WeatherData> = {
        // Use WeatherAPI as backup for critical parameters
        PRECTOTCORR: forecastDay.day.totalprecip_mm || 0,
        T2M: forecastDay.day.avgtemp_c,
        TS_MAX: forecastDay.day.maxtemp_c,
        TS_MIN: forecastDay.day.mintemp_c,
        RH2M: data.current.humidity, // Use current as proxy
        WS10M: data.current.wind_kph / 3.6, // Convert to m/s
        PS: data.current.pressure_mb,
      }

      console.log(
        'WeatherAPI Backup - Precip:',
        weatherAPIData.PRECTOTCORR,
        'mm'
      )

      return weatherAPIData
    } catch (error) {
      console.error('WeatherAPI backup error:', error)
      return {}
    }
  }

  // TERTIARY SOURCE: Visual Crossing (for solar radiation backup)
  private static async getVisualCrossingBackup(
    lat: number,
    lon: number
  ): Promise<Partial<WeatherData>> {
    try {
      const API_KEY = process.env.VISUAL_CROSSING_KEY || 'YOUR_FREE_API_KEY'

      const response = await axios.get(
        `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}?key=${API_KEY}&unitGroup=metric&include=days`
      )

      const data = response.data
      const tomorrow = data.days[1] // Tomorrow's forecast

      const vcData: Partial<WeatherData> = {
        ALLSKY_SFC_SW_DWN: tomorrow.solarradiation || tomorrow.uvindex * 2.5, // Estimate from UV
        PRECTOTCORR: tomorrow.precip || 0,
        TS_MAX: tomorrow.tempmax,
        TS_MIN: tomorrow.tempmin,
        T2M: tomorrow.temp,
      }

      console.log(
        'Visual Crossing - Solar Radiation:',
        vcData.ALLSKY_SFC_SW_DWN
      )

      return vcData
    } catch (error) {
      console.error('Visual Crossing backup error:', error)
      return {}
    }
  }

  // MAIN METHOD: Combine all sources
  static async getCompleteForecastData(
    lat: number = 9.5612,
    lon: number = 44.0669
  ): Promise<WeatherData> {
    try {
      console.log('🚀 Fetching complete forecast data...')

      // Get primary data from Open-Meteo
      const primaryData = await this.getOpenMeteoForecast(lat, lon)

      // Get backup data in parallel
      const [backupData1, backupData2] = await Promise.all([
        this.getWeatherAPIBackup(lat, lon),
        this.getVisualCrossingBackup(lat, lon),
      ])

      // Merge data with priority: Open-Meteo > WeatherAPI > Visual Crossing
      const mergedData: WeatherData = {
        // Start with Open-Meteo data (highest priority)
        ...primaryData,

        // Fill any missing critical parameters from backups
        PRECTOTCORR:
          primaryData.PRECTOTCORR ??
          backupData1.PRECTOTCORR ??
          backupData2.PRECTOTCORR ??
          0,
        ALLSKY_SFC_SW_DWN:
          primaryData.ALLSKY_SFC_SW_DWN ?? backupData2.ALLSKY_SFC_SW_DWN ?? 0,
        T2M: primaryData.T2M ?? backupData1.T2M ?? backupData2.T2M ?? 20,
        TS_MAX:
          primaryData.TS_MAX ?? backupData1.TS_MAX ?? backupData2.TS_MAX ?? 25,
        TS_MIN:
          primaryData.TS_MIN ?? backupData1.TS_MIN ?? backupData2.TS_MIN ?? 15,

        // Ensure all parameters have values
        GWETROOT: primaryData.GWETROOT ?? 0.3,
        GWETTOP: primaryData.GWETTOP ?? 0.25,
        GWETPROF: primaryData.GWETPROF ?? 0.4,
        EVPTRNS: primaryData.EVPTRNS ?? 3.0,
        RH2M: primaryData.RH2M ?? backupData1.RH2M ?? 50,
        WS10M: primaryData.WS10M ?? backupData1.WS10M ?? 2.0,
        PS: primaryData.PS ?? backupData1.PS ?? 1013,
        EVLAND: primaryData.EVLAND ?? primaryData.EVPTRNS ?? 3.0,
        CDD0: primaryData.CDD0 ?? 5.0,
        QV2M: primaryData.QV2M ?? 0.008,
      }

      // Final validation
      this.validateFinalData(mergedData)

      console.log('✅ FINAL FORECAST DATA FOR DROUGHT PREDICTION:')
      console.log('📍 Location:', lat + ', ' + lon)
      console.log('🌧️  Precipitation:', mergedData.PRECTOTCORR.toFixed(2), 'mm')
      console.log('🌡️  Temperature:', mergedData.T2M.toFixed(1), '°C')
      console.log('💧 Soil Moisture (Root):', mergedData.GWETROOT.toFixed(2))
      console.log(
        '☀️  Evapotranspiration:',
        mergedData.EVPTRNS.toFixed(2),
        'mm'
      )
      console.log(
        '🌞 Solar Radiation:',
        mergedData.ALLSKY_SFC_SW_DWN.toFixed(2),
        'MJ/m²'
      )
      console.log('💨 Wind Speed:', mergedData.WS10M.toFixed(1), 'm/s')
      console.log('📊 Data Sources: Open-Meteo + Backup APIs')

      return mergedData
    } catch (error) {
      console.error('❌ Error fetching complete forecast data:', error)
      throw new Error('Failed to fetch weather forecast data from all sources')
    }
  }

  private static validateFinalData(data: WeatherData) {
    // Ensure all values are within reasonable ranges
    data.GWETROOT = Math.max(0, Math.min(1, data.GWETROOT))
    data.GWETTOP = Math.max(0, Math.min(1, data.GWETTOP))
    data.GWETPROF = Math.max(0, Math.min(1, data.GWETPROF))
    data.PRECTOTCORR = Math.max(0, data.PRECTOTCORR)
    data.ALLSKY_SFC_SW_DWN = Math.max(0, data.ALLSKY_SFC_SW_DWN)
    data.RH2M = Math.max(0, Math.min(100, data.RH2M))
  }
}
