import { TrendingUp, TrendingDown, AlertTriangle, Check, AlertCircle } from 'lucide-react'
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

  const budgetStatus = getBudgetStatus()

  if (isLoading) {
    return (
      <section className="rounded-2xl bg-zinc-900/60 p-3" role="status" aria-label="Carregando resumo do mês">
        <div className="grid grid-cols-2 gap-2 items-start">
          <div className="col-span-1 row-span-2">
            <div className="h-8 w-36 bg-zinc-700 rounded skeleton mb-1"></div>
            <div className="h-12 w-44 bg-zinc-700 rounded skeleton"></div>
          </div>

          <div className="rounded-xl bg-zinc-800/60 p-2">
            <div className="h-4 w-16 bg-zinc-600 rounded skeleton mb-2"></div>
            <div className="h-6 w-24 bg-zinc-600 rounded skeleton"></div>
          </div>

          <div className="rounded-xl bg-zinc-800/60 p-2">
            <div className="h-4 w-16 bg-zinc-600 rounded skeleton mb-2"></div>
            <div className="h-6 w-24 bg-zinc-600 rounded skeleton"></div>
          </div>
        </div>

        <div className="mt-3">
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
            <span
              role="status"
              aria-label={budgetStatus.text}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs font-medium",
                budgetStatus.color === 'destructive' && "bg-red-900/30 text-red-200",
                budgetStatus.color === 'warning' && "bg-yellow-900/30 text-yellow-200",
                budgetStatus.color === 'success' && "bg-emerald-900/30 text-emerald-200"
              )}
            >
              <span className="flex items-center justify-center h-4 w-4">
                {budgetStatus.color === 'destructive' ? (
                  <AlertCircle className="h-3 w-3 text-red-300" aria-hidden />
                ) : (
                  <Check className="h-3 w-3 text-emerald-300" aria-hidden />
                )}
              </span>
              <span className="sr-only">{budgetStatus.text}</span>
              <span aria-hidden className="text-xs">{budgetStatus.emoji}</span>
            </span>
          )}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 items-start">
          {/* Total grande ocupando a coluna esquerda (duas linhas) */}
          <div className="col-span-1 row-span-2 flex flex-col justify-center">
            <motion.div
              className="text-2xl font-bold leading-tight text-white"
              key={totalMonth}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {formatCurrency(totalMonth)}
            </motion.div>
            <div className="text-xs text-gray-300 mt-1">Total</div>
          </div>

          {/* Dois mini-KPIs à direita (grid 2x2 compact) */}
          <div className="rounded-xl bg-zinc-800/60 p-2">
            <div className="text-xs text-gray-300">Média/dia</div>
            <div className="text-sm font-semibold mt-1 text-white">{formatCurrency(dailyAverage)}</div>
          </div>

          <div className="rounded-xl bg-zinc-800/60 p-2">
            <div className="text-xs text-gray-300">Projeção</div>
            <div className={cn("text-sm font-semibold mt-1 truncate", isProjectionOverBudget ? "text-red-400" : "text-white")}>{formatCurrency(projection)}</div>
          </div>
        </div>

        {/* Progress bar do orçamento */}
        {budget > 0 && (
          <div className="mt-3">
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

