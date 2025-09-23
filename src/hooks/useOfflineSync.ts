// Hook para funcionalidades offline avançadas
import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { peekQueue, removeFromQueue, getQueueLength } from '@/lib/syncQueue'
import { syncManager } from '@/core/sync'
import { auth } from '@/lib/firebase'

interface OfflineData {
  expenses: any[]
  syncQueue: any[]
  lastSync: Date | null
  isOnline: boolean
}

interface SyncAction {
  id: string
  type: 'create' | 'update' | 'delete'
  data: any
  timestamp: Date
  retryCount: number
}

export function useOfflineSync() {
  const [offlineData, setOfflineData] = useLocalStorage<OfflineData>('offline-data', {
    expenses: [],
    syncQueue: [],
    lastSync: null,
    isOnline: navigator.onLine
  })
  
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      setOfflineData(prev => ({ ...prev, isOnline: true }))
      // Automatically try to sync when coming back online
      setTimeout(syncWithServer, 1000)
    }

    const handleOffline = () => {
      setOfflineData(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Add action to sync queue
  const queueSyncAction = useCallback((action: Omit<SyncAction, 'id' | 'retryCount'>) => {
    const syncAction: SyncAction = {
      ...action,
      id: `sync-${Date.now()}-${Math.random()}`,
      retryCount: 0
    }

    setOfflineData(prev => ({
      ...prev,
      syncQueue: [...prev.syncQueue, syncAction]
    }))

    // Try to sync immediately if online
    if (offlineData.isOnline) {
      setTimeout(syncWithServer, 100)
    }
  }, [offlineData.isOnline])

  // Create expense offline
  const createExpenseOffline = useCallback((expense: any) => {
    const expenseWithId = {
      ...expense,
      id: `offline-${Date.now()}-${Math.random()}`,
      isOffline: true,
      createdAt: new Date()
    }

    // Add to local storage
    setOfflineData(prev => ({
      ...prev,
      expenses: [expenseWithId, ...prev.expenses]
    }))

    // Queue for sync
    queueSyncAction({
      type: 'create',
      data: expenseWithId,
      timestamp: new Date()
    })

    return expenseWithId
  }, [queueSyncAction])

  // Update expense offline
  const updateExpenseOffline = useCallback((id: string, updates: any) => {
    setOfflineData(prev => ({
      ...prev,
      expenses: prev.expenses.map(expense =>
        expense.id === id
          ? { ...expense, ...updates, updatedAt: new Date(), isOffline: true }
          : expense
      )
    }))

    queueSyncAction({
      type: 'update',
      data: { id, updates },
      timestamp: new Date()
    })
  }, [queueSyncAction])

  // Delete expense offline
  const deleteExpenseOffline = useCallback((id: string) => {
    setOfflineData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(expense => expense.id !== id)
    }))

    queueSyncAction({
      type: 'delete',
      data: { id },
      timestamp: new Date()
    })
  }, [queueSyncAction])

  // Sync with server
  const syncWithServer = useCallback(async () => {
    if (!offlineData.isOnline || isSyncing) {
      return
    }

    setIsSyncing(true)
    setSyncError(null)

    try {
      // Merge persistent queue (from services) with in-memory queue
      const persistent = await peekQueue() || []
      const merged = [...offlineData.syncQueue]
      for (const p of persistent) {
        if (!merged.some(m => m.id === p.id)) merged.push(p)
      }

      const processedActions: string[] = []
      const processedPersistent: string[] = []

      for (const action of merged) {
        try {
          await processSync(action)
          processedActions.push(action.id)
          // if this action came from persistent queue, mark for removal
          if (persistent.some(p => p.id === action.id)) processedPersistent.push(action.id)
        } catch (error) {
          console.error(`Erro ao sincronizar ação ${action.id}:`, error)
          // Increment retry count in local state if present
          setOfflineData(prev => ({
            ...prev,
            syncQueue: prev.syncQueue.map(queuedAction =>
              queuedAction.id === action.id
                ? { ...queuedAction, retryCount: (queuedAction.retryCount || 0) + 1 }
                : queuedAction
            )
          }))
          // No immediate removal; retry later. If retryCount >= 3 we will drop later.
        }
      }

      // Remove processed actions from local in-memory queue
      setOfflineData(prev => ({
        ...prev,
        syncQueue: prev.syncQueue.filter(action => !processedActions.includes(action.id)),
        lastSync: new Date()
      }))

      // Remove processed items from persistent queue
      if (processedPersistent.length > 0) {
        await removeFromQueue(processedPersistent)
      }

    } catch (error) {
      setSyncError('Erro durante a sincronização')
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [offlineData.isOnline, offlineData.syncQueue, isSyncing])

  // Process individual sync action (mock implementation)
  const processSync = useCallback(async (action: SyncAction) => {
    // Map our offline action shape to syncManager API
    const user = auth.currentUser
    const userId = user?.uid || 'unknown-user'

    // Normalize payloads so syncManager can apply them
    try {
      switch (action.type) {
        case 'create': {
          const entity = action.data
          // If entity has temporary offline id, pass it through; server should reconcile
          await syncManager.sync('expenses', String(entity.id), entity, 'create', userId)
          break
        }
        case 'update': {
          const { id, updates } = action.data
          await syncManager.sync('expenses', String(id), updates, 'update', userId)
          break
        }
        case 'delete': {
          const { id } = action.data
          await syncManager.sync('expenses', String(id), {}, 'delete', userId)
          break
        }
      }
    } catch (err) {
      // rethrow so caller can handle retry counting
      throw err
    }
  }, [])

  // Get all expenses (online + offline)
  const getAllExpenses = useCallback(() => {
    return offlineData.expenses.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [offlineData.expenses])

  // Check if data is stale (needs sync)
  const isDataStale = useCallback(() => {
    if (!offlineData.lastSync) return true
    
    const timeSinceSync = Date.now() - offlineData.lastSync.getTime()
    const staleThreshold = 30 * 60 * 1000 // 30 minutes
    
    return timeSinceSync > staleThreshold
  }, [offlineData.lastSync])

  // Get sync status info
  const getSyncStatus = useCallback(async () => {
    const persistentCount = await getQueueLength()
    return {
      isOnline: offlineData.isOnline,
      isSyncing,
      pendingActions: offlineData.syncQueue.length + persistentCount,
      lastSync: offlineData.lastSync,
      hasError: !!syncError,
      error: syncError,
      isStale: isDataStale()
    }
  }, [offlineData.isOnline, offlineData.syncQueue.length, offlineData.lastSync, isSyncing, syncError, isDataStale])

  // Clear all offline data (useful for debugging)
  const clearOfflineData = useCallback(() => {
    setOfflineData({
      expenses: [],
      syncQueue: [],
      lastSync: null,
      isOnline: navigator.onLine
    })
    setSyncError(null)
  }, [])

  // Force sync
  const forcSync = useCallback(() => {
    if (offlineData.isOnline) {
      syncWithServer()
    }
  }, [offlineData.isOnline, syncWithServer])

  return {
    // Data operations
    createExpenseOffline,
    updateExpenseOffline,
    deleteExpenseOffline,
    getAllExpenses,
    
    // Sync operations
    syncWithServer,
    forcSync,
    getSyncStatus,
    
    // Utilities
    clearOfflineData,
    isDataStale,
    
    // State
    offlineData,
    isSyncing,
    syncError
  }
}