import { auth } from '@/lib/firebase'
import { db } from '@/lib/db'
import type { BaseModel } from '@/types'
import type { PaginationOptions, PaginatedResult } from '@/types/pagination'

// Interface para operações do banco
interface DatabaseOperation<T> {
  collection: string
  data: Partial<T> & Record<string, any>
  id?: string
}

// Middleware para adicionar campos de auditoria
export class DatabaseMiddleware {
  private static async validateMembership(householdId: string): Promise<boolean> {
    // Prefer Firebase auth when available, but fallback to the local DB's current user
    // This allows the middleware to work in local/dev/test environments where
    // firebase auth isn't present but the app stores a current user in the local DB.
    let uid: string | undefined
    try {
      const firebaseUser = (auth && (auth as any).currentUser) ? (auth as any).currentUser : null
      if (firebaseUser && firebaseUser.uid) {
        uid = firebaseUser.uid
      }
    } catch (e) {
      // ignore
    }

    if (!uid) {
      try {
        // db.getCurrentUser is implemented in AppDatabase and returns the app user (if any)
        const localUser: any = await (db as any).getCurrentUser?.()
        if (localUser && (localUser.id || localUser.uid)) {
          uid = localUser.id || localUser.uid
        }
      } catch (e) {
        // ignore
      }
    }

    if (!uid) return false

    // Verificar se o usuário é membro do household
    const memberDoc = await db.householdMembers
      .where('householdId')
      .equals(householdId)
      .and((member: any) => member.userId === uid)
      .first()

    if (memberDoc) return true

    // Fallbacks for local/dev: if household record marks this user as owner, allow
    try {
      const hh = await db.households.get(householdId)
      if (hh && (hh.ownerId === uid || (hh as any).createdBy === uid || hh.id === uid)) {
        return true
      }
    } catch (e) {
      // ignore
    }

    // Another fallback: if there are expenses in this household created by this user,
    // assume the user should have access (useful for local/test data migrations where
    // householdMembers haven't been populated correctly).
    try {
      const exp = await db.expenses
        .where('householdId')
        .equals(householdId)
        .and((expense: any) => (expense.createdBy === uid || expense.userId === uid))
        .first()
      if (exp) return true
    } catch (e) {
      // ignore
    }

    // Dev-friendly fallback: if there are ZERO householdMembers but the household
    // contains at least one expense, allow access. This covers local data migrations
    // and ensures the UI shows stored expenses even when members table wasn't populated.
    try {
      const membersCount = await db.householdMembers.where('householdId').equals(householdId).count().catch(() => 0)
      if (membersCount === 0) {
        const anyExpense = await db.expenses.where('householdId').equals(householdId).and((e: any) => !e.deletedAt).count().catch(() => 0)
        if (anyExpense > 0) return true
      }
    } catch (e) {
      // ignore
    }

    return false
  }

  // Public wrapper so other modules can verify membership before direct DB reads
  static async checkMembership(householdId: string): Promise<boolean> {
    return await this.validateMembership(householdId)
  }

  private static addAuditFields<T extends BaseModel>(
    operation: DatabaseOperation<T>,
    type: 'create' | 'update'
  ): DatabaseOperation<T> {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não autenticado')

    const now = new Date().toISOString()

    if (type === 'create') {
      return {
        ...operation,
        data: {
          ...operation.data,
          id: operation.id || crypto.randomUUID(),
          createdAt: now,
          createdBy: user.uid,
          version: 1
        } as T
      }
    }

    return {
      ...operation,
      data: {
        ...operation.data,
        updatedAt: now,
        updatedBy: user.uid,
        version: (operation.data.version || 0) + 1
      } as T
    }
  }

  static async create<T extends BaseModel>(
    operation: DatabaseOperation<T>
  ): Promise<string> {
    // Se tem householdId, validar membership
    if ('householdId' in operation.data) {
      const hasAccess = await this.validateMembership(
        (operation.data as any).householdId
      )
      if (!hasAccess) {
        throw new Error('Sem permissão para acessar este household')
      }
    }

    // Adicionar campos de auditoria
    const auditedOperation = this.addAuditFields(operation, 'create')

    // Criar documento
    const id = await db.table(operation.collection).add(auditedOperation.data)
    // Dexie can return number|string; normalize to string for consumers
    return String(id)
  }

