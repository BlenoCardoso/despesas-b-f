import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settlement } from '@/types/settlement'
import { useSettlementCalculation } from '../hooks/useSettlementCalculation'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'

interface Props {
  householdId: string
  month: string
  expenses: Array<{
    id: string
    amount: number
    paidBy: string
    createdAt: Date
  }>
  members: Array<{
    id: string
    name: string
  }>
  onComplete?: () => void
  className?: string
}

export function SettlementSummary({ 
  householdId,
  month,
  expenses,
  members,
  onComplete,
  className 
}: Props) {
  const { settlement, total } = useSettlementCalculation(
    householdId,
    month,
    expenses,
    members
  )

  return (
    <Card className={className}>
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-semibold">Resumo do Mês</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Total de despesas: {formatCurrency(total)}
          </p>
        </div>

        <div className="space-y-4">
          {members.map(member => {
            const data = settlement.amounts[member.id]
            if (!data) return null

            return (
              <div key={member.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{member.name}</span>
                  <span className={cn(
                    "tabular-nums",
                    data.balance > 0 && "text-green-600 dark:text-green-400",
                    data.balance < 0 && "text-red-600 dark:text-red-400"
                  )}>
                    {formatCurrency(data.balance)}
                  </span>
                </div>

                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagou</span>
                    <span className="tabular-nums">{formatCurrency(data.paid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deveria pagar</span>
                    <span className="tabular-nums">{formatCurrency(data.owed)}</span>
                  </div>
                </div>

                {data.transfers.length > 0 && (
                  <div className="text-sm space-y-1 pt-2">
                    <span className="text-muted-foreground">Deve transferir:</span>
                    {data.transfers.map((transfer, i) => {
                      const to = members.find(m => m.id === transfer.to)
                      if (!to) return null

                      return (
                        <div key={i} className="flex justify-between items-center">
                          <span>Para {to.name}</span>
                          <span className="tabular-nums font-medium">
                            {formatCurrency(transfer.amount)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {onComplete && (
          <Button 
            className="w-full" 
            onClick={onComplete}
          >
            Marcar como Acertado
          </Button>
        )}
      </div>
    </Card>
  )
}