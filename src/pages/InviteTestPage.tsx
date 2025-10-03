import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { householdService } from '@/features/households/services/householdService'
import { InviteService } from '@/features/households/services/inviteService'
import { authService } from '@/services/authService'
import { toast } from 'sonner'

export default function InviteTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [testCode, setTestCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setLogs(prev => [...prev, logEntry])
    console.log(logEntry)
  }

  const clearLogs = () => {
    setLogs([])
  }

  const createTestHousehold = async () => {
    try {
      addLog('🏠 Criando household de teste...')
      
      const user = authService.getCurrentUser()
      if (!user) {
        addLog('❌ Usuário não autenticado')
        toast.error('Faça login primeiro')
        return
      }

      const householdName = `Casa de Teste - ${new Date().toLocaleTimeString()}`
      const householdId = await householdService.createHousehold(householdName, user.id)

      addLog(`✅ Household criada: ${householdId}`)
      
      // Agora criar convite
      const invite = await householdService.createInvite({
        householdId: householdId,
        createdBy: user.id,
        expiresInHours: 24,
        maxUses: 5
      })

      addLog(`🎟️ Convite criado: ${invite.code}`)
      addLog(`🔗 Link: ${invite.link}`)
      setGeneratedCode(invite.code)
      toast.success(`Convite criado: ${invite.code}`)

    } catch (error: any) {
      addLog(`💥 Erro: ${error.message}`)
      toast.error(`Erro: ${error.message}`)
    }
  }

  const validateInvite = async () => {
    if (!testCode.trim()) {
      toast.error('Digite um código para validar')
      return
    }

    try {
      addLog(`🔍 Validando código: ${testCode}`)
      
      const result = await InviteService.validate(testCode.trim())
      addLog(`📋 Resultado: ${JSON.stringify(result, null, 2)}`)
      
      if (result.valid) {
        toast.success('Convite válido!')
      } else {
        toast.error(`Convite inválido: ${result.error}`)
      }

    } catch (error: any) {
      addLog(`💥 Erro na validação: ${error.message}`)
      toast.error(`Erro: ${error.message}`)
    }
  }

  const testInviteAcceptance = async () => {
    if (!testCode.trim()) {
      toast.error('Digite um código para aceitar')
      return
    }

    try {
      addLog(`🎯 Testando aceitação do código: ${testCode}`)
      
      // Primeiro validar
      const result = await InviteService.validate(testCode.trim())
      if (!result.valid) {
        addLog(`❌ Convite inválido: ${result.error}`)
        toast.error(`Convite inválido: ${result.error}`)
        return
      }

      addLog(`✅ Convite válido, householdId: ${result.householdId}`)
      
      // Usar o convite
      await InviteService.use(testCode.trim())
      addLog(`✅ Convite usado com sucesso`)
      toast.success('Convite aceito com sucesso!')

    } catch (error: any) {
      addLog(`💥 Erro na aceitação: ${error.message}`)
      toast.error(`Erro: ${error.message}`)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste de Sistema de Convites</CardTitle>
          <CardDescription>
            Ferramenta para testar a criação, validação e aceitação de convites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Criar Teste */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Criar Teste Completo</h3>
            <p className="text-sm text-gray-600">
              Cria uma household de teste e gera um convite
            </p>
            <Button onClick={createTestHousehold} className="w-full">
              🏠 Criar Household + Convite de Teste
            </Button>
            {generatedCode && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-medium">Código gerado: <code className="bg-green-100 px-2 py-1 rounded">{generatedCode}</code></p>
                <p className="text-xs text-green-600">Use este código nos testes abaixo</p>
              </div>
            )}
          </div>

          {/* Testar Validação */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. Testar Validação</h3>
            <div className="flex gap-2">
              <Input
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                placeholder="Digite o código do convite"
                className="flex-1"
              />
              <Button onClick={validateInvite}>
                🔍 Validar
              </Button>
            </div>
          </div>

          {/* Testar Aceitação */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">3. Testar Aceitação</h3>
            <Button onClick={testInviteAcceptance} className="w-full" variant="secondary">
              🎯 Aceitar Convite
            </Button>
          </div>

          {/* Ações Auxiliares */}
          <div className="flex gap-2">
            <Button onClick={clearLogs} variant="outline" size="sm">
              🗑️ Limpar Logs
            </Button>
            <Button onClick={() => window.open('/convite/' + testCode, '_blank')} variant="outline" size="sm" disabled={!testCode}>
              🌐 Abrir Página de Convite
            </Button>
          </div>

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📋 Logs Detalhados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded text-xs font-mono max-h-60 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-gray-500">Aguardando ações...</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}