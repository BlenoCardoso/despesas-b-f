import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'
import { formatCurrency } from '@/core/utils/formatters'

// Color palettes
const COLORS = {
  primary: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
  success: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  warning: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
  danger: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'],
  mixed: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']
}

interface ChartProps {
  data: any[]
  height?: number
  className?: string
}

// Expense Category Pie Chart
export function ExpenseCategoryChart({ data, height = 300, className = '' }: ChartProps) {
  const RADIAN = Math.PI / 180
  
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS.mixed[index % COLORS.mixed.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), 'Valor']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Monthly Trend Line Chart
export function MonthlyTrendChart({ data, height = 300, className = '' }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => formatCurrency(value)} />
          <Tooltip 
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
          />
          <Legend />
          <Bar dataKey="income" fill="#10b981" name="Receitas" />
          <Bar dataKey="expenses" fill="#ef4444" name="Despesas" />
          <Line 
            type="monotone" 
            dataKey="balance" 
            stroke="#2563eb" 
            strokeWidth={3}
            name="Saldo"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// Budget Analysis Chart
export function BudgetAnalysisChart({ data, height = 300, className = '' }: ChartProps) {
  const getBarColor = (percentage: number) => {
    if (percentage >= 100) return '#ef4444' // Red for over budget
    if (percentage >= 80) return '#f59e0b' // Orange for near budget
    return '#10b981' // Green for under budget
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(value) => `${value}%`} />
          <YAxis type="category" dataKey="category" width={100} />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilizado']}
          />
          <Bar 
            dataKey="percentage" 
            fill={(entry: any) => getBarColor(entry.percentage)}
            name="% do Orçamento"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Task Status Pie Chart
export function TaskStatusChart({ data, height = 300, className = '' }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Productivity Trend Chart
export function ProductivityChart({ data, height = 300, className = '' }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="created" fill="#3b82f6" name="Criadas" />
          <Bar yAxisId="left" dataKey="completed" fill="#10b981" name="Concluídas" />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="rate" 
            stroke="#f59e0b" 
            strokeWidth={3}
            name="Taxa de Conclusão (%)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// Medication Adherence Chart
export function AdherenceChart({ data, height = 300, className = '' }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="taken" 
            stackId="1"
            stroke="#10b981" 
            fill="#10b981"
            name="Tomadas"
          />
          <Area 
            type="monotone" 
            dataKey="missed" 
            stackId="1"
            stroke="#ef4444" 
            fill="#ef4444"
            name="Perdidas"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Medication Types Chart
export function MedicationTypesChart({ data, height = 300, className = '' }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="type" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Quantidade" />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="adherence" 
            stroke="#10b981" 
            strokeWidth={3}
            name="Aderência (%)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Stock Alert Chart
export function StockAlertChart({ data, height = 300, className = '' }: ChartProps) {
  const getBarColor = (days: number) => {
    if (days <= 3) return '#ef4444' // Red for critical
    if (days <= 7) return '#f59e0b' // Orange for warning
    return '#10b981' // Green for ok
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="medication" width={120} />
          <Tooltip 
            formatter={(value: number) => [`${value} dias`, 'Dias restantes']}
          />
          <Bar dataKey="days" name="Dias restantes">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.days)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Generic KPI Card
interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  icon?: React.ReactNode
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  color = 'blue',
  icon 
}: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900'
  }

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm opacity-60 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 opacity-60">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

// Chart Container with Loading and Error States
interface ChartContainerProps {
  title: string
  children: React.ReactNode
  isLoading?: boolean
  error?: Error | null
  actions?: React.ReactNode
}

export function ChartContainer({ 
  title, 
  children, 
  isLoading, 
  error, 
  actions 
}: ChartContainerProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>
      
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {error && (
        <div className="flex items-center justify-center h-64 text-red-600">
          <p>Erro ao carregar dados: {error.message}</p>
        </div>
      )}
      
      {!isLoading && !error && children}
    </div>
  )
}

