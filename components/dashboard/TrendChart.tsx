'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

export type ChartDataPoint = {
  week: string
  oiliness?: number
  dryness?: number
  irritation?: number
  breakouts?: number
  satisfaction?: number
  projected_oiliness?: number
  projected_dryness?: number
  projected_irritation?: number
  projected_breakouts?: number
  projected_satisfaction?: number
}

interface TrendChartProps {
  data: ChartDataPoint[]
  showForecast: boolean
}

const COLORS = {
  oiliness: '#84CC16', // Lime green
  dryness: '#06B6D4',  // Cyan/Aqua
  irritation: '#EF4444', // Red
  breakouts: '#F59E0B',  // Amber
  satisfaction: '#EC4899', // Pink
}

export function TrendChart({ data, showForecast }: TrendChartProps) {
  // Sort data chronologically
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => a.week.localeCompare(b.week))
  }, [data])

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 12, fill: '#6B7280' }} 
            tickMargin={10}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            domain={[1, 5]} 
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 12, fill: '#6B7280' }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                // If actual data exists on this point, hide the 'projected_' bridging duplicates
                const hasActualData = payload.some((p: any) => !p.dataKey.startsWith('projected_'))
                let displayPayload = payload
                
                if (hasActualData) {
                  displayPayload = payload.filter((p: any) => !p.dataKey.startsWith('projected_'))
                }

                return (
                  <div className="bg-white p-4 rounded-[16px] shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] border border-neutral-100">
                    <p className="font-semibold text-neutral-900 mb-2">{label}</p>
                    {displayPayload.map((entry: any, index: number) => (
                      <p key={index} style={{ color: entry.color }} className="text-sm font-medium py-0.5">
                        {entry.name}: {entry.value}
                      </p>
                    ))}
                  </div>
                )
              }
              return null
            }}
          />
          <Legend 
            content={(props: any) => {
              const { payload } = props
              const actuals = payload.filter((entry: any) => !entry.dataKey.startsWith('projected_'))
              const forecasts = payload.filter((entry: any) => entry.dataKey.startsWith('projected_'))

              return (
                <div className="mt-8 flex flex-col pt-4 border-t border-neutral-100 md:flex-row justify-between items-start md:items-center gap-6 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-bold text-neutral-400 uppercase tracking-wider text-[10px]">Actual</span>
                    {actuals.map((entry: any) => (
                      <div key={entry.value} className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.value}
                      </div>
                    ))}
                  </div>
                  
                  {showForecast && forecasts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-4 opacity-70">
                      <span className="font-bold text-neutral-400 uppercase tracking-wider text-[10px]">Forecast</span>
                      {forecasts.map((entry: any) => (
                        <div key={entry.value} className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                          <div className="h-1 w-3" style={{ backgroundColor: entry.color }} />
                          {entry.value.replace('Forecast ', '')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }}
          />

          {/* Actual Logged Data Lines (Solid) */}
          <Line type="monotone" dataKey="oiliness" stroke={COLORS.oiliness} strokeWidth={2} dot={{ r: 4, fillOpacity: 0.3, strokeOpacity: 0.4 }} activeDot={{ r: 6 }} name="Oiliness" />
          <Line type="monotone" dataKey="dryness" stroke={COLORS.dryness} strokeWidth={2} dot={{ r: 4, fillOpacity: 0.3, strokeOpacity: 0.4 }} activeDot={{ r: 6 }} name="Dryness" />
          <Line type="monotone" dataKey="irritation" stroke={COLORS.irritation} strokeWidth={2} dot={{ r: 4, fillOpacity: 0.3, strokeOpacity: 0.4 }} activeDot={{ r: 6 }} name="Irritation" />
          <Line type="monotone" dataKey="breakouts" stroke={COLORS.breakouts} strokeWidth={2} dot={{ r: 4, fillOpacity: 0.3, strokeOpacity: 0.4 }} activeDot={{ r: 6 }} name="Breakouts" />
          <Line type="monotone" dataKey="satisfaction" stroke={COLORS.satisfaction} strokeWidth={2} dot={{ r: 4, fillOpacity: 0.3, strokeOpacity: 0.4 }} activeDot={{ r: 6 }} name="Satisfaction" />

          {/* AI Forecast Projections (Dashed) */}
          {showForecast && (
            <>
              <Line type="monotone" dataKey="projected_oiliness" stroke={COLORS.oiliness} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} name="Forecast Oiliness" />
              <Line type="monotone" dataKey="projected_dryness" stroke={COLORS.dryness} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} name="Forecast Dryness" />
              <Line type="monotone" dataKey="projected_irritation" stroke={COLORS.irritation} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} name="Forecast Irritation" />
              <Line type="monotone" dataKey="projected_breakouts" stroke={COLORS.breakouts} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} name="Forecast Breakouts" />
              <Line type="monotone" dataKey="projected_satisfaction" stroke={COLORS.satisfaction} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} name="Forecast Satisfaction" />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
