import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '../useExpenses'
import { expenseService } from '../../services/expenseService'
import { useAppStore } from '@/core/store'

// Mock the expense service
vi.mock('../../services/expenseService', () => ({
  expenseService: {
    getExpenses: vi.fn(),
    createExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn()
  }
}))

// Mock the app store
vi.mock('@/core/store', () => ({
  useAppStore: vi.fn()
}))

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useExpenses', () => {
  const mockHouseholdId = 'household-1'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAppStore).mockReturnValue({
      currentHousehold: { id: mockHouseholdId, name: 'Test Household' }
    } as any)
  })

  it('should fetch expenses successfully', async () => {
    const mockExpenses = [
      { id: '1', description: 'Expense 1', amount: 100 },
      { id: '2', description: 'Expense 2', amount: 200 }
    ]

    vi.mocked(expenseService.getExpenses).mockResolvedValue(mockExpenses as any)

    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockExpenses)
    expect(expenseService.getExpenses).toHaveBeenCalledWith(mockHouseholdId)
  })

  it('should handle error when fetching expenses', async () => {
    const mockError = new Error('Failed to fetch expenses')
    vi.mocked(expenseService.getExpenses).mockRejectedValue(mockError)

    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(mockError)
  })

  it('should not fetch when no household is selected', () => {
    vi.mocked(useAppStore).mockReturnValue({
      currentHousehold: null
    } as any)

    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper()
    })

    expect(result.current.isIdle).toBe(true)
    expect(expenseService.getExpenses).not.toHaveBeenCalled()
  })
})

describe('useCreateExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create expense successfully', async () => {
    const mockExpenseId = 'expense-1'
    vi.mocked(expenseService.createExpense).mockResolvedValue(mockExpenseId)

    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper()
    })

    const expenseData = {
      description: 'New Expense',
      amount: 150,
      categoryId: 'category-1'
    }

    result.current.mutate(expenseData as any)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBe(mockExpenseId)
    expect(expenseService.createExpense).toHaveBeenCalledWith(expenseData)
  })

  it('should handle error when creating expense', async () => {
    const mockError = new Error('Failed to create expense')
    vi.mocked(expenseService.createExpense).mockRejectedValue(mockError)

    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper()
    })

    result.current.mutate({} as any)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(mockError)
  })
})

describe('useUpdateExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update expense successfully', async () => {
    vi.mocked(expenseService.updateExpense).mockResolvedValue()

    const { result } = renderHook(() => useUpdateExpense(), {
      wrapper: createWrapper()
    })

    const updateData = {
      id: 'expense-1',
      description: 'Updated Expense',
      amount: 200
    }

    result.current.mutate(updateData)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(expenseService.updateExpense).toHaveBeenCalledWith('expense-1', {
      description: 'Updated Expense',
      amount: 200
    })
  })
})

describe('useDeleteExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete expense successfully', async () => {
    vi.mocked(expenseService.deleteExpense).mockResolvedValue()

    const { result } = renderHook(() => useDeleteExpense(), {
      wrapper: createWrapper()
    })

    result.current.mutate('expense-1')

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(expenseService.deleteExpense).toHaveBeenCalledWith('expense-1')
  })
})

