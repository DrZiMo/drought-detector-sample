import { useQuery } from '@tanstack/react-query'
import { getData } from '../api/data.api'

export const useGetData = (lat: string, lon: string) => {
  return useQuery({
    queryKey: ['data', lat, lon],
    queryFn: () => getData(lat, lon),
  })
}
