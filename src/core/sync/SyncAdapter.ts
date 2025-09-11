import { ChangeSet } from '@/types/global'

export type EntityType = 'expenses' | 'tasks' | 'documents' | 'medications' | 'medicationIntakes'

export interface SyncEventHandler {
  (entityType: EntityType, data: any): void
}

export interface PresenceInfo {
  userId: string
  userName: string
  lastSeen: Date
  isOnline: boolean
}

export interface SyncAdapter {
  // Connection management
  connect(householdId: string, userId: string): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  
  // Data synchronization
  push(changeSet: ChangeSet): Promise<void>
  pull(since?: Date): Promise<ChangeSet[]>
  
  // Real-time subscriptions
  subscribe(entityType: EntityType, handler: SyncEventHandler): () => void
  unsubscribe(entityType: EntityType): void
  
  // Presence awareness
  onPresence(callback: (users: PresenceInfo[]) => void): () => void
  updatePresence(status: 'online' | 'away' | 'offline'): Promise<void>
  
  // Conflict resolution
  resolveConflict(localChange: ChangeSet, remoteChange: ChangeSet): Promise<ChangeSet>
  
  // Health check
  getConnectionStatus(): {
    connected: boolean
    lastHeartbeat?: Date
    latency?: number
    error?: string
  }
}

export interface SyncConfig {
  householdId: string
  userId: string
  enableRealtime: boolean
  conflictResolution: 'last-write-wins' | 'manual'
  retryAttempts: number
  retryDelay: number
}

export interface SyncStats {
  totalPushed: number
  totalPulled: number
  lastSyncAt?: Date
  pendingChanges: number
  conflictsResolved: number
  errors: number
}

export abstract class BaseSyncAdapter implements SyncAdapter {
  protected config: SyncConfig
  protected stats: SyncStats
  protected eventHandlers: Map<EntityType, SyncEventHandler[]>
  protected presenceCallbacks: Array<(users: PresenceInfo[]) => void>
  
  constructor(config: SyncConfig) {
    this.config = config
    this.stats = {
      totalPushed: 0,
      totalPulled: 0,
      pendingChanges: 0,
      conflictsResolved: 0,
      errors: 0,
    }
    this.eventHandlers = new Map()
    this.presenceCallbacks = []
  }
  
  abstract connect(householdId: string, userId: string): Promise<void>
  abstract disconnect(): Promise<void>
  abstract isConnected(): boolean
  abstract push(changeSet: ChangeSet): Promise<void>
  abstract pull(since?: Date): Promise<ChangeSet[]>
  abstract updatePresence(status: 'online' | 'away' | 'offline'): Promise<void>
  abstract getConnectionStatus(): { connected: boolean; lastHeartbeat?: Date; latency?: number; error?: string }
  
  subscribe(entityType: EntityType, handler: SyncEventHandler): () => void {
    if (!this.eventHandlers.has(entityType)) {
      this.eventHandlers.set(entityType, [])
    }
    
    const handlers = this.eventHandlers.get(entityType)!
    handlers.push(handler)
    
    return () => {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }
  
  unsubscribe(entityType: EntityType): void {
    this.eventHandlers.delete(entityType)
  }
  
  onPresence(callback: (users: PresenceInfo[]) => void): () => void {
    this.presenceCallbacks.push(callback)
    
    return () => {
      const index = this.presenceCallbacks.indexOf(callback)
      if (index > -1) {
        this.presenceCallbacks.splice(index, 1)
      }
    }
  }
  
  async resolveConflict(localChange: ChangeSet, remoteChange: ChangeSet): Promise<ChangeSet> {
    if (this.config.conflictResolution === 'last-write-wins') {
      // Return the change with the latest timestamp
      return localChange.timestamp > remoteChange.timestamp ? localChange : remoteChange
    }
    
    // For manual resolution, we'll need to implement a conflict resolution UI
    // For now, default to last-write-wins
    return localChange.timestamp > remoteChange.timestamp ? localChange : remoteChange
  }
  
  protected notifyHandlers(entityType: EntityType, data: any): void {
    const handlers = this.eventHandlers.get(entityType) || []
    handlers.forEach(handler => {
      try {
        handler(entityType, data)
      } catch (error) {
        console.error(`Error in sync event handler for ${entityType}:`, error)
      }
    })
  }
  
  protected notifyPresence(users: PresenceInfo[]): void {
    this.presenceCallbacks.forEach(callback => {
      try {
        callback(users)
      } catch (error) {
        console.error('Error in presence callback:', error)
      }
    })
  }
  
  getStats(): SyncStats {
    return { ...this.stats }
  }
  
  resetStats(): void {
    this.stats = {
      totalPushed: 0,
      totalPulled: 0,
      pendingChanges: 0,
      conflictsResolved: 0,
      errors: 0,
    }
  }
}

