import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { medicationService } from '../services/medicationService'
import { useCurrentHousehold, useCurrentUser } from '@/core/store'
import { Medication, MedicationFormData, MedicationFilter, MedicationListOptions, MedicationIntake } from '../types'

// Query keys
export const medicationKeys = {
  all: ['medications'] as const,
  lists: () => [...medicationKeys.all, 'list'] as const,
  list: (householdId: string, options?: MedicationListOptions) => 
    [...medicationKeys.lists(), householdId, options] as const,
  details: () => [...medicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...medicationKeys.details(), id] as const,
  active: (householdId: string) => 
    [...medicationKeys.all, 'active', householdId] as const,
  lowStock: (householdId: string) => 
    [...medicationKeys.all, 'lowStock', householdId] as const,
  expiringSoon: (householdId: string, days: number) => 
    [...medicationKeys.all, 'expiringSoon', householdId, days] as const,
  stats: (householdId: string) => 
    [...medicationKeys.all, 'stats', householdId] as const,
  search: (householdId: string, searchText: string) => 
    [...medicationKeys.all, 'search', householdId, searchText] as const,
  intakes: () => [...medicationKeys.all, 'intakes'] as const,
  todaysIntakes: (householdId: string) => 
    [...medicationKeys.intakes(), 'today', householdId] as const,
  overdueIntakes: (householdId: string) => 
    [...medicationKeys.intakes(), 'overdue', householdId] as const,
  intakeRange: (medicationId: string, startDate: Date, endDate: Date) => 
    [...medicationKeys.intakes(), 'range', medicationId, startDate.toISOString(), endDate.toISOString()] as const,
}

// Medications hooks
export function useMedications(options?: MedicationListOptions) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: medicationKeys.list(currentHousehold?.id || '', options),
    queryFn: () => medicationService.getMedications(currentHousehold?.id || '', options),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useMedication(id: string) {
  return useQuery({
    queryKey: medicationKeys.detail(id),
    queryFn: () => medicationService.getMedicationById(id),
    enabled: !!id,
  })
}

export function useActiveMedications() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: medicationKeys.active(currentHousehold?.id || ''),
    queryFn: () => medicationService.getActiveMedications(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useLowStockMedications() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: medicationKeys.lowStock(currentHousehold?.id || ''),
    queryFn: () => medicationService.getLowStockMedications(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useMedicationsExpiringSoon(days: number = 30) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: medicationKeys.expiringSoon(currentHousehold?.id || '', days),
    queryFn: () => medicationService.getMedicationsExpiringSoon(currentHousehold?.id || '', days),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useMedicationStats() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: medicationKeys.stats(currentHousehold?.id || ''),
    queryFn: () => medicationService.getMedicationStats(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useSearchMedications(searchText: string) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: medicationKeys.search(currentHousehold?.id || '', searchText),
    queryFn: () => medicationService.searchMedications(currentHousehold?.id || '', searchText),
    enabled: !!currentHousehold?.id && searchText.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Intake hooks
export function useTodaysIntakes() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: medicationKeys.todaysIntakes(currentHousehold?.id || ''),
    queryFn: () => medicationService.getTodaysIntakes(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })
}

export function useOverdueIntakes() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: medicationKeys.overdueIntakes(currentHousehold?.id || ''),
    queryFn: () => medicationService.getOverdueIntakes(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  })
}

export function useIntakesForDateRange(medicationId: string, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: medicationKeys.intakeRange(medicationId, startDate, endDate),
    queryFn: () => medicationService.getIntakesForDateRange(medicationId, startDate, endDate),
    enabled: !!medicationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Medication mutations
export function useCreateMedication() {
  const queryClient = useQueryClient()
  const currentHousehold = useCurrentHousehold()
  const currentUser = useCurrentUser()
  
  return useMutation({
    mutationFn: (data: MedicationFormData) => 
      medicationService.createMedication(data, currentHousehold?.id || '', currentUser?.id || ''),
    onSuccess: () => {
      // Invalidate and refetch medication queries
      queryClient.invalidateQueries({ queryKey: medicationKeys.all })
    },
  })
}

export function useUpdateMedication() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MedicationFormData> }) =>
      medicationService.updateMedication(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific medication and lists
      queryClient.invalidateQueries({ queryKey: medicationKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: medicationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: medicationKeys.intakes() })
    },
  })
}

export function useDeleteMedication() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => medicationService.deleteMedication(id),
    onSuccess: () => {
      // Invalidate all medication queries
      queryClient.invalidateQueries({ queryKey: medicationKeys.all })
    },
  })
}

// Intake mutations
export function useRecordIntake() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      intakeId, 
      actualDateTime, 
      dosageTaken, 
      notes 
    }: { 
      intakeId: number
      actualDateTime?: Date
      dosageTaken?: number
      notes?: string 
    }) =>
      medicationService.recordIntake(intakeId, actualDateTime, dosageTaken, notes),
    onSuccess: () => {
      // Invalidate intake queries
      queryClient.invalidateQueries({ queryKey: medicationKeys.intakes() })
      queryClient.invalidateQueries({ queryKey: medicationKeys.lists() })
    },
  })
}

export function useSkipIntake() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ intakeId, reason }: { intakeId: number; reason?: string }) =>
      medicationService.skipIntake(intakeId, reason),
    onSuccess: () => {
      // Invalidate intake queries
      queryClient.invalidateQueries({ queryKey: medicationKeys.intakes() })
    },
  })
}

// Stock mutations
export function useUpdateStock() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ medicationId, quantity }: { medicationId: string; quantity: number }) =>
      medicationService.updateStock(medicationId, quantity),
    onSuccess: (_, { medicationId }) => {
      // Invalidate specific medication and lists
      queryClient.invalidateQueries({ queryKey: medicationKeys.detail(medicationId) })
      queryClient.invalidateQueries({ queryKey: medicationKeys.lists() })
    },
  })
}

export function useAddStock() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ medicationId, quantity }: { medicationId: string; quantity: number }) =>
      medicationService.addStock(medicationId, quantity),
    onSuccess: (_, { medicationId }) => {
      // Invalidate specific medication and lists
      queryClient.invalidateQueries({ queryKey: medicationKeys.detail(medicationId) })
      queryClient.invalidateQueries({ queryKey: medicationKeys.lists() })
    },
  })
}

// Utility hooks
export function useMedicationForms() {
  return {
    data: medicationService.getDefaultForms(),
    isLoading: false,
    error: null,
  }
}

export function useMedicationUnits() {
  return {
    data: medicationService.getDefaultUnits(),
    isLoading: false,
    error: null,
  }
}

