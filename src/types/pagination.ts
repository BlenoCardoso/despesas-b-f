export interface Cursor {
  id: string
  [key: string]: any
}

export interface PaginatedResult<T> {
  items: T[]
  cursor: Cursor | null
}

export interface PaginationOptions {
  limit?: number
  cursor?: Cursor | null
  orderBy?: [string, 'asc' | 'desc'][]
}