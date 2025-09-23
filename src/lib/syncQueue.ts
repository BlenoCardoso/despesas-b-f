// Lightweight sync queue helper used by services to enqueue offline actions.
// This is intentionally simple: stores queue in localStorage under 'app-sync-queue'
// Other parts of the app (useOfflineSync) will read and process these actions.

export type SyncActionType = 'create' | 'update' | 'delete'

export interface SyncAction {
  id: string
  type: SyncActionType
  collection: string
  entityId: string
  householdId?: string
  performedBy?: string
  timestamp: string // ISO
  payload?: any
  retryCount?: number
}

// Try to use Dexie-backed helpers when available. We import lazily to avoid circular deps
let useDexie = false
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { dexiePeekQueue } = require('@/lib/syncQueue.dexie')
  if (typeof dexiePeekQueue === 'function') useDexie = true
} catch (e) {
  useDexie = false
}

// LocalStorage fallback (kept for older installs / migrations)
const STORAGE_KEY = 'app-sync-queue'

function readQueue(): SyncAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SyncAction[]
  } catch (e) {
    console.warn('Failed to read sync queue', e)
    return []
  }
}

function writeQueue(q: SyncAction[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(q))
  } catch (e) {
    console.warn('Failed to write sync queue', e)
  }
}

export async function enqueueSync(action: Omit<SyncAction, 'id' | 'timestamp' | 'retryCount'>) {
  if (useDexie) {
    const { dexieEnqueueSync } = require('@/lib/syncQueue.dexie')
    return await dexieEnqueueSync(action)
  }

  const q = readQueue()
  const item: SyncAction = {
    ...action,
    id: `${action.collection}-${action.entityId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  }
  q.push(item)
  writeQueue(q)
  return item
}

export async function peekQueue(): Promise<SyncAction[]> {
  if (useDexie) {
    const { dexiePeekQueue } = require('@/lib/syncQueue.dexie')
    return await dexiePeekQueue()
  }

  return readQueue()
}

export async function removeFromQueue(ids: string[]) {
  if (useDexie) {
    const { dexieRemoveFromQueue } = require('@/lib/syncQueue.dexie')
    return await dexieRemoveFromQueue(ids)
  }

  const q = readQueue()
  const remaining = q.filter(i => !ids.includes(i.id))
  writeQueue(remaining)
}

export async function clearQueue() {
  if (useDexie) {
    const { dexieClearQueue } = require('@/lib/syncQueue.dexie')
    return await dexieClearQueue()
  }

  writeQueue([])
}

export async function getQueueLength() {
  if (useDexie) {
    const { dexieGetQueueLength } = require('@/lib/syncQueue.dexie')
    return await dexieGetQueueLength()
  }

  return readQueue().length
}
