import { mapWeatherbitToModel } from './mapWeatherbitToModel'

export const getFutureData = async (lat: number, lon: number) => {
  try {
    const API_KEY = process.env.WEATHERBIT_API_KEY
    const url = `https://api.weatherbit.io/v2.0/forecast/agweather?lat=${lat}&lon=${lon}&key=${API_KEY}`

    const response = await fetch(url)
    const data = await response.json()

    return mapWeatherbitToModel(data)
  } catch (error) {
    throw error
  }
}
