import axios from 'axios'
import { WeatherData } from '../types/weatherInputs'

export class WeatherService {
  private static calculateCDD0(temps: number[]): number {
    return temps.reduce((s, t) => s + Math.max(0, t), 0)
  }

  private static calculateRHFromSpecificHumidity(
    qv2m: number,
    temp: number,
    pressure: number
  ): number {
    const es = 6.112 * Math.exp((17.67 * temp) / (temp + 243.5)) // hPa saturation vapor pressure
    const e = (qv2m * pressure) / (0.622 + 0.378 * qv2m) // vapor pressure
    return (e / es) * 100 // RH%
  }

  private static async getWeatherbitForecast(
    lat: number,
    lon: number
  ): Promise<Partial<WeatherData>> {
    try {
      const WEATHERBIT_KEY = process.env.WEATHERBIT_API_KEY
      console.log(WEATHERBIT_KEY)

      const url = `https://api.weatherbit.io/v2.0/forecast/agweather?lat=${lat}&lon=${lon}&key=${WEATHERBIT_KEY}&days=16`

      const response = await axios.get(url)
      const data = response.data

      if (!data || !data.data || data.data.length === 0) {
        throw new Error('Weatherbit returned empty data')
      }

      // Use **tomorrow’s** forecast
      const day = data.data[1]

      // Soil moisture deep averages
      const GWETROOT =
        (day.v_soilm_10_40cm + day.v_soilm_40_100cm + day.v_soilm_100_200cm) / 3

      const GWETPROF =
        (day.v_soilm_0_10cm +
          day.v_soilm_10_40cm +
          day.v_soilm_40_100cm +
          day.v_soilm_100_200cm) /
        4

      // Soil moisture top layer
      const GWETTOP = day.v_soilm_0_10cm

      const T2M = day.temp_2m_avg
      const TS_MAX = day.skin_temp_max
      const TS_MIN = day.skin_temp_min
      const PRECTOTCORR = day.precip
      const EVPTRNS = day.evapotranspiration
      const WS10M = day.wind_10m_spd_avg
      const PS = day.pres_avg
      const QV2M = day.specific_humidity

      // RH = convert from QV2M
      const RH2M = this.calculateRHFromSpecificHumidity(QV2M, T2M, PS)

      // Solar radiation → dswrf_avg
      const ALLSKY_SFC_SW_DWN = day.dswrf_avg

      // Cooling degree days
      const CDD0 = this.calculateCDD0([T2M])

      const weatherbitData: Partial<WeatherData> = {
        PRECTOTCORR,
        EVPTRNS,
        EVLAND: EVPTRNS, // same
        GWETROOT,
        GWETTOP,
        GWETPROF,
        T2M,
        TS_MAX,
        TS_MIN,
        RH2M,
        QV2M,
        WS10M,
        PS,
        ALLSKY_SFC_SW_DWN,
        CDD0,
      }

      console.log('Weatherbit Forecast:', weatherbitData)

      return weatherbitData
    } catch (err) {
      console.error('Weatherbit error:', err)
      return {}
    }
  }

  // ================
  // PUBLIC MAIN CALL
  // ================
  static async getCompleteForecastData(
    lat: number = 9.5612,
    lon: number = 44.0669
  ): Promise<WeatherData> {
    const wd = await this.getWeatherbitForecast(lat, lon)

    // Final defaults (in case Weatherbit misses anything)
    const finalData: WeatherData = {
      PRECTOTCORR: wd.PRECTOTCORR ?? 0,
      EVPTRNS: wd.EVPTRNS ?? 0,
      EVLAND: wd.EVLAND ?? wd.EVPTRNS ?? 0,
      GWETROOT: wd.GWETROOT ?? 0.3,
      GWETTOP: wd.GWETTOP ?? 0.2,
      GWETPROF: wd.GWETPROF ?? 0.4,
      T2M: wd.T2M ?? 25,
      TS_MAX: wd.TS_MAX ?? 30,
      TS_MIN: wd.TS_MIN ?? 20,
      RH2M: wd.RH2M ?? 50,
      QV2M: wd.QV2M ?? 0.008,
      WS10M: wd.WS10M ?? 2,
      PS: wd.PS ?? 1013,
      ALLSKY_SFC_SW_DWN: wd.ALLSKY_SFC_SW_DWN ?? 100,
      CDD0: wd.CDD0 ?? 5,
    }

    return finalData
  }
}
