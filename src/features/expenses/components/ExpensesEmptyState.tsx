import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Plus, Receipt } from 'lucide-react'

interface Props {
  onNewExpense: () => void
  showSkeleton?: boolean
  className?: string
}

export function ExpensesEmptyState({ 
  onNewExpense,
  showSkeleton,
  className 
}: Props) {
  if (showSkeleton) {
    return null // Skeleton é tratado no componente pai
  }

  return (
    <EmptyState
      icon={<Receipt className="w-12 h-12" />}
      title="Nenhuma despesa ainda"
      description="Comece adicionando sua primeira despesa para acompanhar os gastos da casa."
      action={
        <Button onClick={onNewExpense}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Despesa
        </Button>
      }
      className={className}
    />
  )
}