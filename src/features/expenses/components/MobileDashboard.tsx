import React, { useState, useEffect, useMemo } from 'react'
import { 
  TrendingUp, TrendingDown, Eye, EyeOff, 
  Calendar, PieChart, BarChart3, Zap,
  Target, AlertTriangle, CheckCircle2,
  Smartphone, Wifi, WifiOff, Battery,
  ArrowRight, ArrowLeft, RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { useIntelligentExpenses } from '../../../hooks/useIntelligentExpenses'
import { useTouchGestures } from '../../../hooks/useTouchGestures'

interface DashboardMetrics {
  totalExpenses: number
  monthlyAverage: number
  categoryBreakdown: { category: string; amount: number; percentage: number }[]
  trendDirection: 'up' | 'down' | 'stable'
  trendPercentage: number
  topExpenseCategory: string
  recurringExpenses: number
  budgetStatus: 'good' | 'warning' | 'danger'
}

interface MobileDashboardProps {
  className?: string
}

export function MobileDashboard({ className }: MobileDashboardProps) {
  const [currentView, setCurrentView] = useState<'overview' | 'trends' | 'categories' | 'insights'>('overview')
  const [isPrivacyMode, setIsPrivacyMode] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { getSpendingInsights, predictUpcomingExpenses, expenseHistory } = useIntelligentExpenses()

  // Touch gestures para navegação mobile
  const { touchHandlers } = useTouchGestures({
    onSwipe: (gesture) => {
      if (gesture.direction === 'left') {
        navigateView('next')
      } else if (gesture.direction === 'right') {
        navigateView('prev')
      }
    }
  })

  // Monitor status da conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Monitor bateria (se disponível)
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level * 100)
        
        const updateBattery = () => setBatteryLevel(battery.level * 100)
        battery.addEventListener('levelchange', updateBattery)
        
        return () => battery.removeEventListener('levelchange', updateBattery)
      })
    }
  }, [])

  // Calcular métricas
  const metrics = useMemo((): DashboardMetrics => {
    const insights = getSpendingInsights()
    
    if (!insights) {
      return {
        totalExpenses: 0,
        monthlyAverage: 0,
        categoryBreakdown: [],
        trendDirection: 'stable',
        trendPercentage: 0,
        topExpenseCategory: 'N/A',
        recurringExpenses: 0,
        budgetStatus: 'good'
      }
    }

    const categoryBreakdown = insights.topCategories.map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / insights.totalAmount) * 100
    }))

    // Simular trend baseado em dados históricos
    const trendDirection: 'up' | 'down' | 'stable' = 
      insights.avgDailySpending > 100 ? 'up' : 
      insights.avgDailySpending < 50 ? 'down' : 'stable'

    const budgetStatus: 'good' | 'warning' | 'danger' = 
      insights.totalAmount < 1000 ? 'good' :
      insights.totalAmount < 2000 ? 'warning' : 'danger'

    return {
      totalExpenses: insights.totalExpenses,
      monthlyAverage: insights.avgDailySpending * 30,
      categoryBreakdown,
      trendDirection,
      trendPercentage: Math.random() * 20, // Mock percentage
      topExpenseCategory: insights.mostFrequentCategory,
      recurringExpenses: expenseHistory.length > 0 ? Math.floor(expenseHistory.length * 0.3) : 0,
      budgetStatus
    }
  }, [getSpendingInsights, expenseHistory])

  const navigateView = (direction: 'next' | 'prev') => {
    const views = ['overview', 'trends', 'categories', 'insights'] as const
    const currentIndex = views.indexOf(currentView)
    
    if (direction === 'next') {
      setCurrentView(views[(currentIndex + 1) % views.length])
    } else {
      setCurrentView(views[currentIndex === 0 ? views.length - 1 : currentIndex - 1])
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simular refresh de dados
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsRefreshing(false)
  }

  const formatCurrency = (value: number) => {
    if (isPrivacyMode) return '••••••'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getTrendIcon = () => {
    switch (metrics.trendDirection) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />
      default: return <BarChart3 className="h-4 w-4 text-blue-500" />
    }
  }

  const getBudgetStatusColor = () => {
    switch (metrics.budgetStatus) {
      case 'good': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'danger': return 'text-red-600 bg-red-50'
    }
  }

  return (
    <div className={`w-full max-w-md mx-auto space-y-4 ${className}`} {...touchHandlers}>
      {/* Header Mobile */}
      <div className="flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <PieChart className="h-6 w-6 text-blue-600" />
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Status Indicators */}
          <div className="flex items-center text-xs text-gray-500 space-x-1">
            {isOnline ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
            
            {batteryLevel !== null && (
              <div className="flex items-center">
                <Battery className="h-3 w-3" />
                <span className="ml-1">{Math.round(batteryLevel)}%</span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
          >
            {isPrivacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex justify-center space-x-1 px-4">
        {['overview', 'trends', 'categories', 'insights'].map((view) => (
          <button
            key={view}
            onClick={() => setCurrentView(view as any)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              currentView === view
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Views */}
      <div className="px-4 space-y-4">
        {currentView === 'overview' && (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Total (30 dias)</p>
                      <p className="text-lg font-bold">{formatCurrency(metrics.monthlyAverage)}</p>
                    </div>
                    {getTrendIcon()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Despesas</p>
                      <p className="text-lg font-bold">{metrics.totalExpenses}</p>
                    </div>
                    <Badge className={getBudgetStatusColor()}>
                      {metrics.budgetStatus}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Principais Categorias */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top Categorias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {metrics.categoryBreakdown.slice(0, 3).map((item, index) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.category}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'trends' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tendências
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Gastos diários</p>
                    <p className="text-xs text-gray-500">Média dos últimos 30 dias</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(metrics.monthlyAverage / 30)}</p>
                    <div className="flex items-center text-xs">
                      {getTrendIcon()}
                      <span className="ml-1">{metrics.trendPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Previsões</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Próxima semana</span>
                      <span>{formatCurrency(metrics.monthlyAverage * 0.25)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Próximo mês</span>
                      <span>{formatCurrency(metrics.monthlyAverage * 1.1)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'categories' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.categoryBreakdown.map((item, index) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.category}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(item.amount)}</p>
                        <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'insights' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Insights Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Categoria Principal</p>
                      <p className="text-xs text-gray-600">
                        Seus maiores gastos são em <strong>{metrics.topExpenseCategory}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Despesas Recorrentes</p>
                      <p className="text-xs text-gray-600">
                        Você tem {metrics.recurringExpenses} despesas que se repetem mensalmente
                      </p>
                    </div>
                  </div>

                  {metrics.budgetStatus === 'danger' && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Atenção aos Gastos</p>
                        <p className="text-xs text-gray-600">
                          Seus gastos estão acima da média. Considere revisar seu orçamento.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      <div className="flex justify-between px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateView('prev')}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Anterior</span>
        </Button>
        
        <div className="flex space-x-1">
          {['overview', 'trends', 'categories', 'insights'].map((view, index) => (
            <div
              key={view}
              className={`w-2 h-2 rounded-full ${
                currentView === view ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateView('next')}
          className="flex items-center gap-1"
        >
          <span className="sr-only">Próximo</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4">
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-xs">
            <Smartphone className="h-3 w-3 mr-1" />
            Deslize para navegar
          </Badge>
        </div>
      </div>
    </div>
  )
}