import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { QuickExpenseForm } from '../QuickExpenseForm'

// Mock hooks and store
vi.mock('@/core/store', () => ({
  useAppStore: vi.fn(() => ({
    currentHousehold: { id: 'household-1' },
    currentUser: { id: 'user-1' }
  }))
}))

// Mock expense categories
vi.mock('../../hooks/useExpenseCategories', () => ({
  useExpenseCategories: () => ({
    data: [
      { id: 'cat-1', name: 'Alimentação', icon: '🍔', color: '#ff6b6b' },
      { id: 'cat-2', name: 'Transporte', icon: '🚗', color: '#4ecdc4' }
    ],
    isLoading: false
  })
}))

// We'll mock the mutation hook to capture the payload
const mockMutateAsync = vi.fn()
vi.mock('../../hooks/useExpenseMutation', () => ({
  useExpenseMutation: () => ({
    mutateAsync: mockMutateAsync
  })
}))

// Mock account service used by QuickExpenseForm dynamic import
vi.mock('@/features/accounts/services/accountService', () => ({
  accountService: {
    listAccounts: async (householdId: string) => [
      { id: 'acc-123', name: 'Conta Teste' }
    ]
  }
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('QuickExpenseForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('includes accountId from lastAccount in created payload', async () => {
    // set last account in localStorage matching key used by component
    localStorage.setItem('quick-expense-last-account:household-1', 'acc-123')

    render(<QuickExpenseForm householdId="household-1" />, { wrapper: createWrapper() })

  // Enter amount by clicking keypad (e.g., 1 0 0 -> R$1,00)
    const btn1 = screen.getByRole('button', { name: '1' })
    const btn0 = screen.getByRole('button', { name: '0' })
    const ok = screen.getByRole('button', { name: /ok/i })

    await userEvent.click(btn1)
    await userEvent.click(btn0)
    await userEvent.click(btn0)

    await userEvent.click(ok)

  // Wait for category buttons to render and click first category
    // wait for the account select to be populated and choose the saved account
    const accountSelect = await screen.findByRole('combobox')
    await userEvent.selectOptions(accountSelect, 'acc-123')

    const catBtn = await screen.findByRole('button', { name: /alimentação/i })
    await userEvent.click(catBtn)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled()
      // debug output
      // eslint-disable-next-line no-console
      console.log('MUTATE_CALLS', JSON.stringify(mockMutateAsync.mock.calls))
      // find the call that matches our household and category
      const call = mockMutateAsync.mock.calls.find(c => c[0] && c[0].householdId === 'household-1' && c[0].categoryId === 'cat-1')
      expect(call).toBeDefined()
      const payload = call![0]
      expect(payload).toBeDefined()
      expect(payload.accountId).toBe('acc-123')
      expect(payload.householdId).toBe('household-1')
    })
  })
})
