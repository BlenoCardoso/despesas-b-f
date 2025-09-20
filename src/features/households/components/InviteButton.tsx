import { useState } from 'react'
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
import { InviteService } from '../services/inviteService'
import { auth } from '@/lib/firebase'
import { Share2, Copy, RefreshCw } from 'lucide-react'

interface InviteButtonProps {
  householdId: string
}

export function InviteButton({ householdId }: InviteButtonProps) {
  // Estado do modal
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState<string>()
  const [inviteLink, setInviteLink] = useState<string>()

  // Opções do convite
  const [expiresIn, setExpiresIn] = useState('168') // 7 dias
  const [maxUses, setMaxUses] = useState('1')

  // Query client para cache
  const queryClient = useQueryClient()

  // Gerar novo convite
  const generateInvite = async () => {
    try {
      setIsLoading(true)

      const user = auth.currentUser
      if (!user) throw new Error('Usuário não autenticado')

      // Criar convite
      const invite = await InviteService.create({
        householdId,
        invitedBy: user.uid,
        expiresIn: parseInt(expiresIn),
        maxUses: parseInt(maxUses)
      })

      // Gerar link
      const link = InviteService.generateInviteLink(invite.code)

      setInviteCode(invite.code)
      setInviteLink(link)

      // Atualizar cache de membros
      queryClient.invalidateQueries({
        queryKey: ['household-members', householdId]
      })

    } catch (error) {
      toast.error('Erro ao gerar convite')
    } finally {
      setIsLoading(false)
    }
  }

  // Copiar código/link
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copiado!')
    } catch (error) {
      toast.error('Erro ao copiar')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Convidar
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar para a casa</DialogTitle>
          <DialogDescription>
            Gere um código de convite para adicionar novos membros.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!inviteCode ? (
            <>
              {/* Opções do convite */}
              <div className="grid gap-2">
                <Label>Expira em</Label>
                <Select
                  value={expiresIn}
                  onValueChange={setExpiresIn}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="72">3 dias</SelectItem>
                    <SelectItem value="168">7 dias</SelectItem>
                    <SelectItem value="720">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Máximo de usos</Label>
                <Select
                  value={maxUses}
                  onValueChange={setMaxUses}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 uso</SelectItem>
                    <SelectItem value="5">5 usos</SelectItem>
                    <SelectItem value="10">10 usos</SelectItem>
                    <SelectItem value="50">50 usos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              {/* Código gerado */}
              <div className="grid gap-2">
                <Label>Código do convite</Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteCode}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(inviteCode)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Link do convite */}
              <div className="grid gap-2">
                <Label>Link do convite</Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => inviteLink && copyToClipboard(inviteLink)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {!inviteCode ? (
            // Botão de gerar
            <Button
              onClick={generateInvite}
              disabled={isLoading}
            >
              {isLoading && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              Gerar Convite
            </Button>
          ) : (
            // Botão de novo convite
            <Button
              variant="outline"
              onClick={() => {
                setInviteCode(undefined)
                setInviteLink(undefined)
              }}
            >
              Gerar Novo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}