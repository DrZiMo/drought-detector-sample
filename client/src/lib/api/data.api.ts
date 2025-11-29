import { api } from './axios'
import type { DashboardData } from '../../types/dashboard'

export const getData = async (
  lat: string,
  lon: string
): Promise<DashboardData[]> => {
  try {
    const response = await api.get(`/data?lat=${lat}&lon=${lon}`)
    return response.data.data
  } catch (error) {
    console.error(error)
    throw error
  }
}
