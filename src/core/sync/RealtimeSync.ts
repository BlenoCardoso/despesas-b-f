import { EventEmitter } from 'events'
import { generateId } from '../utils/id'
import { versionManager } from './VersionManager'
import { conflictResolver } from './ConflictResolver'

export interface SyncEvent {
  id: string
  type: 'create' | 'update' | 'delete' | 'sync_request' | 'sync_response'
  entityType: string
  entityId: string
  data?: any
  version?: number
  timestamp: Date
  userId: string
  householdId: string
  checksum?: string
  metadata?: Record<string, any>
}

export interface SyncState {
  isConnected: boolean
  lastSyncTime: Date | null
  pendingEvents: SyncEvent[]
  failedEvents: SyncEvent[]
  syncInProgress: boolean
  connectionAttempts: number
  maxRetries: number
}

export interface RealtimeSyncConfig {
  websocketUrl?: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
  syncBatchSize: number
  conflictResolution: 'auto' | 'manual'
}

export class RealtimeSync extends EventEmitter {
  private config: RealtimeSyncConfig
  private state: SyncState
  private websocket: WebSocket | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private syncQueue: SyncEvent[] = []
  private eventHandlers: Map<string, Function[]> = new Map()

  constructor(config: Partial<RealtimeSyncConfig> = {}) {
    super()
    
    this.config = {
      websocketUrl: 'ws://localhost:8080/sync',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      syncBatchSize: 50,
      conflictResolution: 'auto',
      ...config
    }

    this.state = {
      isConnected: false,
      lastSyncTime: null,
      pendingEvents: [],
      failedEvents: [],
      syncInProgress: false,
      connectionAttempts: 0,
      maxRetries: this.config.maxReconnectAttempts
    }

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    // Handle different types of sync events
    this.on('sync_event', this.handleSyncEvent.bind(this))
    this.on('conflict_detected', this.handleConflict.bind(this))
    this.on('connection_lost', this.handleConnectionLost.bind(this))
    this.on('connection_restored', this.handleConnectionRestored.bind(this))
  }

  async connect(userId: string, householdId: string): Promise<void> {
    if (this.state.isConnected) {
      return
    }

    try {
      // In a real implementation, this would connect to a WebSocket server
      // For now, we'll simulate the connection
      await this.simulateConnection(userId, householdId)
      
      this.state.isConnected = true
      this.state.connectionAttempts = 0
      this.startHeartbeat()
      
      this.emit('connected', { userId, householdId })
      
      // Process any pending events
      await this.processPendingEvents()
      
    } catch (error) {
      console.error('Failed to connect to sync server:', error)
      this.scheduleReconnect(userId, householdId)
      throw error
    }
  }

