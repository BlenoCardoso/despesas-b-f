import { useState } from 'react'
import { ExpensesEmptyState } from './ExpensesEmptyState'
import { FinancialSummaryEmptyState } from './FinancialSummaryEmptyState'
import { ChartEmptyState } from '@/features/reports/components/ChartEmptyState'
import { useExpenses } from '../hooks/useExpenses'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface Props {
  householdId: string
}

export function ExpensesDashboard({ householdId }: Props) {
  const { data: expenses, isLoading } = useExpenses({ householdId })
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false)

  // Funções de callback
  const handleNewExpense = () => {
    setShowNewExpenseForm(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeletons são implementados nos componentes específicos */}
        <div className="animate-pulse bg-muted rounded-lg h-48" />
        <div className="animate-pulse bg-muted rounded-lg h-96" />
        <div className="animate-pulse bg-muted rounded-lg h-64" />
      </div>
    )
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Despesas</h2>
          <Button onClick={handleNewExpense}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Despesa
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FinancialSummaryEmptyState className="md:col-span-1" />
          <ChartEmptyState
            title="Sem despesas por categoria"
            description="O gráfico de categorias aparecerá aqui quando houver despesas registradas."
            className="md:col-span-1"
          />
        </div>

        <ExpensesEmptyState onNewExpense={handleNewExpense} />
      </div>
    )
  }

  return (
    // Renderização normal quando há despesas
    null
  )
}