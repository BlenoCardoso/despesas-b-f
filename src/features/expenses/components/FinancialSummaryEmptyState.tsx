import { EmptyState } from '@/components/ui/empty-state'
import { PieChart } from 'lucide-react'

interface Props {
  showSkeleton?: boolean
  className?: string
}

export function FinancialSummaryEmptyState({
  showSkeleton,
  className
}: Props) {
  if (showSkeleton) {
    return null // Skeleton é tratado no componente pai
  }

  return (
    <EmptyState
      icon={<PieChart className="w-12 h-12" />}
      title="Sem dados para exibir"
      description="O resumo financeiro será exibido aqui quando houver despesas registradas."
      className={className}
    />
  )
}