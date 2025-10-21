import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ComposedChart, Line } from 'recharts'

const COLORS = ['#4f46e5', '#f97316', '#10b981', '#ef4444', '#06b6d4']

export const ReportCharts: React.FC<{ type: 'pie' | 'bar'; data: Array<any>; showLine?: boolean; lineKey?: string }> = ({ type, data, showLine = false, lineKey = 'ma' }) => {
  if (type === 'pie') {
    return (
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie dataKey="value" data={data} outerRadius={80} label>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#4f46e5" />
          {showLine && <Line type="monotone" dataKey={lineKey} stroke="#ff7a45" strokeWidth={2} dot={false} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ReportCharts
