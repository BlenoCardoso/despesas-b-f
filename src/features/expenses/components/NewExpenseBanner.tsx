import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useNewExpenseWatcher } from '../hooks/useNewExpenseWatcher'

interface NewExpenseBannerProps {
  householdId: string
}

export function NewExpenseBanner({ householdId }: NewExpenseBannerProps) {
  const { newExpense, dismissNewExpense } = useNewExpenseWatcher(householdId)

  // Configurar auto-dismiss com cleanup
  useEffect(() => {
    if (!newExpense) return
    const timer = setTimeout(dismissNewExpense, 5000)
    return () => clearTimeout(timer)
  }, [newExpense, dismissNewExpense])

  if (!newExpense) return null

  return (
    <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{newExpense.title}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:text-primary-foreground/80"
            onClick={dismissNewExpense}
          >
            Dispensar
          </Button>
        </div>
        {newExpense.description && (
          <span className="text-sm text-primary-foreground/90">
            {newExpense.description}
          </span>
        )}
      </div>
    </div>
  )
}