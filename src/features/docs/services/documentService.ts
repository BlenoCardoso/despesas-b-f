import { db } from '@/core/db/database'
import { Document, DocumentFormData, DocumentFilter, DocumentListOptions } from '../types'
import { generateId } from '@/core/utils/id'
import { parseISO } from 'date-fns'

export class DocumentService {
  /**
   * Create a new document
   */
  async createDocument(data: DocumentFormData, householdId: string, userId: string): Promise<Document> {
    const document: Document = {
      id: generateId(),
      householdId,
      userId,
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
      fileUrl: '',
      fileName: '',
      fileSize: 0,
      mimeType: '',
      blobRef: '',
      expiryDate: data.expiryDate,
      isImportant: data.isImportant || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Handle file upload
    if (data.file) {
      const blobRef = generateId()
      await db.storeBlob(blobRef, data.file, data.file.type)
      
      document.fileName = data.file.name
      document.fileSize = data.file.size
      document.mimeType = data.file.type
      document.blobRef = blobRef
      document.fileUrl = `blob:${blobRef}`
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
      updatedAt: new Date(),
      syncVersion: Date.now(),
    }

    // Handle new file upload
    if (data.file) {
      const currentDocument = await db.documents.get(id)
      if (currentDocument?.blobRef) {
        // Delete old file
        await db.deleteBlob(currentDocument.blobRef)
      }

      const blobRef = generateId()
      await db.storeBlob(blobRef, data.file, data.file.type)
      
      updates.fileName = data.file.name
      updates.fileSize = data.file.size
      updates.mimeType = data.file.type
      updates.blobRef = blobRef
      updates.fileUrl = `blob:${blobRef}`
    }

    await db.documents.update(id, updates)
  }

  /**
   * Delete a document (soft delete)
   */
  async deleteDocument(id: string): Promise<void> {
    const document = await db.documents.get(id)
    if (document?.blobRef) {
      await db.deleteBlob(document.blobRef)
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
   * Get all documents for a household
   */
  async getDocuments(householdId: string, options?: DocumentListOptions): Promise<Document[]> {
    let query = db.documents.where({ householdId }).and(doc => !doc.deletedAt)

    // Apply filters
    if (options?.filter) {
      query = this.applyFilters(query, options.filter)
    }

    let documents = await query.toArray()

    // Apply sorting
    if (options?.sortBy) {
      documents = this.sortDocuments(documents, options.sortBy, options.sortOrder || 'desc')
    }

    // Apply pagination
    if (options?.page && options?.pageSize) {
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
      .and(doc => !doc.deletedAt && doc.mimeType.includes(fileType))
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
    totalSize: number
    byCategory: Record<string, number>
    byFileType: Record<string, number>
  }> {
    const allDocuments = await this.getDocuments(householdId)
    const importantDocs = await this.getImportantDocuments(householdId)
    const expiringSoonDocs = await this.getDocumentsExpiringSoon(householdId)
    const expiredDocs = await this.getExpiredDocuments(householdId)

    const totalSize = allDocuments.reduce((sum, doc) => sum + doc.fileSize, 0)
    
    const byCategory: Record<string, number> = {}
    const byFileType: Record<string, number> = {}

    allDocuments.forEach(doc => {
      // Count by category
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1
      
      // Count by file type
      const fileType = doc.mimeType.split('/')[0] || 'unknown'
      byFileType[fileType] = (byFileType[fileType] || 0) + 1
    })

    return {
      total: allDocuments.length,
      important: importantDocs.length,
      expiringSoon: expiringSoonDocs.length,
      expired: expiredDocs.length,
      totalSize,
      byCategory,
      byFileType,
    }
  }

  /**
   * Get document file blob
   */
  async getDocumentBlob(blobRef: string): Promise<Blob | undefined> {
    return await db.getBlob(blobRef)
  }

  /**
   * Download document
   */
  async downloadDocument(id: string): Promise<void> {
    const doc = await this.getDocumentById(id)
    if (!doc || !doc.blobRef) {
      throw new Error('Document not found or no file attached')
    }

    const blob = await this.getDocumentBlob(doc.blobRef)
    if (!blob) {
      throw new Error('File not found')
    }

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = doc.fileName
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
    const originalDocument = await db.documents.get(id)
    if (!originalDocument) {
      throw new Error('Document not found')
    }

    const duplicatedDocument: Document = {
      ...originalDocument,
      id: generateId(),
      title: `${originalDocument.title} (Cópia)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Copy the file blob if it exists
    if (originalDocument.blobRef) {
      const originalBlob = await db.getBlob(originalDocument.blobRef)
      if (originalBlob) {
        const newBlobRef = generateId()
        await db.storeBlob(newBlobRef, originalBlob, originalBlob.type)
        duplicatedDocument.blobRef = newBlobRef
        duplicatedDocument.fileUrl = `blob:${newBlobRef}`
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

  private applyFilters(query: any, filter: DocumentFilter): any {
    return query.and((doc: Document) => {
      // Category filter
      if (filter.categories && filter.categories.length > 0) {
        if (!filter.categories.includes(doc.category)) return false
      }

      // File type filter
      if (filter.fileTypes && filter.fileTypes.length > 0) {
        const fileType = doc.mimeType.split('/')[0]
        if (!filter.fileTypes.includes(fileType)) return false
      }

      // Important filter
      if (filter.isImportant !== undefined) {
        if (filter.isImportant !== doc.isImportant) return false
      }

      // Expiry date filter
      if (filter.expiryDateStart || filter.expiryDateEnd) {
        if (!doc.expiryDate) return false
        
        const expiryDate = typeof doc.expiryDate === 'string' ? parseISO(doc.expiryDate) : doc.expiryDate
        if (filter.expiryDateStart && expiryDate < filter.expiryDateStart) return false
        if (filter.expiryDateEnd && expiryDate > filter.expiryDateEnd) return false
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag => doc.tags.includes(tag))
        if (!hasMatchingTag) return false
      }

      // Text search filter
      if (filter.searchText) {
        const searchText = filter.searchText.toLowerCase()
        const matchesTitle = doc.title.toLowerCase().includes(searchText)
        const matchesDescription = doc.description?.toLowerCase().includes(searchText) || false
        const matchesFileName = doc.fileName.toLowerCase().includes(searchText)
        const matchesTags = doc.tags.some(tag => tag.toLowerCase().includes(searchText))
        if (!matchesTitle && !matchesDescription && !matchesFileName && !matchesTags) return false
      }

      return true
    })
  }

  private sortDocuments(documents: Document[], sortBy: string, sortOrder: 'asc' | 'desc'): Document[] {
    return documents.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'fileSize':
          comparison = a.fileSize - b.fileSize
          break
        case 'expiryDate':
          const expiryA = a.expiryDate ? (typeof a.expiryDate === 'string' ? parseISO(a.expiryDate) : a.expiryDate) : new Date(0)
          const expiryB = b.expiryDate ? (typeof b.expiryDate === 'string' ? parseISO(b.expiryDate) : b.expiryDate) : new Date(0)
          comparison = expiryA.getTime() - expiryB.getTime()
          break
        case 'fileName':
          comparison = a.fileName.localeCompare(b.fileName)
          break
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }
}

// Singleton instance
export const documentService = new DocumentService()

