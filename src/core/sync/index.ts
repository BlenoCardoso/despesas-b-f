import { SyncAdapter } from './SyncAdapter'
import { LocalAdapter } from './LocalAdapter'
import { BroadcastChannelAdapter } from './BroadcastChannelAdapter'
import { realtimeSync, RealtimeSync } from './RealtimeSync'
import { versionManager, VersionManager } from './VersionManager'
import { conflictResolver, ConflictResolver } from './ConflictResolver'

export interface SyncConfig {
  adapters: ('local' | 'broadcast' | 'firebase' | 'realtime')[]
  primaryAdapter: 'local' | 'broadcast' | 'firebase' | 'realtime'
  conflictResolution: 'auto' | 'manual'
  syncInterval: number
  batchSize: number
  retryAttempts: number
  enableVersioning: boolean
  enableRealtime: boolean
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: Date | null
  pendingChanges: number
  failedChanges: number
  conflicts: number
  adaptersStatus: Record<string, boolean>
}

export interface SyncMetrics {
  totalSyncs: number
  successfulSyncs: number
  failedSyncs: number
  conflictsResolved: number
  averageSyncTime: number
  dataTransferred: number
}

export class SyncManager {
  private adapters: Map<string, SyncAdapter> = new Map()
  private config: SyncConfig
  private status: SyncStatus
  private metrics: SyncMetrics
  private syncQueue: Array<{ entityType: string; entityId: string; operation: string; data: any }> = []
  private isSyncing = false
  private syncTimer: NodeJS.Timeout | null = null
  private eventListeners: Map<string, Function[]> = new Map()

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      adapters: ['local', 'broadcast'],
      primaryAdapter: 'local',
      conflictResolution: 'auto',
      syncInterval: 30000, // 30 seconds
      batchSize: 50,
      retryAttempts: 3,
      enableVersioning: true,
      enableRealtime: false,
      ...config
    }

    this.status = {
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncTime: null,
      pendingChanges: 0,
      failedChanges: 0,
      conflicts: 0,
      adaptersStatus: {}
    }

    this.metrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsResolved: 0,
      averageSyncTime: 0,
      dataTransferred: 0
    }

    this.initializeAdapters()
    this.setupEventListeners()
    this.startPeriodicSync()
  }

  private initializeAdapters() {
    // Initialize adapters based on configuration
    if (this.config.adapters.includes('local')) {
      this.adapters.set('local', new LocalAdapter())
    }

    if (this.config.adapters.includes('broadcast')) {
      this.adapters.set('broadcast', new BroadcastChannelAdapter())
    }

    if (this.config.adapters.includes('realtime') && this.config.enableRealtime) {
      this.adapters.set('realtime', realtimeSync as any)
    }

    // Update adapters status
    this.adapters.forEach((adapter, name) => {
      this.status.adaptersStatus[name] = true
    })
  }

  private setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.status.isOnline = true
      this.triggerSync()
      this.emit('online')
    })

    window.addEventListener('offline', () => {
      this.status.isOnline = false
      this.emit('offline')
    })

    // Listen for realtime sync events if enabled
    if (this.config.enableRealtime) {
      realtimeSync.onDataUpdated((data) => {
        this.handleRemoteUpdate(data)
      })

      realtimeSync.onConflictDetected((conflict) => {
        this.handleConflict(conflict)
      })

      realtimeSync.onConnectionStatusChanged((isConnected) => {
        this.status.adaptersStatus['realtime'] = isConnected
        this.emit('adapter_status_changed', { adapter: 'realtime', status: isConnected })
      })
    }
  }

  private startPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }

    this.syncTimer = setInterval(() => {
      if (this.status.isOnline && !this.isSyncing) {
        this.triggerSync()
      }
    }, this.config.syncInterval)
  }

  async sync(entityType: string, entityId: string, data: any, operation: 'create' | 'update' | 'delete', userId: string): Promise<void> {
    const syncItem = { entityType, entityId, operation, data }
    
    // Add to sync queue
    this.syncQueue.push(syncItem)
    this.status.pendingChanges = this.syncQueue.length

    // Create version if versioning is enabled
    if (this.config.enableVersioning) {
      const currentVersion = versionManager.getCurrentVersion(entityType, entityId)
      versionManager.createVersion(entityType, entityId, data, operation, userId, currentVersion?.data)
    }

    // Immediate sync for high priority operations
    if (operation === 'delete' || this.config.primaryAdapter === 'realtime') {
      await this.processSyncItem(syncItem, userId)
    }

    this.emit('sync_queued', syncItem)
  }

  private async processSyncItem(item: any, userId: string): Promise<void> {
    const startTime = Date.now()

    try {
      // Get primary adapter
      const primaryAdapter = this.adapters.get(this.config.primaryAdapter)
      if (!primaryAdapter) {
        throw new Error(`Primary adapter ${this.config.primaryAdapter} not available`)
      }

      // Sync with primary adapter
      await primaryAdapter.sync(item.entityType, item.entityId, item.data, item.operation)

      // Sync with secondary adapters
      const secondaryAdapters = Array.from(this.adapters.entries())
        .filter(([name]) => name !== this.config.primaryAdapter)

      await Promise.allSettled(
        secondaryAdapters.map(([name, adapter]) => 
          adapter.sync(item.entityType, item.entityId, item.data, item.operation)
        )
      )

      // Update metrics
      const syncTime = Date.now() - startTime
      this.metrics.totalSyncs++
      this.metrics.successfulSyncs++
      this.metrics.averageSyncTime = 
        (this.metrics.averageSyncTime * (this.metrics.totalSyncs - 1) + syncTime) / this.metrics.totalSyncs
      this.metrics.dataTransferred += JSON.stringify(item.data).length

      // Remove from queue
      const index = this.syncQueue.indexOf(item)
      if (index > -1) {
        this.syncQueue.splice(index, 1)
        this.status.pendingChanges = this.syncQueue.length
      }

      this.emit('sync_success', item)

    } catch (error) {
      console.error('Sync failed:', error)
      this.metrics.failedSyncs++
      this.status.failedChanges++
      this.emit('sync_error', { item, error })
    }
  }

  async triggerSync(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return
    }

    this.isSyncing = true
    this.status.isSyncing = true

    try {
      const batch = this.syncQueue.splice(0, this.config.batchSize)
      const userId = 'current-user' // Should come from auth context

      await Promise.allSettled(
        batch.map(item => this.processSyncItem(item, userId))
      )

      this.status.lastSyncTime = new Date()
      this.emit('sync_completed')

    } finally {
      this.isSyncing = false
      this.status.isSyncing = false

      // Continue syncing if there are more items
      if (this.syncQueue.length > 0) {
        setTimeout(() => this.triggerSync(), 1000)
      }
    }
  }

  private async handleRemoteUpdate(data: any): Promise<void> {
    try {
      // Check for conflicts if versioning is enabled
      if (this.config.enableVersioning) {
        const currentVersion = versionManager.getCurrentVersion(data.entityType, data.entityId)
        
        if (currentVersion) {
          const conflict = conflictResolver.detectConflict(
            data.entityType,
            data.entityId,
            currentVersion.data,
            data.data,
            currentVersion.createdAt,
            new Date()
          )

          if (conflict) {
            this.status.conflicts++
            await this.handleConflict(conflict)
            return
          }
        }
      }

      // Apply remote update
      this.emit('remote_update', data)

    } catch (error) {
      console.error('Error handling remote update:', error)
      this.emit('sync_error', { data, error })
    }
  }

  private async handleConflict(conflict: any): Promise<void> {
    this.emit('conflict_detected', conflict)

    if (this.config.conflictResolution === 'auto') {
      try {
        const resolvedData = await conflictResolver.resolveConflict(conflict.id)
        if (resolvedData) {
          this.metrics.conflictsResolved++
          this.status.conflicts--
          this.emit('conflict_resolved', { conflict, resolvedData })
        }
      } catch (error) {
        console.error('Auto conflict resolution failed:', error)
        this.emit('conflict_resolution_failed', { conflict, error })
      }
    }
  }

  // Public API methods
  getStatus(): SyncStatus {
    return { ...this.status }
  }

  getMetrics(): SyncMetrics {
    return { ...this.metrics }
  }

  getConflicts() {
    return conflictResolver.getPendingConflicts()
  }

  async resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merge', mergedData?: any): Promise<void> {
    try {
      const resolvedData = await conflictResolver.resolveConflict(conflictId, resolution, mergedData)
      if (resolvedData) {
        this.metrics.conflictsResolved++
        this.status.conflicts--
        this.emit('conflict_resolved', { conflictId, resolution, resolvedData })
      }
    } catch (error) {
      console.error('Manual conflict resolution failed:', error)
      this.emit('conflict_resolution_failed', { conflictId, error })
    }
  }

  getVersionHistory(entityType: string, entityId: string) {
    return versionManager.getVersionHistory(entityType, entityId)
  }

  async revertToVersion(entityType: string, entityId: string, version: number, userId: string): Promise<void> {
    const revertedVersion = versionManager.revertToVersion(entityType, entityId, version, userId)
    if (revertedVersion) {
      await this.sync(entityType, entityId, revertedVersion.data, 'update', userId)
      this.emit('version_reverted', { entityType, entityId, version, revertedVersion })
    }
  }

  async connectRealtime(userId: string, householdId: string): Promise<void> {
    if (this.config.enableRealtime) {
      await realtimeSync.connect(userId, householdId)
    }
  }

  disconnectRealtime(): void {
    if (this.config.enableRealtime) {
      realtimeSync.disconnect()
    }
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in event listener:', error)
        }
      })
    }
  }

  // Cleanup
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }

    this.disconnectRealtime()
    this.eventListeners.clear()
    this.adapters.clear()
  }
}

// Create singleton instance
export const syncManager = new SyncManager()

// Export all sync-related classes and instances
export {
  SyncAdapter,
  LocalAdapter,
  BroadcastChannelAdapter,
  RealtimeSync,
  VersionManager,
  ConflictResolver,
  realtimeSync,
  versionManager,
  conflictResolver
}