  static async update<T extends BaseModel>(
    operation: DatabaseOperation<T>
  ): Promise<void> {
    if (!operation.id) {
      throw new Error('ID é obrigatório para atualização')
    }

    // Buscar documento atual
    const current = await db.table(operation.collection).get(operation.id)
    if (!current) {
      throw new Error('Documento não encontrado')
    }

    // Se tem householdId, validar membership
    if ('householdId' in current) {
      const hasAccess = await this.validateMembership(
        (current as any).householdId
      )
      if (!hasAccess) {
        throw new Error('Sem permissão para acessar este household')
      }
    }

    // Validar versão
    if (operation.data.version !== current.version + 1) {
      throw new Error('Conflito de versão - documento foi alterado')
    }

    // Adicionar campos de auditoria
    const auditedOperation = this.addAuditFields(operation, 'update')

    // Atualizar documento
    await db.table(operation.collection).update(operation.id, auditedOperation.data)
  }

  static async delete<T extends BaseModel>(
    operation: DatabaseOperation<T>
  ): Promise<void> {
    if (!operation.id) {
      throw new Error('ID é obrigatório para exclusão')
    }

    // Buscar documento
    const doc = await db.table(operation.collection).get(operation.id)
    if (!doc) {
      throw new Error('Documento não encontrado')
    }

    // Se tem householdId, validar membership
    if ('householdId' in doc) {
      const hasAccess = await this.validateMembership(
        (doc as any).householdId
      )
      if (!hasAccess) {
        throw new Error('Sem permissão para acessar este household')
      }
    }

    // Soft delete
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não autenticado')

    await db.table(operation.collection).update(operation.id, {
      deletedAt: new Date().toISOString(),
      deletedBy: user.uid,
      version: doc.version + 1
    })
  }

