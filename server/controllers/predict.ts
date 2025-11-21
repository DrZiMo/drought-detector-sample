import { Request, Response } from 'express'
import { predictDrought } from '../lib/predictDrought'
import { WeatherService } from '../lib/weatherServices'

export const predictFn = async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 71.7069
    const lon = parseFloat(req.query.lon as string) || 42.6043

    // Get complete forecast data from multiple sources
    const weatherData = await WeatherService.getCompleteForecastData(lat, lon)
    const pred = await predictDrought(weatherData)

    res.status(200).json({
      ok: true,
      prediction: Number(pred),
      confidence: 'high', // Since we're using multiple verified sources
      forecast_period: 'next_24_hours',
      location: { lat, lon },
      data_sources: ['Open-Meteo GFS', 'WeatherAPI', 'Visual Crossing'],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Prediction error:', error)
    res.status(500).json({
      ok: false,
      message: 'Failed to generate drought prediction from forecast data',
    })
  }
}
