// Hook para busca e filtros avançados
import { useState, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface ExpenseFilter {
  text?: string
  category?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  amountRange?: {
    min: number
    max: number
  }
  tags?: string[]
  location?: {
    lat: number
    lng: number
    radius: number // em metros
  }
  hasAttachments?: boolean
  isRecurring?: boolean
}

export interface SearchHistory {
  id: string
  query: string
  filters: ExpenseFilter
  timestamp: Date
  resultCount: number
}

export interface ExpenseWithMetadata {
  id: string
  description: string
  amount: number
  category: string
  date: Date
  location?: {
    lat: number
    lng: number
    address: string
  }
  tags: string[]
  attachments: any[]
  isRecurring: boolean
  recurringId?: string
  metadata: {
    searchScore?: number
    highlightedText?: string
    matchedFields: string[]
  }
}

export function useAdvancedSearch() {
  const [expenses] = useLocalStorage<ExpenseWithMetadata[]>('expenses-data', [])
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistory[]>('search-history', [])
  
  const [currentFilter, setCurrentFilter] = useState<ExpenseFilter>({})
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ExpenseWithMetadata[]>([])
  const [searchStats, setSearchStats] = useState({
    totalResults: 0,
    avgAmount: 0,
    categoryBreakdown: {} as Record<string, number>,
    dateRange: { earliest: null as Date | null, latest: null as Date | null }
  })

  // Busca por texto com score de relevância
  const searchByText = useCallback((query: string, items: ExpenseWithMetadata[]): ExpenseWithMetadata[] => {
    if (!query.trim()) return items

    const searchTerms = query.toLowerCase().split(/\s+/)
    
    return items
      .map(item => {
        let score = 0
        const matchedFields: string[] = []
        let highlightedText = item.description

        // Busca na descrição (peso 3)
        const descriptionLower = item.description.toLowerCase()
        const descriptionMatches = searchTerms.filter(term => descriptionLower.includes(term))
        if (descriptionMatches.length > 0) {
          score += descriptionMatches.length * 3
          matchedFields.push('description')
          
          // Highlight matches
          searchTerms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi')
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
          })
        }

        // Busca na categoria (peso 2)
        const categoryLower = item.category.toLowerCase()
        if (searchTerms.some(term => categoryLower.includes(term))) {
          score += 2
          matchedFields.push('category')
        }

        // Busca nas tags (peso 2)
        const tagMatches = item.tags.filter(tag => 
          searchTerms.some(term => tag.toLowerCase().includes(term))
        )
        if (tagMatches.length > 0) {
          score += tagMatches.length * 2
          matchedFields.push('tags')
        }

        // Busca no endereço (peso 1)
        if (item.location?.address) {
          const addressLower = item.location.address.toLowerCase()
          if (searchTerms.some(term => addressLower.includes(term))) {
            score += 1
            matchedFields.push('location')
          }
        }

        // Busca por valor exato
        const numericQuery = parseFloat(query.replace(',', '.'))
        if (!isNaN(numericQuery) && Math.abs(item.amount - numericQuery) < 0.01) {
          score += 5
          matchedFields.push('amount')
        }

        return {
          ...item,
          metadata: {
            ...item.metadata,
            searchScore: score,
            highlightedText,
            matchedFields
          }
        }
      })
      .filter(item => item.metadata.searchScore! > 0)
      .sort((a, b) => (b.metadata.searchScore! || 0) - (a.metadata.searchScore! || 0))
  }, [])

  // Filtrar por categoria
  const filterByCategory = useCallback((categories: string[], items: ExpenseWithMetadata[]): ExpenseWithMetadata[] => {
    if (!categories.length) return items
    return items.filter(item => categories.includes(item.category))
  }, [])

  // Filtrar por período
  const filterByDateRange = useCallback((dateRange: { start: Date; end: Date }, items: ExpenseWithMetadata[]): ExpenseWithMetadata[] => {
    return items.filter(item => {
      const itemDate = new Date(item.date)
      return itemDate >= dateRange.start && itemDate <= dateRange.end
    })
  }, [])

  // Filtrar por valor
  const filterByAmountRange = useCallback((amountRange: { min: number; max: number }, items: ExpenseWithMetadata[]): ExpenseWithMetadata[] => {
    return items.filter(item => 
      item.amount >= amountRange.min && item.amount <= amountRange.max
    )
  }, [])

  // Filtrar por localização
  const filterByLocation = useCallback((location: { lat: number; lng: number; radius: number }, items: ExpenseWithMetadata[]): ExpenseWithMetadata[] => {
    return items.filter(item => {
      if (!item.location) return false
      
      const distance = calculateDistance(
        location.lat, location.lng,
        item.location.lat, item.location.lng
      )
      
      return distance <= location.radius
    })
  }, [])

  // Calcular distância entre dois pontos (em metros)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3 // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }, [])

  // Busca principal com todos os filtros
  const search = useCallback(async (filters: ExpenseFilter): Promise<ExpenseWithMetadata[]> => {
    setIsSearching(true)
    setCurrentFilter(filters)

    try {
      let results = [...expenses]

      // Aplicar filtros sequencialmente
      if (filters.text) {
        results = searchByText(filters.text, results)
      }

      if (filters.category?.length) {
        results = filterByCategory(filters.category, results)
      }

      if (filters.dateRange) {
        results = filterByDateRange(filters.dateRange, results)
      }

      if (filters.amountRange) {
        results = filterByAmountRange(filters.amountRange, results)
      }

      if (filters.location) {
        results = filterByLocation(filters.location, results)
      }

      if (filters.hasAttachments !== undefined) {
        results = results.filter(item => 
          filters.hasAttachments ? item.attachments.length > 0 : item.attachments.length === 0
        )
      }

      if (filters.isRecurring !== undefined) {
        results = results.filter(item => item.isRecurring === filters.isRecurring)
      }

      if (filters.tags?.length) {
        results = results.filter(item =>
          filters.tags!.some(tag => item.tags.includes(tag))
        )
      }

      // Calcular estatísticas
      const stats = {
        totalResults: results.length,
        avgAmount: results.length > 0 ? results.reduce((sum, item) => sum + item.amount, 0) / results.length : 0,
        categoryBreakdown: results.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        dateRange: {
          earliest: results.length > 0 ? new Date(Math.min(...results.map(r => r.date.getTime()))) : null,
          latest: results.length > 0 ? new Date(Math.max(...results.map(r => r.date.getTime()))) : null
        }
      }

      setSearchResults(results)
      setSearchStats(stats)

      // Salvar no histórico se houver texto de busca
      if (filters.text && filters.text.trim()) {
        const historyEntry: SearchHistory = {
          id: `search-${Date.now()}`,
          query: filters.text,
          filters,
          timestamp: new Date(),
          resultCount: results.length
        }

        setSearchHistory(prev => [historyEntry, ...prev.slice(0, 19)]) // Manter últimas 20 buscas
      }

      return results
    } finally {
      setIsSearching(false)
    }
  }, [expenses, searchByText, filterByCategory, filterByDateRange, filterByAmountRange, filterByLocation])

  // Busca rápida (apenas texto)
  const quickSearch = useCallback(async (query: string): Promise<ExpenseWithMetadata[]> => {
    return search({ text: query })
  }, [search])

  // Sugestões de busca baseadas no histórico
  const getSearchSuggestions = useCallback((partial: string): string[] => {
    if (!partial.trim()) return []

    const suggestions = new Set<string>()

    // Histórico de buscas
    searchHistory
      .filter(entry => entry.query.toLowerCase().includes(partial.toLowerCase()))
      .slice(0, 5)
      .forEach(entry => suggestions.add(entry.query))

    // Descrições similares
    expenses
      .filter(expense => expense.description.toLowerCase().includes(partial.toLowerCase()))
      .slice(0, 5)
      .forEach(expense => suggestions.add(expense.description))

    // Categorias
    const categories = [...new Set(expenses.map(e => e.category))]
    categories
      .filter(cat => cat.toLowerCase().includes(partial.toLowerCase()))
      .forEach(cat => suggestions.add(cat))

    return Array.from(suggestions).slice(0, 8)
  }, [searchHistory, expenses])

  // Filtros salvos (favoritos)
  const [savedFilters, setSavedFilters] = useLocalStorage<{
    id: string
    name: string
    filters: ExpenseFilter
    createdAt: Date
  }[]>('saved-filters', [])

  const saveFilter = useCallback((name: string, filters: ExpenseFilter) => {
    const savedFilter = {
      id: `filter-${Date.now()}`,
      name,
      filters,
      createdAt: new Date()
    }

    setSavedFilters(prev => [savedFilter, ...prev])
    return savedFilter
  }, [setSavedFilters])

  const loadFilter = useCallback(async (filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId)
    if (filter) {
      return search(filter.filters)
    }
    return []
  }, [savedFilters, search])

  // Limpar resultados
  const clearSearch = useCallback(() => {
    setSearchResults([])
    setCurrentFilter({})
    setSearchStats({
      totalResults: 0,
      avgAmount: 0,
      categoryBreakdown: {},
      dateRange: { earliest: null, latest: null }
    })
  }, [])

  // Busca por voz (Web Speech API)
  const voiceSearch = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Busca por voz não suportada neste navegador'))
        return
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.lang = 'pt-BR'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        resolve(transcript)
      }

      recognition.onerror = (event: any) => {
        reject(new Error(`Erro na busca por voz: ${event.error}`))
      }

      recognition.start()
    })
  }, [])

  return {
    // Estado
    searchResults,
    searchStats,
    currentFilter,
    isSearching,
    searchHistory,
    savedFilters,

    // Ações principais
    search,
    quickSearch,
    clearSearch,
    
    // Sugestões e histórico
    getSearchSuggestions,
    
    // Filtros salvos
    saveFilter,
    loadFilter,
    
    // Busca por voz
    voiceSearch,

    // Utilitários
    calculateDistance
  }
}