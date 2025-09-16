import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Check, AlertCircle } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/core/utils/formatters'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ExpenseSummaryCardProps {
  totalMonth: number
  budget: number
  remaining: number
  dailyAverage: number
  projection: number
  variationFromLastMonth: number
  isLoading?: boolean
}

export function ExpenseSummaryCard({
  totalMonth,
  budget,
  remaining,
  dailyAverage,
  projection,
  variationFromLastMonth,
  isLoading = false,
}: ExpenseSummaryCardProps) {
  const budgetUsage = budget > 0 ? (totalMonth / budget) * 100 : 0
  const isOverBudget = totalMonth > budget && budget > 0
  const isNearLimit = budgetUsage >= 70 && budgetUsage < 100
  const isProjectionOverBudget = projection > budget && budget > 0

  const getBudgetStatus = () => {
    if (isOverBudget) return { 
      color: 'destructive', 
      icon: AlertCircle, 
      text: 'Orçamento Estourou',
      emoji: '❗'
    }
    if (isNearLimit) return { 
      color: 'warning', 
      icon: AlertTriangle, 
      text: 'Próximo do Limite',
      emoji: '⚠️'
    }
    return { 
      color: 'success', 
      icon: Check, 
      text: 'Dentro do Orçamento',
      emoji: '✅'
    }
  }

  const getVariationColor = () => {
    if (variationFromLastMonth > 0) return 'text-red-500'
    if (variationFromLastMonth < 0) return 'text-green-500'
    return 'text-gray-500'
  }

  const getVariationIcon = () => {
    if (variationFromLastMonth > 0) return TrendingUp
    if (variationFromLastMonth < 0) return TrendingDown
    return null
  }

  const budgetStatus = getBudgetStatus()
  const VariationIcon = getVariationIcon()

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="font-semibold">Resumo do Mês</CardTitle>
        </CardHeader>
        <CardContent className="space-consistent">
          <div className="animate-pulse space-consistent-sm">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-consistent">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="font-semibold">Resumo do Mês</CardTitle>
            {budget > 0 && (
              <Badge 
                variant="outline" 
                className={cn(
                  "flex items-center gap-1 font-medium border",
                  budgetStatus.color === 'destructive' && "badge-error",
                  budgetStatus.color === 'warning' && "badge-warning",
                  budgetStatus.color === 'success' && "badge-success"
                )}
              >
                <span className="text-sm">{budgetStatus.emoji}</span>
                <span>{budgetStatus.text}</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-consistent-sm">
          {/* Total gasto - Grande e centralizado */}
          <div className="text-center">
            <div className="text-gray-500 mb-1">Total gasto</div>
            <motion.div 
              className="monetary-large font-bold text-gray-900"
              key={totalMonth}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {formatCurrency(totalMonth)}
            </motion.div>
          </div>
          
          {/* Grid 2x2 com mini-KPIs */}
          <div className="grid grid-cols-2 gap-consistent-sm">
            <div className="text-center padding-consistent-sm bg-gray-50 rounded-md">
              <div className="text-gray-500 mb-1">Média/dia</div>
              <div className="monetary-small font-semibold">{formatCurrency(dailyAverage)}</div>
            </div>
            
            <div className="text-center padding-consistent-sm bg-gray-50 rounded-md">
              <div className="text-gray-500 mb-1">Projeção</div>
              <div className={cn(
                "monetary-small font-semibold",
                isProjectionOverBudget && "text-red-500"
              )}>
                {formatCurrency(projection)}
              </div>
            </div>
          </div>

          {/* Progress bar do orçamento - compacto */}
          {budget > 0 && (
            <div className="space-consistent-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Orçamento {formatCurrency(budget)}</span>
                <span>{formatPercentage(budgetUsage)}</span>
              </div>
              <Progress 
                value={Math.min(budgetUsage, 100)} 
                className={cn(
                  "h-2 transition-colors duration-300",
                  isOverBudget && "[&>div]:bg-red-500 bg-red-100",
                  isNearLimit && "[&>div]:bg-yellow-500 bg-yellow-100",
                  !isOverBudget && !isNearLimit && "[&>div]:bg-green-500 bg-green-100"
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

