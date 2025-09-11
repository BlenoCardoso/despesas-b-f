import { describe, it, expect, beforeEach, vi } from 'vitest'
import { expenseService } from '../expenseService'
import { db } from '@/core/db/database'
import { Expense } from '../../types'

// Mock the database
vi.mock('@/core/db/database', () => ({
  db: {
    expenses: {
      add: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn()
        }))
      })),
      toArray: vi.fn()
    }
  }
}))

describe('ExpenseService', () => {
  const mockHouseholdId = 'household-1'
  const mockUserId = 'user-1'

  const mockExpense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
    householdId: mockHouseholdId,
    description: 'Test Expense',
    amount: 100.50,
    categoryId: 'category-1',
    date: new Date(),
    type: 'expense',
    paidBy: mockUserId,
    splitBetween: [mockUserId],
    splitMethod: 'equal',
    tags: ['test'],
    isRecurring: false,
    attachments: []
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createExpense', () => {
    it('should create a new expense with generated ID and timestamps', async () => {
      const mockAdd = vi.mocked(db.expenses.add)
      mockAdd.mockResolvedValue('expense-1')

      const result = await expenseService.createExpense(mockExpense)

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockExpense,
          id: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      )
      expect(result).toBe('expense-1')
    })

    it('should handle recurring expenses', async () => {
      const recurringExpense = {
        ...mockExpense,
        isRecurring: true,
        recurringConfig: {
          frequency: 'monthly' as const,
          interval: 1,
          endDate: new Date('2024-12-31')
        }
      }

      const mockAdd = vi.mocked(db.expenses.add)
      mockAdd.mockResolvedValue('expense-1')

      await expenseService.createExpense(recurringExpense)

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          isRecurring: true,
          recurringConfig: recurringExpense.recurringConfig
        })
      )
    })
  })

  describe('getExpenses', () => {
    it('should return expenses for a household', async () => {
      const mockExpenses = [
        { id: '1', ...mockExpense },
        { id: '2', ...mockExpense }
      ]

      const mockToArray = vi.fn().mockResolvedValue(mockExpenses)
      const mockEquals = vi.fn().mockReturnValue({ toArray: mockToArray })
      const mockWhere = vi.mocked(db.expenses.where)
      mockWhere.mockReturnValue({ equals: mockEquals } as any)

      const result = await expenseService.getExpenses(mockHouseholdId)

      expect(mockWhere).toHaveBeenCalledWith('householdId')
      expect(mockEquals).toHaveBeenCalledWith(mockHouseholdId)
      expect(result).toEqual(mockExpenses)
    })
  })

  describe('updateExpense', () => {
    it('should update an existing expense', async () => {
      const expenseId = 'expense-1'
      const updates = { description: 'Updated Expense', amount: 200 }

      const mockPut = vi.mocked(db.expenses.put)
      mockPut.mockResolvedValue(expenseId)

      await expenseService.updateExpense(expenseId, updates)

      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expenseId,
          ...updates,
          updatedAt: expect.any(Date)
        })
      )
    })
  })

  describe('deleteExpense', () => {
    it('should delete an expense', async () => {
      const expenseId = 'expense-1'
      const mockDelete = vi.mocked(db.expenses.delete)
      mockDelete.mockResolvedValue()

      await expenseService.deleteExpense(expenseId)

      expect(mockDelete).toHaveBeenCalledWith(expenseId)
    })
  })

  describe('calculateSplit', () => {
    it('should calculate equal split correctly', () => {
      const amount = 100
      const participants = ['user-1', 'user-2', 'user-3']
      const method = 'equal'

      const result = expenseService.calculateSplit(amount, participants, method)

      expect(result).toEqual({
        'user-1': 33.33,
        'user-2': 33.33,
        'user-3': 33.34
      })
    })

    it('should calculate percentage split correctly', () => {
      const amount = 100
      const participants = ['user-1', 'user-2']
      const method = 'percentage'
      const percentages = { 'user-1': 60, 'user-2': 40 }

      const result = expenseService.calculateSplit(amount, participants, method, percentages)

      expect(result).toEqual({
        'user-1': 60,
        'user-2': 40
      })
    })

    it('should calculate exact amount split correctly', () => {
      const amount = 100
      const participants = ['user-1', 'user-2']
      const method = 'exact'
      const amounts = { 'user-1': 70, 'user-2': 30 }

      const result = expenseService.calculateSplit(amount, participants, method, undefined, amounts)

      expect(result).toEqual({
        'user-1': 70,
        'user-2': 30
      })
    })
  })

  describe('getExpensesByCategory', () => {
    it('should return expenses filtered by category', async () => {
      const categoryId = 'category-1'
      const mockExpenses = [{ id: '1', ...mockExpense, categoryId }]

      const mockToArray = vi.fn().mockResolvedValue(mockExpenses)
      const mockAnd = vi.fn().mockReturnValue({ toArray: mockToArray })
      const mockEquals = vi.fn().mockReturnValue({ and: mockAnd })
      const mockWhere = vi.mocked(db.expenses.where)
      mockWhere.mockReturnValue({ equals: mockEquals } as any)

      const result = await expenseService.getExpensesByCategory(mockHouseholdId, categoryId)

      expect(result).toEqual(mockExpenses)
    })
  })

  describe('getExpensesByDateRange', () => {
    it('should return expenses within date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      const mockExpenses = [{ id: '1', ...mockExpense }]

      const mockToArray = vi.fn().mockResolvedValue(mockExpenses)
      const mockAnd = vi.fn().mockReturnValue({ toArray: mockToArray })
      const mockEquals = vi.fn().mockReturnValue({ and: mockAnd })
      const mockWhere = vi.mocked(db.expenses.where)
      mockWhere.mockReturnValue({ equals: mockEquals } as any)

      const result = await expenseService.getExpensesByDateRange(mockHouseholdId, startDate, endDate)

      expect(result).toEqual(mockExpenses)
    })
  })
})

