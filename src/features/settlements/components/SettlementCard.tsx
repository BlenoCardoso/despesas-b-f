import { useCallback, useState } from 'react'
import { format } from 'date-fns'
import { Card } from '@/components/ui/card'
import { MonthSelect } from './MonthSelect'
import { SettlementSummary } from './SettlementSummary'
import { SettlementService } from '../services/settlementService'

interface Props {
  householdId: string
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
  className?: string
}

export function SettlementCard({ householdId, expenses, members, className }: Props) {
  // Estado para mês selecionado
  const [selectedDate, setSelectedDate] = useState(new Date())
  const month = format(selectedDate, 'yyyy-MM')

  // Handler para marcar como acertado
  const handleComplete = useCallback(async () => {
    // Calcula settlement atual
    const settlement = await SettlementService.getMonthSettlement(
      householdId,
      month
    )

    if (!settlement) return

    // Marca como acertado
    await SettlementService.saveSettlement({
      ...settlement,
      completedAt: new Date()
    })
  }, [householdId, month])

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold">Acerto do Mês</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Veja os valores a serem transferidos entre os membros
          </p>
        </div>

        <MonthSelect
          date={selectedDate}
          onSelect={setSelectedDate}
        />

        <SettlementSummary
          householdId={householdId}
          month={month}
          expenses={expenses}
          members={members}
          onComplete={handleComplete}
        />
      </div>
    </Card>
  )
}