import { db } from '@/core/db/database'
import { generateId } from '@/core/utils/id'
import {
  HouseholdSplitSettings,
  SettleUpRecord,
  MonthlyBalanceReport,
  BalanceCalculator
} from '../types/balance'

export class BalanceService {
  // Buscar ou criar configurações de divisão
  async getOrCreateSplitSettings(householdId: string): Promise<HouseholdSplitSettings> {
    const settings = await db.householdSplitSettings
      .where('householdId')
      .equals(householdId)
      .first()

    if (settings) return settings

    // Se não existir, cria com valores padrão
    const newSettings: HouseholdSplitSettings = {
      householdId,
      unifyExpenses: false, // Por padrão, cada despesa tem seu próprio status
      updatedAt: new Date()
    }

    await db.householdSplitSettings.add(newSettings)
    return newSettings
  }

  // Atualizar configurações
  async updateSplitSettings(
    householdId: string,
    settings: Partial<HouseholdSplitSettings>
  ): Promise<void> {
    await db.householdSplitSettings
      .where('householdId')
      .equals(householdId)
      .modify({
        ...settings,
        updatedAt: new Date()
      })
  }

  // Calcular saldos do mês
  async calculateMonthlyBalance(
    householdId: string,
    month: number,
    year: number
  ): Promise<MonthlyBalanceReport> {
    // Buscar configurações de divisão
    const settings = await this.getOrCreateSplitSettings(householdId)

    // Buscar membros da household
    const members = await db.householdMembers
      .where('householdId')
      .equals(householdId)
      .toArray()

    // Definir período
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    // Buscar despesas da household (normalizamos datas para comparação)
    const rawExpenses = await db.expenses
      .where('householdId')
      .equals(householdId)
      .toArray()

    // Normalizar e filtrar por período/deletedAt
    let expenses = rawExpenses
      .map(e => ({
        // preserve original fields but normalize date to Date object
        ...(e as any),
        date: typeof (e as any).date === 'string' ? new Date((e as any).date) : (e as any).date,
        // ensure isShared exists on the in-memory representation
        isShared: (e as any).isShared === true
      } as any))
      .filter((expense: any) => {
        if (expense.deletedAt) return false
        return expense.date >= startDate && expense.date <= endDate
      })

    // Se unifyExpenses = true, considera todas as despesas como compartilhadas
    if (settings.unifyExpenses) {
      expenses = expenses.map((expense: any) => ({
        ...expense,
        isShared: true
      }))
    } else {
      // Senão, filtra apenas as despesas marcadas como compartilhadas
      expenses = expenses.filter((expense: any) => expense.isShared)
    }

    // Verifica se já existe um acerto para este mês
    const existingSettle = await db.settleUpRecords
      .where(['householdId', 'month', 'year'])
      .equals([householdId, month, year])
      .first()

    // Calcula os saldos
    const report = BalanceCalculator.calculateMonthlyBalance(
      expenses,
      members,
      settings.shares
    )

    // Atualiza status de acerto
    if (existingSettle) {
      report.isSettled = true
      report.settledAt = existingSettle.settledAt
    }

    return report
  }

  // Registrar um acerto de contas
  async settleUp(data: {
    householdId: string
    fromMemberId: string
    toMemberId: string
    amount: number
    expenseIds: string[]
    month: number
    year: number
    notes?: string
    paymentMethod?: string
    paymentDate?: Date
    status?: 'registered' | 'pending' | 'cancelled'
  }): Promise<SettleUpRecord> {
    // Criar registro de acerto
    const record: SettleUpRecord = {
      id: generateId(),
      householdId: data.householdId,
      fromMemberId: data.fromMemberId,
      toMemberId: data.toMemberId,
      amount: data.amount,
      expenseIds: data.expenseIds || [],
      month: data.month,
      year: data.year,
      notes: data.notes,
      settledAt: new Date(),
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate,
      status: data.status || 'registered'
    }

    await db.settleUpRecords.add(record as any)

    // Marcar todas as despesas incluídas como acertadas
    if (data.expenseIds && data.expenseIds.length > 0) {
      await db.expenses
        .where('id')
        .anyOf(data.expenseIds)
        .modify({
          settledRecordId: record.id,
          settledAt: record.settledAt,
          updatedAt: new Date()
        } as any)
    }

    return record
  }

  // Buscar histórico de acertos
  async getSettleHistory(householdId: string): Promise<SettleUpRecord[]> {
    return await db.settleUpRecords
      .where('householdId')
      .equals(householdId)
      .reverse()
      .sortBy('settledAt')
  }
}