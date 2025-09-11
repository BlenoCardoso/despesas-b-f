import React, { useState } from 'react'
import { Plus, Search, Filter, CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react'
import { TaskList } from '../components/TaskList'
import { useTasks, useTaskStats, useOverdueTasks, useTasksDueToday } from '../hooks/useTasks'
import { Task, TaskFilter } from '../types'

export function TasksPage() {
  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue' | 'today'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Queries
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks()
  const { data: stats } = useTaskStats()
  const { data: overdueTasks = [] } = useOverdueTasks()
  const { data: todayTasks = [] } = useTasksDueToday()

  // Filter tasks based on active filter
  const getFilteredTasks = () => {
    switch (activeFilter) {
      case 'pending':
        return allTasks.filter(task => task.status === 'pendente')
      case 'in_progress':
        return allTasks.filter(task => task.status === 'em_progresso')
      case 'completed':
        return allTasks.filter(task => task.status === 'concluida')
      case 'overdue':
        return overdueTasks
      case 'today':
        return todayTasks
      default:
        return allTasks
    }
  }

  const filteredTasks = getFilteredTasks().filter(task =>
    searchText === '' || 
    task.title.toLowerCase().includes(searchText.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchText.toLowerCase()) ||
    task.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
  )

  const filterOptions = [
    { key: 'all', label: 'Todas', count: stats?.total || 0, icon: Calendar },
    { key: 'pending', label: 'Pendentes', count: stats?.pending || 0, icon: Clock },
    { key: 'in_progress', label: 'Em Progresso', count: stats?.inProgress || 0, icon: Clock },
    { key: 'completed', label: 'Concluídas', count: stats?.completed || 0, icon: CheckCircle2 },
    { key: 'overdue', label: 'Atrasadas', count: stats?.overdue || 0, icon: AlertTriangle },
    { key: 'today', label: 'Hoje', count: stats?.dueToday || 0, icon: Calendar },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
              
              {/* Stats Summary */}
              {stats && (
                <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                  <span>{stats.total} total</span>
                  <span className="text-yellow-600">{stats.pending} pendentes</span>
                  {stats.overdue > 0 && (
                    <span className="text-red-600 font-medium">{stats.overdue} atrasadas</span>
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
              
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
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
                    placeholder="Buscar tarefas..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          option.key === 'overdue' ? 'text-red-500' : 
                          option.key === 'completed' ? 'text-green-500' : 
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
                    <span className="text-sm text-gray-600">Total de tarefas</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Concluídas</span>
                    <span className="font-medium text-green-600">{stats.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Em progresso</span>
                    <span className="font-medium text-blue-600">{stats.inProgress}</span>
                  </div>
                  {stats.overdue > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Atrasadas</span>
                      <span className="font-medium text-red-600">{stats.overdue}</span>
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
                {filterOptions.find(f => f.key === activeFilter)?.label || 'Todas as Tarefas'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'tarefa' : 'tarefas'}
                {searchText && ` encontrada${filteredTasks.length === 1 ? '' : 's'} para "${searchText}"`}
              </p>
            </div>

            {/* Tasks List */}
            <TaskList
              tasks={filteredTasks}
              loading={tasksLoading}
              onEdit={(task) => setSelectedTask(task)}
              onView={(task) => setSelectedTask(task)}
              showAssignee={true}
              showDueDate={true}
            />

            {/* Empty State */}
            {!tasksLoading && filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchText ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchText 
                    ? 'Tente ajustar os filtros ou termos de busca.'
                    : 'Comece criando sua primeira tarefa.'
                  }
                </p>
                {!searchText && (
                  <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Tarefa
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

