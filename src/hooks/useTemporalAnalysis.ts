// Hook para análise temporal e gráficos avançados
import { useState, useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface ExpenseData {
  id: string
  amount: number
  category: string
  date: Date
  description: string
}

export interface TimeSeriesPoint {
  date: Date
  amount: number
  count: number
  category?: string
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  significance: 'high' | 'medium' | 'low'
  period: string
}

export interface SeasonalPattern {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  peak: { label: string; value: number }
  low: { label: string; value: number }
  pattern: { label: string; value: number }[]
}

export interface BudgetComparison {
  period: string
  budgeted: number
  actual: number
  variance: number
  variancePercentage: number
  status: 'under' | 'over' | 'on-track'
}

export function useTemporalAnalysis() {
  const [expenses] = useLocalStorage<ExpenseData[]>('expenses-data', [])
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [comparePeriod, setComparePeriod] = useState<'previous' | 'year-ago'>('previous')

  // Filtrar dados por período
  const getFilteredData = useCallback((period: string, categoryFilter?: string) => {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1))
        break
      default:
        startDate = new Date(0) // All time
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      const isInPeriod = expenseDate >= startDate
      const isInCategory = !categoryFilter || expense.category === categoryFilter
      return isInPeriod && isInCategory
    })
  }, [expenses])

  // Gerar série temporal diária
  const getDailyTimeSeries = useCallback((period: string, categoryFilter?: string): TimeSeriesPoint[] => {
    const filteredData = getFilteredData(period, categoryFilter)
    const dailyData = new Map<string, { amount: number; count: number }>()

    filteredData.forEach(expense => {
      const dateKey = expense.date.toISOString().split('T')[0]
      const current = dailyData.get(dateKey) || { amount: 0, count: 0 }
      dailyData.set(dateKey, {
        amount: current.amount + expense.amount,
        count: current.count + 1
      })
    })

    return Array.from(dailyData.entries())
      .map(([dateStr, data]) => ({
        date: new Date(dateStr),
        amount: data.amount,
        count: data.count
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [getFilteredData])

  // Gerar série temporal mensal
  const getMonthlyTimeSeries = useCallback((period: string, categoryFilter?: string): TimeSeriesPoint[] => {
    const filteredData = getFilteredData(period, categoryFilter)
    const monthlyData = new Map<string, { amount: number; count: number }>()

    filteredData.forEach(expense => {
      const date = new Date(expense.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const current = monthlyData.get(monthKey) || { amount: 0, count: 0 }
      monthlyData.set(monthKey, {
        amount: current.amount + expense.amount,
        count: current.count + 1
      })
    })

    return Array.from(monthlyData.entries())
      .map(([monthStr, data]) => ({
        date: new Date(monthStr + '-01'),
        amount: data.amount,
        count: data.count
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [getFilteredData])

  // Análise de tendências
  const getTrendAnalysis = useCallback((period: string, categoryFilter?: string): TrendAnalysis => {
    const timeSeries = getDailyTimeSeries(period, categoryFilter)
    
    if (timeSeries.length < 7) {
      return {
        direction: 'stable',
        percentage: 0,
        significance: 'low',
        period
      }
    }

    // Calcular média móvel de 7 dias
    const movingAverages = timeSeries.slice(-14).map((_, index, arr) => {
      if (index < 6) return 0
      const slice = arr.slice(index - 6, index + 1)
      return slice.reduce((sum, point) => sum + point.amount, 0) / slice.length
    }).filter(avg => avg > 0)

    if (movingAverages.length < 2) {
      return {
        direction: 'stable',
        percentage: 0,
        significance: 'low',
        period
      }
    }

    const firstAvg = movingAverages[0]
    const lastAvg = movingAverages[movingAverages.length - 1]
    const percentage = ((lastAvg - firstAvg) / firstAvg) * 100

    let direction: 'up' | 'down' | 'stable' = 'stable'
    let significance: 'high' | 'medium' | 'low' = 'low'

    if (Math.abs(percentage) > 20) {
      significance = 'high'
    } else if (Math.abs(percentage) > 10) {
      significance = 'medium'
    }

    if (percentage > 5) {
      direction = 'up'
    } else if (percentage < -5) {
      direction = 'down'
    }

    return {
      direction,
      percentage: Math.abs(percentage),
      significance,
      period
    }
  }, [getDailyTimeSeries])

  // Análise sazonal
  const getSeasonalPatterns = useCallback((categoryFilter?: string): SeasonalPattern[] => {
    const allData = getFilteredData('all', categoryFilter)
    const patterns: SeasonalPattern[] = []

    // Padrão semanal (dia da semana)
    const weeklyData = Array(7).fill(0).map(() => ({ total: 0, count: 0 }))
    allData.forEach(expense => {
      const dayOfWeek = new Date(expense.date).getDay()
      weeklyData[dayOfWeek].total += expense.amount
      weeklyData[dayOfWeek].count += 1
    })

    const weeklyPattern = weeklyData.map((data, index) => ({
      label: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][index],
      value: data.count > 0 ? data.total / data.count : 0
    }))

    const weeklyMax = weeklyPattern.reduce((max, curr) => curr.value > max.value ? curr : max)
    const weeklyMin = weeklyPattern.reduce((min, curr) => curr.value < min.value ? curr : min)

    patterns.push({
      period: 'weekly',
      peak: weeklyMax,
      low: weeklyMin,
      pattern: weeklyPattern
    })

    // Padrão mensal (dia do mês)
    const monthlyData = Array(31).fill(0).map(() => ({ total: 0, count: 0 }))
    allData.forEach(expense => {
      const dayOfMonth = new Date(expense.date).getDate() - 1
      monthlyData[dayOfMonth].total += expense.amount
      monthlyData[dayOfMonth].count += 1
    })

    const monthlyPattern = monthlyData.map((data, index) => ({
      label: String(index + 1),
      value: data.count > 0 ? data.total / data.count : 0
    })).filter(item => item.value > 0)

    if (monthlyPattern.length > 0) {
      const monthlyMax = monthlyPattern.reduce((max, curr) => curr.value > max.value ? curr : max)
      const monthlyMin = monthlyPattern.reduce((min, curr) => curr.value < min.value ? curr : min)

      patterns.push({
        period: 'monthly',
        peak: monthlyMax,
        low: monthlyMin,
        pattern: monthlyPattern
      })
    }

    return patterns
  }, [getFilteredData])

  // Comparação de períodos
  const getPeriodComparison = useCallback((currentPeriod: string, categoryFilter?: string) => {
    const currentData = getFilteredData(currentPeriod, categoryFilter)
    const currentTotal = currentData.reduce((sum, expense) => sum + expense.amount, 0)
    const currentCount = currentData.length

    // Calcular período anterior
    const now = new Date()
    let previousStartDate: Date
    let previousEndDate: Date

    switch (currentPeriod) {
      case '7d':
        previousEndDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        previousEndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        previousEndDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      default:
        previousStartDate = new Date(0)
        previousEndDate = now
    }

    const previousData = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      const isInPeriod = expenseDate >= previousStartDate && expenseDate <= previousEndDate
      const isInCategory = !categoryFilter || expense.category === categoryFilter
      return isInPeriod && isInCategory
    })

    const previousTotal = previousData.reduce((sum, expense) => sum + expense.amount, 0)
    const previousCount = previousData.length

    const totalChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0
    const countChange = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0

    return {
      current: {
        total: currentTotal,
        count: currentCount,
        average: currentCount > 0 ? currentTotal / currentCount : 0
      },
      previous: {
        total: previousTotal,
        count: previousCount,
        average: previousCount > 0 ? previousTotal / previousCount : 0
      },
      changes: {
        total: totalChange,
        count: countChange,
        average: currentCount > 0 && previousCount > 0 
          ? (((currentTotal / currentCount) - (previousTotal / previousCount)) / (previousTotal / previousCount)) * 100
          : 0
      }
    }
  }, [getFilteredData, expenses])

  // Dados formatados para gráficos
  const chartData = useMemo(() => {
    const timeSeries = selectedPeriod === '1y' || selectedPeriod === 'all' 
      ? getMonthlyTimeSeries(selectedPeriod, selectedCategory || undefined)
      : getDailyTimeSeries(selectedPeriod, selectedCategory || undefined)

    const comparison = compareMode 
      ? getPeriodComparison(selectedPeriod, selectedCategory || undefined)
      : null

    return {
      timeSeries,
      comparison,
      trend: getTrendAnalysis(selectedPeriod, selectedCategory || undefined),
      seasonal: getSeasonalPatterns(selectedCategory || undefined)
    }
  }, [selectedPeriod, selectedCategory, compareMode, getDailyTimeSeries, getMonthlyTimeSeries, getPeriodComparison, getTrendAnalysis, getSeasonalPatterns])

  // Métricas resumo
  const summaryMetrics = useMemo(() => {
    const data = getFilteredData(selectedPeriod, selectedCategory || undefined)
    const total = data.reduce((sum, expense) => sum + expense.amount, 0)
    const count = data.length
    const average = count > 0 ? total / count : 0

    const categories = [...new Set(data.map(e => e.category))]
    const categoryTotals = categories.map(category => ({
      category,
      total: data.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0)
    })).sort((a, b) => b.total - a.total)

    return {
      total,
      count,
      average,
      categories: categoryTotals,
      topCategory: categoryTotals[0]?.category || 'N/A',
      period: selectedPeriod
    }
  }, [getFilteredData, selectedPeriod, selectedCategory])

  return {
    // Estado
    selectedPeriod,
    selectedCategory,
    compareMode,
    comparePeriod,

    // Setters
    setSelectedPeriod,
    setSelectedCategory,
    setCompareMode,
    setComparePeriod,

    // Dados principais
    chartData,
    summaryMetrics,

    // Métodos de análise
    getDailyTimeSeries,
    getMonthlyTimeSeries,
    getTrendAnalysis,
    getSeasonalPatterns,
    getPeriodComparison,
    getFilteredData
  }
}