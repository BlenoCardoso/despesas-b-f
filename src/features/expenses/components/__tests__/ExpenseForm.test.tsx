import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExpenseForm } from '../ExpenseForm'
import { useAppStore } from '@/core/store'

// Mock the app store
vi.mock('@/core/store', () => ({
  useAppStore: vi.fn()
}))

// Mock the hooks
vi.mock('../../hooks/useExpenses', () => ({
  useCreateExpense: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null
  }),
  useUpdateExpense: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null
  })
}))

vi.mock('../../hooks/useCategories', () => ({
  useCategories: () => ({
    data: [
      { id: 'cat-1', name: 'Alimentação', icon: '🍔', color: '#ff6b6b' },
      { id: 'cat-2', name: 'Transporte', icon: '🚗', color: '#4ecdc4' }
    ],
    isLoading: false
  })
}))

// Test wrapper
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

describe('ExpenseForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAppStore).mockReturnValue({
      currentHousehold: { id: 'household-1', name: 'Test Household' },
      currentUser: { id: 'user-1', name: 'Test User' }
    } as any)
  })

  it('should render form fields correctly', () => {
    render(
      <ExpenseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/valor/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/data/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()

    render(
      <ExpenseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    const submitButton = screen.getByRole('button', { name: /salvar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/descrição é obrigatória/i)).toBeInTheDocument()
      expect(screen.getByText(/valor é obrigatório/i)).toBeInTheDocument()
      expect(screen.getByText(/categoria é obrigatória/i)).toBeInTheDocument()
    })
  })

  it('should validate amount is positive', async () => {
    const user = userEvent.setup()

    render(
      <ExpenseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    const amountInput = screen.getByLabelText(/valor/i)
    await user.type(amountInput, '-10')

    const submitButton = screen.getByRole('button', { name: /salvar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/valor deve ser positivo/i)).toBeInTheDocument()
    })
  })

  it('should fill form with initial data when editing', () => {
    const initialData = {
      id: 'expense-1',
      description: 'Test Expense',
      amount: 100,
      categoryId: 'cat-1',
      date: new Date('2024-01-15'),
      type: 'expense' as const,
      paidBy: 'user-1',
      splitBetween: ['user-1'],
      splitMethod: 'equal' as const,
      tags: ['test'],
      isRecurring: false,
      attachments: []
    }

    render(
      <ExpenseForm 
        initialData={initialData}
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByDisplayValue('Test Expense')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument()
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ExpenseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should toggle between expense and income types', async () => {
    const user = userEvent.setup()

    render(
      <ExpenseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    const incomeRadio = screen.getByLabelText(/receita/i)
    await user.click(incomeRadio)

    expect(incomeRadio).toBeChecked()
  })

  it('should show recurring options when recurring is enabled', async () => {
    const user = userEvent.setup()

    render(
      <ExpenseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    const recurringCheckbox = screen.getByLabelText(/recorrente/i)
    await user.click(recurringCheckbox)

    await waitFor(() => {
      expect(screen.getByLabelText(/frequência/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/intervalo/i)).toBeInTheDocument()
    })
  })

  it('should handle tag input', async () => {
    const user = userEvent.setup()

    render(
      <ExpenseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    const tagInput = screen.getByLabelText(/tags/i)
    await user.type(tagInput, 'tag1,tag2')

    // Simulate Enter key to add tags
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText('tag1')).toBeInTheDocument()
      expect(screen.getByText('tag2')).toBeInTheDocument()
    })
  })

  it('should handle split method changes', async () => {
    const user = userEvent.setup()

    render(
      <ExpenseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    // Open split method dropdown
    const splitMethodSelect = screen.getByLabelText(/método de divisão/i)
    await user.click(splitMethodSelect)

    // Select percentage method
    const percentageOption = screen.getByText(/porcentagem/i)
    await user.click(percentageOption)

    await waitFor(() => {
      expect(screen.getByText(/definir porcentagens/i)).toBeInTheDocument()
    })
  })
})