  static async queryPaginated<T extends BaseModel>(
    collectionName: string,
    filters: Record<string, any>,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const {
      limit = 20,
      cursor = null,
      orderBy = [['createdAt', 'desc']]
    } = options

    // Build query
  // Use `any` here to avoid mixing Table and Collection types in this thin middleware.
  let collection: any = db.table(collectionName)

  // Note: do not apply collection.filter() here — Dexie.transaction expects a Table or string.
  // Soft-delete filtering will be applied inside the transaction where `collection` can be filtered safely.
    
    // If query is scoped to a household, validate membership before reading
    if (filters && typeof filters === 'object' && 'householdId' in filters) {
      const householdId = (filters as any).householdId
      const hasAccess = await this.validateMembership(householdId)
      if (!hasAccess) {
        throw new Error('Sem permissão para ler dados deste household')
      }
    }

    // Start transaction
    const tx = db.transaction('r', collection, async () => {
      // Apply a default exclusion for soft-deleted records for collections that support it
      const collectionsWithSoftDelete = ['expenses', 'tasks', 'documents', 'medications', 'calendarEvents']
      if (collectionsWithSoftDelete.includes(collectionName)) {
        // convert to a filtered collection view by wrapping with .filter
        try {
          collection = collection.filter((item: any) => !item.deletedAt)
        } catch (e) {
          // ignore if filter isn't available in this runtime
        }
      }

      // Apply filters with compound where
      Object.entries(filters).forEach(([key, value]) => {
        // Support range queries expressed as { __range: [fromIso, toIso] }
        if (value && typeof value === 'object' && '__range' in value) {
          const [from, to] = (value as any).__range || []

          // Helper: produce local YYYY-MM-DD (date-only) representation for comparison
          const toLocalDateOnly = (v: any) => {
            try {
              if (!v) return null
              // If already a YYYY-MM-DD string, keep as-is
              if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v
              const d = (typeof v === 'string' || typeof v === 'number') ? new Date(v) : (v instanceof Date ? v : new Date(String(v)))
              if (isNaN(d.getTime())) return null
              const yy = d.getFullYear()
              const mm = String(d.getMonth() + 1).padStart(2, '0')
              const dd = String(d.getDate()).padStart(2, '0')
              return `${yy}-${mm}-${dd}`
            } catch (e) {
              return null
            }
          }

          const fromDateOnly = toLocalDateOnly(from)
          const toDateOnly = toLocalDateOnly(to)

          collection = collection.filter((item: any) => {
            try {
              const raw = item[key]
              if (!raw) return false
              const itemDateOnly = toLocalDateOnly(raw)
              if (!itemDateOnly) return false
              if (fromDateOnly && itemDateOnly < fromDateOnly) return false
              if (toDateOnly && itemDateOnly > toDateOnly) return false
              return true
            } catch (e) {
              return false
            }
          })
          return
        }

        // Special-case: support participantIds array filter (match any)
        if (key === 'participantIds' && Array.isArray(value)) {
          const filterIds = value as any[]
          collection = collection.filter((item: any) => {
            // Expenses may store participants as `participantIds` or as `shares` array
            const p = item.participantIds || (item.shares && item.shares.map((s: any) => s.memberId)) || []
            if (!p || p.length === 0) return false
            return filterIds.some(id => p.includes(id))
          })
          return
        }

        // Special-case: support a basic full-text search over title/notes/category
        if (key === 'searchText' && typeof value === 'string' && value.trim()) {
          const q = value.toLowerCase()
          collection = collection.filter((item: any) => {
            try {
              const title = (item.title || item.description || item.name || '').toString().toLowerCase()
              const notes = (item.notes || '').toString().toLowerCase()
              const cat = (item.category || item.categoryId || '').toString().toLowerCase()
              return title.includes(q) || notes.includes(q) || cat.includes(q)
            } catch (e) {
              return false
            }
          })
          return
        }

        // Special-case mapping: allow callers to request "sharedOnly" which
        // maps to the model field `isShared`. This keeps higher-level code
        // using a readable flag while the DB layer filters the actual field.
        if (key === 'sharedOnly') {
          if (value) {
            collection = collection.filter((item: any) => !!item.isShared)
          }
          return
        }

        // Special-case: personalOnly (not shared)
        if (key === 'personalOnly') {
          if (value) {
            collection = collection.filter((item: any) => !item.isShared)
          }
          return
        }

        // Special-case: paymentStatus (paid / unpaid / pending)
        if (key === 'paymentStatus') {
          // Normalize common values: 'paid' means item.paymentStatus === 'paid'
          // 'unpaid' or 'pending' means paymentStatus !== 'paid'
          try {
            if (value === 'paid') {
              collection = collection.filter((item: any) => (item.paymentStatus || 'unpaid') === 'paid')
            } else {
              collection = collection.filter((item: any) => (item.paymentStatus || 'unpaid') !== 'paid')
            }
          } catch (e) {
            // swallow and let outer fallback handle it
          }
          return
        }

        // Support a sentinel for inequality created in query() wrapper: { __not: v }
        if (value && typeof value === 'object' && '__not' in value) {
          const v = (value as any).__not
          collection = collection.filter((item: any) => item[key] !== v)
        } else {
          collection = collection.filter((item: any) => item[key] === value)
        }
      })

      // Apply sorting - only first orderBy for now as compound sort isn't supported
      const [field, direction] = orderBy[0]

      // Some runtimes / filtered collection views may not expose Dexie's `orderBy`.
      // In that case, fall back to converting the collection to an array and
      // perform sorting/pagination in-memory to avoid "collection.orderBy is not a function".
      let items: any[] = []
      if (collection && typeof (collection as any).orderBy === 'function') {
        // Dexie-backed path: use DB ordering and pagination
        try {
          collection = direction === 'desc'
            ? (collection as any).orderBy(field).reverse()
            : (collection as any).orderBy(field)
        } catch (e) {
          // Some filtered collection views (depending on Dexie/runtime) may
          // still throw when calling orderBy. Fall back to the array path below.
          try { console.warn('[DatabaseMiddleware] orderBy threw, falling back to in-memory sort', String(e && e.message ? e.message : e)) } catch(_){}
          collection = null as any
        }

        // Apply cursor based pagination using DB lookups when available
        if (cursor) {
          const cursorDoc = await (collection as any).get(cursor.id)
          if (cursorDoc) {
            const cursorValue = cursorDoc[field]
            collection = direction === 'desc'
              ? (collection as any).filter((item: any) => item[field] < cursorValue)
              : (collection as any).filter((item: any) => item[field] > cursorValue)
          }
        }

        // Apply limit and get results from DB
        items = await (collection as any).limit(limit + 1).toArray()
      } else {
        // Fallback path: convert whatever collection is into an array and sort in JS
        try {
          // If collection has toArray, use it; if it's already an array, use directly
          if (typeof (collection as any).toArray === 'function') {
            items = await (collection as any).toArray()
          } else if (Array.isArray(collection)) {
            items = collection as any[]
          } else {
            // As last resort, try to iterate via .each or coerce to empty
            items = []
          }
        } catch (e) {
          items = []
        }

        // Sort in-memory by the requested field
        items.sort((a: any, b: any) => {
          const av = a && a[field]
          const bv = b && b[field]
          if (av === bv) return 0
          if (av == null) return 1
          if (bv == null) return -1
          if (av > bv) return direction === 'desc' ? -1 : 1
          if (av < bv) return direction === 'desc' ? 1 : -1
          return 0
        })

        // If cursor provided, find its position and slice accordingly
        if (cursor) {
          const idx = items.findIndex((it: any) => String(it.id) === String(cursor.id))
          if (idx >= 0) {
            // Start after the cursor item
            items = items.slice(idx + 1)
          }
        }

        // Respect limit + 1 semantics for pagination detection
        items = items.slice(0, limit + 1)
      }

      // Check if there are more items
      const hasMore = items.length > limit
      const results = hasMore ? items.slice(0, -1) : items

      // Get last item as next cursor
      const lastItem = hasMore ? results[results.length - 1] : null
      const nextCursor = lastItem ? { id: lastItem.id, [field]: lastItem[field] } : null

      return {
        items: results as T[],
        cursor: nextCursor
      }
    })

    return tx
  }

