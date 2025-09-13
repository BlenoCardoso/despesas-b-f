import { BaseEntity } from '@/types/global'

export interface Document extends BaseEntity {
  title: string
  fileName: string
  mimeType: string
  fileSize: number // Consistente com documentService
  fileUrl: string
  blobRef: string // referência para IndexedDB
  tags: string[]
  expiryDate?: Date
  description?: string
  category: string
  isImportant?: boolean
}

export interface DocumentFormData {
  title: string
  file?: File
  tags: string[]
  expiryDate?: Date
  description?: string
  category: string
  isImportant?: boolean
}

export interface DocumentFilter {
  searchText?: string
  mimeTypes?: string[]
  tags?: string[]
  categories?: string[]
  hasExpiryDate?: boolean
  expiringWithinDays?: number
  sizeMin?: number
  sizeMax?: number
}

export interface DocumentGroup {
  category: string
  documents: Document[]
  totalSize: number
  count: number
}

export interface DocumentStats {
  totalDocuments: number
  totalSize: number
  averageSize: number
  expiringDocuments: number
  byCategory: Record<string, number>
  byMimeType: Record<string, number>
  byTag: Record<string, number>
}

export interface DocumentExpiryAlert {
  id: string
  documentId: string
  documentTitle: string
  expiryDate: Date
  daysUntilExpiry: number
  severity: 'warning' | 'critical' | 'expired'
}

export interface DocumentNotification {
  id: string
  documentId: string
  type: 'expiry_warning' | 'expiry_critical' | 'expired'
  title: string
  message: string
  scheduledFor: Date
  delivered: boolean
  actions: Array<{
    action: 'view' | 'renew' | 'dismiss'
    title: string
  }>
}

export type DocumentSortBy = 
  | 'title'
  | 'fileName'
  | 'size'
  | 'createdAt'
  | 'expiryDate'
  | 'category'

export type DocumentSortOrder = 'asc' | 'desc'

export interface DocumentListOptions {
  sortBy: DocumentSortBy
  sortOrder: DocumentSortOrder
  groupBy: 'category' | 'mimeType' | 'tag' | 'none'
  filter: DocumentFilter
  page: number
  pageSize: number
}

export interface DocumentExportData extends Document {
  householdName: string
  userName: string
  daysUntilExpiry?: number
}

export interface DocumentImportData {
  title: string
  fileName: string
  tags: string
  expiryDate?: string
  description?: string
  category: string
}

export interface DocumentPreview {
  id: string
  type: 'image' | 'pdf' | 'text' | 'unsupported'
  content?: string // para texto
  imageUrl?: string // para imagem/PDF
  pages?: number // para PDF
}

export interface DocumentCategory {
  id: string
  name: string
  icon: string
  color: string
  description?: string
}

