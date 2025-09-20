import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <Card className={cn("flex flex-col items-center justify-center p-8", className)}>
      {icon && (
        <div className="text-muted-foreground/50 mb-4">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-muted-foreground text-center mt-1">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </Card>
  )
}