import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentService } from '../services/documentService'
import { useCurrentHousehold, useCurrentUser } from '@/core/store'
import { Document, DocumentFormData, DocumentFilter, DocumentListOptions } from '../types'

// Query keys
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (householdId: string, options?: DocumentListOptions) => 
    [...documentKeys.lists(), householdId, options] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  byCategory: (householdId: string, category: string) => 
    [...documentKeys.all, 'byCategory', householdId, category] as const,
  important: (householdId: string) => 
    [...documentKeys.all, 'important', householdId] as const,
  expiringSoon: (householdId: string, days: number) => 
    [...documentKeys.all, 'expiringSoon', householdId, days] as const,
  expired: (householdId: string) => 
    [...documentKeys.all, 'expired', householdId] as const,
  byFileType: (householdId: string, fileType: string) => 
    [...documentKeys.all, 'byFileType', householdId, fileType] as const,
  stats: (householdId: string) => 
    [...documentKeys.all, 'stats', householdId] as const,
  search: (householdId: string, searchText: string) => 
    [...documentKeys.all, 'search', householdId, searchText] as const,
}

// Documents hooks
export function useDocuments(options?: DocumentListOptions) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: documentKeys.list(currentHousehold?.id || '', options),
    queryFn: () => documentService.getDocuments(currentHousehold?.id || '', options),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentService.getDocumentById(id),
    enabled: !!id,
  })
}

export function useDocumentsByCategory(category: string) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: documentKeys.byCategory(currentHousehold?.id || '', category),
    queryFn: () => documentService.getDocumentsByCategory(currentHousehold?.id || '', category),
    enabled: !!currentHousehold?.id && !!category,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useImportantDocuments() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: documentKeys.important(currentHousehold?.id || ''),
    queryFn: () => documentService.getImportantDocuments(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useDocumentsExpiringSoon(days: number = 30) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: documentKeys.expiringSoon(currentHousehold?.id || '', days),
    queryFn: () => documentService.getDocumentsExpiringSoon(currentHousehold?.id || '', days),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useExpiredDocuments() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: documentKeys.expired(currentHousehold?.id || ''),
    queryFn: () => documentService.getExpiredDocuments(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useDocumentsByFileType(fileType: string) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: documentKeys.byFileType(currentHousehold?.id || '', fileType),
    queryFn: () => documentService.getDocumentsByFileType(currentHousehold?.id || '', fileType),
    enabled: !!currentHousehold?.id && !!fileType,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useDocumentStats() {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: documentKeys.stats(currentHousehold?.id || ''),
    queryFn: () => documentService.getDocumentStats(currentHousehold?.id || ''),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useSearchDocuments(searchText: string) {
  const currentHousehold = useCurrentHousehold()
  
  return useQuery({
    queryKey: documentKeys.search(currentHousehold?.id || '', searchText),
    queryFn: () => documentService.searchDocuments(currentHousehold?.id || '', searchText),
    enabled: !!currentHousehold?.id && searchText.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Document mutations
export function useCreateDocument() {
  const queryClient = useQueryClient()
  const currentHousehold = useCurrentHousehold()
  const currentUser = useCurrentUser()
  
  return useMutation({
    mutationFn: (data: DocumentFormData) => 
      documentService.createDocument(data, currentHousehold?.id || '', currentUser?.id || ''),
    onSuccess: () => {
      // Invalidate and refetch document queries
      queryClient.invalidateQueries({ queryKey: documentKeys.all })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DocumentFormData> }) =>
      documentService.updateDocument(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific document and lists
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => {
      // Invalidate all document queries
      queryClient.invalidateQueries({ queryKey: documentKeys.all })
    },
  })
}

export function useDuplicateDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => documentService.duplicateDocument(id),
    onSuccess: () => {
      // Invalidate document lists
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: (id: string) => documentService.downloadDocument(id),
  })
}

// Utility hooks
export function useDocumentBlob(blobRef: string) {
  return useQuery({
    queryKey: ['document-blob', blobRef],
    queryFn: () => documentService.getDocumentBlob(blobRef),
    enabled: !!blobRef,
    staleTime: Infinity, // Blobs don't change
  })
}

export function useDocumentCategories() {
  return {
    data: documentService.getDefaultCategories(),
    isLoading: false,
    error: null,
  }
}

