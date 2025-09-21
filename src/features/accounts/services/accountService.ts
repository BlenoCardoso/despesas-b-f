import { db } from '@/core/db/database'
import type { Account, TransferPayload } from '../types'

export class AccountService {
  async listAccounts(householdId: string): Promise<Account[]> {
    return await db.accounts.where({ householdId }).toArray()
  }

  async getAccount(id: string): Promise<Account | undefined> {
    return await db.accounts.get(id)
  }

  async createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    // Dexie typings in this codebase are loose; cast payload to any to avoid wide refactors here
    const id = await db.accounts.add({ ...account, createdAt: now, updatedAt: now } as any)
    return await db.accounts.get(id as any)
  }

  async updateAccount(id: string, patch: Partial<Account>) {
    patch.updatedAt = new Date().toISOString()
    await db.accounts.update(id, patch as any)
    return await db.accounts.get(id)
  }

  async deleteAccount(id: string) {
    // soft-delete: here simply remove; callers may keep transfer history elsewhere
    await db.accounts.delete(id)
  }

  async transfer(p: TransferPayload) {
    // Simple atomic-ish transfer: adjust balances if present and record a settleUpRecord as transfer
    const { householdId, fromAccountId, toAccountId, amount, notes, createdBy } = p

    // Update balances if stored
    const from = await db.accounts.get(fromAccountId)
    const to = await db.accounts.get(toAccountId)

    if (!from || !to) throw new Error('Conta não encontrada')

    // adjust numeric balances if present
    if (typeof from.balance === 'number') from.balance = (from.balance || 0) - amount
    if (typeof to.balance === 'number') to.balance = (to.balance || 0) + amount

    await Promise.all([
      db.accounts.put(from as any),
      db.accounts.put(to as any),
      // Record transfer as a settleUpRecord (reusing existing table) so history exists
      db.settleUpRecords.add({
        householdId,
        fromMemberId: createdBy || 'system',
        toMemberId: to.id,
        amount,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        settledAt: new Date().toISOString()
      } as any)
    ])
  }
}

export const accountService = new AccountService()
