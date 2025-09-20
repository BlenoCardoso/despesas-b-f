import { db } from '@/core/db/database'
import type { Document, DocumentFormData, DocumentFilter, DocumentListOptions, DocumentStats } from '../types'
import { hasAttachment, hasFileFilter, hasFileStats } from '../types/guards'
import { blobStorage } from './blobStorage'
import { generateId } from '@/core/utils/id'
import { parseISO } from 'date-fns'
import { ATTACHMENTS_ENABLED } from '@/config/features'

type DocumentWithAttachment = Document & {
  fileName: string
  mimeType: string
  fileSize: number
  fileUrl: string
  blobRef: string
}

export class DocumentService {
  /**
   * Create a new document
   */
  async createDocument(data: DocumentFormData, householdId: string, userId: string): Promise<Document> {
    const document = {
      id: generateId(),
      householdId,
      userId,
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
      expiryDate: data.expiryDate,
      isImportant: data.isImportant || false,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Document

    // Handle file upload only if attachments are enabled
    if (ATTACHMENTS_ENABLED && 'file' in data && data.file instanceof File) {
      const blobRef = generateId()
      await blobStorage.store(blobRef, data.file)
      
      const fileFields = {
        fileName: data.file.name,
        fileSize: data.file.size,
        mimeType: data.file.type,
        blobRef: blobRef,
        fileUrl: `blob:${blobRef}`
      }

      Object.assign(document, fileFields)
    }

    await db.documents.add(document)
    return document
  }

  /**
   * Update an existing document
   */
  async updateDocument(id: string, data: Partial<DocumentFormData>): Promise<void> {
    const updates: Partial<Document> = {
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags,
      expiryDate: data.expiryDate,
      isImportant: data.isImportant,
      updatedAt: new Date()
    }

    // Handle new file upload only if attachments are enabled
    if (ATTACHMENTS_ENABLED && 'file' in data && data.file instanceof File) {
      const currentDocument = await db.documents.get(id)
      
      // If current document has a blob reference, delete it
      if (currentDocument && 'blobRef' in currentDocument) {
        await blobStorage.delete(currentDocument.blobRef)
      }

      const blobRef = generateId()
      await blobStorage.store(blobRef, data.file)
      
      const fileFields = {
        fileName: data.file.name,
        fileSize: data.file.size,
        mimeType: data.file.type,
        blobRef: blobRef,
        fileUrl: `blob:${blobRef}`
      }

      Object.assign(updates, fileFields)
    }

    await db.documents.update(id, updates)
  }

  /**
   * Delete a document (soft delete)
   */
  async deleteDocument(id: string): Promise<void> {
    const document = await db.documents.get(id) as Document
    if (document && ATTACHMENTS_ENABLED && hasAttachment(document)) {
      await blobStorage.delete(document.blobRef)
    }
    await db.softDeleteDocument(id)
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: string): Promise<Document | undefined> {
    return await db.documents.get(id)
  }

  /**
   * Get all documents for a household with optional filtering, sorting, and pagination
   */
  async getDocuments(householdId: string, options?: DocumentListOptions): Promise<Document[]> {
    let query = db.documents.where({ householdId }).and(doc => !doc.deletedAt)

    // Apply filters if provided
    if (options?.filter) {
      query = query.and(doc => {
        const filter = options.filter!

        // Basic filters
        if (filter.categories?.length && !filter.categories.includes(doc.category)) {
          return false
        }

        if (filter.tags?.length && !doc.tags.some(tag => filter.tags!.includes(tag))) {
          return false
        }

        if (filter.hasExpiryDate !== undefined) {
          const hasExpiry = doc.expiryDate !== undefined
          if (filter.hasExpiryDate !== hasExpiry) return false
        }

        // Text search
        if (filter.searchText) {
          const searchText = filter.searchText.toLowerCase()
          const matchesTitle = doc.title.toLowerCase().includes(searchText)
          const matchesDescription = doc.description?.toLowerCase().includes(searchText) || false
          const matchesTags = doc.tags.some(tag => tag.toLowerCase().includes(searchText))

          // Also search file name if attachments are enabled
          const matchesFileName = ATTACHMENTS_ENABLED && 
            hasAttachment(doc) ? 
            doc.fileName.toLowerCase().includes(searchText) : 
            false

          if (!matchesTitle && !matchesDescription && !matchesTags && !matchesFileName) {
            return false
          }
        }

        // Handle file-specific filters
        if (ATTACHMENTS_ENABLED && hasFileFilter(filter)) {
          // Skip file filters if document has no attachment data
          if (!hasAttachment(doc)) {
            return filter.mimeTypes === undefined &&
                   filter.sizeMin === undefined &&
                   filter.sizeMax === undefined
          }

          if (filter.mimeTypes?.length) {
            const fileType = doc.mimeType.split('/')[0]
            if (!filter.mimeTypes.includes(fileType)) return false
          }

          if (filter.sizeMin !== undefined && doc.fileSize < filter.sizeMin) {
            return false
          }

          if (filter.sizeMax !== undefined && doc.fileSize > filter.sizeMax) {
            return false
          }
        }

        return true
      })
    }

    let documents = await query.toArray()

    // Apply sorting
    if (options?.sortBy) {
      documents.sort((a, b) => {
        let comparison = 0
        const sortOrder = options.sortOrder === 'asc' ? 1 : -1

        switch (options.sortBy) {
          case 'title':
            comparison = a.title.localeCompare(b.title)
            break
          case 'category':
            comparison = a.category.localeCompare(b.category)
            break
          case 'createdAt':
            comparison = a.createdAt.getTime() - b.createdAt.getTime()
            break
          case 'expiryDate':
            const dateA = a.expiryDate?.getTime() || 0
            const dateB = b.expiryDate?.getTime() || 0
            comparison = dateA - dateB
            break
          // File-specific sort options
          case 'fileName':
          case 'size':
            if (ATTACHMENTS_ENABLED && 'fileName' in a && 'fileName' in b) {
              if (options.sortBy === 'fileName') {
                comparison = (a as any).fileName.localeCompare((b as any).fileName)
              } else {
                comparison = (a as any).fileSize - (b as any).fileSize
              }
            }
            break
        }

        return comparison * sortOrder
      })
    }

    // Apply pagination if requested
    if (options?.page !== undefined && options?.pageSize !== undefined) {
      const start = (options.page - 1) * options.pageSize
      const end = start + options.pageSize
      documents = documents.slice(start, end)
    }

    return documents
  }

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(householdId: string, category: string): Promise<Document[]> {
    return await db.documents
      .where({ householdId, category })
      .and(doc => !doc.deletedAt)
      .reverse()
      .sortBy('createdAt')
  }

  /**
   * Get important documents
   */
  async getImportantDocuments(householdId: string): Promise<Document[]> {
    return await db.documents
      .where({ householdId })
      .and(doc => !doc.deletedAt && doc.isImportant)
      .reverse()
      .sortBy('createdAt')
  }

  /**
   * Get documents expiring soon
   */
  async getDocumentsExpiringSoon(householdId: string, days: number = 30): Promise<Document[]> {
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    
    return await db.documents
      .where({ householdId })
      .and(doc => {
        if (doc.deletedAt || !doc.expiryDate) return false
        
        const expiryDate = typeof doc.expiryDate === 'string' ? parseISO(doc.expiryDate) : doc.expiryDate
        return expiryDate >= now && expiryDate <= futureDate
      })
      .reverse()
      .sortBy('expiryDate')
  }

  /**
   * Get expired documents
   */
  async getExpiredDocuments(householdId: string): Promise<Document[]> {
    const now = new Date()
    
    return await db.documents
      .where({ householdId })
      .and(doc => {
        if (doc.deletedAt || !doc.expiryDate) return false
        
        const expiryDate = typeof doc.expiryDate === 'string' ? parseISO(doc.expiryDate) : doc.expiryDate
        return expiryDate < now
      })
      .reverse()
      .sortBy('expiryDate')
  }

  /**
   * Search documents by text
   */
  async searchDocuments(householdId: string, searchText: string): Promise<Document[]> {
    const lowerSearchText = searchText.toLowerCase()
    
    return await db.documents
      .where({ householdId })
      .and(doc => {
        if (doc.deletedAt) return false
        return (
          doc.title.toLowerCase().includes(lowerSearchText) ||
          doc.description?.toLowerCase().includes(lowerSearchText) ||
          doc.fileName.toLowerCase().includes(lowerSearchText) ||
          doc.tags.some(tag => tag.toLowerCase().includes(lowerSearchText)) ||
          false
        )
      })
      .reverse()
      .sortBy('createdAt')
  }

  /**
   * Get documents by file type
   */
  async getDocumentsByFileType(householdId: string, fileType: string): Promise<Document[]> {
    return await db.documents
      .where({ householdId })
      .and(doc => {
        const hasDeletedAt = doc.deletedAt !== undefined && doc.deletedAt !== null
        if (hasDeletedAt || !hasAttachment(doc)) return false
        return doc.mimeType.includes(fileType)
      })
      .reverse()
      .sortBy('createdAt')
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(householdId: string): Promise<{
    total: number
    important: number
    expiringSoon: number
    expired: number
    totalSize?: number
    byCategory: Record<string, number>
    byFileType?: Record<string, number>
  }> {
    const allDocuments = await this.getDocuments(householdId)
    const importantDocs = await this.getImportantDocuments(householdId)
    const expiringSoonDocs = await this.getDocumentsExpiringSoon(householdId)
    const expiredDocs = await this.getExpiredDocuments(householdId)

    const byCategory: Record<string, number> = {}
    const stats = {
      total: allDocuments.length,
      important: importantDocs.length,
      expiringSoon: expiringSoonDocs.length,
      expired: expiredDocs.length,
      byCategory,
    }

    allDocuments.forEach(doc => {
      // Count by category
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1
    })

    // Only include file-related stats if attachments are enabled
    if (ATTACHMENTS_ENABLED) {
      const byFileType: Record<string, number> = {}
      let totalSize = 0

      allDocuments.forEach(doc => {
        if (hasAttachment(doc)) {
          // Count by file type
          const fileType = doc.mimeType.split('/')[0] || 'unknown'
          byFileType[fileType] = (byFileType[fileType] || 0) + 1
          
          // Add to total size
          totalSize += doc.fileSize || 0
        }
      })

      Object.assign(stats, {
        totalSize,
        byFileType
      })
    }

    return stats
  }

  /**
   * Download document
   */
  async downloadDocument(id: string): Promise<void> {
    const doc = await this.getDocumentById(id)
    if (!doc || !('blobRef' in doc)) {
      throw new Error('Document not found or no file attached')
    }

    const blob = await blobStorage.get(doc.blobRef as string)
    if (!blob) {
      throw new Error('File not found')
    }

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = ('fileName' in doc ? doc.fileName : 'document') as string
    link.style.display = 'none'
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Duplicate a document
   */
  async duplicateDocument(id: string): Promise<Document> {
    const originalDocument = await db.documents.get(id) as Document
    if (!originalDocument) {
      throw new Error('Document not found')
    }

    let duplicatedDocument = {
      ...originalDocument,
      id: generateId(),
      title: `${originalDocument.title} (Cópia)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Document

    // Copy the file blob if it exists and attachments are enabled
    if (ATTACHMENTS_ENABLED && 'blobRef' in originalDocument) {
      const originalBlob = await blobStorage.get(originalDocument.blobRef as string)
      if (originalBlob) {
        const newBlobRef = generateId()
        await blobStorage.store(newBlobRef, originalBlob)
        Object.assign(duplicatedDocument, {
          fileName: (originalDocument as any).fileName,
          fileSize: (originalDocument as any).fileSize,
          mimeType: (originalDocument as any).mimeType,
          blobRef: newBlobRef,
          fileUrl: `blob:${newBlobRef}`
        })
      }
    }

    await db.documents.add(duplicatedDocument)
    return duplicatedDocument
  }

  /**
   * Get default document categories
   */
  getDefaultCategories(): string[] {
    return [
      'Identidade',
      'Financeiro',
      'Saúde',
      'Educação',
      'Trabalho',
      'Imóveis',
      'Veículos',
      'Seguros',
      'Impostos',
      'Contratos',
      'Outros',
    ]
  }

  private sortDocumentsByExpiry(documents: Document[], sortOrder: 'asc' | 'desc'): Document[] {
    return documents.sort((a, b) => {
      const expiryA = a.expiryDate ? (typeof a.expiryDate === 'string' ? parseISO(a.expiryDate) : a.expiryDate) : new Date(0)
      const expiryB = b.expiryDate ? (typeof b.expiryDate === 'string' ? parseISO(b.expiryDate) : b.expiryDate) : new Date(0)
      const comparison = expiryA.getTime() - expiryB.getTime()
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  private sortDocumentsByTitle(documents: Document[], sortOrder: 'asc' | 'desc'): Document[] {
    return documents.sort((a, b) => {
      const comparison = a.title.localeCompare(b.title)
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  private sortDocumentsByCategory(documents: Document[], sortOrder: 'asc' | 'desc'): Document[] {
    return documents.sort((a, b) => {
      const comparison = a.category.localeCompare(b.category)
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  private sortDocumentsByDate(documents: Document[], sortOrder: 'asc' | 'desc'): Document[] {
    return documents.sort((a, b) => {
      const comparison = a.createdAt.getTime() - b.createdAt.getTime()
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  private sortDocumentsByFileSize(documents: Document[], sortOrder: 'asc' | 'desc'): Document[] {
    if (!ATTACHMENTS_ENABLED) return documents

    return documents.sort((a, b) => {
      const aSize = hasAttachment(a) ? a.fileSize : 0
      const bSize = hasAttachment(b) ? b.fileSize : 0
      const comparison = aSize - bSize
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  private sortDocumentsByFileName(documents: Document[], sortOrder: 'asc' | 'desc'): Document[] {
    if (!ATTACHMENTS_ENABLED) return documents

    return documents.sort((a, b) => {
      const aName = hasAttachment(a) ? a.fileName : ''
      const bName = hasAttachment(b) ? b.fileName : ''
      const comparison = aName.localeCompare(bName)
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  sortDocuments(documents: Document[], options: DocumentListOptions): Document[] {
    if (!options.sortBy || !options.sortOrder) return documents

    switch (options.sortBy) {
      case 'title':
        return this.sortDocumentsByTitle(documents, options.sortOrder)
      case 'category':
        return this.sortDocumentsByCategory(documents, options.sortOrder)
      case 'expiryDate':
        return this.sortDocumentsByExpiry(documents, options.sortOrder)
      case 'fileName':
        return this.sortDocumentsByFileName(documents, options.sortOrder)
      case 'size':
        return this.sortDocumentsByFileSize(documents, options.sortOrder)
      default:
        return this.sortDocumentsByDate(documents, options.sortOrder)
    }
  }
}

// Singleton instance
export const documentService = new DocumentService()

