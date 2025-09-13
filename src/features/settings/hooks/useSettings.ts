import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPreferences, NotificationSettings, BackupSettings, PrivacySettings, SecuritySettings } from '../types'

// Keys para React Query
export const settingsKeys = {
  all: ['settings'] as const,
  preferences: () => [...settingsKeys.all, 'preferences'] as const,
  notifications: () => [...settingsKeys.all, 'notifications'] as const,
  backup: () => [...settingsKeys.all, 'backup'] as const,
  privacy: () => [...settingsKeys.all, 'privacy'] as const,
  security: () => [...settingsKeys.all, 'security'] as const,
}

// Simulação de dados padrão (substituir por API real)
const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'pt-BR',
  currency: 'BRL',
  dateFormat: 'dd/MM/yyyy',
  notifications: {
    push: true,
    email: true,
    sms: false,
    reminders: true,
    weeklyReport: true,
    monthlyReport: true,
    budgetAlerts: true,
    medicationReminders: true,
    taskDeadlines: true,
  },
  biometricAuth: true,
  autoLock: true,
  autoLockTimeout: 5,
  dataSharing: false,
  analytics: true,
  defaultExpenseCategory: 'Outros',
  defaultPaymentMethod: 'Dinheiro',
  budgetWarningPercentage: 80,
  autoBackup: true,
  backupFrequency: 'weekly',
  syncFrequency: 'realtime',
}

// Mock functions (substituir por chamadas de API reais)
const mockSettingsService = {
  getPreferences: async (): Promise<UserPreferences> => {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300))
    const stored = localStorage.getItem('user-preferences')
    return stored ? JSON.parse(stored) : defaultPreferences
  },

  updatePreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const current = await mockSettingsService.getPreferences()
    const updated = { ...current, ...preferences }
    localStorage.setItem('user-preferences', JSON.stringify(updated))
    return updated
  },

  exportData: async (type: 'expenses' | 'reports' | 'all'): Promise<Blob> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Simular geração de arquivo
    const data = JSON.stringify({ type, timestamp: new Date().toISOString() })
    return new Blob([data], { type: 'application/json' })
  },

  createBackup: async (): Promise<{ success: boolean; filename: string }> => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return {
      success: true,
      filename: `backup-${new Date().toISOString().split('T')[0]}.json`
    }
  },

  restoreBackup: async (file: File): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return {
      success: true,
      message: 'Backup restaurado com sucesso!'
    }
  },

  deleteAllData: async (): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    localStorage.clear()
    return { success: true }
  },

  checkForUpdates: async (): Promise<{ hasUpdate: boolean; version?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { hasUpdate: false }
  }
}

// Hooks
export function useUserPreferences() {
  return useQuery({
    queryKey: settingsKeys.preferences(),
    queryFn: mockSettingsService.getPreferences,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mockSettingsService.updatePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.preferences(), data)
    },
  })
}

export function useExportData() {
  return useMutation({
    mutationFn: mockSettingsService.exportData,
    onSuccess: (blob, type) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
  })
}

export function useCreateBackup() {
  return useMutation({
    mutationFn: mockSettingsService.createBackup,
  })
}

export function useRestoreBackup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mockSettingsService.restoreBackup,
    onSuccess: () => {
      // Invalidar todas as queries após restore
      queryClient.invalidateQueries()
    },
  })
}

export function useDeleteAllData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mockSettingsService.deleteAllData,
    onSuccess: () => {
      // Limpar cache e redefinir para valores padrão
      queryClient.clear()
      queryClient.setQueryData(settingsKeys.preferences(), defaultPreferences)
    },
  })
}

export function useCheckForUpdates() {
  return useQuery({
    queryKey: ['app-updates'],
    queryFn: mockSettingsService.checkForUpdates,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  })
}

// Hooks para configurações específicas
export function useTheme() {
  const { data: preferences } = useUserPreferences()
  const updatePreferences = useUpdatePreferences()

  const setTheme = (theme: UserPreferences['theme']) => {
    updatePreferences.mutate({ theme })
  }

  return {
    theme: preferences?.theme || 'light',
    setTheme,
    isLoading: updatePreferences.isPending,
  }
}

export function useNotificationSettings() {
  const { data: preferences } = useUserPreferences()
  const updatePreferences = useUpdatePreferences()

  const updateNotifications = (notifications: Partial<UserPreferences['notifications']>) => {
    if (preferences) {
      updatePreferences.mutate({
        notifications: { ...preferences.notifications, ...notifications }
      })
    }
  }

  return {
    notifications: preferences?.notifications || defaultPreferences.notifications,
    updateNotifications,
    isLoading: updatePreferences.isPending,
  }
}

export function useSecuritySettings() {
  const { data: preferences } = useUserPreferences()
  const updatePreferences = useUpdatePreferences()

  const updateSecurity = (settings: Partial<Pick<UserPreferences, 'biometricAuth' | 'autoLock' | 'autoLockTimeout'>>) => {
    updatePreferences.mutate(settings)
  }

  return {
    biometricAuth: preferences?.biometricAuth || false,
    autoLock: preferences?.autoLock || false,
    autoLockTimeout: preferences?.autoLockTimeout || 5,
    updateSecurity,
    isLoading: updatePreferences.isPending,
  }
}

export function useLanguageSettings() {
  const { data: preferences } = useUserPreferences()
  const updatePreferences = useUpdatePreferences()

  const setLanguage = (language: UserPreferences['language']) => {
    updatePreferences.mutate({ language })
  }

  const setCurrency = (currency: UserPreferences['currency']) => {
    updatePreferences.mutate({ currency })
  }

  const setDateFormat = (dateFormat: UserPreferences['dateFormat']) => {
    updatePreferences.mutate({ dateFormat })
  }

  return {
    language: preferences?.language || 'pt-BR',
    currency: preferences?.currency || 'BRL',
    dateFormat: preferences?.dateFormat || 'dd/MM/yyyy',
    setLanguage,
    setCurrency,
    setDateFormat,
    isLoading: updatePreferences.isPending,
  }
}