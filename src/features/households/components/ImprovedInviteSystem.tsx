import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { householdService } from '../services/householdService'
import { auth } from '@/lib/firebase'
import { 
  Share2, 
  Copy, 
  RefreshCw, 
  Users, 
  Crown, 
  Shield, 
  X,
  Check,
  Eye,
  EyeOff,
  UserPlus
} from 'lucide-react'
import { useCurrentHousehold, useCurrentUser } from '@/core/store'

interface ImprovedInviteSystemProps {
  householdId: string
}

interface InviteData {
  id: string
  code: string
  householdId: string
  inviterUid: string
  maxUses: number
  uses: number
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  createdAt: any
  expiresAt: Date
  requestedRole?: 'member' | 'admin'
  requiresApproval?: boolean
}

export function ImprovedInviteSystem({ householdId }: ImprovedInviteSystemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeInvites, setActiveInvites] = useState<InviteData[]>([])
  const [showCodes, setShowCodes] = useState<{ [key: string]: boolean }>({})
  
  // Form state
  const [inviteType, setInviteType] = useState<'member' | 'admin'>('member')
  const [expiresIn, setExpiresIn] = useState('168') // 7 dias
  const [maxUses, setMaxUses] = useState('1')
  const [requiresApproval, setRequiresApproval] = useState(false)

  const household = useCurrentHousehold()
  const currentUser = useCurrentUser()
  const queryClient = useQueryClient()

  const isOwnerOrAdmin = (() => {
    if (!household || !currentUser) return false
    const isOwner = (household as any).ownerId === currentUser.id
    const memberRole = (household as any).memberRoles?.[currentUser.id]
    return isOwner || memberRole === 'admin'
  })()

  // Carregar convites ativos
  const loadActiveInvites = async () => {
    try {
      const invites = await householdService.listInvites(householdId)
      const activeInvites = invites.filter((invite: any) => 
        invite.status === 'pending' && new Date(invite.expiresAt?.toDate?.() || invite.expiresAt) > new Date()
      )
      setActiveInvites(activeInvites)
    } catch (error) {
      console.error('Erro ao carregar convites:', error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadActiveInvites()
    }
  }, [isOpen, householdId])

  // Gerar novo convite com configurações avançadas
  const generateInvite = async () => {
    try {
      setIsLoading(true)

      const user = auth.currentUser
      if (!user) throw new Error('Usuário não autenticado')

      // Validar permissões para convites de admin
      if (inviteType === 'admin' && !isOwnerOrAdmin) {
        throw new Error('Apenas proprietários ou administradores podem convidar outros administradores')
      }

      // Criar convite com configurações avançadas
      const invite = await householdService.createAdvancedInvite({
        householdId,
        createdBy: user.uid,
        expiresInHours: parseInt(expiresIn),
        maxUses: parseInt(maxUses),
        requestedRole: inviteType,
        requiresApproval: requiresApproval || inviteType === 'admin'
      })

      toast.success('Convite gerado com sucesso!')
      await loadActiveInvites()

    } catch (error: any) {
      const msg = error?.message || String(error)
      console.error('Erro ao gerar convite', error)
      toast.error(`Erro ao gerar convite: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Copiar código
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copiado!')
    } catch (error) {
      toast.error('Erro ao copiar')
    }
  }

  // Revogar convite
  const revokeInvite = async (inviteId: string) => {
    try {
      await householdService.revokeInvite(inviteId)
      toast.success('Convite revogado')
      await loadActiveInvites()
    } catch (error: any) {
      toast.error(`Erro ao revogar convite: ${error.message}`)
    }
  }

  // Toggle visibilidade do código
  const toggleCodeVisibility = (inviteId: string) => {
    setShowCodes(prev => ({
      ...prev,
      [inviteId]: !prev[inviteId]
    }))
  }

  // Gerar QR Code
  const generateQRCode = async (code: string) => {
    const url = `${window.location.origin}/convite/${code}`
    // Implementar QR code generation aqui
    toast.info('QR Code: ' + url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={!isOwnerOrAdmin}
        >
          <UserPlus className="h-4 w-4" />
          Sistema de Convites
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sistema de Convites Avançado
          </DialogTitle>
          <DialogDescription>
            Gerencie convites com controle de roles e aprovação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário de novo convite */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Gerar Novo Convite
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de convite</Label>
                <Select value={inviteType} onValueChange={(value: 'member' | 'admin') => setInviteType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Membro
                      </div>
                    </SelectItem>
                    <SelectItem value="admin" disabled={!isOwnerOrAdmin}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Administrador
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Expira em</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hora</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="72">3 dias</SelectItem>
                    <SelectItem value="168">7 dias</SelectItem>
                    <SelectItem value="720">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Máximo de usos</Label>
                <Select value={maxUses} onValueChange={setMaxUses}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 uso</SelectItem>
                    <SelectItem value="3">3 usos</SelectItem>
                    <SelectItem value="5">5 usos</SelectItem>
                    <SelectItem value="10">10 usos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={requiresApproval || inviteType === 'admin'}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  disabled={inviteType === 'admin'}
                  className="rounded"
                />
                <Label htmlFor="requiresApproval" className="text-sm">
                  Requer aprovação manual
                </Label>
              </div>
            </div>

            <Button
              onClick={generateInvite}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Gerar Convite
            </Button>
          </div>

          {/* Lista de convites ativos */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Convites Ativos ({activeInvites.length})
            </h3>

            {activeInvites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum convite ativo</p>
              </div>
            ) : (
              activeInvites.map((invite) => (
                <div key={invite.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {invite.requestedRole === 'admin' ? (
                        <Shield className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Users className="h-4 w-4 text-green-600" />
                      )}
                      <span className="font-medium">
                        Convite {invite.requestedRole === 'admin' ? 'Admin' : 'Membro'}
                      </span>
                      {invite.requiresApproval && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Requer aprovação
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeInvite(invite.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Usos:</span> {invite.uses}/{invite.maxUses}
                    </div>
                    <div>
                      <span className="text-gray-500">Expira:</span>{' '}
                      {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        value={showCodes[invite.id] ? invite.code : '••••••••'}
                        readOnly
                        className="font-mono"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleCodeVisibility(invite.id)}
                    >
                      {showCodes[invite.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(invite.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => generateQRCode(invite.code)}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500">
                    <strong>Link:</strong> {window.location.origin}/convite/{invite.code}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}