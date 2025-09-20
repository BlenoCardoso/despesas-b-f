import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useExpenseRatioStore } from '@/stores/expenseRatio'
import { useEffect } from 'react'

interface Props {
  householdId: string
  members: Array<{
    id: string
    name: string
  }>
  className?: string
}

export function ExpenseRatioControl({ householdId, members, className }: Props) {
  const { isUnified, setRatio, getRatios } = useExpenseRatioStore()
  const ratios = getRatios(householdId)

  // Inicializa proporções iguais se não existirem
  useEffect(() => {
    const defaultRatio = 100 / members.length
    members.forEach(member => {
      if (!ratios[member.id]) {
        setRatio(householdId, member.id, defaultRatio)
      }
    })
  }, [members, householdId, ratios, setRatio])

  // Atualiza proporção do membro
  const handleRatioChange = (memberId: string, value: string) => {
    const ratio = parseFloat(value) || 0
    if (ratio < 0 || ratio > 100) return
    
    setRatio(householdId, memberId, ratio)
    
    // Ajusta proporções para somar 100%
    const total = Object.values(ratios).reduce((acc, curr) => acc + curr, 0)
    if (total > 100) {
      const diff = total - 100
      const otherMembers = members.filter(m => m.id !== memberId)
      const reduction = diff / otherMembers.length
      
      otherMembers.forEach(member => {
        const newRatio = Math.max(0, (ratios[member.id] || 0) - reduction)
        setRatio(householdId, member.id, newRatio)
      })
    }
  }

  if (!isUnified) return null

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <h3 className="font-semibold">Proporção das Despesas</h3>
        
        <div className="space-y-3">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor={`ratio-${member.id}`}>{member.name}</Label>
              </div>
              
              <div className="w-24 flex items-center gap-1">
                <Input
                  id={`ratio-${member.id}`}
                  type="number"
                  min={0}
                  max={100}
                  value={ratios[member.id] || 0}
                  onChange={e => handleRatioChange(member.id, e.target.value)}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Defina a proporção de cada pessoa no total das despesas.
          A soma deve ser 100%.
        </p>
      </div>
    </Card>
  )
}