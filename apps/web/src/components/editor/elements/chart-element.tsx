import { useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, Legend
} from 'recharts'
import type { ChartContent } from '@motionslides/shared'
import { useMotionContext } from '@/context/motion-context'

interface Props {
  content: ChartContent
}

const AXIS_TICK = { fill: '#94a3b8', fontSize: 12 }
const LEGEND_STYLE = { fontSize: 12, color: '#cbd5e1' }

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function ChartElement({ content }: Props) {
  const { isTransitioning, durationSec } = useMotionContext()

  const data = useMemo(() => content.data || [], [content.data])
  const colors = content.colors?.length ? content.colors : DEFAULT_COLORS
  const series = content.series?.length ? content.series : null
  const seriesData = useMemo(
    () => (series ? data.map(d => ({ label: d.label, ...(d.values ?? {}) })) : data),
    [data, series],
  )

  const animationDuration = isTransitioning ? durationSec * 1000 : 0

  function renderChart() {
    switch (content.chartType) {
      case 'bar': {
        if (series) {
          return (
            <BarChart data={seriesData}>
              {content.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />}
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} hide={!content.showLabels} />
              <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} hide={!content.showLabels} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', fontSize: '10px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={LEGEND_STYLE} />
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  fill={s.color || colors[i % colors.length]}
                  radius={[4, 4, 0, 0]}
                  barSize={content.barSize}
                  animationDuration={animationDuration}
                />
              ))}
            </BarChart>
          )
        }

        const normalizedData = data.map(d => ({
          ...d,
          stack: content.isStacked ? (d.stack && d.stack.length > 0 ? d.stack : [d.value]) : [d.value],
        }))

        const maxStackLength = content.isStacked
          ? Math.max(...normalizedData.map(d => d.stack.length))
          : 1

        const barData = normalizedData.map(d => {
          const item: any = { label: d.label, value: d.value }
          d.stack.forEach((v, si) => { item[`stack${si}`] = v })
          return item
        })

        return (
          <BarChart data={barData}>
            {content.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />}
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              hide={!content.showLabels}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              hide={!content.showLabels}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', fontSize: '10px' }}
              itemStyle={{ color: '#fff' }}
            />
            {content.isStacked ? (
              Array.from({ length: maxStackLength }).map((_, si) => (
                <Bar
                  key={si}
                  dataKey={`stack${si}`}
                  stackId="a"
                  fill={colors[si % colors.length]}
                  barSize={content.barSize}
                  animationDuration={animationDuration}
                />
              ))
            ) : (
              <Bar
                dataKey="value"
                fill={colors[0]}
                radius={[4, 4, 0, 0]}
                barSize={content.barSize}
                animationDuration={animationDuration}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
                ))}
              </Bar>
            )}
          </BarChart>
        )
      }
      case 'line':
        if (series) {
          return (
            <LineChart data={seriesData}>
              {content.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#333" />}
              <XAxis dataKey="label" hide={!content.showLabels} tick={AXIS_TICK} />
              <YAxis hide={!content.showLabels} tick={AXIS_TICK} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', fontSize: '10px' }}
              />
              <Legend wrapperStyle={LEGEND_STYLE} />
              {series.map((s, i) => {
                const color = s.color || colors[i % colors.length]
                return (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={color}
                    strokeWidth={3}
                    dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#111' }}
                    animationDuration={animationDuration}
                  />
                )
              })}
            </LineChart>
          )
        }
        return (
          <LineChart data={data}>
            {content.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#333" />}
            <XAxis dataKey="label" hide={!content.showLabels} tick={AXIS_TICK} />
            <YAxis hide={!content.showLabels} tick={AXIS_TICK} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', fontSize: '10px' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              strokeWidth={3}
              dot={{ r: 4, fill: colors[0], strokeWidth: 2, stroke: '#111' }}
              animationDuration={animationDuration}
            />
          </LineChart>
        )
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={5}
              dataKey="value"
              animationDuration={animationDuration}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', fontSize: '10px' }}
            />
          </PieChart>
        )
      case 'area':
        return (
          <AreaChart data={data}>
            {content.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#333" />}
            <XAxis dataKey="label" hide={!content.showLabels} tick={AXIS_TICK} />
            <YAxis hide={!content.showLabels} tick={AXIS_TICK} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', fontSize: '10px' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
              animationDuration={animationDuration}
            />
          </AreaChart>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full h-full p-2 bg-[#121212]/50 rounded-lg border border-white/5 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}
