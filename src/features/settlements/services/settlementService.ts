import { DatabaseMiddleware } from '@/lib/databaseMiddleware'
import { Settlement, Transfer } from '@/types/settlement'

export class SettlementService {
  // Busca acerto do mês
  static async getMonthSettlement(householdId: string, month: string) {
    const settlements = await DatabaseMiddleware.query({
      collection: 'settlements',
      where: [
        ['householdId', '==', householdId],
        ['month', '==', month]
      ]
    })

    return settlements[0] as Settlement | undefined
  }

  // Cria ou atualiza acerto
  static async saveSettlement(settlement: Omit<Settlement, 'id'>) {
    const existing = await this.getMonthSettlement(
      settlement.householdId,
      settlement.month
    )

    if (existing) {
      await DatabaseMiddleware.update({
        collection: 'settlements',
        id: existing.id,
        data: settlement
      })
      return existing.id
    }

    return DatabaseMiddleware.create({
      collection: 'settlements',
      data: settlement
    })
  }

  // Calcula transferências necessárias
  static calculateTransfers(amounts: Record<string, number>): Transfer[] {
    const transfers: Transfer[] = []
    const members = Object.entries(amounts)
      .map(([id, amount]) => ({ id, amount }))
      .sort((a, b) => a.amount - b.amount)

    let i = 0
    let j = members.length - 1

    while (i < j) {
      const debtor = members[i]
      const creditor = members[j]

      if (debtor.amount >= 0) break

      const amount = Math.min(-debtor.amount, creditor.amount)
      
      if (amount > 0) {
        transfers.push({
          from: debtor.id,
          to: creditor.id,
          amount
        })

        debtor.amount += amount
        creditor.amount -= amount

        if (creditor.amount === 0) j--
        if (debtor.amount === 0) i++
      }
    }

    return transfers
  }
}