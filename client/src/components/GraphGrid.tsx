// In GraphGrid.tsx, update the charts to group by similar scales:

import { ParameterChart } from './ParameterChart'
import type { DashboardData } from '../types/dashboard'

interface GraphGridProps {
  data: DashboardData[] | null | undefined
}

export const GraphGrid: React.FC<GraphGridProps> = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className='p-6 text-slate-400 text-center'>
        No data available to display.
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 p-6'>
      {/* Group 1: Precipitation & Evaporation (similar scales) */}
      <ParameterChart
        title='Precipitation & Evaporation'
        data={data}
        parameters={[
          { key: 'PRECTOTCORR', color: '#3b82f6', name: 'Precipitation (mm)' },
          { key: 'EVPTRNS', color: '#06b6d4', name: 'Evapotranspiration' },
          { key: 'EVLAND', color: '#14b8a6', name: 'Evap Land' },
        ]}
      />

      {/* Group 2: Soil Moisture (similar scales) */}
      <ParameterChart
        title='Soil Moisture'
        data={data}
        parameters={[
          { key: 'GWETROOT', color: '#22c55e', name: 'Root Soil Wetness' },
          { key: 'GWETTOP', color: '#8b5cf6', name: 'Top Soil Wetness' },
          { key: 'GWETPROF', color: '#a855f7', name: 'Profile Soil Wetness' },
        ]}
      />

      {/* Group 3: Temperature */}
      <ParameterChart
        title='Temperature Metrics'
        data={data}
        parameters={[
          { key: 'T2M', color: '#f59e0b', name: 'Temp 2m (°C)' },
          { key: 'TS_MAX', color: '#ef4444', name: 'Surface Max (°C)' },
          { key: 'TS_MIN', color: '#3b82f6', name: 'Surface Min (°C)' },
          { key: 'CDD0', color: '#f43f5e', name: 'Cooling Degree Days' },
        ]}
      />

      {/* Group 4: Atmospheric Conditions */}
      <ParameterChart
        title='Atmospheric Conditions'
        data={data}
        parameters={[
          { key: 'RH2M', color: '#0ea5e9', name: 'Rel Humidity (%)' },
          { key: 'QV2M', color: '#6366f1', name: 'Spec Humidity' },
          { key: 'WS10M', color: '#64748b', name: 'Wind Speed (m/s)' },
          { key: 'PS', color: '#94a3b8', name: 'Pressure' },
          {
            key: 'ALLSKY_SFC_SW_DWN',
            color: '#eab308',
            name: 'Solar Radiation',
          },
        ]}
      />
    </div>
  )
}
