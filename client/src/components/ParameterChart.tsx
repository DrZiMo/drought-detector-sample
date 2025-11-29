import React, { useState, useRef } from 'react'
import type { DashboardData } from '../types/dashboard'

interface ParameterChartProps {
  title: string
  data: DashboardData[] | null | undefined
  parameters: {
    key: keyof DashboardData
    color: string
    name: string
  }[]
}

export const ParameterChart: React.FC<ParameterChartProps> = ({
  title,
  data,
  parameters,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  if (!data || data.length === 0) {
    return (
      <div className='p-6 text-slate-400 text-center bg-slate-900/80 rounded-xl'>
        No data available
      </div>
    )
  }

  const width = 600
  const height = 300
  const padding = { top: 20, right: 30, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Global min/max across all parameters to avoid spikes
  const allValues = parameters.flatMap((p) =>
    data.map((d) => Number(d[p.key])).filter((v) => !isNaN(v))
  )
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const range = maxVal - minVal || 1

  const parameterScales = parameters.map((param) => {
    const values = data
      .map((d) => Number(d[param.key]))
      .filter((v) => !isNaN(v))
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const range = maxVal - minVal || 1
    return { minVal, maxVal, range }
  })

  const getX = (index: number) =>
    padding.left + (index / (data.length - 1)) * chartWidth
  const getY = (value: number, scaleIndex: number) => {
    const scale = parameterScales[scaleIndex]
    return (
      height -
      padding.bottom -
      ((value - scale.minVal) / scale.range) * chartHeight
    )
  }

  const createPath = (key: keyof DashboardData, scaleIndex: number) =>
    data
      .map((d, i) => {
        const val = Number(d[key])
        if (isNaN(val)) return null
        return `${getX(i)},${getY(val, scaleIndex)}`
      })
      .filter(Boolean)
      .join(' ')

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const index = Math.round(
      ((x - padding.left) / chartWidth) * (data.length - 1)
    )
    if (index >= 0 && index < data.length) setHoverIndex(index)
  }

  const handleMouseLeave = () => setHoverIndex(null)

  return (
    <div
      ref={containerRef}
      className='bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-2xl transition-all hover:border-slate-600'
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className='flex justify-between items-center mb-4 border-b border-slate-800 pb-2'>
        <h3 className='text-slate-100 font-bold text-lg tracking-tight'>
          {title}
        </h3>
        {hoverIndex !== null && (
          <span className='text-xs text-slate-400 font-mono'>
            {data[hoverIndex].timestamp || 'N/A'}
          </span>
        )}
      </div>

      <div className='relative w-full aspect-2/1 select-none'>
        <svg viewBox={`0 0 ${width} ${height}`} className='w-full h-full'>
          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = height - padding.bottom - t * chartHeight
            const value = (minVal + t * range).toFixed(2)
            return (
              <g key={t}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke='#334155'
                  strokeWidth={1}
                  strokeDasharray='4 4'
                />
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor='end'
                  fill='#64748b'
                  fontSize='10'
                  fontFamily='monospace'
                >
                  {value}
                </text>
              </g>
            )
          })}

          {/* X-Axis Labels */}
          {data
            .filter((_, i) => i % Math.ceil(data.length / 8) === 0)
            .map((d, i) => {
              const x = getX(data.indexOf(d))
              return (
                <text
                  key={i}
                  x={x}
                  y={height - 10}
                  textAnchor='middle'
                  fill='#64748b'
                  fontSize='10'
                  fontFamily='monospace'
                >
                  {d.timestamp || 'N/A'}
                </text>
              )
            })}

          {/* Lines */}
          {parameters.map((param, index) => (
            <g key={param.key}>
              <polyline
                points={createPath(param.key, index)}
                fill='none'
                stroke={param.color}
                strokeWidth={2.5}
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              {hoverIndex !== null &&
                !isNaN(Number(data[hoverIndex][param.key])) && (
                  <circle
                    cx={getX(hoverIndex)}
                    cy={getY(Number(data[hoverIndex][param.key]), index)}
                    r={4}
                    fill={param.color}
                    stroke='#1e293b'
                    strokeWidth={2}
                  />
                )}
            </g>
          ))}

          {/* Hover Line */}
          {hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1={padding.top}
              x2={getX(hoverIndex)}
              y2={height - padding.bottom}
              stroke='#94a3b8'
              strokeWidth={1}
              strokeDasharray='2 2'
            />
          )}
        </svg>

        {/* Tooltip */}
        {hoverIndex !== null && (
          <div
            className='absolute top-0 right-0 bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-xl text-xs z-10 pointer-events-none'
            style={{ backdropFilter: 'blur(4px)' }}
          >
            <div className='font-bold text-slate-300 mb-2 border-b border-slate-700 pb-1'>
              {data[hoverIndex].timestamp || 'N/A'}
            </div>
            <div className='space-y-1'>
              {parameters.map((param) => (
                <div key={param.key} className='flex items-center gap-2'>
                  <div
                    className='w-2 h-2 rounded-full'
                    style={{ backgroundColor: param.color }}
                  />
                  <span className='text-slate-400'>{param.name}:</span>
                  <span className='font-mono font-bold text-slate-200'>
                    {Number(data[hoverIndex][param.key]).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
