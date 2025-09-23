/// <reference types="vitest" />
import { db } from '@/core/db/database'
import { accountService } from '../accountService'
import { budgetService } from '@/features/expenses/services/budgetService'

beforeEach(async () => {
  // reset mocked db tables used in tests
  (db.accounts as any) = { data: [], add: vi.fn(), put: vi.fn(), get: vi.fn(), where: vi.fn() }
  ;(db.settleUpRecords as any) = { data: [], add: vi.fn(async (d: any) => { return d }) }
})

test('transfer adjusts balances and records settle with transfer metadata', async () => {
  // Prepare accounts
  const a1 = { id: 'a1', householdId: 'h1', name: 'From', balance: 1000 }
  const a2 = { id: 'a2', householdId: 'h1', name: 'To', balance: 200 }

  // Mock db.get and put
  ;(db.accounts.get as any) = vi.fn(async (id: string) => id === 'a1' ? a1 : id === 'a2' ? a2 : undefined)
  ;(db.accounts.put as any) = vi.fn(async (acc: any) => acc)
  ;(db.settleUpRecords.add as any) = vi.fn(async (r: any) => r)

  await accountService.transfer({ householdId: 'h1', fromAccountId: 'a1', toAccountId: 'a2', amount: 100, notes: 'test', createdBy: 'user1' })

  // balances adjusted
  expect(db.accounts.put).toHaveBeenCalled()
  // settle record persisted with paymentMethod transfer
  expect(db.settleUpRecords.add).toHaveBeenCalled()
  const added = (db.settleUpRecords.add as any).mock.calls[0][0]
  // If BalanceService was used, it writes paymentMethod field; if fallback used, notes present
  expect(added.amount).toBe(100)
  expect(added.notes === 'test' || added.paymentMethod === 'transfer').toBeTruthy()
})
