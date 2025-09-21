import { Expense } from './expense'
import { HouseholdMember } from '@/features/households/types'

// Proporção de pagamento por membro (ex: 50/50, 60/40)
export interface PaymentShare {
  memberId: string
  percentage: number
}

// Configurações de divisão de despesas
export interface HouseholdSplitSettings {
  householdId: string
  // Se true, todas as despesas são compartilhadas igualmente
  // Se false, cada despesa tem seu próprio status de compartilhamento
  unifyExpenses: boolean
  // Proporções de divisão por membro (se não definido, divide igualmente)
  shares?: PaymentShare[]
  updatedAt: Date
}

// Registra um acerto de contas entre membros
export interface SettleUpRecord {
  id: string
  householdId: string
  // Membro que pagou
  fromMemberId: string
  // Membro que recebeu
  toMemberId: string
  // Valor acertado
  amount: number
  // Data do acerto
  settledAt: Date
  // Mês/ano de referência
  month: number // 1-12
  year: number
  // Despesas incluídas neste acerto
  expenseIds: string[]
  // Observações opcionais
  notes?: string
}

// Representa o saldo entre dois membros
export interface MemberBalance {
  memberId: string
  paid: number // quanto pagou no total
  share: number // quanto deveria ter pago (baseado nas proporções)
  balance: number // saldo (positivo = tem a receber, negativo = tem a pagar)
}

// Representa uma transferência necessária para acerto
export interface BalanceTransfer {
  fromMemberId: string
  toMemberId: string
  amount: number
}

// Resume os saldos do mês
export interface MonthlyBalanceReport {
  month: number
  year: number
  totalExpenses: number
  memberBalances: MemberBalance[]
  // Lista otimizada de transferências para acerto
  suggestedTransfers: BalanceTransfer[]
  // Se houve acerto neste mês
  isSettled: boolean
  settledAt?: Date
  // Ajustes por centavos resultantes do arredondamento das divisões
  roundingAdjustments?: Array<{
    memberId: string
    // ajuste em centavos (positivo = recebeu centavos extras, negativo = perdeu centavos)
    cents: number
    direction: 'up' | 'down' | 'none'
  }>
}

// Funções auxiliares para cálculos
export class BalanceCalculator {
  // Calcula os saldos do mês considerando as proporções definidas
  static calculateMonthlyBalance(
    expenses: Expense[],
    members: HouseholdMember[],
    shares?: PaymentShare[]
  ): MonthlyBalanceReport {
    // Se não há proporções definidas, divide igualmente
    const defaultShare = 100 / members.length
    const memberShares = new Map(
      members.map(member => [
        member.id,
        shares?.find(s => s.memberId === member.id)?.percentage || defaultShare
      ])
    )

    // Inicializa saldos
    const balances = new Map(
      members.map(member => [
        member.id,
        {
          memberId: member.id,
          paid: 0,
          share: 0,
          balance: 0
        }
      ])
    )

    // Calcula totais pagos e devidos
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    // Para cada despesa
    for (const expense of expenses) {
      // Adiciona ao total pago pelo membro (paidById pode ser opcional em alguns registros)
      const paidById = (expense as any).paidById ?? (expense as any).userId
      if (paidById) {
        const paidBy = balances.get(paidById)
        if (paidBy) paidBy.paid += expense.amount
      }

      // Calcula quanto cada um deve dessa despesa (valor bruto, sem arredondar)
      for (const [memberId, share] of memberShares) {
        const balance = balances.get(memberId)
        if (balance) {
          balance.share += (expense.amount * share) / 100
        }
      }
    }

    // Ajuste por centavos: transformar valores brutos em centavos inteiros distribuindo o restante
    const totalCents = Math.round(totalExpenses * 100)
    const membersData = Array.from(balances.values())

    // Calcula centavos floor e resíduos
    const floorCentsMap = new Map<string, number>()
    const residueMap = new Map<string, number>()
    let sumFloorCents = 0

    for (const m of membersData) {
      const rawCentsFloat = m.share * 100
      const floorCents = Math.floor(rawCentsFloat)
      const residue = rawCentsFloat - floorCents
      floorCentsMap.set(m.memberId, floorCents)
      residueMap.set(m.memberId, residue)
      sumFloorCents += floorCents
    }

    // Quantos centavos ainda precisamos distribuir
    let remaining = totalCents - sumFloorCents

    // Ordena membros por residue desc para distribuir centavos extras a quem ficou com maior parte fracionária
    const ordered = membersData.slice().sort((a, b) => (residueMap.get(b.memberId) ?? 0) - (residueMap.get(a.memberId) ?? 0))

    const finalCentsMap = new Map<string, number>()
    for (const m of ordered) {
      const base = floorCentsMap.get(m.memberId) ?? 0
      const add = remaining > 0 ? 1 : 0
      finalCentsMap.set(m.memberId, base + add)
      if (remaining > 0) remaining--
    }

    // Prepara informações de ajuste (quem recebeu/perdeu centavos)
    const roundingAdjustments: Array<{ memberId: string; cents: number; direction: 'up' | 'down' | 'none' }> = []

    for (const m of membersData) {
      const rawCentsRoundedNearest = Math.round(m.share * 100)
      const finalCents = finalCentsMap.get(m.memberId) ?? 0
      const diff = finalCents - rawCentsRoundedNearest
      const direction: 'up' | 'down' | 'none' = diff > 0 ? 'up' : diff < 0 ? 'down' : 'none'
      roundingAdjustments.push({ memberId: m.memberId, cents: diff, direction })

      // Atualiza o share para o valor final em reais
      m.share = (finalCentsMap.get(m.memberId) ?? 0) / 100
    }

    // Calcula saldos finais
    for (const balance of balances.values()) {
      balance.balance = balance.paid - balance.share
    }

    // Calcula transferências otimizadas
    const transfers = this.calculateOptimalTransfers(Array.from(balances.values()))

    return {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      totalExpenses,
      memberBalances: Array.from(balances.values()),
      suggestedTransfers: transfers,
      isSettled: false,
      roundingAdjustments
    }
  }

  // Calcula a lista otimizada de transferências para acerto
  private static calculateOptimalTransfers(balances: MemberBalance[]): BalanceTransfer[] {
    const transfers: BalanceTransfer[] = []
    
    // Separa quem tem a pagar e quem tem a receber
    const debtors = balances
      .filter(b => b.balance < 0)
      .sort((a, b) => a.balance - b.balance)
    const creditors = balances
      .filter(b => b.balance > 0)
      .sort((a, b) => b.balance - a.balance)

    let debtorIndex = 0
    let creditorIndex = 0

    // Enquanto houver débitos a acertar
    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex]
      const creditor = creditors[creditorIndex]

      // Valor a ser transferido é o menor entre o débito e o crédito
      const amount = Math.min(Math.abs(debtor.balance), creditor.balance)

      // Registra a transferência
      transfers.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amount: Math.round(amount * 100) / 100 // Arredonda para 2 casas decimais
      })

      // Atualiza os saldos
      debtor.balance += amount
      creditor.balance -= amount

      // Avança para o próximo se o saldo foi zerado
      if (Math.abs(debtor.balance) < 0.01) debtorIndex++
      if (Math.abs(creditor.balance) < 0.01) creditorIndex++
    }

    return transfers
  }
}