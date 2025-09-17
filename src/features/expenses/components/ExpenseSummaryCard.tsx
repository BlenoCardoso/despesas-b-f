import React from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Check, AlertCircle, Activity } from 'lucide-react'
import { formatCurrency } from '@/core/utils/formatters'
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
      <section className="rounded-2xl bg-zinc-900/60 p-3" role="status" aria-label="Carregando resumo do mês">
        <div className="flex items-center justify-between mb-0.5">
          <div className="h-4 w-20 bg-zinc-700 rounded skeleton"></div>
          <div className="h-5 w-16 bg-zinc-700 rounded skeleton"></div>
        </div>

        {/* Total skeleton */}
        <div className="h-7 w-28 bg-zinc-700 rounded skeleton mb-1.5"></div>

        {/* Mini-cards skeleton */}
        <div className="mt-1 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-zinc-800/60 p-2 flex items-center gap-2">
            <div className="h-4 w-4 bg-zinc-600 rounded skeleton shrink-0"></div>
            <div className="min-w-0 space-y-1">
              <div className="h-3 w-12 bg-zinc-600 rounded skeleton"></div>
              <div className="h-4 w-14 bg-zinc-600 rounded skeleton"></div>
            </div>
          </div>

          <div className="rounded-xl bg-zinc-800/60 p-2 flex items-center gap-2">
            <div className="h-4 w-4 bg-zinc-600 rounded skeleton shrink-0"></div>
            <div className="min-w-0 space-y-1">
              <div className="h-3 w-14 bg-zinc-600 rounded skeleton"></div>
              <div className="h-4 w-16 bg-zinc-600 rounded skeleton"></div>
            </div>
          </div>
        </div>

        {/* Progress bar skeleton */}
        <div className="mt-2">
          <div className="h-2 w-full bg-zinc-800 rounded skeleton"></div>
        </div>
      </section>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <section className="rounded-2xl bg-zinc-900/60 p-3">
        <div className="flex items-center justify-between mb-0.5">
          <h2 className="text-sm font-medium text-white">Resumo do Mês</h2>
          {budget > 0 && (
            <span className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              budgetStatus.color === 'destructive' && "bg-red-900/40 text-red-200",
              budgetStatus.color === 'warning' && "bg-yellow-900/40 text-yellow-200", 
              budgetStatus.color === 'success' && "bg-emerald-900/40 text-emerald-200"
            )}>
              {budgetStatus.emoji} {budgetStatus.text}
            </span>
          )}
        </div>
          {/* Total em uma linha */}
        <motion.div 
          className="text-2xl font-bold leading-tight text-white"
          key={totalMonth}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {formatCurrency(totalMonth)}
        </motion.div>
          
          {/* Mini-cards com ícones */}
          <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-zinc-800/60 p-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-gray-300">Média/dia</div>
                <div className="text-sm font-semibold truncate text-white">{formatCurrency(dailyAverage)}</div>
              </div>
            </div>
            
            <div className="rounded-xl bg-zinc-800/60 p-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-gray-300">Projeção</div>
                <div className={cn(
                  "text-sm font-semibold truncate",
                  isProjectionOverBudget ? "text-red-400" : "text-white"
                )}>
                  {formatCurrency(projection)}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar do orçamento - compacto */}
          {budget > 0 && (
            <div className="mt-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div 
                  className={cn(
                    "h-full transition-all duration-300",
                    isOverBudget && "bg-red-500",
                    isNearLimit && "bg-yellow-500",
                    !isOverBudget && !isNearLimit && "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                />
              </div>
            </div>
          )}
      </section>
    </motion.div>
  )
}

