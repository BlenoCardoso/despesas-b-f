import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Home, 
  Users, 
  Shield, 
  Check, 
  X, 
  Clock,
  AlertCircle,
  UserPlus,
  Crown
} from 'lucide-react'
import { householdService } from '@/features/households/services/householdService'
import { auth } from '@/lib/firebase'
import { useCurrentUser } from '@/core/store'

interface InviteInfo {
  id: string
  code: string
  householdId: string
  householdName: string
  inviterName: string
  requestedRole: 'member' | 'admin'
  requiresApproval: boolean
  maxUses: number
  uses: number
  status: string
  expiresAt: Date
  isExpired: boolean
  isValid: boolean
}

export function AcceptInvitePage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar informações do convite
  useEffect(() => {
    if (!code) {
      setError('Código de convite inválido')
      setIsLoading(false)
      return
    }

    loadInviteInfo()
  }, [code])

  const loadInviteInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const info = await householdService.getInviteInfo(code!)
      setInviteInfo(info)
    } catch (error: any) {
      console.error('Erro ao carregar convite:', error)
      setError(error.message || 'Convite não encontrado ou expirado')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvite = async () => {
    if (!code || !currentUser) return

    try {
      setIsAccepting(true)
      
      const result = await householdService.acceptInvite(code, currentUser.id)
      
      if (result.requiresApproval) {
        toast.success(result.message || 'Solicitação enviada para aprovação!')
        navigate('/dashboard', { 
          state: { 
            message: 'Sua solicitação foi enviada aos administradores da casa. Você será notificado quando for aprovada.' 
          }
        })
      } else {
        toast.success('Convite aceito com sucesso!')
        navigate('/dashboard')
      }
    } catch (error: any) {
      console.error('Erro ao aceitar convite:', error)
      toast.error(error.message || 'Erro ao aceitar convite')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleLogin = () => {
    navigate('/login', { 
      state: { redirect: `/convite/${code}` }
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando convite...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Convite Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full"
            >
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Login Necessário</CardTitle>
            <CardDescription>
              Você precisa fazer login para aceitar este convite
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inviteInfo && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">{inviteInfo.householdName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    Convidado por {inviteInfo.inviterName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {inviteInfo.requestedRole === 'admin' ? (
                    <Shield className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Users className="h-4 w-4 text-green-600" />
                  )}
                  <span className="text-sm">
                    Como {inviteInfo.requestedRole === 'admin' ? 'Administrador' : 'Membro'}
                  </span>
                </div>
              </div>
            )}
            <Button onClick={handleLogin} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Home className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Convite para Casa</CardTitle>
          <CardDescription>
            Você foi convidado para participar de uma casa
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {inviteInfo && (
            <>
              {/* Informações da casa */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <Home className="h-5 w-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium">{inviteInfo.householdName}</h3>
                    <p className="text-sm text-gray-600">
                      Convidado por {inviteInfo.inviterName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {inviteInfo.requestedRole === 'admin' ? (
                    <>
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div>
                        <span className="font-medium text-blue-900">Administrador</span>
                        <p className="text-sm text-gray-600">
                          Acesso completo para gerenciar a casa
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Users className="h-5 w-5 text-green-600" />
                      <div>
                        <span className="font-medium text-green-900">Membro</span>
                        <p className="text-sm text-gray-600">
                          Acesso para visualizar e adicionar despesas
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {inviteInfo.requiresApproval && (
                  <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded p-3">
                    <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">
                        Requer Aprovação
                      </p>
                      <p className="text-xs text-yellow-700">
                        Sua solicitação será enviada aos administradores para aprovação
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Informações do convite */}
              <div className="text-sm text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Usos:</span>
                  <span>{inviteInfo.uses}/{inviteInfo.maxUses}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expira em:</span>
                  <span>{inviteInfo.expiresAt.toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Recusar
                </Button>
                <Button
                  onClick={handleAcceptInvite}
                  disabled={isAccepting || !inviteInfo.isValid}
                  className="flex-1"
                >
                  {isAccepting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {inviteInfo.requiresApproval ? 'Solicitar' : 'Aceitar'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}