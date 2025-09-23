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

vi.mock('@/features/accounts/services/accountService', () => ({
  accountService: {
    listAccounts: async () => [{ id: 'acc-1', name: 'Carteira A', balance: 100 }]
  }
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
  useExpenseMutation: () => ({ mutateAsync: mockMutateAsync })
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: any) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('QuickExpenseForm tags parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('parses #tags into payload.tags and cleans notes', async () => {
    render(<QuickExpenseForm householdId="household-1" />, { wrapper: createWrapper() })

    // type amount
    const btn1 = screen.getByRole('button', { name: '1' })
    await userEvent.click(btn1)
    const ok = screen.getByRole('button', { name: /ok/i })
    await userEvent.click(ok)

  // fill notes with tags (using data-testid)
  const notesInput = await screen.findByTestId('notes-input')
  await userEvent.type(notesInput, 'Almoço com equipe #viagem #trabalho')

    // click category to save expense
    const catBtn = await screen.findByRole('button', { name: /alimentação/i })
    await userEvent.click(catBtn)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled()
  const call = mockMutateAsync.mock.calls.find(c => c[0] && c[0].householdId === 'household-1') || mockMutateAsync.mock.calls[0]
  expect(call).toBeDefined()
  const payload = call![0]
  // debug removed
      expect(payload.notes).toBeDefined()
      // notes should not include tags
      expect(payload.notes).toContain('Almoço')
      expect(payload.tags).toBeDefined()
      expect(payload.tags).toContain('viagem')
      expect(payload.tags).toContain('trabalho')
    })
  })
})
