import { BaseEntity } from '@/types/global'
import { ATTACHMENTS_ENABLED } from '@/config/features'

export interface Document extends BaseEntity {
  title: string
  tags: string[]
  expiryDate?: Date
  description?: string
  category: string
  isImportant?: boolean
  ...(ATTACHMENTS_ENABLED ? {
    fileName: string
    mimeType: string
    fileSize: number
    fileUrl: string
    blobRef: string
  } : {})
}

export interface DocumentFormData {
  title: string
  tags: string[]
  expiryDate?: Date
  description?: string
  category: string
  isImportant?: boolean
  ...(ATTACHMENTS_ENABLED ? {
    file?: File
  } : {})
}

export interface DocumentFilter {
  searchText?: string
  tags?: string[]
  categories?: string[]
  hasExpiryDate?: boolean
  expiringWithinDays?: number
  ...(ATTACHMENTS_ENABLED ? {
    mimeTypes?: string[]
    sizeMin?: number
    sizeMax?: number
  } : {})
}

export interface DocumentGroup {
  category: string
  documents: Document[]
  ...(ATTACHMENTS_ENABLED ? {
    totalSize: number
  } : {})
  count: number
}

export interface DocumentStats {
  totalDocuments: number
  expiringDocuments: number
  byCategory: Record<string, number>
  byTag: Record<string, number>
  ...(ATTACHMENTS_ENABLED ? {
    totalSize: number
    averageSize: number
    byMimeType: Record<string, number>
  } : {})
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
  | 'createdAt'
  | 'expiryDate'
  | 'category'
  | ...(ATTACHMENTS_ENABLED ? ['fileName', 'size'] : [])

export type DocumentSortOrder = 'asc' | 'desc'

export interface DocumentListOptions {
  sortBy: DocumentSortBy
  sortOrder: DocumentSortOrder
  groupBy: 'category' | ...(ATTACHMENTS_ENABLED ? ['mimeType'] : []) | 'tag' | 'none'
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
  tags: string
  expiryDate?: string
  description?: string
  category: string
  ...(ATTACHMENTS_ENABLED ? {
    fileName: string
  } : {})
}

export interface DocumentCategory {
  id: string
  name: string
  icon: string
  color: string
  description?: string
}

