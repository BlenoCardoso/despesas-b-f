import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  User, 
  Calendar,
  MoreVertical,
  Play,
  Trash2,
  Edit,
  Copy
} from 'lucide-react'
import { Task } from '../types'
import { useCompleteTask, useStartTask, useDeleteTask, useDuplicateTask } from '../hooks/useTasks'

interface TaskListProps {
  tasks: Task[]
  loading?: boolean
  onEdit?: (task: Task) => void
  onView?: (task: Task) => void
  showAssignee?: boolean
  showDueDate?: boolean
  compact?: boolean
}

export function TaskList({ 
  tasks, 
  loading = false, 
  onEdit, 
  onView,
  showAssignee = true,
  showDueDate = true,
  compact = false
}: TaskListProps) {
  const completeTaskMutation = useCompleteTask()
  const startTaskMutation = useStartTask()
  const deleteTaskMutation = useDeleteTask()
  const duplicateTaskMutation = useDuplicateTask()

  const handleToggleComplete = async (task: Task) => {
    if (task.status === 'concluida') return
    
    try {
      await completeTaskMutation.mutateAsync(task.id)
    } catch (error) {
      console.error('Erro ao completar tarefa:', error)
    }
  }

  const handleStartTask = async (task: Task) => {
    if (task.status !== 'pendente') return
    
    try {
      await startTaskMutation.mutateAsync(task.id)
    } catch (error) {
      console.error('Erro ao iniciar tarefa:', error)
    }
  }

  const handleDeleteTask = async (task: Task) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return
    
    try {
      await deleteTaskMutation.mutateAsync(task.id)
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
    }
  }

  const handleDuplicateTask = async (task: Task) => {
    try {
      await duplicateTaskMutation.mutateAsync(task.id)
    } catch (error) {
      console.error('Erro ao duplicar tarefa:', error)
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'concluida':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'em_progresso':
        return <Play className="h-5 w-5 text-blue-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'concluida') return false
    const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate
    return dueDate < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-16"></div>
          </div>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma tarefa encontrada</p>
      </div>
    )
  }

  return (
    <div className={`space-y-${compact ? '2' : '3'}`}>
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`
            bg-white rounded-lg border border-gray-200 p-${compact ? '3' : '4'} 
            hover:shadow-md transition-shadow cursor-pointer
            ${task.status === 'concluida' ? 'opacity-75' : ''}
            ${isOverdue(task) ? 'border-red-200 bg-red-50' : ''}
          `}
          onClick={() => onView?.(task)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Status Icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleComplete(task)
                }}
                className="mt-1 hover:scale-110 transition-transform"
                disabled={completeTaskMutation.isPending}
              >
                {getStatusIcon(task.status)}
              </button>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className={`
                    font-medium text-gray-900 truncate
                    ${task.status === 'concluida' ? 'line-through text-gray-500' : ''}
                  `}>
                    {task.title}
                  </h3>
                  
                  {/* Priority Badge */}
                  <span className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${getPriorityColor(task.priority)}
                  `}>
                    {task.priority === 'high' ? 'Alta' : 
                     task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>

                  {/* Overdue Warning */}
                  {isOverdue(task) && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                {/* Description */}
                {task.description && !compact && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {task.description}
                  </p>
                )}

                {/* Meta Information */}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {/* Due Date */}
                  {showDueDate && task.dueDate && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span className={isOverdue(task) ? 'text-red-600 font-medium' : ''}>
                        {format(
                          typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate,
                          'dd/MM/yyyy',
                          { locale: ptBR }
                        )}
                      </span>
                    </div>
                  )}

                  {/* Assignee */}
                  {showAssignee && task.assignedTo && (
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>Atribuída</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <span className="capitalize">
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Tags */}
                {task.tags && task.tags.length > 0 && !compact && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <div className="flex items-center space-x-1">
              {/* Quick Actions */}
              {task.status === 'pendente' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartTask(task)
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Iniciar tarefa"
                  disabled={startTaskMutation.isPending}
                >
                  <Play className="h-4 w-4" />
                </button>
              )}

              {/* More Actions */}
              <div className="relative group">
                <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
                
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit?.(task)
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicateTask(task)
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      disabled={duplicateTaskMutation.isPending}
                    >
                      <Copy className="h-4 w-4" />
                      <span>Duplicar</span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTask(task)
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      disabled={deleteTaskMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

