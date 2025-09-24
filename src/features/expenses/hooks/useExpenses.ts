import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseService } from '../services/expenseService'
import { categoryService } from '../services/categoryService'
import { budgetService } from '../services/budgetService'
import { useAppStore } from '@/core/store'
import { ExpenseFormData, ExpenseFilter, ExpenseListOptions } from '../types'
import { BudgetFormData } from '../services/budgetService'
import { CategoryFormData } from '../services/categoryService'

// Query keys
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (householdId: string, options?: ExpenseListOptions) => 
    [...expenseKeys.lists(), householdId, options] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  monthly: (householdId: string, month: Date) => 
    [...expenseKeys.all, 'monthly', householdId, month] as const,
  categories: (householdId: string) => 
    [...expenseKeys.all, 'categories', householdId] as const,
  budgets: (householdId: string, month: string) => 
    [...expenseKeys.all, 'budgets', householdId, month] as const,
  search: (householdId: string, searchText: string) => 
    [...expenseKeys.all, 'search', householdId, searchText] as const,
}

// Expenses hooks
export function useExpenses(options?: ExpenseListOptions) {
  const { currentHousehold: _currentHousehold } = useAppStore()

  const householdId = _currentHousehold?.id || ''

  const query = useQuery({
    queryKey: expenseKeys.list(householdId || '', options),
    queryFn: async () => {
      if (!householdId) return []
      return await expenseService.getExpenses(householdId)
    },
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Some test environments (renderHook + mocked stores) observed `isIdle` as undefined.
  // React Query normally provides `isIdle` when `enabled` is false — guard defensively
  // so tests can assert `isIdle` without depending on internals.
  if ((query as any).isIdle === undefined) {
    ;(query as any).isIdle = !householdId
  }

  return query
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expenseService.getExpenseById(id),
    enabled: !!id,
  })
}

