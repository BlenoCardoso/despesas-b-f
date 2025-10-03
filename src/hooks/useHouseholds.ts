import { useState, useEffect, useCallback } from 'react'
import { householdService, type Household } from '@/services/householdService'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export function useHouseholds() {
  const { user } = useAuth()
  const [households, setHouseholds] = useState<Household[]>([])
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar household atual do localStorage
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`currentHousehold:${user.id}`)
      if (saved) {
        try {
          const householdId = JSON.parse(saved)
          // Será atualizado quando as households forem carregadas
          console.log('Household salva no localStorage:', householdId)
        } catch (e) {
          console.warn('Erro ao carregar household do localStorage:', e)
        }
      }
    }
  }, [user?.id])

  // Escutar mudanças em tempo real
  useEffect(() => {
    if (!user?.id) {
      setHouseholds([])
      setCurrentHousehold(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = householdService.subscribeToUserHouseholds(
      user.id,
      (newHouseholds) => {
        setHouseholds(newHouseholds)
        
        // Definir household atual
        const saved = localStorage.getItem(`currentHousehold:${user.id}`)
        let currentId = null
        
        if (saved) {
          try {
            currentId = JSON.parse(saved)
          } catch (e) {
            // ignore
          }
        }

        // Verificar se a household salva ainda existe
        const savedHousehold = newHouseholds.find(h => h.id === currentId)
        
        if (savedHousehold) {
          setCurrentHousehold(savedHousehold)
        } else if (newHouseholds.length > 0) {
          // Usar a primeira household como padrão
          const firstHousehold = newHouseholds[0]
          setCurrentHousehold(firstHousehold)
          localStorage.setItem(`currentHousehold:${user.id}`, JSON.stringify(firstHousehold.id))
        } else {
          setCurrentHousehold(null)
        }
        
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user?.id])

  // Trocar household atual
  const switchHousehold = useCallback((householdId: string) => {
    const household = households.find(h => h.id === householdId)
    if (household && user?.id) {
      setCurrentHousehold(household)
      localStorage.setItem(`currentHousehold:${user.id}`, JSON.stringify(householdId))
    }
  }, [households, user?.id])

  // Criar nova household
  const createHousehold = useCallback(async (name: string) => {
    try {
      setError(null)
      const householdId = await householdService.createHousehold(name)
      toast.success('Household criada com sucesso!')
      
      // A household será automaticamente adicionada via listener
      // Vamos aguardar um pouco e então selecioná-la
      setTimeout(() => {
        switchHousehold(householdId)
      }, 1000)
      
      return householdId
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar household'
      setError(message)
      toast.error(message)
      throw error
    }
  }, [switchHousehold])

  // Gerar código de convite
  const generateInviteCode = useCallback(async (householdId?: string) => {
    try {
      setError(null)
      const id = householdId || currentHousehold?.id
      if (!id) throw new Error('Nenhuma household selecionada')
      
      const code = await householdService.generateInviteCode(id)
      const link = `${window.location.origin}/convite/${code}`
      
      // Copiar para clipboard
      try {
        await navigator.clipboard.writeText(link)
        toast.success('Link de convite copiado para a área de transferência!')
      } catch (clipboardError) {
        toast.success(`Código de convite: ${code}`)
      }
      
      return { code, link }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar convite'
      setError(message)
      toast.error(message)
      throw error
    }
  }, [currentHousehold?.id])

  // Aceitar convite
  const acceptInvite = useCallback(async (code: string) => {
    try {
      setError(null)
      const householdId = await householdService.acceptInvite(code)
      toast.success('Convite aceito com sucesso!')
      
      // Trocar para a nova household
      setTimeout(() => {
        switchHousehold(householdId)
      }, 1000)
      
      return householdId
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao aceitar convite'
      setError(message)
      toast.error(message)
      throw error
    }
  }, [switchHousehold])

  // Sair da household
  const leaveHousehold = useCallback(async (householdId?: string) => {
    try {
      setError(null)
      const id = householdId || currentHousehold?.id
      if (!id) throw new Error('Nenhuma household selecionada')
      
      await householdService.leaveHousehold(id)
      toast.success('Você saiu da household')
      
      // Se saiu da household atual, trocar para outra ou limpar
      if (id === currentHousehold?.id) {
        const remaining = households.filter(h => h.id !== id)
        if (remaining.length > 0) {
          switchHousehold(remaining[0].id)
        } else {
          setCurrentHousehold(null)
          if (user?.id) {
            localStorage.removeItem(`currentHousehold:${user.id}`)
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao sair da household'
      setError(message)
      toast.error(message)
      throw error
    }
  }, [currentHousehold?.id, households, switchHousehold, user?.id])

  // Remover membro
  const removeMember = useCallback(async (userId: string, householdId?: string) => {
    try {
      setError(null)
      const id = householdId || currentHousehold?.id
      if (!id) throw new Error('Nenhuma household selecionada')
      
      await householdService.removeMember(id, userId)
      toast.success('Membro removido com sucesso')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao remover membro'
      setError(message)
      toast.error(message)
      throw error
    }
  }, [currentHousehold?.id])

  // Atualizar nome
  const updateName = useCallback(async (name: string, householdId?: string) => {
    try {
      setError(null)
      const id = householdId || currentHousehold?.id
      if (!id) throw new Error('Nenhuma household selecionada')
      
      await householdService.updateName(id, name)
      toast.success('Nome atualizado com sucesso')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar nome'
      setError(message)
      toast.error(message)
      throw error
    }
  }, [currentHousehold?.id])

  // Deletar household
  const deleteHousehold = useCallback(async (householdId?: string) => {
    try {
      setError(null)
      const id = householdId || currentHousehold?.id
      if (!id) throw new Error('Nenhuma household selecionada')
      
      await householdService.deleteHousehold(id)
      toast.success('Household deletada com sucesso')
      
      // Se deletou a household atual, trocar para outra ou limpar
      if (id === currentHousehold?.id) {
        const remaining = households.filter(h => h.id !== id)
        if (remaining.length > 0) {
          switchHousehold(remaining[0].id)
        } else {
          setCurrentHousehold(null)
          if (user?.id) {
            localStorage.removeItem(`currentHousehold:${user.id}`)
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar household'
      setError(message)
      toast.error(message)
      throw error
    }
  }, [currentHousehold?.id, households, switchHousehold, user?.id])

  return {
    households,
    currentHousehold,
    loading,
    error,
    switchHousehold,
    createHousehold,
    generateInviteCode,
    acceptInvite,
    leaveHousehold,
    removeMember,
    updateName,
    deleteHousehold
  }
}