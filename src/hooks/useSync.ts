import { useState, useEffect, useCallback } from 'react'
import { syncManager, SyncStatus, SyncMetrics } from '@/core/sync'
import { useAppStore } from '@/core/store'

export interface UseSyncReturn {
  status: SyncStatus
  metrics: SyncMetrics
  conflicts: any[]
  sync: (entityType: string, entityId: string, data: any, operation: 'create' | 'update' | 'delete') => Promise<void>
  triggerSync: () => Promise<void>
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merge', mergedData?: any) => Promise<void>
  getVersionHistory: (entityType: string, entityId: string) => any[]
  revertToVersion: (entityType: string, entityId: string, version: number) => Promise<void>
  connectRealtime: () => Promise<void>
  disconnectRealtime: () => void
  isOnline: boolean
  isSyncing: boolean
  hasConflicts: boolean
  hasPendingChanges: boolean
}

export function useSync(): UseSyncReturn {
  const { currentUser, currentHousehold } = useAppStore()
  const [status, setStatus] = useState<SyncStatus>(syncManager.getStatus())
  const [metrics, setMetrics] = useState<SyncMetrics>(syncManager.getMetrics())
  const [conflicts, setConflicts] = useState<any[]>([])

  // Update status and metrics periodically
  useEffect(() => {
    const updateData = () => {
      setStatus(syncManager.getStatus())
      setMetrics(syncManager.getMetrics())
      setConflicts(syncManager.getConflicts())
    }

    // Initial update
    updateData()

    // Set up interval for periodic updates
    const interval = setInterval(updateData, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Set up event listeners
  useEffect(() => {
    const handleSyncCompleted = () => {
      setStatus(syncManager.getStatus())
      setMetrics(syncManager.getMetrics())
    }

    const handleConflictDetected = (conflict: any) => {
      setConflicts(prev => [...prev, conflict])
      setStatus(syncManager.getStatus())
    }

    const handleConflictResolved = ({ conflictId }: { conflictId: string }) => {
      setConflicts(prev => prev.filter(c => c.id !== conflictId))
      setStatus(syncManager.getStatus())
      setMetrics(syncManager.getMetrics())
    }

    const handleSyncError = (error: any) => {
      console.error('Sync error:', error)
      setStatus(syncManager.getStatus())
    }

    const handleOnline = () => {
      setStatus(syncManager.getStatus())
    }

    const handleOffline = () => {
      setStatus(syncManager.getStatus())
    }

    // Add event listeners
    syncManager.on('sync_completed', handleSyncCompleted)
    syncManager.on('conflict_detected', handleConflictDetected)
    syncManager.on('conflict_resolved', handleConflictResolved)
    syncManager.on('sync_error', handleSyncError)
    syncManager.on('online', handleOnline)
    syncManager.on('offline', handleOffline)

    // Cleanup
    return () => {
      syncManager.off('sync_completed', handleSyncCompleted)
      syncManager.off('conflict_detected', handleConflictDetected)
      syncManager.off('conflict_resolved', handleConflictResolved)
      syncManager.off('sync_error', handleSyncError)
      syncManager.off('online', handleOnline)
      syncManager.off('offline', handleOffline)
    }
  }, [])

  // Sync function
  const sync = useCallback(async (
    entityType: string, 
    entityId: string, 
    data: any, 
    operation: 'create' | 'update' | 'delete'
  ) => {
    if (!currentUser) {
      throw new Error('No current user available for sync')
    }

    await syncManager.sync(entityType, entityId, data, operation, currentUser.id)
  }, [currentUser])

  // Trigger sync manually
  const triggerSync = useCallback(async () => {
    await syncManager.triggerSync()
  }, [])

  // Resolve conflict
  const resolveConflict = useCallback(async (
    conflictId: string, 
    resolution: 'local' | 'remote' | 'merge', 
    mergedData?: any
  ) => {
    await syncManager.resolveConflict(conflictId, resolution, mergedData)
  }, [])

  // Get version history
  const getVersionHistory = useCallback((entityType: string, entityId: string) => {
    return syncManager.getVersionHistory(entityType, entityId)
  }, [])

  // Revert to version
  const revertToVersion = useCallback(async (
    entityType: string, 
    entityId: string, 
    version: number
  ) => {
    if (!currentUser) {
      throw new Error('No current user available for revert')
    }

    await syncManager.revertToVersion(entityType, entityId, version, currentUser.id)
  }, [currentUser])

  // Connect to realtime sync
  const connectRealtime = useCallback(async () => {
    if (!currentUser || !currentHousehold) {
      throw new Error('No current user or household available for realtime sync')
    }

    await syncManager.connectRealtime(currentUser.id, currentHousehold.id)
  }, [currentUser, currentHousehold])

  // Disconnect from realtime sync
  const disconnectRealtime = useCallback(() => {
    syncManager.disconnectRealtime()
  }, [])

  return {
    status,
    metrics,
    conflicts,
    sync,
    triggerSync,
    resolveConflict,
    getVersionHistory,
    revertToVersion,
    connectRealtime,
    disconnectRealtime,
    isOnline: status.isOnline,
    isSyncing: status.isSyncing,
    hasConflicts: conflicts.length > 0,
    hasPendingChanges: status.pendingChanges > 0,
  }
}

// Hook for sync status only (lighter version)
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(syncManager.getStatus())

  useEffect(() => {
    const updateStatus = () => {
      setStatus(syncManager.getStatus())
    }

    // Update on sync events
    syncManager.on('sync_completed', updateStatus)
    syncManager.on('online', updateStatus)
    syncManager.on('offline', updateStatus)

    // Periodic update
    const interval = setInterval(updateStatus, 10000) // Every 10 seconds

    return () => {
      syncManager.off('sync_completed', updateStatus)
      syncManager.off('online', updateStatus)
      syncManager.off('offline', updateStatus)
      clearInterval(interval)
    }
  }, [])

  return {
    isOnline: status.isOnline,
    isSyncing: status.isSyncing,
    pendingChanges: status.pendingChanges,
    conflicts: status.conflicts,
    lastSyncTime: status.lastSyncTime,
  }
}

// Hook for conflict management
export function useConflicts() {
  const [conflicts, setConflicts] = useState<any[]>(syncManager.getConflicts())

  useEffect(() => {
    const updateConflicts = () => {
      setConflicts(syncManager.getConflicts())
    }

    syncManager.on('conflict_detected', updateConflicts)
    syncManager.on('conflict_resolved', updateConflicts)

    return () => {
      syncManager.off('conflict_detected', updateConflicts)
      syncManager.off('conflict_resolved', updateConflicts)
    }
  }, [])

  const resolveConflict = useCallback(async (
    conflictId: string, 
    resolution: 'local' | 'remote' | 'merge', 
    mergedData?: any
  ) => {
    await syncManager.resolveConflict(conflictId, resolution, mergedData)
  }, [])

  return {
    conflicts,
    resolveConflict,
    hasConflicts: conflicts.length > 0,
  }
}

// Hook for version history
export function useVersionHistory(entityType: string, entityId: string) {
  const [versions, setVersions] = useState<any[]>([])

  useEffect(() => {
    const updateVersions = () => {
      setVersions(syncManager.getVersionHistory(entityType, entityId))
    }

    // Initial load
    updateVersions()

    // Update when sync completes
    syncManager.on('sync_completed', updateVersions)
    syncManager.on('version_reverted', updateVersions)

    return () => {
      syncManager.off('sync_completed', updateVersions)
      syncManager.off('version_reverted', updateVersions)
    }
  }, [entityType, entityId])

  const revertToVersion = useCallback(async (version: number) => {
    const { currentUser } = useAppStore.getState()
    if (!currentUser) {
      throw new Error('No current user available for revert')
    }

    await syncManager.revertToVersion(entityType, entityId, version, currentUser.id)
  }, [entityType, entityId])

  return {
    versions,
    revertToVersion,
    hasVersions: versions.length > 0,
  }
}

