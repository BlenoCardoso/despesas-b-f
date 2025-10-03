import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './mobile-card'
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react'
import { Expense } from '@/services/expenseService'
import { formatCurrency } from '@/lib/utils'

interface ExpenseStatsProps {
  expenses: Expense[]
}

const categoryColors = {
  food: '#ef4444',
  transport: '#3b82f6',
  home: '#10b981',
  entertainment: '#8b5cf6',
  health: '#f59e0b',
  education: '#06b6d4',
  other: '#6b7280',
}

const categoryLabels = {
  food: 'Alimentação',
  transport: 'Transporte',
  home: 'Casa',
  entertainment: 'Entretenimento',
  health: 'Saúde',
  education: 'Educação',
  other: 'Outros',
}

export function ExpenseStats({ expenses }: ExpenseStatsProps) {
  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })

    const lastMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear
    })

    const currentTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const lastTotal = lastMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const changePercent = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0

    // Dados por categoria - usando títulos como proxy para categorias
    const categoryData = Object.entries(categoryLabels).map(([key, label]) => {
      const total = currentMonthExpenses
        .filter(expense => {
          // Como não temos categoryId preenchido, vamos usar palavras-chave no título
          const title = expense.title.toLowerCase()
          switch (key) {
            case 'food':
              return title.includes('comida') || title.includes('alimentação') || title.includes('restaurante') || title.includes('mercado') || title.includes('lanche')
            case 'transport':
              return title.includes('transporte') || title.includes('combustível') || title.includes('uber') || title.includes('ônibus') || title.includes('taxi')
            case 'home':
              return title.includes('casa') || title.includes('aluguel') || title.includes('condomínio') || title.includes('luz') || title.includes('água')
            case 'entertainment':
              return title.includes('cinema') || title.includes('show') || title.includes('festa') || title.includes('bar') || title.includes('lazer')
            case 'health':
              return title.includes('saúde') || title.includes('médico') || title.includes('farmácia') || title.includes('hospital') || title.includes('remédio')
            case 'education':
              return title.includes('educação') || title.includes('curso') || title.includes('livro') || title.includes('escola') || title.includes('faculdade')
            default:
              return true // outros
          }
        })
        .reduce((sum, expense) => sum + expense.amount, 0)
      
      return {
        name: label,
        value: total,
        color: categoryColors[key as keyof typeof categoryColors]
      }
    }).filter(item => item.value > 0)

    // Dados dos últimos 7 dias
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date
    }).reverse()

    const dailyData = last7Days.map(date => {
      const dayExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.toDateString() === date.toDateString()
      })
      
      const total = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      
      return {
        day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        value: total
      }
    })

    return {
      currentTotal,
      lastTotal,
      changePercent,
      categoryData,
      dailyData,
      expenseCount: currentMonthExpenses.length
    }
  }, [expenses])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-2xl p-3 shadow-strong">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-xs text-primary-600 font-medium">Este Mês</p>
                <p className="text-lg font-bold text-primary-700">
                  {formatCurrency(stats.currentTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-secondary-600" />
              <div>
                <p className="text-xs text-secondary-600 font-medium">Despesas</p>
                <p className="text-lg font-bold text-secondary-700">
                  {stats.expenseCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de Variação */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Variação do mês anterior</p>
              <div className="flex items-center space-x-2 mt-1">
                {stats.changePercent >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-success-600" />
                )}
                <span className={`font-medium ${
                  stats.changePercent >= 0 ? 'text-destructive' : 'text-success-600'
                }`}>
                  {Math.abs(stats.changePercent).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Mês anterior</p>
              <p className="font-medium">{formatCurrency(stats.lastTotal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Pizza - Categorias */}
      {stats.categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {stats.categoryData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                    <p className="text-sm font-medium">{formatCurrency(item.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Barras - Últimos 7 dias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyData}>
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}