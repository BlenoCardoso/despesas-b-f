import { useState, useRef, useEffect } from 'react'
import { Search, Clock, X, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  type: 'expense' | 'task' | 'document' | 'medication' | 'calendar'
  href: string
  relevance: number
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    title: 'Compra no supermercado',
    subtitle: 'R$ 150,00 • 12 set 2025',
    type: 'expense',
    href: '/expenses',
    relevance: 0.9
  },
  {
    id: '2',
    title: 'Reunião médica',
    subtitle: 'Calendário • 15 set 2025',
    type: 'calendar',
    href: '/calendar',
    relevance: 0.8
  },
  {
    id: '3',
    title: 'Tomar vitamina D',
    subtitle: 'Medicação • Diário às 08:00',
    type: 'medication',
    href: '/medications',
    relevance: 0.7
  }
]

const recentSearches = [
  'supermercado',
  'vitamina',
  'reunião',
  'relatório'
]

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Busca simulada
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    const searchTimeout = setTimeout(() => {
      const filtered = mockSearchResults.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(query.toLowerCase())
      )
      setResults(filtered)
      setLoading(false)
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const handleResultClick = (result: SearchResult) => {
    navigate(result.href)
    setIsOpen(false)
    setQuery('')
  }

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'expense': return '💳'
      case 'task': return '✅'
      case 'document': return '📄'
      case 'medication': return '💊'
      case 'calendar': return '📅'
      default: return '📋'
    }
  }

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'expense': return 'text-green-600 bg-green-50'
      case 'task': return 'text-blue-600 bg-blue-50'
      case 'document': return 'text-purple-600 bg-purple-50'
      case 'medication': return 'text-red-600 bg-red-50'
      case 'calendar': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <>
      {/* Search Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors w-64 justify-between"
      >
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4" />
          <span>Buscar...</span>
        </div>
        <kbd className="hidden sm:inline text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto">
              {/* Search Input */}
              <div className="flex items-center border-b border-gray-200 p-4">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar despesas, tarefas, medicamentos..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 text-lg placeholder-gray-400 border-0 focus:ring-0 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {!loading && query.length >= 2 && results.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">🔍</div>
                    <p className="text-gray-500">Nenhum resultado encontrado</p>
                  </div>
                )}

                {!loading && results.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Resultados
                      </h3>
                    </div>
                    {results.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${getTypeColor(result.type)}`}>
                          {getTypeIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Recent Searches */}
                {query.length < 2 && (
                  <div className="py-2">
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Buscas Recentes
                      </h3>
                    </div>
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(search)}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{search}</span>
                      </button>
                    ))}
                    
                    <div className="px-4 py-2 mt-4">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Sugestões
                      </h3>
                    </div>
                    <div className="px-4 pb-4">
                      <div className="flex flex-wrap gap-2">
                        {['gastos do mês', 'medicamentos vencidos', 'tarefas pendentes'].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setQuery(suggestion)}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}