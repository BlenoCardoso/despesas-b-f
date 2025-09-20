import { EmptyState } from '@/components/ui/empty-state'
import { BarChart3 } from 'lucide-react'

interface Props {
  showSkeleton?: boolean
  title?: string
  description?: string
  className?: string
}

export function ChartEmptyState({
  showSkeleton,
  title = 'Sem dados para visualizar',
  description = 'O gráfico será exibido quando houver dados suficientes para análise.',
  className
}: Props) {
  if (showSkeleton) {
    return null // Skeleton é tratado no componente pai
  }

  return (
    <EmptyState
      icon={<BarChart3 className="w-12 h-12" />}
      title={title}
      description={description}
      className={className}
    />
  )
}