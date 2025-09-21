import { BaseEntity } from '@/types/global'
import { ATTACHMENTS_ENABLED } from '@/config/features'

export interface Document extends BaseEntity {
  title: string
  tags: string[]
  expiryDate?: Date
  description?: string
  category: string
  isImportant?: boolean
  // Attachment-related fields (optional; only populated when attachments are enabled)
  fileName?: string
  mimeType?: string
  fileSize?: number
  fileUrl?: string
  blobRef?: string
}

export interface DocumentFormData {
  title: string
  tags: string[]
  expiryDate?: Date
  description?: string
  category: string
  isImportant?: boolean
  // Optional attachment when attachments feature is enabled
  file?: File
}

export interface DocumentFilter {
  searchText?: string
  tags?: string[]
  categories?: string[]
  hasExpiryDate?: boolean
  expiringWithinDays?: number
  // Attachment-related filter options
  mimeTypes?: string[]
  sizeMin?: number
  sizeMax?: number
}

export interface DocumentGroup {
  category: string
  documents: Document[]
  count: number
  // Optional total size when attachments are enabled
  totalSize?: number
}

export interface DocumentStats {
  totalDocuments: number
  expiringDocuments: number
  byCategory: Record<string, number>
  byTag: Record<string, number>
  // Attachment-related stats (optional)
  totalSize?: number
  averageSize?: number
  byMimeType?: Record<string, number>
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
  | 'fileName'
  | 'size'

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
  tags: string
  expiryDate?: string
  description?: string
  category: string
  // Optional import metadata for attachments
  fileName?: string
}

export interface DocumentCategory {
  id: string
  name: string
  icon: string
  color: string
  description?: string
}

