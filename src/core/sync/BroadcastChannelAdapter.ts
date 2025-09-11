import { BaseSyncAdapter, SyncConfig, PresenceInfo, EntityType } from './SyncAdapter'
import { ChangeSet } from '@/types/global'

interface BroadcastMessage {
  type: 'change' | 'presence' | 'heartbeat'
  householdId: string
  userId: string
  timestamp: Date
  data?: any
}

interface ChangeMessage extends BroadcastMessage {
  type: 'change'
  data: ChangeSet
}

interface PresenceMessage extends BroadcastMessage {
  type: 'presence'
  data: {
    status: 'online' | 'away' | 'offline'
    userName: string
  }
}

interface HeartbeatMessage extends BroadcastMessage {
  type: 'heartbeat'
  data: {
    userName: string
  }
}

/**
 * BroadcastChannelAdapter - Simulates real-time sync between browser tabs
 * This adapter uses the BroadcastChannel API to communicate between tabs
 * of the same application, providing a simulation of real-time collaboration.
 */
export class BroadcastChannelAdapter extends BaseSyncAdapter {
  private channel: BroadcastChannel | null = null
  private connected = false
  private heartbeatInterval: number | null = null
  private presenceMap = new Map<string, PresenceInfo>()
  private lastHeartbeat?: Date
  
  constructor(config: SyncConfig) {
    super(config)
  }
  
  async connect(householdId: string, userId: string): Promise<void> {
    if (this.connected) {
      await this.disconnect()
    }
    
    console.log(`BroadcastChannelAdapter: Connecting to household ${householdId} as user ${userId}`)
    
    this.config.householdId = householdId
    this.config.userId = userId
    
    // Create broadcast channel for this household
    const channelName = `despesas-sync-${householdId}`
    this.channel = new BroadcastChannel(channelName)
    
    // Set up message listener
    this.channel.addEventListener('message', this.handleMessage.bind(this))
    
    this.connected = true
    this.lastHeartbeat = new Date()
    
    // Start heartbeat to maintain presence
    this.startHeartbeat()
    
    // Announce presence
    await this.updatePresence('online')
  }
  
  async disconnect(): Promise<void> {
    console.log('BroadcastChannelAdapter: Disconnecting')
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    // Announce offline status before disconnecting
    if (this.connected) {
      await this.updatePresence('offline')
    }
    
    if (this.channel) {
      this.channel.close()
      this.channel = null
    }
    
    this.connected = false
    this.presenceMap.clear()
  }
  
  isConnected(): boolean {
    return this.connected
  }
  
  async push(changeSet: ChangeSet): Promise<void> {
    if (!this.connected || !this.channel) {
      throw new Error('Not connected')
    }
    
    console.log('BroadcastChannelAdapter: Broadcasting change', changeSet)
    
    const message: ChangeMessage = {
      type: 'change',
      householdId: this.config.householdId,
      userId: this.config.userId,
      timestamp: new Date(),
      data: changeSet,
    }
    
    this.channel.postMessage(message)
    this.stats.totalPushed++
  }
  
  async pull(since?: Date): Promise<ChangeSet[]> {
    console.log('BroadcastChannelAdapter: Pull (real-time via broadcast)', since)
    this.stats.totalPulled++
    
    // In broadcast channel mode, changes are received in real-time
    // So pull returns empty array as changes are pushed via events
    return []
  }
  
  async updatePresence(status: 'online' | 'away' | 'offline'): Promise<void> {
    if (!this.connected || !this.channel) {
      return
    }
    
    console.log(`BroadcastChannelAdapter: Update presence to ${status}`)
    
    const message: PresenceMessage = {
      type: 'presence',
      householdId: this.config.householdId,
      userId: this.config.userId,
      timestamp: new Date(),
      data: {
        status,
        userName: `User ${this.config.userId}`, // In real app, get from user store
      },
    }
    
    this.channel.postMessage(message)
    
    // Update local presence
    this.updateLocalPresence(this.config.userId, status, `User ${this.config.userId}`)
  }
  
  getConnectionStatus() {
    return {
      connected: this.connected,
      lastHeartbeat: this.lastHeartbeat,
      latency: 0, // Broadcast channel is essentially instant
    }
  }
  
  private handleMessage(event: MessageEvent<BroadcastMessage>) {
    const message = event.data
    
    // Ignore messages from other households or from self
    if (message.householdId !== this.config.householdId || message.userId === this.config.userId) {
      return
    }
    
    console.log('BroadcastChannelAdapter: Received message', message)
    
    switch (message.type) {
      case 'change':
        this.handleChangeMessage(message as ChangeMessage)
        break
      case 'presence':
        this.handlePresenceMessage(message as PresenceMessage)
        break
      case 'heartbeat':
        this.handleHeartbeatMessage(message as HeartbeatMessage)
        break
    }
  }
  
  private handleChangeMessage(message: ChangeMessage) {
    const changeSet = message.data
    
    // Notify subscribers about the change
    this.notifyHandlers(changeSet.entityType as EntityType, changeSet)
    
    this.stats.totalPulled++
  }
  
  private handlePresenceMessage(message: PresenceMessage) {
    const { status, userName } = message.data
    this.updateLocalPresence(message.userId, status, userName)
  }
  
  private handleHeartbeatMessage(message: HeartbeatMessage) {
    const { userName } = message.data
    this.updateLocalPresence(message.userId, 'online', userName)
  }
  
  private updateLocalPresence(userId: string, status: 'online' | 'away' | 'offline', userName: string) {
    if (status === 'offline') {
      this.presenceMap.delete(userId)
    } else {
      this.presenceMap.set(userId, {
        userId,
        userName,
        lastSeen: new Date(),
        isOnline: status === 'online',
      })
    }
    
    // Notify presence callbacks
    const users = Array.from(this.presenceMap.values())
    this.notifyPresence(users)
  }
  
  private startHeartbeat() {
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = window.setInterval(() => {
      if (this.connected && this.channel) {
        const message: HeartbeatMessage = {
          type: 'heartbeat',
          householdId: this.config.householdId,
          userId: this.config.userId,
          timestamp: new Date(),
          data: {
            userName: `User ${this.config.userId}`,
          },
        }
        
        this.channel.postMessage(message)
        this.lastHeartbeat = new Date()
      }
    }, 30000)
  }
}

/**
 * Factory function to create a BroadcastChannelAdapter instance
 */
export function createBroadcastChannelAdapter(config: Partial<SyncConfig> = {}): BroadcastChannelAdapter {
  const defaultConfig: SyncConfig = {
    householdId: '',
    userId: '',
    enableRealtime: true,
    conflictResolution: 'last-write-wins',
    retryAttempts: 3,
    retryDelay: 1000,
  }
  
  return new BroadcastChannelAdapter({ ...defaultConfig, ...config })
}

