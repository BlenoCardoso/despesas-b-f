import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { AppSettings, FeatureFlags, Household, User } from '@/types/global'

// App State Interface
interface AppState {
  // Core data
  currentHousehold: Household | null
  currentUser: User | null
  
  // UI State
  isLoading: boolean
  error: string | null
  
  // Settings
  settings: AppSettings
  featureFlags: FeatureFlags
  
  // Navigation
  currentTab: string
  
  // Notifications
  notificationPermission: NotificationPermission
  unreadNotifications: number
  
  // PWA
  isInstallable: boolean
  isInstalled: boolean
  
  // Sync
  lastSyncAt: Date | null
  isSyncing: boolean
  syncError: string | null
}

// App Actions Interface
interface AppActions {
  // Core data actions
  setCurrentHousehold: (household: Household | null) => void
  setCurrentUser: (user: User | null) => void
  
  // UI actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void
  updateFeatureFlags: (flags: Partial<FeatureFlags>) => void
  
  // Navigation actions
  setCurrentTab: (tab: string) => void
  
  // Notification actions
  setNotificationPermission: (permission: NotificationPermission) => void
  setUnreadNotifications: (count: number) => void
  incrementUnreadNotifications: () => void
  decrementUnreadNotifications: () => void
  
  // PWA actions
  setInstallable: (installable: boolean) => void
  setInstalled: (installed: boolean) => void
  
  // Sync actions
  setSyncStatus: (syncing: boolean, error?: string | null) => void
  setLastSyncAt: (date: Date | null) => void
  
  // Reset
  reset: () => void
}

// Default settings
const defaultSettings: AppSettings = {
  theme: 'dark',
  accentColor: '#3b82f6',
  notifications: {
    expenses: true,
    tasks: true,
    medications: true,
    documents: true,
  },
  language: 'pt-BR',
  currency: 'BRL',
}

// Default feature flags
const defaultFeatureFlags: FeatureFlags = {
  enableSync: false,
  enableNotifications: true,
  enablePushExperimental: false,
}

// Initial state
const initialState: AppState = {
  currentHousehold: null,
  currentUser: null,
  isLoading: false,
  error: null,
  settings: defaultSettings,
  featureFlags: defaultFeatureFlags,
  currentTab: 'expenses',
  notificationPermission: 'default',
  unreadNotifications: 0,
  isInstallable: false,
  isInstalled: false,
  lastSyncAt: null,
  isSyncing: false,
  syncError: null,
}

// Create the store
export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        // Core data actions
        setCurrentHousehold: (household) => set((state) => {
          state.currentHousehold = household
        }),
        
        setCurrentUser: (user) => set((state) => {
          state.currentUser = user
        }),
        
        // UI actions
        setLoading: (loading) => set((state) => {
          state.isLoading = loading
        }),
        
        setError: (error) => set((state) => {
          state.error = error
        }),
        
        clearError: () => set((state) => {
          state.error = null
        }),
        
        // Settings actions
        updateSettings: (newSettings) => set((state) => {
          state.settings = { ...state.settings, ...newSettings }
        }),
        
        updateFeatureFlags: (newFlags) => set((state) => {
          state.featureFlags = { ...state.featureFlags, ...newFlags }
        }),
        
        // Navigation actions
        setCurrentTab: (tab) => set((state) => {
          state.currentTab = tab
        }),
        
        // Notification actions
        setNotificationPermission: (permission) => set((state) => {
          state.notificationPermission = permission
        }),
        
        setUnreadNotifications: (count) => set((state) => {
          state.unreadNotifications = Math.max(0, count)
        }),
        
        incrementUnreadNotifications: () => set((state) => {
          state.unreadNotifications += 1
        }),
        
        decrementUnreadNotifications: () => set((state) => {
          state.unreadNotifications = Math.max(0, state.unreadNotifications - 1)
        }),
        
        // PWA actions
        setInstallable: (installable) => set((state) => {
          state.isInstallable = installable
        }),
        
        setInstalled: (installed) => set((state) => {
          state.isInstalled = installed
        }),
        
        // Sync actions
        setSyncStatus: (syncing, error = null) => set((state) => {
          state.isSyncing = syncing
          state.syncError = error
        }),
        
        setLastSyncAt: (date) => set((state) => {
          state.lastSyncAt = date
        }),
        
        // Reset
        reset: () => set(() => ({ ...initialState })),
      })),
      {
        name: 'despesas-app-store',
        partialize: (state) => ({
          settings: state.settings,
          featureFlags: state.featureFlags,
          currentTab: state.currentTab,
          currentHousehold: state.currentHousehold,
          currentUser: state.currentUser,
          lastSyncAt: state.lastSyncAt,
        }),
      }
    ),
    {
      name: 'despesas-app-store',
    }
  )
)

// Selectors for better performance
export const useCurrentHousehold = () => useAppStore((state) => state.currentHousehold)
export const useCurrentUser = () => useAppStore((state) => state.currentUser)
export const useSettings = () => useAppStore((state) => state.settings)
export const useFeatureFlags = () => useAppStore((state) => state.featureFlags)
export const useCurrentTab = () => useAppStore((state) => state.currentTab)
export const useNotifications = () => useAppStore((state) => ({
  permission: state.notificationPermission,
  unread: state.unreadNotifications,
}))
export const usePWAStatus = () => useAppStore((state) => ({
  isInstallable: state.isInstallable,
  isInstalled: state.isInstalled,
}))
export const useSyncStatus = () => useAppStore((state) => ({
  lastSyncAt: state.lastSyncAt,
  isSyncing: state.isSyncing,
  syncError: state.syncError,
}))
export const useUIState = () => useAppStore((state) => ({
  isLoading: state.isLoading,
  error: state.error,
}))

