// Re-export the canonical AppDatabase instance from core/db/database.ts
// This ensures every module imports the same DB surface (tables and helpers)
// and avoids duplicated/incompatible lightweight shims.
import { db as coreDb } from '@/core/db/database'

export const db = coreDb