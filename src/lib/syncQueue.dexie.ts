import { db } from '@/core/db/database'
import type { SyncAction } from '@/lib/syncQueue'

export async function dexieEnqueueSync(action: Omit<SyncAction, 'id' | 'timestamp' | 'retryCount'>) {
  const item = {
    ...action,
    timestamp: new Date().toISOString(),
    retryCount: 0
  }
  const id = await (db as any).syncQueue.add(item)
  // return item with generated numeric id coerced to string for compatibility
  return { ...item, id: String(id) } as SyncAction
}

export async function dexiePeekQueue(): Promise<SyncAction[]> {
  const items = await (db as any).syncQueue.toArray()
  return items.map((i: any) => ({ ...i, id: String(i.id) }))
}

export async function dexieRemoveFromQueue(ids: string[]) {
  // items in DB have numeric ++id; try to remove by matching stringified ids OR by custom id field
  const numericIds = ids.map(id => {
    const parsed = parseInt(id, 10)
    return isNaN(parsed) ? null : parsed
  }).filter(n => n !== null) as number[]

  if (numericIds.length > 0) {
    await (db as any).syncQueue.bulkDelete(numericIds)
  }

  // Also remove any items whose custom id field matches (if we stored id as string)
  await (db as any).syncQueue.where('id').anyOf(ids).delete()
}

export async function dexieClearQueue() {
  await (db as any).syncQueue.clear()
}

export async function dexieGetQueueLength() {
  return await (db as any).syncQueue.count()
}
