import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react'
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
    if (isOverBudget) return { color: 'destructive', icon: AlertTriangle }
    if (isNearLimit) return { color: 'warning', icon: AlertTriangle }
    return { color: 'default', icon: DollarSign }
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
          <CardTitle className="text-lg font-semibold">Resumo do Mês</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Resumo do Mês</CardTitle>
            <Badge variant={budgetStatus.color as any} className="flex items-center gap-1">
              <budgetStatus.icon className="h-3 w-3" />
              {isOverBudget ? 'Acima do orçamento' : isNearLimit ? 'Próximo do limite' : 'No orçamento'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Total gasto */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-gray-600">Total gasto</span>
              <motion.span 
                className="text-2xl font-bold"
                key={totalMonth}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {formatCurrency(totalMonth)}
              </motion.span>
            </div>
            
            {budget > 0 && (
              <>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Orçamento: {formatCurrency(budget)}</span>
                  <span>Restante: {formatCurrency(remaining)}</span>
                </div>
                <Progress 
                  value={Math.min(budgetUsage, 100)} 
                  className={cn(
                    "h-2",
                    isOverBudget && "bg-red-100",
                    isNearLimit && "bg-yellow-100"
                  )}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatPercentage(budgetUsage)}</span>
                  {isOverBudget && (
                    <span className="text-red-500 font-medium">
                      +{formatCurrency(totalMonth - budget)} acima
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Média diária</p>
              <p className="text-lg font-semibold">{formatCurrency(dailyAverage)}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Projeção do mês</p>
              <div className="flex items-center gap-1">
                <p className={cn(
                  "text-lg font-semibold",
                  isProjectionOverBudget && "text-red-500"
                )}>
                  {formatCurrency(projection)}
                </p>
                {isProjectionOverBudget && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Variação do mês anterior */}
          {variationFromLastMonth !== 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-gray-600">vs. mês anterior</span>
              <div className="flex items-center gap-1">
                {VariationIcon && (
                  <VariationIcon className={cn("h-4 w-4", getVariationColor())} />
                )}
                <span className={cn("text-sm font-medium", getVariationColor())}>
                  {variationFromLastMonth > 0 ? '+' : ''}
                  {formatPercentage(Math.abs(variationFromLastMonth))}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