  private async simulateConnection(userId: string, householdId: string): Promise<void> {
    // Simulate WebSocket connection
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          console.log(`Simulated connection established for user ${userId} in household ${householdId}`)
          resolve()
        } else {
          reject(new Error('Simulated connection failure'))
        }
      }, 1000)
    })
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.state.isConnected = false
    this.emit('disconnected')
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.state.isConnected) {
        this.sendHeartbeat()
      }
    }, this.config.heartbeatInterval)
  }

  private sendHeartbeat(): void {
    // In a real implementation, this would send a heartbeat to the server
    console.log('Sending heartbeat...')
  }

  private scheduleReconnect(userId: string, householdId: string): void {
    if (this.state.connectionAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.emit('connection_failed')
      return
    }

    this.state.connectionAttempts++
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnection attempt ${this.state.connectionAttempts}/${this.config.maxReconnectAttempts}`)
      this.connect(userId, householdId).catch(() => {
        // Will automatically schedule another reconnect
      })
    }, this.config.reconnectInterval * this.state.connectionAttempts)
  }

  async sendEvent(event: Omit<SyncEvent, 'id' | 'timestamp'>): Promise<void> {
    const syncEvent: SyncEvent = {
      ...event,
      id: generateId(),
      timestamp: new Date()
    }

    if (this.state.isConnected) {
      try {
        await this.transmitEvent(syncEvent)
        this.emit('event_sent', syncEvent)
      } catch (error) {
        console.error('Failed to send event:', error)
        this.queueEvent(syncEvent)
      }
    } else {
      this.queueEvent(syncEvent)
    }
  }

  private async transmitEvent(event: SyncEvent): Promise<void> {
    // In a real implementation, this would send the event via WebSocket
    // For now, we'll simulate the transmission
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.05) { // 95% success rate
          console.log('Event transmitted:', event.type, event.entityType, event.entityId)
          resolve()
        } else {
          reject(new Error('Simulated transmission failure'))
        }
      }, 100)
    })
  }

  private queueEvent(event: SyncEvent): void {
    this.state.pendingEvents.push(event)
    this.emit('event_queued', event)
  }

  private async processPendingEvents(): Promise<void> {
    if (this.state.syncInProgress || this.state.pendingEvents.length === 0) {
      return
    }

    this.state.syncInProgress = true

    try {
      const batch = this.state.pendingEvents.splice(0, this.config.syncBatchSize)
      
      for (const event of batch) {
        try {
          await this.transmitEvent(event)
          this.emit('event_sent', event)
        } catch (error) {
          console.error('Failed to send queued event:', error)
          this.state.failedEvents.push(event)
        }
      }

      // Continue processing if there are more events
      if (this.state.pendingEvents.length > 0) {
        setTimeout(() => this.processPendingEvents(), 1000)
      }

    } finally {
      this.state.syncInProgress = false
    }
  }

  private async handleSyncEvent(event: SyncEvent): Promise<void> {
    try {
      // Create version for the incoming event
      if (event.data) {
        const version = versionManager.createVersion(
          event.entityType,
          event.entityId,
          event.data,
          event.type as any,
          event.userId
        )

        // Check for conflicts
        const currentVersion = versionManager.getCurrentVersion(event.entityType, event.entityId)
        if (currentVersion && currentVersion.version !== (event.version || 0) - 1) {
          // Potential conflict detected
          const conflict = conflictResolver.detectConflict(
            event.entityType,
            event.entityId,
            currentVersion.data,
            event.data,
            currentVersion.createdAt,
            event.timestamp
          )

          if (conflict) {
            this.emit('conflict_detected', conflict)
            
            if (this.config.conflictResolution === 'auto') {
              const resolvedData = await conflictResolver.resolveConflict(conflict.id)
              if (resolvedData) {
                this.emit('data_updated', {
                  entityType: event.entityType,
                  entityId: event.entityId,
                  data: resolvedData,
                  isConflictResolution: true
                })
              }
            }
            return
          }
        }

        // No conflict, apply the change
        this.emit('data_updated', {
          entityType: event.entityType,
          entityId: event.entityId,
          data: event.data,
          operation: event.type
        })
      }

    } catch (error) {
      console.error('Error handling sync event:', error)
      this.emit('sync_error', { event, error })
    }
  }

  private async handleConflict(conflict: any): Promise<void> {
    console.log('Conflict detected:', conflict)
    this.emit('conflict_requires_resolution', conflict)
  }

  private handleConnectionLost(): void {
    this.state.isConnected = false
    console.log('Connection lost, attempting to reconnect...')
    // Reconnection will be handled by the heartbeat failure
  }

  private handleConnectionRestored(): void {
    console.log('Connection restored')
    this.processPendingEvents()
  }

  // Public API methods
  async syncEntity(entityType: string, entityId: string, data: any, operation: 'create' | 'update' | 'delete', userId: string, householdId: string): Promise<void> {
    await this.sendEvent({
      type: operation,
      entityType,
      entityId,
      data,
      userId,
      householdId,
      version: versionManager.getCurrentVersion(entityType, entityId)?.version || 0
    })
  }

  async requestSync(entityType: string, entityId: string, userId: string, householdId: string): Promise<void> {
    await this.sendEvent({
      type: 'sync_request',
      entityType,
      entityId,
      userId,
      householdId
    })
  }

  getState(): SyncState {
    return { ...this.state }
  }

  getPendingEventsCount(): number {
    return this.state.pendingEvents.length
  }

  getFailedEventsCount(): number {
    return this.state.failedEvents.length
  }

  retryFailedEvents(): void {
    this.state.pendingEvents.push(...this.state.failedEvents)
    this.state.failedEvents = []
    this.processPendingEvents()
  }

  clearFailedEvents(): void {
    this.state.failedEvents = []
  }

  // Event subscription helpers
  onDataUpdated(callback: (data: any) => void): void {
    this.on('data_updated', callback)
  }

  onConflictDetected(callback: (conflict: any) => void): void {
    this.on('conflict_requires_resolution', callback)
  }

  onConnectionStatusChanged(callback: (isConnected: boolean) => void): void {
    this.on('connected', () => callback(true))
    this.on('disconnected', () => callback(false))
  }

  onSyncError(callback: (error: any) => void): void {
    this.on('sync_error', callback)
  }
}

// Singleton instance
export const realtimeSync = new RealtimeSync()

