import React, { useState } from 'react'
import { Plus, Search, Filter, Pill, AlertTriangle, Clock, CheckCircle2, Package } from 'lucide-react'
import { 
  useMedications, 
  useMedicationStats, 
  useActiveMedications, 
  useLowStockMedications,
  useTodaysIntakes,
  useOverdueIntakes,
  useRecordIntake,
  useSkipIntake,
  useRecordDirectIntake,
  useStopMedication,
  useDeleteMedication
} from '../hooks/useMedications'
import { Medication, MedicationIntake } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MedicationForm } from '../components/MedicationForm'
import { MedicationDetails } from '../components/MedicationDetails'
import { StockSummary } from '../components/StockSummary'
import { NextDoseCard } from '../components/NextDoseCard'

export function MedicationsPage() {
  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'low_stock' | 'expiring'>('all')
  const [showFilters, setShowFilters] = useState(true)
  const [activeTab, setActiveTab] = useState<'medications' | 'intakes'>('medications')
  const [showMedicationForm, setShowMedicationForm] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [showMedicationDetails, setShowMedicationDetails] = useState(false)
  const [showInactiveMedications, setShowInactiveMedications] = useState(false)

  // Queries
  const { data: allMedications = [], isLoading: medicationsLoading } = useMedications()
  const { data: stats } = useMedicationStats()
  const { data: activeMedications = [] } = useActiveMedications()
  const { data: lowStockMeds = [] } = useLowStockMedications()
  const { data: todaysIntakes = [] } = useTodaysIntakes()
  const { data: overdueIntakes = [] } = useOverdueIntakes()

  // Mutations
  const recordIntakeMutation = useRecordIntake()
  const skipIntakeMutation = useSkipIntake()
  const recordDirectIntakeMutation = useRecordDirectIntake()
  const stopMedicationMutation = useStopMedication()
  const deleteMedicationMutation = useDeleteMedication()

  // Filter medications based on active filter
  const getFilteredMedications = () => {
    switch (activeFilter) {
      case 'active':
        return activeMedications
      case 'low_stock':
        return lowStockMeds
      case 'expiring':
        return allMedications.filter(med => {
          if (!med.endDate) return false
          const endDate = typeof med.endDate === 'string' ? new Date(med.endDate) : med.endDate
          const now = new Date()
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          return endDate >= now && endDate <= thirtyDaysFromNow
        })
      default:
        return allMedications
    }
  }

  const filteredMedications = getFilteredMedications()
    .filter(med => showInactiveMedications || med.isActive)
    .filter(med =>
      searchText === '' || 
      med.name.toLowerCase().includes(searchText.toLowerCase()) ||
    med.description?.toLowerCase().includes(searchText.toLowerCase()) ||
    med.prescribedBy?.toLowerCase().includes(searchText.toLowerCase())
  )

  const filterOptions = [
    { key: 'all', label: 'Todos', count: stats?.total || 0, icon: Pill },
    { key: 'active', label: 'Ativos', count: stats?.active || 0, icon: CheckCircle2 },
    { key: 'low_stock', label: 'Estoque Baixo', count: stats?.lowStock || 0, icon: AlertTriangle },
    { key: 'expiring', label: 'Vencendo', count: stats?.expiringSoon || 0, icon: Clock },
  ]

  const handleRecordIntake = async (intake: MedicationIntake & { medication: Medication }) => {
    try {
      await recordIntakeMutation.mutateAsync({
        intakeId: intake.id!,
        actualDateTime: new Date(),
        dosageTaken: intake.dosageTaken,
      })
    } catch (error) {
      console.error('Erro ao registrar tomada:', error)
    }
  }

  const handleSkipIntake = async (intake: MedicationIntake & { medication: Medication }, reason?: string) => {
    try {
      await skipIntakeMutation.mutateAsync({
        intakeId: intake.id!,
        reason,
      })
    } catch (error) {
      console.error('Erro ao pular tomada:', error)
    }
  }

  const getStockStatusColor = (medication: Medication) => {
    if (medication.stockQuantity <= 0) return 'text-red-600 bg-red-50'
    if (medication.stockQuantity <= medication.lowStockThreshold) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getIntakeStatusColor = (status: MedicationIntake['status']) => {
    switch (status) {
      case 'taken': return 'text-green-600 bg-green-50'
      case 'skipped': return 'text-gray-600 bg-gray-50'
      case 'pending': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const isOverdue = (intake: MedicationIntake & { medication: Medication }) => {
    const now = new Date()
    const plannedTime = new Date(intake.dateTimePlanned)
    return plannedTime < now && intake.status === 'pending'
  }

  const handleOpenMedication = (medication: Medication) => {
    setSelectedMedication(medication)
    setShowMedicationDetails(true)
  }

  const handleRecordNewIntake = async (medicationId: string, dosage: number, time?: Date, notes?: string) => {
    try {
      const medicationBefore = selectedMedication
      
      await recordDirectIntakeMutation.mutateAsync({
        medicationId,
        dosageTaken: dosage,
        actualDateTime: time,
        notes
      })

      // Calculate new stock after intake
      const newStock = Math.max(0, (medicationBefore?.stockQuantity || 0) - dosage)
      const stockStatus = newStock === 0 ? 'SEM ESTOQUE!' : 
                         newStock <= (medicationBefore?.lowStockThreshold || 5) ? 'ESTOQUE BAIXO!' : 
                         'Estoque OK'

      alert(`✅ Tomada registrada com sucesso!

📋 Medicamento: ${selectedMedication?.name}
💊 Dosagem tomada: ${dosage} ${selectedMedication?.unit}
🕐 Horário: ${time?.toLocaleString('pt-BR') || new Date().toLocaleString('pt-BR')}
📦 Estoque anterior: ${medicationBefore?.stockQuantity || 0} ${selectedMedication?.unit}
📦 Estoque atual: ${newStock} ${selectedMedication?.unit}
⚠️  Status: ${stockStatus}
${notes ? `📝 Observações: ${notes}` : ''}`)

      // Fechar o modal de detalhes
      setShowMedicationDetails(false)
    } catch (error) {
      console.error('Erro ao registrar tomada:', error)
      alert('❌ Erro ao registrar tomada. Tente novamente.')
    }
  }

  const handleStopMedication = async (medicationId: string, reason?: string) => {
    try {
      await stopMedicationMutation.mutateAsync({ medicationId, reason })
      
      alert(`⏹️ Medicamento parado com sucesso!

📋 Medicamento: ${selectedMedication?.name}
📅 Data: ${new Date().toLocaleDateString('pt-BR')}
${reason ? `📝 Motivo: ${reason}` : ''}

ℹ️ O medicamento foi marcado como inativo e todas as doses futuras foram canceladas.`)

      setShowMedicationDetails(false)
    } catch (error) {
      console.error('Erro ao parar medicamento:', error)
      alert('❌ Erro ao parar medicamento. Tente novamente.')
    }
  }

  const handleDeleteMedication = async (medicationId: string) => {
    try {
      await deleteMedicationMutation.mutateAsync(medicationId)
      
      alert(`🗑️ Medicamento excluído com sucesso!

📋 Medicamento: ${selectedMedication?.name}
📅 Data: ${new Date().toLocaleDateString('pt-BR')}

⚠️ Todos os dados relacionados foram removidos permanentemente.`)

      setShowMedicationDetails(false)
    } catch (error) {
      console.error('Erro ao excluir medicamento:', error)
      alert('❌ Erro ao excluir medicamento. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Remédios</h1>
              
              {/* Stats Summary */}
              {stats && (
                <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                  <span>{stats.total} total</span>
                  <span className="text-green-600">{stats.active} ativos</span>
                  {stats.lowStock > 0 && (
                    <span className="text-red-600 font-medium">{stats.lowStock} estoque baixo</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Tab Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('medications')}
                  className={`
                    flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors
                    ${activeTab === 'medications' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                  `}
                >
                  <Pill className="h-4 w-4 mr-1" />
                  Medicamentos
                </button>
                <button
                  onClick={() => setActiveTab('intakes')}
                  className={`
                    flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors
                    ${activeTab === 'intakes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                  `}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Tomadas
                  {(todaysIntakes.length + overdueIntakes.length) > 0 && (
                    <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                      {todaysIntakes.length + overdueIntakes.length}
                    </span>
                  )}
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                  showFilters 
                    ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
              
              <button 
                onClick={() => setShowMedicationForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Remédio
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'medications' ? (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar with Filters */}
            <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden'}`}>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
                
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar remédios..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Show Inactive Toggle */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Mostrar remédios parados
                  </span>
                  <button
                    onClick={() => setShowInactiveMedications(!showInactiveMedications)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${showInactiveMedications ? 'bg-blue-600' : 'bg-gray-200'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${showInactiveMedications ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
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
                            option.key === 'low_stock' ? 'text-red-500' : 
                            option.key === 'active' ? 'text-green-500' : 
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
                      <span className="text-sm text-gray-600">Ativos</span>
                      <span className="font-medium text-green-600">{stats.active}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Custo total</span>
                      <span className="font-medium">R$ {stats.totalCost.toFixed(2)}</span>
                    </div>
                    {stats.lowStock > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Estoque baixo</span>
                        <span className="font-medium text-red-600">{stats.lowStock}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Main Content - Medications */}
            <div className="flex-1">
              {/* Next Doses */}
              {allMedications && (
                <NextDoseCard 
                  medications={allMedications} 
                  onRecordIntake={handleRecordNewIntake}
                />
              )}
              
              {/* Stock Summary */}
              {allMedications && <StockSummary medications={allMedications} />}
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {filterOptions.find(f => f.key === activeFilter)?.label || 'Todos os Remédios'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredMedications.length} {filteredMedications.length === 1 ? 'remédio' : 'remédios'}
                  {searchText && ` encontrado${filteredMedications.length === 1 ? '' : 's'} para "${searchText}"`}
                </p>
              </div>

              {/* Medications Grid */}
              {medicationsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-lg h-40"></div>
                    </div>
                  ))}
                </div>
              ) : filteredMedications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMedications.map((medication) => (
                    <div
                      key={medication.id}
                      onClick={() => handleOpenMedication(medication)}
                      className={`
                        bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer
                        ${!medication.isActive 
                          ? 'border-gray-200 opacity-75 bg-gray-50' 
                          : 'border-gray-200'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Pill className={`h-5 w-5 ${!medication.isActive ? 'text-gray-400' : 'text-blue-600'}`} />
                          {!medication.isActive && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">
                              Parado
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`
                            text-xs px-2 py-1 rounded-full font-medium
                            ${getStockStatusColor(medication)}
                          `}>
                            {medication.stockQuantity} {medication.unit}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-medium text-gray-900 mb-1">
                        {medication.name}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {medication.dosage} {medication.unit} - {medication.form}
                      </p>

                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Frequência: {
                          medication.frequency === 'daily' ? 'Diário' :
                          medication.frequency === 'weekly' ? 'Semanal' :
                          medication.frequency === 'monthly' ? 'Mensal' :
                          'Conforme necessário'
                        }</div>
                        
                        {medication.prescribedBy && (
                          <div>Prescrito por: {medication.prescribedBy}</div>
                        )}
                        
                        {medication.endDate && (
                          <div>
                            Até: {format(
                              typeof medication.endDate === 'string' ? new Date(medication.endDate) : medication.endDate,
                              'dd/MM/yyyy',
                              { locale: ptBR }
                            )}
                          </div>
                        )}
                      </div>

                      {medication.tags && medication.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {medication.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {medication.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{medication.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchText ? 'Nenhum remédio encontrado' : 'Nenhum remédio'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchText 
                      ? 'Tente ajustar os filtros ou termos de busca.'
                      : 'Comece adicionando seu primeiro remédio.'
                    }
                  </p>
                  {!searchText && (
                    <button 
                      onClick={() => setShowMedicationForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Remédio
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Intakes Tab */
          <div className="space-y-6">
            {/* Overdue Intakes */}
            {overdueIntakes.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Tomadas Atrasadas ({overdueIntakes.length})
                </h3>
                <div className="space-y-3">
                  {overdueIntakes.map((intake) => (
                    <div key={intake.id} className="bg-white rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{intake.medication.name}</h4>
                          <p className="text-sm text-gray-600">
                            {intake.dosageTaken} {intake.medication.unit} - 
                            Previsto para {format(intake.dateTimePlanned, 'HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRecordIntake(intake)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                            disabled={recordIntakeMutation.isPending}
                          >
                            Tomar Agora
                          </button>
                          <button
                            onClick={() => handleSkipIntake(intake, 'Atrasado')}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                            disabled={skipIntakeMutation.isPending}
                          >
                            Pular
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Intakes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Tomadas de Hoje ({todaysIntakes.length})
              </h3>
              
              {todaysIntakes.length > 0 ? (
                <div className="space-y-3">
                  {todaysIntakes.map((intake) => (
                    <div key={intake.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-3 h-3 rounded-full
                          ${intake.status === 'taken' ? 'bg-green-500' :
                            intake.status === 'skipped' ? 'bg-gray-400' :
                            isOverdue(intake) ? 'bg-red-500' : 'bg-blue-500'}
                        `} />
                        <div>
                          <h4 className="font-medium text-gray-900">{intake.medication.name}</h4>
                          <p className="text-sm text-gray-600">
                            {intake.dosageTaken} {intake.medication.unit} - 
                            {format(intake.dateTimePlanned, 'HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`
                          text-xs px-2 py-1 rounded-full font-medium
                          ${getIntakeStatusColor(intake.status)}
                        `}>
                          {intake.status === 'taken' ? 'Tomado' :
                           intake.status === 'skipped' ? 'Pulado' :
                           'Pendente'}
                        </span>
                        
                        {intake.status === 'pending' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleRecordIntake(intake)}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              disabled={recordIntakeMutation.isPending}
                            >
                              Tomar
                            </button>
                            <button
                              onClick={() => handleSkipIntake(intake)}
                              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                              disabled={skipIntakeMutation.isPending}
                            >
                              Pular
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhuma tomada programada para hoje</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Medication Form Modal */}
      <MedicationForm 
        isOpen={showMedicationForm}
        onClose={() => setShowMedicationForm(false)}
      />

      {/* Medication Details Modal */}
      <MedicationDetails
        medication={selectedMedication}
        isOpen={showMedicationDetails}
        onClose={() => {
          setShowMedicationDetails(false)
          setSelectedMedication(null)
        }}
        onRecordIntake={handleRecordNewIntake}
        onStopMedication={handleStopMedication}
        onDeleteMedication={handleDeleteMedication}
      />
    </div>
  )
}

