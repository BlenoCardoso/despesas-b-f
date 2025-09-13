import React, { useState, useCallback, useEffect } from 'react'
import { 
  Search, Filter, X, Calendar, DollarSign, 
  MapPin, Tag, Mic, History, Star, Save,
  TrendingUp, BarChart3, Clock, Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { useAdvancedSearch, ExpenseFilter } from '../../../hooks/useAdvancedSearch'
import { useTouchGestures } from '../../../hooks/useTouchGestures'

interface AdvancedSearchProps {
  onResultsChange?: (results: any[]) => void
  className?: string
}

export function AdvancedSearch({ onResultsChange, className }: AdvancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [activeFilters, setActiveFilters] = useState<ExpenseFilter>({})

  const {
    search,
    quickSearch,
    searchResults,
    searchStats,
    isSearching,
    getSearchSuggestions,
    searchHistory,
    voiceSearch,
    saveFilter,
    savedFilters
  } = useAdvancedSearch()

  // Touch gestures para mobile
  const { touchHandlers } = useTouchGestures({
    onSwipe: (gesture) => {
      if (gesture.direction === 'down' && showFilters) {
        setShowFilters(false)
      } else if (gesture.direction === 'up' && !showFilters) {
        setShowFilters(true)
      }
    }
  })

  // Sugestões baseadas na digitação
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (searchQuery.length > 1) {
      const newSuggestions = getSearchSuggestions(searchQuery)
      setSuggestions(newSuggestions)
      setShowSuggestions(newSuggestions.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery, getSearchSuggestions])

  // Busca ao digitar (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Notificar mudanças nos resultados
  useEffect(() => {
    if (onResultsChange) {
      onResultsChange(searchResults)
    }
  }, [searchResults, onResultsChange])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() && Object.keys(activeFilters).length === 0) {
      return
    }

    const filters: ExpenseFilter = {
      ...activeFilters,
      text: searchQuery.trim() || undefined
    }

    await search(filters)
    setShowSuggestions(false)
  }, [searchQuery, activeFilters, search])

  const handleVoiceSearch = useCallback(async () => {
    setIsVoiceRecording(true)
    try {
      const transcript = await voiceSearch()
      setSearchQuery(transcript)
      setIsVoiceRecording(false)
      // A busca será disparada automaticamente pelo useEffect
    } catch (error) {
      console.error('Erro na busca por voz:', error)
      setIsVoiceRecording(false)
    }
  }, [voiceSearch])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
  }, [])

  const handleFilterChange = useCallback((filterKey: keyof ExpenseFilter, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }))
  }, [])

  const removeFilter = useCallback((filterKey: keyof ExpenseFilter) => {
    setActiveFilters(prev => {
      const updated = { ...prev }
      delete updated[filterKey]
      return updated
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setActiveFilters({})
    setSearchQuery('')
  }, [])

  const handleSaveFilter = useCallback(() => {
    const name = prompt('Nome para este filtro:')
    if (name && (searchQuery || Object.keys(activeFilters).length > 0)) {
      saveFilter(name, {
        ...activeFilters,
        text: searchQuery || undefined
      })
    }
  }, [searchQuery, activeFilters, saveFilter])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getActiveFiltersCount = () => {
    return Object.keys(activeFilters).filter(key => 
      activeFilters[key as keyof ExpenseFilter] !== undefined && 
      activeFilters[key as keyof ExpenseFilter] !== null
    ).length
  }

  return (
    <div className={`w-full space-y-4 ${className}`} {...touchHandlers}>
      {/* Barra de Busca Principal */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar despesas..."
              className="pl-10 pr-12"
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleVoiceSearch}
            disabled={isVoiceRecording}
            className="p-2"
          >
            <Mic className={`h-4 w-4 ${isVoiceRecording ? 'animate-pulse text-red-500' : ''}`} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 relative"
          >
            <Filter className="h-4 w-4" />
            {getActiveFiltersCount() > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
              >
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
        </div>

        {/* Sugestões */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
            <CardContent className="p-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm flex items-center space-x-2"
                >
                  <History className="h-3 w-3 text-gray-400" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filtros Avançados */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Filtros Avançados</span>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={handleSaveFilter}>
                  <Save className="h-3 w-3 mr-1" />
                  Salvar
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros Salvos */}
            {savedFilters.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  Filtros Salvos
                </label>
                <div className="flex flex-wrap gap-2">
                  {savedFilters.slice(0, 5).map((saved) => (
                    <Button
                      key={saved.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveFilters(saved.filters)
                        setSearchQuery(saved.filters.text || '')
                      }}
                      className="text-xs"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {saved.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro de Valor */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Valor Mínimo
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    type="number"
                    step="0.01"
                    value={activeFilters.amountRange?.min || ''}
                    onChange={(e) => handleFilterChange('amountRange', {
                      ...activeFilters.amountRange,
                      min: parseFloat(e.target.value) || 0
                    })}
                    className="pl-7 text-xs"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Valor Máximo
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    type="number"
                    step="0.01"
                    value={activeFilters.amountRange?.max || ''}
                    onChange={(e) => handleFilterChange('amountRange', {
                      ...activeFilters.amountRange,
                      max: parseFloat(e.target.value) || Infinity
                    })}
                    className="pl-7 text-xs"
                    placeholder="∞"
                  />
                </div>
              </div>
            </div>

            {/* Filtro de Data */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Data Início
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    type="date"
                    value={activeFilters.dateRange?.start ? activeFilters.dateRange.start.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...activeFilters.dateRange,
                      start: new Date(e.target.value)
                    })}
                    className="pl-7 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Data Fim
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    type="date"
                    value={activeFilters.dateRange?.end ? activeFilters.dateRange.end.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...activeFilters.dateRange,
                      end: new Date(e.target.value)
                    })}
                    className="pl-7 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeFilters.hasAttachments === true ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('hasAttachments', 
                  activeFilters.hasAttachments === true ? undefined : true
                )}
                className="text-xs"
              >
                <Tag className="h-3 w-3 mr-1" />
                Com Anexos
              </Button>

              <Button
                variant={activeFilters.isRecurring === true ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('isRecurring',
                  activeFilters.isRecurring === true ? undefined : true
                )}
                className="text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                Recorrentes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros Ativos */}
      {(searchQuery || getActiveFiltersCount() > 0) && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="text-xs">
              <Search className="h-3 w-3 mr-1" />
              "{searchQuery}"
              <button 
                onClick={() => setSearchQuery('')}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-2 w-2" />
              </button>
            </Badge>
          )}

          {activeFilters.amountRange && (
            <Badge variant="secondary" className="text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              {formatCurrency(activeFilters.amountRange.min || 0)} - {
                activeFilters.amountRange.max === Infinity 
                  ? '∞' 
                  : formatCurrency(activeFilters.amountRange.max || 0)
              }
              <button 
                onClick={() => removeFilter('amountRange')}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-2 w-2" />
              </button>
            </Badge>
          )}

          {activeFilters.hasAttachments && (
            <Badge variant="secondary" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              Com Anexos
              <button 
                onClick={() => removeFilter('hasAttachments')}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-2 w-2" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Estatísticas dos Resultados */}
      {searchResults.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center mb-1">
                  <BarChart3 className="h-4 w-4 text-blue-500 mr-1" />
                </div>
                <p className="text-lg font-bold">{searchStats.totalResults}</p>
                <p className="text-xs text-gray-600">Resultados</p>
              </div>
              
              <div>
                <div className="flex items-center justify-center mb-1">
                  <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                </div>
                <p className="text-lg font-bold">{formatCurrency(searchStats.avgAmount)}</p>
                <p className="text-xs text-gray-600">Valor Médio</p>
              </div>

              <div>
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                </div>
                <p className="text-lg font-bold">
                  {Object.keys(searchStats.categoryBreakdown).length}
                </p>
                <p className="text-xs text-gray-600">Categorias</p>
              </div>

              <div>
                <div className="flex items-center justify-center mb-1">
                  <Target className="h-4 w-4 text-orange-500 mr-1" />
                </div>
                <p className="text-lg font-bold">
                  {searchStats.dateRange.earliest && searchStats.dateRange.latest
                    ? Math.ceil((searchStats.dateRange.latest.getTime() - searchStats.dateRange.earliest.getTime()) / (1000 * 60 * 60 * 24))
                    : 0}
                </p>
                <p className="text-xs text-gray-600">Dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado de Loading */}
      {isSearching && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Buscando...</span>
        </div>
      )}
    </div>
  )
}