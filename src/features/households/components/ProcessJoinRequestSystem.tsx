import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  User, 
  Search, 
  Users, 
  Shield,
  Check,
  X,
  Clock,
  AlertCircle
} from 'lucide-react'
import { householdService } from '../services/householdService'
import { useCurrentHousehold, useCurrentUser } from '@/core/store'

interface JoinRequestInfo {
  id: string
  code: string
  householdName: string
  requesterName: string
  requesterEmail: string
  requestedRole: 'member' | 'admin'
  message: string
  status: string
  createdAt: Date
  expiresAt: Date
  isExpired: boolean
  isValid: boolean
}

export function ProcessJoinRequestSystem() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [requestCode, setRequestCode] = useState('')
  const [requestInfo, setRequestInfo] = useState<JoinRequestInfo | null>(null)

  const household = useCurrentHousehold()
  const currentUser = useCurrentUser()

  const isOwnerOrAdmin = (() => {
    if (!household || !currentUser) return false
    const isOwner = (household as any).ownerId === currentUser.id
    const memberRole = (household as any).memberRoles?.[currentUser.id]
    return isOwner || memberRole === 'admin'
  })()

  // Buscar informações da solicitação
  const searchRequest = async () => {
    if (!requestCode.trim()) {
      toast.error('Digite um código válido')
      return
    }

    try {
      setIsLoading(true)
      const info = await householdService.getJoinRequestInfo(requestCode.trim().toUpperCase())
      setRequestInfo(info)
    } catch (error: any) {
      console.error('Erro ao buscar solicitação:', error)
      toast.error(error.message || 'Solicitação não encontrada')
      setRequestInfo(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Processar solicitação
  const processRequest = async (action: 'approve' | 'reject') => {
    if (!requestInfo || !household) return

    try {
      setIsProcessing(true)
      
      await householdService.processJoinRequestByCode(
        requestInfo.code, 
        action, 
        action === 'approve' ? household.id : undefined
      )

      toast.success(
        action === 'approve' 
          ? 'Solicitação aprovada! O usuário foi adicionado à casa.'
          : 'Solicitação rejeitada.'
      )

      // Reset form
      setRequestCode('')
      setRequestInfo(null)
      setIsOpen(false)

    } catch (error: any) {
      console.error('Erro ao processar solicitação:', error)
      toast.error(error.message || 'Erro ao processar solicitação')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOwnerOrAdmin) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        setRequestCode('')
        setRequestInfo(null)
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <User className="h-4 w-4 mr-2" />
          Processar Solicitação
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Processar Solicitação de Entrada
          </DialogTitle>
          <DialogDescription>
            Digite o código de solicitação para revisar e aprovar/rejeitar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Busca por código */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="requestCode">Código da Solicitação</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="requestCode"
                  value={requestCode}
                  onChange={(e) => setRequestCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC123"
                  className="flex-1 font-mono"
                  maxLength={6}
                />
                <Button
                  onClick={searchRequest}
                  disabled={isLoading || !requestCode.trim()}
                  size="sm"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Informações da solicitação */}
          {requestInfo && (
            <div className="border rounded-lg p-4 space-y-4">
              {requestInfo.isValid ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Solicitação Encontrada</h3>
                    <Badge 
                      variant={requestInfo.requestedRole === 'admin' ? 'default' : 'secondary'}
                    >
                      {requestInfo.requestedRole === 'admin' ? (
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

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Solicitante:</span> {requestInfo.requesterName}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span> {requestInfo.requesterEmail}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Casa desejada:</span> {requestInfo.householdName}
                    </div>
                    {requestInfo.message && (
                      <div>
                        <span className="font-medium text-gray-700">Mensagem:</span>
                        <p className="text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                          {requestInfo.message}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>
                        Solicitado em {requestInfo.createdAt.toLocaleDateString('pt-BR')} às{' '}
                        {requestInfo.createdAt.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {requestInfo.requestedRole === 'admin' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900">
                            Solicitação de Administrador
                          </p>
                          <p className="text-xs text-yellow-700">
                            Esta pessoa está solicitando acesso de administrador. 
                            Administradores podem gerenciar todos os dados da casa.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => processRequest('approve')}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => processRequest('reject')}
                      disabled={isProcessing}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 font-medium">Solicitação Inválida</p>
                  <p className="text-sm text-red-600">
                    {requestInfo.isExpired ? 'Esta solicitação expirou' : 'Esta solicitação já foi processada'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h4 className="font-medium text-blue-900 mb-2">Como funciona:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Usuário gera código de solicitação</li>
              <li>Envia o código para você</li>
              <li>Você digita o código aqui</li>
              <li>Revisa as informações e aprova/rejeita</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}