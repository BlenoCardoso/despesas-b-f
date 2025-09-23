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
    const user = auth.currentUser
    if (!user) return false

    // Verificar se o usuário é membro do household
    const memberDoc = await db.householdMembers
      .where('householdId')
      .equals(householdId)
      .and((member: any) => member.userId === user.uid)
      .first()

    return !!memberDoc
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
      // Apply filters with compound where
      Object.entries(filters).forEach(([key, value]) => {
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
      collection = direction === 'desc'
        ? collection.orderBy(field).reverse()
        : collection.orderBy(field)

      // Apply cursor based pagination
      if (cursor) {
        const cursorDoc = await collection.get(cursor.id)
        if (cursorDoc) {
          const cursorValue = cursorDoc[field]
          collection = direction === 'desc'
            ? collection.filter((item: any) => item[field] < cursorValue)
            : collection.filter((item: any) => item[field] > cursorValue)
        }
      }

      // Apply limit and get results
      const items = await collection.limit(limit + 1).toArray()

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