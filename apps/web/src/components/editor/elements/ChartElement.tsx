import { useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area
} from 'recharts'
import type { ChartContent } from '@motionslides/shared'
import { useMotionContext } from '@/context/MotionContext'

interface Props {
  content: ChartContent
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function ChartElement({ content }: Props) {
  const { isTransitioning, durationSec } = useMotionContext()

  const data = useMemo(() => content.data || [], [content.data])
  const colors = content.colors?.length ? content.colors : DEFAULT_COLORS

  const animationDuration = isTransitioning ? durationSec * 1000 : 0

  function renderChart() {
    switch (content.chartType) {
      case 'bar': {
        // Normalize: when stacked, every data point uses its `stack` array.
        // Fall back to [d.value] if the stack array hasn't been set yet.
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
              tick={{ fill: '#666', fontSize: 10 }}
              hide={!content.showLabels}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#666', fontSize: 10 }}
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
        return (
          <LineChart data={data}>
            {content.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#333" />}
            <XAxis dataKey="label" hide={!content.showLabels} tick={{ fill: '#666', fontSize: 10 }} />
            <YAxis hide={!content.showLabels} tick={{ fill: '#666', fontSize: 10 }} />
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
            <XAxis dataKey="label" hide={!content.showLabels} tick={{ fill: '#666', fontSize: 10 }} />
            <YAxis hide={!content.showLabels} tick={{ fill: '#666', fontSize: 10 }} />
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
