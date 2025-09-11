import { BaseSyncAdapter, SyncConfig, PresenceInfo } from './SyncAdapter'
import { ChangeSet } from '@/types/global'

/**
 * LocalAdapter - No-op implementation for local-only mode
 * This adapter doesn't perform any actual synchronization,
 * it's used when sync is disabled or for testing purposes.
 */
export class LocalAdapter extends BaseSyncAdapter {
  private connected = false
  
  constructor(config: SyncConfig) {
    super(config)
  }
  
  async connect(householdId: string, userId: string): Promise<void> {
    console.log(`LocalAdapter: Connecting to household ${householdId} as user ${userId}`)
    this.connected = true
    this.config.householdId = householdId
    this.config.userId = userId
  }
  
  async disconnect(): Promise<void> {
    console.log('LocalAdapter: Disconnecting')
    this.connected = false
  }
  
  isConnected(): boolean {
    return this.connected
  }
  
  async push(changeSet: ChangeSet): Promise<void> {
    console.log('LocalAdapter: Push (no-op)', changeSet)
    this.stats.totalPushed++
    // No-op: changes are only stored locally
  }
  
  async pull(since?: Date): Promise<ChangeSet[]> {
    console.log('LocalAdapter: Pull (no-op)', since)
    this.stats.totalPulled++
    // No-op: return empty array as there are no remote changes
    return []
  }
  
  async updatePresence(status: 'online' | 'away' | 'offline'): Promise<void> {
    console.log(`LocalAdapter: Update presence to ${status} (no-op)`)
    // No-op: no presence tracking in local mode
  }
  
  getConnectionStatus() {
    return {
      connected: this.connected,
      lastHeartbeat: this.connected ? new Date() : undefined,
      latency: 0,
    }
  }
}

/**
 * Factory function to create a LocalAdapter instance
 */
export function createLocalAdapter(config: Partial<SyncConfig> = {}): LocalAdapter {
  const defaultConfig: SyncConfig = {
    householdId: '',
    userId: '',
    enableRealtime: false,
    conflictResolution: 'last-write-wins',
    retryAttempts: 0,
    retryDelay: 0,
  }
  
  return new LocalAdapter({ ...defaultConfig, ...config })
}