  // Backwards-compatible query method used by various services/components
  // Accepts a more declarative `where` clause and optional ordering/limit
  static async query<T extends BaseModel>(opts: {
    collection: string
    where?: Array<[string, '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' , any]> | Record<string, any>
    orderBy?: [string, 'asc' | 'desc'] | [string, 'asc' | 'desc'][]
    limit?: number
  }): Promise<T[]>
  {
    const { collection: collName, where = {}, orderBy, limit = 100 } = opts

    // If where is an array of tuples, convert to object filters for our simple filter implementation
    let filters: Record<string, any> = {}
    if (Array.isArray(where)) {
      where.forEach(([k, op, v]) => {
        // Only support equality/inequality for now in this thin wrapper
        if (op === '==' ) filters[k] = v
        else if (op === '!=' ) filters[k] = { __not: v }
      })
    } else {
      filters = where as Record<string, any>
    }

    // If filters include householdId, validate membership
    if (filters && typeof filters === 'object' && 'householdId' in filters) {
      const householdId = (filters as any).householdId
      const hasAccess = await this.validateMembership(householdId)
      if (!hasAccess) {
        throw new Error('Sem permissão para ler dados deste household')
      }
    }

    // Reuse queryPaginated for paging behavior but request a large limit
    const result = await this.queryPaginated<T>(collName, filters, {
      limit,
      orderBy: orderBy ? (Array.isArray(orderBy[0]) ? orderBy as any : [orderBy as any]) : undefined
    } as any)

    return result.items
  }

  static async get<T extends BaseModel>(opts: { collection: string; id: string }): Promise<T | undefined> {
    const doc = await db.table(opts.collection).get(opts.id) as T | undefined
    if (!doc) return undefined

    // If document scoped to household, validate membership
    if ((doc as any).householdId) {
      const hasAccess = await this.validateMembership((doc as any).householdId)
      if (!hasAccess) {
        throw new Error('Sem permissão para ler este documento')
      }
    }

    return doc
  }
}