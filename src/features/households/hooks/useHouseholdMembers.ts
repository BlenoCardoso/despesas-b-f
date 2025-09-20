import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { householdService } from '../services/householdService'

// Hook para listar membros de uma household
export function useHouseholdMembers(householdId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['householdMembers', householdId],
    queryFn: () => householdService.listHouseholdMembers(householdId)
  })

  return {
    members: data || [],
    isLoading,
    error
  }
}

// Hook para remover membro
export function useRemoveMember(householdId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ memberId, removedBy }: { 
      memberId: string 
      removedBy: string
    }) => {
      return householdService.removeMember(householdId, memberId, removedBy)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['householdMembers', householdId] })
    }
  })

  return mutation
}

// Hook para atualizar role do membro
export function useUpdateMemberRole(householdId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ memberId, newRole, updatedBy }: {
      memberId: string
      newRole: string
      updatedBy: string
    }) => {
      return householdService.updateMemberRole(householdId, memberId, newRole, updatedBy)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['householdMembers', householdId] })
    }
  })

  return mutation
}

// Hook para criar convite
export function useCreateInvite(householdId: string) {
  return useMutation({
    mutationFn: (data: {
      createdBy: string
      expiresInHours?: number
      maxUses?: number
    }) => {
      return householdService.createInvite({
        householdId,
        ...data
      })
    }
  })
}

// Hook para aceitar convite
export function useAcceptInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ code, userId }: {
      code: string
      userId: string  
    }) => {
      return householdService.acceptInvite(code, userId)
    },
    onSuccess: () => {
      // Invalida várias queries que podem ter sido afetadas
      queryClient.invalidateQueries({ queryKey: ['households'] })
      queryClient.invalidateQueries({ queryKey: ['householdMembers'] })
    }
  })
}