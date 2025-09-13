import React, { useState } from 'react'
import { Plus, Search, Filter, FileText, Star, AlertTriangle, Calendar, Download } from 'lucide-react'
import { useDocuments, useDocumentStats, useImportantDocuments, useExpiredDocuments } from '../hooks/useDocuments'
import { Document } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DocumentForm } from '../components/DocumentForm'

export function DocumentsPage() {
  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'important' | 'expired' | 'expiring'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showDocumentForm, setShowDocumentForm] = useState(false)

  // Queries
  const { data: allDocuments = [], isLoading: documentsLoading } = useDocuments()
  const { data: stats } = useDocumentStats()
  const { data: importantDocs = [] } = useImportantDocuments()
  const { data: expiredDocs = [] } = useExpiredDocuments()

  // Filter documents based on active filter
  const getFilteredDocuments = () => {
    switch (activeFilter) {
      case 'important':
        return importantDocs
      case 'expired':
        return expiredDocs
      case 'expiring':
        return allDocuments.filter(doc => {
          if (!doc.expiryDate) return false
          const expiryDate = typeof doc.expiryDate === 'string' ? new Date(doc.expiryDate) : doc.expiryDate
          const now = new Date()
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          return expiryDate >= now && expiryDate <= thirtyDaysFromNow
        })
      default:
        return allDocuments
    }
  }

  const filteredDocuments = getFilteredDocuments().filter(doc =>
    searchText === '' || 
    doc.title.toLowerCase().includes(searchText.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchText.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchText.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
  )

  const filterOptions = [
    { key: 'all', label: 'Todos', count: stats?.total || 0, icon: FileText },
    { key: 'important', label: 'Importantes', count: stats?.important || 0, icon: Star },
    { key: 'expired', label: 'Vencidos', count: stats?.expired || 0, icon: AlertTriangle },
    { key: 'expiring', label: 'Vencendo', count: stats?.expiringSoon || 0, icon: Calendar },
  ]

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('video')) return '🎥'
    if (mimeType.includes('audio')) return '🎵'
    if (mimeType.includes('text')) return '📝'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📈'
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isExpired = (doc: Document) => {
    if (!doc.expiryDate) return false
    const expiryDate = typeof doc.expiryDate === 'string' ? new Date(doc.expiryDate) : doc.expiryDate
    return expiryDate < new Date()
  }

  const isExpiringSoon = (doc: Document) => {
    if (!doc.expiryDate) return false
    const expiryDate = typeof doc.expiryDate === 'string' ? new Date(doc.expiryDate) : doc.expiryDate
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return expiryDate >= now && expiryDate <= thirtyDaysFromNow
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
              
              {/* Stats Summary */}
              {stats && (
                <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                  <span>{stats.total} total</span>
                  <span>{formatFileSize(stats.totalSize)}</span>
                  {stats.expired > 0 && (
                    <span className="text-red-600 font-medium">{stats.expired} vencidos</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </button>
              
              <button 
                onClick={() => setShowDocumentForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Documento
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar with Filters */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
              
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar documentos..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Filter Options */}
              <div className="space-y-1">
                {filterOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.key}
                      onClick={() => setActiveFilter(option.key as any)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${activeFilter === option.key
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-4 w-4 ${
                          option.key === 'expired' ? 'text-red-500' : 
                          option.key === 'important' ? 'text-yellow-500' : 
                          'text-gray-500'
                        }`} />
                        <span>{option.label}</span>
                      </div>
                      <span className={`
                        px-2 py-1 rounded-full text-xs
                        ${activeFilter === option.key
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-200 text-gray-600'
                        }
                      `}>
                        {option.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tamanho total</span>
                    <span className="font-medium">{formatFileSize(stats.totalSize)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Importantes</span>
                    <span className="font-medium text-yellow-600">{stats.important}</span>
                  </div>
                  {stats.expired > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Vencidos</span>
                      <span className="font-medium text-red-600">{stats.expired}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Active Filter Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {filterOptions.find(f => f.key === activeFilter)?.label || 'Todos os Documentos'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredDocuments.length} {filteredDocuments.length === 1 ? 'documento' : 'documentos'}
                {searchText && ` encontrado${filteredDocuments.length === 1 ? '' : 's'} para "${searchText}"`}
              </p>
            </div>

            {/* Documents Grid */}
            {documentsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-32"></div>
                  </div>
                ))}
              </div>
            ) : filteredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`
                      bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer
                      ${isExpired(doc) ? 'border-red-200 bg-red-50' : ''}
                      ${isExpiringSoon(doc) && !isExpired(doc) ? 'border-yellow-200 bg-yellow-50' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getFileIcon(doc.mimeType)}</span>
                        {doc.isImportant && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                        {isExpired(doc) && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        {isExpiringSoon(doc) && !isExpired(doc) && (
                          <Calendar className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>

                    <h3 className="font-medium text-gray-900 mb-1 truncate">
                      {doc.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-2 truncate">
                      {doc.fileName}
                    </p>

                    {doc.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {doc.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {doc.category}
                      </span>
                    </div>

                    {doc.expiryDate && (
                      <div className="mt-2 text-xs">
                        <span className={`
                          ${isExpired(doc) ? 'text-red-600 font-medium' : 
                            isExpiringSoon(doc) ? 'text-yellow-600 font-medium' : 
                            'text-gray-500'}
                        `}>
                          Vence em: {format(
                            typeof doc.expiryDate === 'string' ? new Date(doc.expiryDate) : doc.expiryDate,
                            'dd/MM/yyyy',
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    )}

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {doc.tags.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{doc.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchText ? 'Nenhum documento encontrado' : 'Nenhum documento'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchText 
                    ? 'Tente ajustar os filtros ou termos de busca.'
                    : 'Comece fazendo upload do seu primeiro documento.'
                  }
                </p>
                {!searchText && (
                  <button 
                    onClick={() => setShowDocumentForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Fazer Upload
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Form Modal */}
      <DocumentForm 
        isOpen={showDocumentForm}
        onClose={() => setShowDocumentForm(false)}
      />
    </div>
  )
}

