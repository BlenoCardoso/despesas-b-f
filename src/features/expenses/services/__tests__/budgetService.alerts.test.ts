/// <reference types="vitest" />
import { budgetService } from '../budgetService'
import { db } from '@/core/db/database'

test('getBudgetAlerts respects user threshold preference', async () => {
  // prepare budgets and expenses
  const householdId = 'h-test'
  const month = '2025-09'

  // Clear DB mocks / insert a budget
  ;(db.budgets as any) = { data: [], where: vi.fn(() => ({ sortBy: async (k: string) => [{ id: 'b1', householdId, categoryId: undefined, amount: 1000, month }], toArray: async () => [{ id: 'b1', householdId, categoryId: undefined, amount: 1000, month }] })) }

  // mock getSpentAmount to return 850
  vi.spyOn(budgetService, 'getSpentAmount' as any).mockImplementation(async () => 850)

  // set user pref threshold to 80
  localStorage.setItem('user-preferences', JSON.stringify({ budgetWarningPercentage: 80 }))

  const alerts = await budgetService.getBudgetAlerts(householdId, month)
  expect(alerts.length).toBeGreaterThanOrEqual(1)
  expect(alerts[0].alertType === 'warning' || alerts[0].alertType === 'exceeded').toBeTruthy()
})
