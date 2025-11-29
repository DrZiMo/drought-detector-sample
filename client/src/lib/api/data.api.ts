import { api } from './axios'
import type { DashboardData } from '../../types/dashboard'

type BackendData = Omit<DashboardData, 'timestamp'> & { date: string | number }

export const getData = async (
  lat: string,
  lon: string
): Promise<DashboardData[]> => {
  try {
    const response = await api.get(`/data?lat=${lat}&lon=${lon}`)
    return transformBackendData(response.data.data)
  } catch (error) {
    console.error(error)
    throw error
  }
}

// Transform backend data to frontend format
const transformBackendData = (backendData: BackendData[]): DashboardData[] => {
  return backendData.map((item) => {
    // Convert date to timestamp format
    const dateStr = item.date.toString()

    // Handle both "YYYYMMDD" and "YYYY-MM-DD" formats
    if (dateStr.includes('-')) {
      // Already in YYYY-MM-DD format
      return {
        timestamp: dateStr,
        ...item,
      } as DashboardData
    } else {
      // Convert from YYYYMMDD to YYYY-MM-DD
      const year = dateStr.substring(0, 4)
      const month = dateStr.substring(4, 6)
      const day = dateStr.substring(6, 8)
      return {
        timestamp: `${year}-${month}-${day}`,
        ...item,
      } as DashboardData
    }
  })
}
