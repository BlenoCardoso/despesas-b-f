import { Card } from '@/components/ui/card'
import { useExpenseTotals } from '../hooks/useExpenseTotals'
import { formatCurrency } from '@/utils/format'

interface Props {
  householdId: string
  expenses: Array<{
    id: string
    amount: number
    paidBy: string
  }>
  members: Array<{
    id: string
    name: string
  }>
  className?: string
}

export function ExpenseSummary({ householdId, expenses, members, className }: Props) {
  const { total, totals } = useExpenseTotals(householdId, expenses, members)

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <h3 className="font-semibold">Resumo das Despesas</h3>

        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="flex justify-between items-center text-sm">
              <span>{member.name}</span>
              <span className="tabular-nums">
                {formatCurrency(totals[member.id] || 0)}
              </span>
            </div>
          ))}

          <div className="h-px bg-border my-2" />

          <div className="flex justify-between items-center font-medium">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}