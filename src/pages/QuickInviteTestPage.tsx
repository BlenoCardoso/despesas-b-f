import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { householdService } from '@/features/households/services/householdService'
import { authService } from '@/services/authService'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export default function QuickInviteTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [testCode, setTestCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const navigate = useNavigate()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setLogs(prev => [...prev, logEntry])
    console.log(logEntry)
  }

  const clearLogs = () => {
    setLogs([])
  }

  const generateQuickInvite = async () => {
    setIsGenerating(true)
    try {
      addLog('🚀 Iniciando geração rápida de convite...')
      
      const user = authService.getCurrentUser()
      if (!user) {
        addLog('❌ Usuário não autenticado')
        toast.error('Faça login primeiro')
        return
      }

      addLog(`👤 Usuário: ${user.email}`)

      // Usar household ID fixo para teste
      const testHouseholdId = '84d0cc61-1d5b-4cc6-8514-6388ce351bd8'
      addLog(`🏠 Usando household ID: ${testHouseholdId}`)

      // Criar convite diretamente via householdService
      const invite = await householdService.createInvite({
        householdId: testHouseholdId,
        createdBy: (user as any).uid || (user as any).id,
        expiresInHours: 24,
        maxUses: 5
      })

      addLog(`✅ Convite criado com sucesso!`)
      addLog(`🎟️ Código: ${invite.code}`)
  addLog(`🔗 Link PC: http://localhost:5174/convite/${invite.code}`)
  addLog(`📱 Link Mobile: http://192.168.1.9:5174/convite/${invite.code}`)

      setGeneratedCode(invite.code)
      toast.success(`Convite criado: ${invite.code}`)

    } catch (error: any) {
      addLog(`❌ Erro: ${error.message}`)
      console.error('Erro ao gerar convite:', error)
      toast.error('Erro ao gerar convite')
    } finally {
      setIsGenerating(false)
    }
  }

  const validateTestCode = async () => {
    if (!testCode.trim()) {
      toast.error('Digite um código para testar')
      return
    }

    setIsTesting(true)
    try {
      addLog(`🔍 Testando código: ${testCode}`)
      
      const { InviteService } = await import('@/features/households/services/inviteService')
      const result = await InviteService.validate(testCode.trim())
      
      addLog(`📋 Resultado: ${JSON.stringify(result, null, 2)}`)
      
      if (result.valid) {
        addLog(`✅ Código válido! HouseholdId: ${result.householdId}`)
        toast.success('Código válido!')
      } else {
        addLog(`❌ Código inválido: ${result.error}`)
        toast.error(`Código inválido: ${result.error}`)
      }

    } catch (error: any) {
      addLog(`💥 Erro na validação: ${error.message}`)
      console.error('Erro na validação:', error)
      toast.error('Erro na validação')
    } finally {
      setIsTesting(false)
    }
  }

  const openInviteLink = (code: string) => {
  const url = `http://localhost:5174/convite/${code}`
    window.open(url, '_blank')
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🎟️ Teste Rápido de Sistema de Convites</CardTitle>
          <CardDescription>
            Ferramenta para testar criação e validação de convites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
            >
              ← Voltar
            </Button>
            <Button onClick={clearLogs} variant="outline">
              🗑️ Limpar Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gerar Convite */}
      <Card>
        <CardHeader>
          <CardTitle>1. Gerar Convite Rápido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={generateQuickInvite}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? '⏳ Gerando...' : '🎟️ Gerar Convite de Teste'}
          </Button>

          {generatedCode && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-semibold text-green-800">✅ Convite Gerado!</h4>
              <p className="text-green-700 font-mono text-lg">{generatedCode}</p>
              <div className="mt-2 space-y-1">
                <Button 
                  size="sm" 
                  onClick={() => openInviteLink(generatedCode)}
                  className="mr-2"
                >
                  🔗 Abrir Link
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setTestCode(generatedCode)}
                >
                  📋 Copiar para Teste
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testar Código */}
      <Card>
        <CardHeader>
          <CardTitle>2. Testar Código de Convite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite o código do convite"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button 
              onClick={validateTestCode}
              disabled={isTesting}
            >
              {isTesting ? '⏳' : '🔍'} Validar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Logs Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Aguardando ações...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>📱 Como Testar PC ↔ Mobile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p><strong>1. PC:</strong> Gere um convite clicando no botão acima</p>
            <p><strong>2. Mobile:</strong> Acesse uma das URLs abaixo com o código:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>http://192.168.1.9:5173/convite/[CODIGO]</code></li>
              <li><code>http://192.168.56.1:5173/convite/[CODIGO]</code></li>
              <li><code>http://192.168.56.2:5173/convite/[CODIGO]</code></li>
            </ul>
            <p><strong>3. Teste:</strong> Use o campo "Testar Código" para validar antes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}