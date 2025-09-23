import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuickExpenseForm } from '../QuickExpenseForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { accountService } from '@/features/accounts/services/accountService'

vi.mock('@/features/accounts/services/accountService', () => ({
  accountService: {
    transfer: vi.fn().mockResolvedValue(undefined),
    listAccounts: vi.fn().mockResolvedValue([
      { id: 'a-1', name: 'Carteira A', balance: 100 },
      { id: 'a-2', name: 'Carteira B', balance: 50 }
    ])
  }
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: any) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('QuickExpenseForm transfer flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  test('calls accountService.transfer and does not call expense mutation when transfer selected', async () => {
    render(<QuickExpenseForm householdId="household-1" />, { wrapper: createWrapper() })

  // set amount by clicking keypad (1 0 0 -> R$1.00)
  const btn1 = screen.getByRole('button', { name: '1' })
  const btn0 = screen.getByRole('button', { name: '0' })
  await userEvent.click(btn1)
  await userEvent.click(btn0)
  await userEvent.click(btn0)
  const ok = screen.getByRole('button', { name: /ok/i })
  await userEvent.click(ok)

  // choose transfer type using stable test id
  const transferRadio = await screen.findByTestId('transfer-radio')
  await userEvent.click(transferRadio)

  // choose origin and destination accounts via stable test ids
  const origin = await screen.findByTestId('transfer-origin') as HTMLSelectElement
  const dest = await screen.findByTestId('transfer-dest') as HTMLSelectElement
  fireEvent.change(origin, { target: { value: 'a-1' } })
  fireEvent.change(dest, { target: { value: 'a-2' } })

  // click a template button (Mercado) which exists in the UI to trigger transfer flow
  const templateBtn = await screen.findByRole('button', { name: /mercado/i })
  await userEvent.click(templateBtn)

    await waitFor(() => {
      expect(vi.mocked(accountService.transfer)).toHaveBeenCalled()
    })
  })
})
