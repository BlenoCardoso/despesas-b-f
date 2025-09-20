import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useExpenseRatioStore } from '@/stores/expenseRatio'

interface Props {
  className?: string
}

export function UnifyExpensesToggle({ className }: Props) {
  const { isUnified, setUnified } = useExpenseRatioStore()

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <Switch
          id="unify-expenses"
          checked={isUnified}
          onCheckedChange={setUnified}
        />
        <Label htmlFor="unify-expenses">
          {isUnified ? 'Despesas unificadas' : 'Despesas separadas'}
        </Label>
      </div>
      
      <p className="text-sm text-muted-foreground mt-1">
        {isUnified 
          ? 'As despesas serão combinadas de acordo com a proporção definida'
          : 'As despesas serão mantidas separadas por pessoa'
        }
      </p>
    </div>
  )
}