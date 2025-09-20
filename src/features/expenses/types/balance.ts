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
      // Adiciona ao total pago pelo membro
      const paidBy = balances.get(expense.paidById)
      if (paidBy) {
        paidBy.paid += expense.amount
      }

      // Calcula quanto cada um deve dessa despesa
      for (const [memberId, share] of memberShares) {
        const balance = balances.get(memberId)
        if (balance) {
          balance.share += (expense.amount * share) / 100
        }
      }
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
      isSettled: false
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