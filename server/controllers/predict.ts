import { Request, Response } from 'express'
import { predictDrought } from '../lib/predictDrought'
import { WeatherService } from '../lib/weatherServices'

export const predictFn = async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 38.7946
    const lon = parseFloat(req.query.lon as string) || 106.5348

    const weatherData = await WeatherService.getCompleteForecastData(lat, lon)
    const pred = await predictDrought(weatherData)

    res.status(200).json({
      ok: true,
      prediction: Number(pred),
      location: { lat, lon },
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
