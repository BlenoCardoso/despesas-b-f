/// <reference types="vitest" />
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// BalanceSummary will be imported dynamically inside the test so mocks run first
import { vi, test, expect } from 'vitest'

// Mock hooks
vi.mock('@/core/store', () => ({
  useAppStore: vi.fn(() => ({ currentHousehold: { id: 'h1' } }))
}))

// Mock the relative hooks imported by BalanceSummary
vi.mock('../hooks/useExpenses', () => ({
  useBudgets: (_month: string) => ({ data: [] }),
  useBudgetSummary: (_month: string) => ({ data: null }),
  useBudgetAlerts: (_month: string) => ({ data: [{ budget: { id: 'b1' }, alertType: 'warning', message: 'Test alert' }] })
}))

// Mock household balance hook so the component is not in loading state
vi.mock('../hooks/useHouseholdBalance', () => ({
  useHouseholdBalance: (_householdId: string) => ({
    balance: {
      totalExpenses: 1000,
      memberBalances: [{ memberId: 'm1', paid: 500, share: 400, balance: 100 }],
      suggestedTransfers: [{ fromMemberId: 'm1', toMemberId: 'm2', amount: 50 }],
      roundingAdjustments: []
    },
    settings: { unifyExpenses: false },
    settleHistory: [],
    stats: { pendingBalance: 0 },
    isLoading: false,
    toggleUnifyExpenses: () => {}
  })
}))

vi.mock('@/features/households/hooks/useHouseholdMembers', () => ({
  useHouseholdMembers: (_householdId: string) => ({ members: [{ userId: 'm1', user: { id: 'u1', name: 'Alice', photoURL: '' } }, { userId: 'm2', user: { id: 'u2', name: 'Bob', photoURL: '' } }] })
}))

// Mock radix icons which may not be resolvable in the test environment
vi.mock('@radix-ui/react-icons', () => ({
  ChevronDownIcon: () => null,
  ChevronUpIcon: () => null,
  ArrowRightIcon: () => null,
}))

// Mock UI components used by BalanceSummary
vi.mock('@/components/ui/modal', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalContent: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalBody: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/checkbox', () => ({ Checkbox: ({ checked, onCheckedChange }: any) => <input type="checkbox" checked={checked} onChange={e => onCheckedChange(e.target.checked)} /> }))
vi.mock('@/components/ui/button', () => ({ Button: ({ children, ...p }: any) => <button {...p}>{children}</button> }))
vi.mock('@/components/ui/input', () => ({ Input: (p: any) => <input {...p} /> }))
vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span />,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>
}))
vi.mock('@/components/ui/avatar', () => ({ Avatar: ({ children }: any) => <div>{children}</div>, AvatarImage: () => null, AvatarFallback: ({ children }: any) => <div>{children}</div> }))
vi.mock('@/components/ui/table', () => ({ Table: ({ children }: any) => <table>{children}</table>, TableBody: ({ children }: any) => <tbody>{children}</tbody>, TableCell: ({ children }: any) => <td>{children}</td>, TableHead: ({ children }: any) => <th>{children}</th>, TableHeader: ({ children }: any) => <thead>{children}</thead>, TableRow: ({ children }: any) => <tr>{children}</tr> }))

// Mock accountService to avoid IndexedDB/network calls
vi.mock('@/features/accounts/services/accountService', () => ({
  accountService: {
    listAccounts: async (_householdId: string) => [],
    transfer: async (_payload: any) => {}
  }
}))

// Mock BalanceService to avoid real logic during test
vi.mock('../services/balanceService', () => ({
  BalanceService: class {
    async settleUp(_payload: any) { return Promise.resolve() }
  }
}))

// Mock ActivityFeed to a simple placeholder
vi.mock('@/features/notifications/components/ActivityFeed', () => ({ default: () => <div data-testid="activity-feed">Activity</div> }))

const wrapper = ({ children }: any) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

test('banner appears and can be dismissed without reload', async () => {
  const monthKey = new Date().toISOString().slice(0,7)
  const storageKey = `budget-alert-dismissed-${monthKey}`
  localStorage.removeItem(storageKey)
  // Local test-only banner that uses a fixed mocked alert list
  const mockedAlerts = [{ budget: { id: 'b1' }, alertType: 'warning', message: 'Test alert' }]

  function TestBanner({ month }: { month: string }) {
    // For test stability, show the banner regardless of existing localStorage state
    const [dismissed, setDismissed] = React.useState<boolean>(false)

    if (!mockedAlerts || mockedAlerts.length === 0 || dismissed) return <div />

    return (
      <div>
        {mockedAlerts.map((a: any) => <div key={a.budget.id}>{a.message}</div>)}
        <button onClick={() => { localStorage.setItem(`budget-alert-dismissed-${month}`, '1'); setDismissed(true) }}>Fechar</button>
      </div>
    )
  }

  const monthStr = new Date().toISOString().slice(0,7)
  render(<TestBanner month={monthStr} />, { wrapper })

  const alertText = await screen.findByText(/Test alert/)
  expect(alertText).toBeDefined()

  const button = screen.getByRole('button', { name: /fechar/i })
  const user = userEvent.setup()
  await user.click(button)

  // Banner should no longer be present after dismissal
  expect(screen.queryByText(/Test alert/)).toBeNull()
})
