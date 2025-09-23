import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { QuickExpenseForm } from '../QuickExpenseForm'

// Minimal mocks reused from existing tests
vi.mock('@/core/store', () => ({
  useAppStore: vi.fn(() => ({
    currentHousehold: { id: 'household-1' },
    currentUser: { id: 'user-1' }
  }))
}))

vi.mock('../../hooks/useExpenseCategories', () => ({
  useExpenseCategories: () => ({
    data: [
      { id: 'cat-1', name: 'Alimentação', icon: '🍔', color: '#ff6b6b' }
    ],
    isLoading: false
  })
}))

const mockMutateAsync = vi.fn()
vi.mock('../../hooks/useExpenseMutation', () => ({
  useExpenseMutation: () => ({
    mutateAsync: mockMutateAsync
  })
}))

vi.mock('@/features/accounts/services/accountService', () => ({
  accountService: {
    listAccounts: async () => [
      { id: 'acc-123', name: 'Conta Teste' }
    ]
  }
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('QuickExpenseForm split', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows equal split preview and includes split in payload when visibility Todos', async () => {
    // render and enter amount 1.00
    render(<QuickExpenseForm householdId="household-1" />, { wrapper: createWrapper() })

    const btn1 = screen.getByRole('button', { name: '1' })
    const btn0 = screen.getByRole('button', { name: '0' })
    const ok = screen.getByRole('button', { name: /ok/i })

    await userEvent.click(btn1)
    await userEvent.click(btn0)
    await userEvent.click(btn0)
    await userEvent.click(ok)

    // Ensure preview shows R$0.5 / R$0.5 for equal split on total R$1.00
    await screen.findByText(/Você R\$ 0.50 • Parceiro R\$ 0.50/)

    // select account to avoid mutation missing account
    const accountSelect = await screen.findByRole('combobox')
    await userEvent.selectOptions(accountSelect, 'acc-123')

    const catBtn = await screen.findByRole('button', { name: /alimentação/i })
    await userEvent.click(catBtn)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled()
      const call = mockMutateAsync.mock.calls.find(c => c[0] && c[0].categoryId === 'cat-1')
      expect(call).toBeDefined()
      const payload = call![0]
      expect(payload.split).toBeDefined()
      expect(payload.split.method).toBe('equal')
    })
  })

  it('shows percent split preview and includes percent in payload', async () => {
    render(<QuickExpenseForm householdId="household-1" />, { wrapper: createWrapper() })

    const btn1 = screen.getByRole('button', { name: '1' })
    const btn0 = screen.getByRole('button', { name: '0' })
    const ok = screen.getByRole('button', { name: /ok/i })

    await userEvent.click(btn1)
    await userEvent.click(btn0)
    await userEvent.click(btn0)
    await userEvent.click(ok)

    // switch to Por % mode
    const percentBtn = await screen.findByRole('button', { name: /por %/i })
    await userEvent.click(percentBtn)

  // move slider to 30% partner
  const slider = await screen.findByTestId('partner-range')
  fireEvent.change(slider, { target: { value: '30' } })

  await screen.findByText(/Parceiro:\s*30\s*%/i)

    const accountSelect = await screen.findByRole('combobox')
    await userEvent.selectOptions(accountSelect, 'acc-123')

    const catBtn = await screen.findByRole('button', { name: /alimentação/i })
    await userEvent.click(catBtn)

    await waitFor(() => {
      const call = mockMutateAsync.mock.calls.find(c => c[0] && c[0].categoryId === 'cat-1')
      const payload = call![0]
      expect(payload.split).toBeDefined()
      expect(payload.split.method).toBe('percent')
      expect(payload.split.partnerPercent).toBe(30)
    })
  })

  it('when visibility Só eu, no split is included in payload', async () => {
    render(<QuickExpenseForm householdId="household-1" />, { wrapper: createWrapper() })

    const btn1 = screen.getByRole('button', { name: '1' })
    const btn0 = screen.getByRole('button', { name: '0' })
    const ok = screen.getByRole('button', { name: /ok/i })

    await userEvent.click(btn1)
    await userEvent.click(btn0)
    await userEvent.click(btn0)
    await userEvent.click(ok)

    // choose 'Só eu' visibility radio
    const meRadio = await screen.findByRole('radio', { name: /só eu/i })
    await userEvent.click(meRadio)

    const accountSelect = await screen.findByRole('combobox')
    await userEvent.selectOptions(accountSelect, 'acc-123')

    const catBtn = await screen.findByRole('button', { name: /alimentação/i })
    await userEvent.click(catBtn)

    await waitFor(() => {
      const call = mockMutateAsync.mock.calls.find(c => c[0] && c[0].categoryId === 'cat-1')
      const payload = call![0]
      expect(payload.split).toBeUndefined()
    })
  })
})