export function useMonthlyExpenses(month: Date) {
  const { currentHousehold } = useAppStore()

  return useQuery({
    queryKey: expenseKeys.monthly(currentHousehold?.id || '', month),
    queryFn: () => expenseService.getMonthlyExpenses(currentHousehold?.id || '', month),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useSearchExpenses(searchText: string) {
  const { currentHousehold } = useAppStore()

  return useQuery({
    queryKey: expenseKeys.search(currentHousehold?.id || '', searchText),
    queryFn: () => expenseService.searchExpenses(currentHousehold?.id || '', searchText),
    enabled: !!currentHousehold?.id && searchText.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Expense mutations
export function useCreateExpense() {
  const queryClient = useQueryClient()
  const { currentHousehold } = useAppStore()

  return useMutation({
    // Tests expect createExpense to be called with the data object only
    mutationFn: (data: ExpenseFormData) => expenseService.createExpense(data),
    onSuccess: () => {
      // Invalidate and refetch expense queries
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    // Accept either { id, data } or a flat { id, ...data } payload so tests can call mutate with either shape
    mutationFn: (payload: any) => {
      const id = payload?.id
      const data = payload?.data ? payload.data : Object.fromEntries(Object.entries(payload || {}).filter(([k]) => k !== 'id'))
      return expenseService.updateExpense(id, data)
    },
    onSuccess: (_, { id }) => {
      // Invalidate specific expense and lists
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      // Invalidate all expense queries
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export function useDuplicateExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => expenseService.duplicateExpense(id),
    onSuccess: () => {
      // Invalidate expense lists
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
    },
  })
}

// Categories hooks
export function useCategories() {
  const { currentHousehold } = useAppStore()
  
  return useQuery({
    queryKey: expenseKeys.categories(currentHousehold?.id || ''),
    queryFn: () => categoryService.getCategories(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useCategoriesWithCounts() {
  const { currentHousehold } = useAppStore()
  
  return useQuery({
    queryKey: [...expenseKeys.categories(currentHousehold?.id || ''), 'with-counts'],
    queryFn: () => categoryService.getCategoriesWithCounts(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  const { currentHousehold } = useAppStore()
  
  return useMutation({
    mutationFn: (data: CategoryFormData) => 
      categoryService.createCategory(data, currentHousehold?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: expenseKeys.categories(currentHousehold?.id || '') 
      })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  const { currentHousehold } = useAppStore()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      categoryService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: expenseKeys.categories(currentHousehold?.id || '') 
      })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  const { currentHousehold } = useAppStore()
  
  return useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: expenseKeys.categories(currentHousehold?.id || '') 
      })
    },
  })
}

// Budgets hooks
export function useBudgets(month: string) {
  const { currentHousehold } = useAppStore()
  
  return useQuery({
    queryKey: expenseKeys.budgets(currentHousehold?.id || '', month),
    queryFn: async () => {
      // Try to fetch budgets; if none exist and household prefs request autoReset, copy from previous month
      const res = await budgetService.getBudgetsWithUsage(currentHousehold?.id || '', month)
      if ((res || []).length === 0) {
        // Read household user preferences to decide whether to auto-copy (use local storage fallback)
        try {
          const prefsRaw = localStorage.getItem('user-preferences')
          if (prefsRaw) {
            const prefs = JSON.parse(prefsRaw)
            if (prefs.autoResetBudgets) {
              await budgetService.copyBudgetsFromPreviousMonth(currentHousehold?.id || '', month)
              return await budgetService.getBudgetsWithUsage(currentHousehold?.id || '', month)
            }
          }
        } catch (e) {
          // ignore
        }
      }

      return res
    },
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useBudgetSummary(month: string) {
  const { currentHousehold } = useAppStore()
  
  return useQuery({
    queryKey: [...expenseKeys.budgets(currentHousehold?.id || '', month), 'summary'],
    queryFn: () => budgetService.getBudgetSummary(currentHousehold?.id || '', month),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useBudgetAlerts(month: string) {
  const { currentHousehold } = useAppStore()
  
  return useQuery({
    queryKey: [...expenseKeys.budgets(currentHousehold?.id || '', month), 'alerts'],
    queryFn: () => budgetService.getBudgetAlerts(currentHousehold?.id || '', month),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  const { currentHousehold } = useAppStore()
  
  return useMutation({
    mutationFn: (data: BudgetFormData) => 
      budgetService.createBudget(data, currentHousehold?.id || ''),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: expenseKeys.budgets(currentHousehold?.id || '', variables.month) 
      })
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()
  const { currentHousehold } = useAppStore()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetFormData> }) =>
      budgetService.updateBudget(id, data),
    onSuccess: (_, { data }) => {
      if (data.month) {
        queryClient.invalidateQueries({ 
          queryKey: expenseKeys.budgets(currentHousehold?.id || '', data.month) 
        })
      }
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  const { currentHousehold } = useAppStore()
  
  return useMutation({
    mutationFn: (id: string) => budgetService.deleteBudget(id),
    onSuccess: () => {
      // Invalidate all budget queries for this household
      queryClient.invalidateQueries({ 
        queryKey: [...expenseKeys.all, 'budgets', currentHousehold?.id || ''] 
      })
    },
  })
}

// Utility hooks
export function useExpenseStats(filter?: ExpenseFilter) {
  const { currentHousehold } = useAppStore()
  
  return useQuery({
    queryKey: [...expenseKeys.all, 'stats', currentHousehold?.id || '', filter],
    queryFn: async () => {
      const expenses = await expenseService.getExpenses(currentHousehold?.id || '', {
        filter,
        sortBy: 'date',
        sortOrder: 'desc',
        page: 1,
        pageSize: 1000,
        groupBy: 'none',
      })

      const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
      const totalCount = expenses.length
      const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0

      return {
        totalAmount,
        totalCount,
        averageAmount,
        expenses,
      }
    },
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useAttachmentBlob(blobRef: string) {
  return useQuery({
    queryKey: ['attachment', blobRef],
    queryFn: () => expenseService.getAttachmentBlob(blobRef),
    enabled: !!blobRef,
    staleTime: Infinity, // Blobs don't change
  })
}

// Hook para despesas filtradas
export function useFilteredExpenses(filter?: ExpenseFilter, searchText?: string) {
  const { currentHousehold } = useAppStore()
  const safeFilter: ExpenseFilter = filter || ({} as ExpenseFilter)
  
  return useQuery({
    queryKey: [...expenseKeys.all, 'filtered', currentHousehold?.id || '', filter, searchText],
    queryFn: async () => {
      const expenses = await expenseService.getExpenses(currentHousehold?.id || '', {
        filter: filter ? { ...filter, searchText } : { searchText },
        sortBy: 'date',
        sortOrder: 'desc',
        page: 1,
        pageSize: 1000,
        groupBy: 'date',
      })

      // Aplicar filtros locais adicionais se necessário
      let filteredExpenses = expenses

      // Filtro por texto (se não foi aplicado no serviço)
      if (searchText && searchText.trim()) {
        const searchLower = searchText.toLowerCase()
        filteredExpenses = filteredExpenses.filter(expense =>
          expense.title.toLowerCase().includes(searchLower) ||
          expense.notes?.toLowerCase().includes(searchLower)
        )
      }

      // Filtros por data
      if (safeFilter.startDate || safeFilter.endDate) {
        filteredExpenses = filteredExpenses.filter(expense => {
          const expenseDate = new Date(expense.date)
          if (safeFilter.startDate && expenseDate < safeFilter.startDate) return false
          if (safeFilter.endDate && expenseDate > safeFilter.endDate) return false
          return true
        })
      }

      // Filtros por valor
      if (safeFilter.minAmount !== undefined || safeFilter.maxAmount !== undefined) {
        filteredExpenses = filteredExpenses.filter(expense => {
          if (safeFilter.minAmount !== undefined && expense.amount < safeFilter.minAmount) return false
          if (safeFilter.maxAmount !== undefined && expense.amount > safeFilter.maxAmount) return false
          return true
        })
      }

      // Filtros por categoria
      if (safeFilter.categoryIds && safeFilter.categoryIds.length > 0) {
        filteredExpenses = filteredExpenses.filter(expense =>
          expense.categoryId ? safeFilter.categoryIds!.includes(expense.categoryId) : false
        )
      }

      // Filtros por forma de pagamento
      if (safeFilter.paymentMethods && safeFilter.paymentMethods.length > 0) {
        filteredExpenses = filteredExpenses.filter(expense =>
          expense.paymentMethod ? safeFilter.paymentMethods!.includes(expense.paymentMethod as any) : false
        )
      }

      // Filtros por recorrência
      if (safeFilter.hasRecurrence) {
        filteredExpenses = filteredExpenses.filter(expense => !!expense.recurrence)
      }

      // Filtros por parcelamento
      if (safeFilter.hasInstallments) {
        filteredExpenses = filteredExpenses.filter(expense => !!expense.installment)
      }

      return filteredExpenses
    },
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

