import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseService } from '../services/expenseService'
import { categoryService } from '../services/categoryService'
import { budgetService } from '../services/budgetService'
import { useCurrentHousehold, useCurrentUser } from '@/core/store'
import { Expense, ExpenseFormData, ExpenseFilter, ExpenseListOptions } from '../types'
import { Category, Budget } from '@/types/global'
import { BudgetFormData, BudgetWithUsage } from '../services/budgetService'
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
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: expenseKeys.list(currentHousehold?.id || '', options),
    queryFn: () => expenseService.getExpenses(currentHousehold?.id || '', options),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expenseService.getExpenseById(id),
    enabled: !!id,
  })
}

export function useMonthlyExpenses(month: Date) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: expenseKeys.monthly(currentHousehold?.id || '', month),
    queryFn: () => expenseService.getMonthlyExpenses(currentHousehold?.id || '', month),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useSearchExpenses(searchText: string) {
  const currentHousehold = useCurrentHousehold()
  
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
  const currentHousehold = useCurrentHousehold()
  const currentUser = useCurrentUser()
  
  return useMutation({
    mutationFn: (data: ExpenseFormData) => 
      expenseService.createExpense(data, currentHousehold?.id || '', currentUser?.id || ''),
    onSuccess: () => {
      // Invalidate and refetch expense queries
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseFormData> }) =>
      expenseService.updateExpense(id, data),
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
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: expenseKeys.categories(currentHousehold?.id || ''),
    queryFn: () => categoryService.getCategories(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useCategoriesWithCounts() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: [...expenseKeys.categories(currentHousehold?.id || ''), 'with-counts'],
    queryFn: () => categoryService.getCategoriesWithCounts(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  const currentHousehold = useCurrentHousehold()
  
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
  const currentHousehold = useCurrentHousehold()
  
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
  const currentHousehold = useCurrentHousehold()
  
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
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: expenseKeys.budgets(currentHousehold?.id || '', month),
    queryFn: () => budgetService.getBudgetsWithUsage(currentHousehold?.id || '', month),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useBudgetSummary(month: string) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: [...expenseKeys.budgets(currentHousehold?.id || '', month), 'summary'],
    queryFn: () => budgetService.getBudgetSummary(currentHousehold?.id || '', month),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useBudgetAlerts(month: string) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: [...expenseKeys.budgets(currentHousehold?.id || '', month), 'alerts'],
    queryFn: () => budgetService.getBudgetAlerts(currentHousehold?.id || '', month),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  const currentHousehold = useCurrentHousehold()
  
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
  const currentHousehold = useCurrentHousehold()
  
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
  const currentHousehold = useCurrentHousehold()
  
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
  const currentHousehold = useCurrentHousehold()
  
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

