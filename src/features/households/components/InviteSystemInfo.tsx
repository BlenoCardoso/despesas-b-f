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
import { Badge } from '@/components/ui/badge'
import { 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Shield, 
  Clock,
  Lock,
  User,
  Settings
} from 'lucide-react'

export function InviteSystemInfo() {
  const [isOpen, setIsOpen] = useState(false)

  const improvements = [
    {
      icon: Lock,
      title: 'Códigos de Convite Únicos',
      description: 'Cada convite tem um código único de 6 dígitos que pode ser enviado por qualquer meio (WhatsApp, Email, SMS)',
      status: 'new'
    },
    {
      icon: Shield,
      title: 'Controle de Roles',
      description: 'Convites podem ser para Membro ou Administrador, com validação de permissões',
      status: 'new'
    },
    {
      icon: User,
      title: 'Sistema de Aprovação',
      description: 'Convites para Admin sempre requerem aprovação manual dos administradores atuais',
      status: 'new'
    },
    {
      icon: Clock,
      title: 'Expiração e Limites',
      description: 'Convites podem ter data de expiração e limite de usos para maior segurança',
      status: 'improved'
    },
    {
      icon: Users,
      title: 'Sistema Bidirecional',
      description: 'Admins podem convidar OU usuários podem solicitar entrada - funciona nos dois sentidos!',
      status: 'new'
    }
  ]

  const securityFeatures = [
    'Apenas proprietários e administradores podem convidar outros administradores',
    'Convites para admin sempre requerem aprovação manual',
    'Sistema de auditoria com registro de quem criou e aprovou convites',
    'Convites podem ser revogados a qualquer momento',
    'Expiração automática baseada em tempo configurável'
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
          <Info className="h-4 w-4 mr-2" />
          Sobre o Sistema de Convites
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sistema de Convites Melhorado
          </DialogTitle>
          <DialogDescription>
            Entenda as melhorias e recursos de segurança implementados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Melhorias Implementadas */}
          <div>
            <h3 className="font-medium mb-3">✨ Novos Recursos</h3>
            <div className="space-y-3">
              {improvements.map((improvement, index) => {
                const Icon = improvement.icon
                return (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="bg-white p-2 rounded-lg">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{improvement.title}</h4>
                        <Badge 
                          variant={improvement.status === 'new' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {improvement.status === 'new' ? 'Novo' : 'Melhorado'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{improvement.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recursos de Segurança */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Segurança e Controle
            </h3>
            <div className="space-y-2">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Como Usar */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Como Usar - Sistema Bidirecional</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-blue-800">📤 Admin convidando usuário:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside ml-2">
                  <li>Admin clica em "Sistema de Convites"</li>
                  <li>Escolhe tipo (Membro/Admin) e configurações</li>
                  <li>Gera código e envia para o usuário</li>
                  <li>Usuário usa o código para entrar</li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium text-blue-800">📥 Usuário solicitando entrada:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside ml-2">
                  <li>Usuário clica em "Solicitar Entrada"</li>
                  <li>Informa nome da casa e role desejado</li>
                  <li>Gera código e envia para admin</li>
                  <li>Admin usa "Processar Solicitação" para aprovar</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Problema Resolvido */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Problemas Resolvidos
            </h3>
            <div className="text-sm text-green-800 space-y-2">
              <div>
                <strong>✅ Múltiplos Admins:</strong> Agora solicitações de admin sempre requerem aprovação manual.
              </div>
              <div>
                <strong>✅ Unidirecional:</strong> Sistema agora funciona nos dois sentidos - admin pode convidar OU usuário pode solicitar!
              </div>
              <div>
                <strong>✅ Falta de Controle:</strong> Códigos únicos, expiração, limite de usos e aprovação manual.
              </div>
            </div>
          </div>

          {/* Avisos */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Importante
            </h3>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>• Convites para administrador sempre requerem aprovação</p>
              <p>• Códigos são únicos e podem ser compartilhados por qualquer meio</p>
              <p>• Verifique regularmente a central de aprovações</p>
              <p>• Revogue convites não utilizados quando necessário</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}