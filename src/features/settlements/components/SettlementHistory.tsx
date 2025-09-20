import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Settlement } from '@/types/settlement'
import { DatabaseMiddleware } from '@/lib/databaseMiddleware'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'

interface Props {
  householdId: string
  members: Array<{
    id: string
    name: string
  }>
  className?: string
}

export function SettlementHistory({ householdId, members, className }: Props) {
  const [settlements, setSettlements] = useState<Settlement[]>([])

  // Busca histórico de acertos
  useEffect(() => {
    const fetchSettlements = async () => {
      const results = await DatabaseMiddleware.query({
        collection: 'settlements',
        where: [
          ['householdId', '==', householdId],
          ['completedAt', '!=', null]
        ],
        orderBy: ['completedAt', 'desc'],
        limit: 12
      })

      setSettlements(results as Settlement[])
    }

    fetchSettlements()
  }, [householdId])

  if (settlements.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold">Histórico de Acertos</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Últimos 12 meses de acertos
          </p>
        </div>

        <div className="space-y-6">
          {settlements.map(settlement => {
            const monthName = format(new Date(settlement.month), "MMMM 'de' yyyy", {
              locale: ptBR
            })

            return (
              <div key={settlement.id}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{monthName}</h4>
                  <span className="text-sm text-muted-foreground">
                    {format(settlement.completedAt!, "dd/MM/yyyy")}
                  </span>
                </div>

                <div className="space-y-2">
                  {members.map(member => {
                    const data = settlement.amounts[member.id]
                    if (!data) return null

                    return (
                      <div key={member.id} className="flex justify-between items-center text-sm">
                        <span>{member.name}</span>
                        <span className={cn(
                          "tabular-nums",
                          data.balance > 0 && "text-green-600 dark:text-green-400",
                          data.balance < 0 && "text-red-600 dark:text-red-400"
                        )}>
                          {formatCurrency(data.balance)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}