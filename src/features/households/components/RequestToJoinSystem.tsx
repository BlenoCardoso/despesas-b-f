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
import { toast } from 'sonner'
import { 
  UserPlus, 
  Copy, 
  RefreshCw, 
  Users, 
  Shield,
  Clock
} from 'lucide-react'
import { householdService } from '../services/householdService'
import { authService } from '@/services/authService'

export function RequestToJoinSystem() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [requestCode, setRequestCode] = useState<string>()
  const [householdName, setHouseholdName] = useState('')
  const [requestedRole, setRequestedRole] = useState<'member' | 'admin'>('member')
  const [message, setMessage] = useState('')

  // Gerar código de solicitação
  const generateJoinRequest = async () => {
    try {
      setIsLoading(true)

      const user = authService.getCurrentUser()
      if (!user) throw new Error('Usuário não autenticado')

      if (!householdName.trim()) {
        toast.error('Nome da casa é obrigatório')
        return
      }

      // Criar solicitação de entrada
      const request = await householdService.createJoinRequest({
        householdName: householdName.trim(),
        requestedRole,
        message: message.trim(),
        requesterUid: user.id,
        requesterName: user.name || user.email || 'Usuário',
        requesterEmail: user.email || ''
      })

      setRequestCode(request.code)
      toast.success('Código de solicitação gerado!')

    } catch (error: any) {
      console.error('Erro ao gerar solicitação:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Copiar código
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Código copiado!')
    } catch (error) {
      toast.error('Erro ao copiar')
    }
  }

  const resetForm = () => {
    setRequestCode(undefined)
    setHouseholdName('')
    setRequestedRole('member')
    setMessage('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Solicitar Entrada
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Solicitar Entrada em Casa
          </DialogTitle>
          <DialogDescription>
            Gere um código para solicitar entrada em uma casa existente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!requestCode ? (
            <>
              {/* Formulário de solicitação */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="householdName">Nome da Casa</Label>
                  <Input
                    id="householdName"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    placeholder="Ex: Casa da Família Silva"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nome da casa que você quer entrar
                  </p>
                </div>

                <div>
                  <Label htmlFor="requestedRole">Tipo de acesso solicitado</Label>
                  <Select 
                    value={requestedRole} 
                    onValueChange={(value: 'member' | 'admin') => setRequestedRole(value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Membro
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Administrador
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Mensagem (opcional)</Label>
                  <Input
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Por que você quer entrar nesta casa?"
                    className="mt-1"
                  />
                </div>

                {requestedRole === 'admin' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Solicitações para administrador requerem aprovação especial dos proprietários.
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={generateJoinRequest}
                disabled={isLoading || !householdName.trim()}
                className="w-full"
              >
                {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Gerar Código de Solicitação
              </Button>
            </>
          ) : (
            <>
              {/* Código gerado */}
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">Código Gerado!</h3>
                  <div className="bg-white border border-green-300 rounded p-3 mb-3">
                    <code className="text-2xl font-mono font-bold text-green-800">
                      {requestCode}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(requestCode)}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Código
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-left">
                  <h4 className="font-medium text-blue-900 mb-2">Como usar:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Envie este código para um administrador da casa</li>
                    <li>Eles vão usar o código para aprovar sua entrada</li>
                    <li>Você receberá uma notificação quando for aprovado</li>
                  </ol>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Código válido por 7 dias</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={resetForm}
                className="w-full"
              >
                Gerar Nova Solicitação
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}