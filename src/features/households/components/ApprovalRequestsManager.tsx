import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Bell, 
  Check, 
  X, 
  Shield, 
  Users, 
  Clock,
  User
} from 'lucide-react'
import { householdService } from '../services/householdService'
import { useCurrentHousehold, useCurrentUser } from '@/core/store'

interface PendingRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  requestedRole: 'member' | 'admin'
  inviteCode: string
  createdAt: Date
  status: 'pending' | 'approved' | 'rejected'
}

export function ApprovalRequestsManager() {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const household = useCurrentHousehold()
  const currentUser = useCurrentUser()

  const isOwnerOrAdmin = (() => {
    if (!household || !currentUser) return false
    const isOwner = (household as any).ownerId === currentUser.id
    const memberRole = (household as any).memberRoles?.[currentUser.id]
    return isOwner || memberRole === 'admin'
  })()

  // Carregar solicitações pendentes
  const loadPendingRequests = async () => {
    if (!household?.id) return
    
    try {
      setIsLoading(true)
      const requests = await householdService.getPendingJoinRequests(household.id)
      setPendingRequests(requests)
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
      toast.error('Erro ao carregar solicitações')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && household?.id) {
      loadPendingRequests()
    }
  }, [isOpen, household?.id])

  // Aprovar solicitação
  const approveRequest = async (requestId: string, userId: string, requestedRole: string) => {
    if (!household?.id) return

    try {
      await householdService.approveJoinRequest(household.id, requestId, userId, requestedRole)
      toast.success('Solicitação aprovada!')
      await loadPendingRequests()
    } catch (error: any) {
      console.error('Erro ao aprovar:', error)
      toast.error(`Erro ao aprovar: ${error.message}`)
    }
  }

  // Rejeitar solicitação
  const rejectRequest = async (requestId: string) => {
    try {
      await householdService.rejectJoinRequest(requestId)
      toast.success('Solicitação rejeitada')
      await loadPendingRequests()
    } catch (error: any) {
      console.error('Erro ao rejeitar:', error)
      toast.error(`Erro ao rejeitar: ${error.message}`)
    }
  }

  if (!isOwnerOrAdmin) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
        >
          <Bell className="h-4 w-4 mr-2" />
          Aprovações
          {pendingRequests.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {pendingRequests.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Solicitações de Aprovação
          </DialogTitle>
          <DialogDescription>
            Gerencie solicitações para entrar na casa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Carregando...</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma solicitação pendente</p>
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{request.userName}</h4>
                      <Badge
                        variant={request.requestedRole === 'admin' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {request.requestedRole === 'admin' ? (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <Users className="h-3 w-3 mr-1" />
                            Membro
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{request.userEmail}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3" />
                      {request.createdAt.toLocaleDateString('pt-BR')} às{' '}
                      {request.createdAt.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveRequest(request.id, request.userId, request.requestedRole)}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectRequest(request.id)}
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>

                {request.requestedRole === 'admin' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                    <p className="text-xs text-yellow-800">
                      ⚠️ Esta pessoa está solicitando acesso de administrador. 
                      Administradores podem convidar outros administradores e gerenciar todos os dados da casa.
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}