import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { householdService } from '@/features/households/services/householdService'
import { authService } from '@/services/authService'
import { toast } from 'sonner'
import { Copy, Users, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function WorkingInviteSystem() {
  const [logs, setLogs] = useState<string[]>([])
  const [generatedCode, setGeneratedCode] = useState('')
  const [testCode, setTestCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const navigate = useNavigate()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setLogs(prev => [logEntry, ...prev].slice(0, 20)) // Manter apenas 20 logs
    console.log(logEntry)
  }

  const clearLogs = () => {
    setLogs([])
  }

  const generateInvite = async () => {
    setIsGenerating(true)
    try {
      addLog('🚀 Gerando convite...')
      
      const user = authService.getCurrentUser()
      if (!user) {
        addLog('❌ Usuário não autenticado')
        toast.error('Faça login primeiro')
        return
      }

      addLog(`👤 Usuário autenticado: ${user.email}`)

      // Usar household ID fixo ou criar um novo
      const testHouseholdId = '84d0cc61-1d5b-4cc6-8514-6388ce351bd8'
      
      // Gerar convite via householdService (método confiável)
      const invite = await householdService.createInvite({
        householdId: testHouseholdId,
        createdBy: (user as any).uid || (user as any).id,
        expiresInHours: 168, // 7 dias
        maxUses: 10
      })

      addLog(`✅ Convite criado: ${invite.code}`)
      if ((invite as any).householdId) {
        addLog(`🏠 Household: ${(invite as any).householdId}`)
      }
      
      setGeneratedCode(invite.code)
      toast.success(`Convite criado: ${invite.code}`)

    } catch (error: any) {
      addLog(`❌ Erro: ${error.message}`)
      console.error('Erro ao gerar convite:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const testInviteCode = async () => {
    if (!testCode.trim()) {
      toast.error('Digite um código para testar')
      return
    }

    setIsTesting(true)
    try {
      addLog(`🔍 Testando código: ${testCode}`)
      
      // Testar via householdService
      const result = await householdService.validateInvite(testCode.trim())
      
      addLog(`📋 Resultado: ${JSON.stringify(result, null, 2)}`)
      
      if (result.valid) {
        addLog(`✅ Código válido!`)
        toast.success('✅ Código válido!')
      } else {
        addLog(`❌ Código inválido: ${result.error}`)
        toast.error(`❌ ${result.error}`)
      }

    } catch (error: any) {
      addLog(`💥 Erro: ${error.message}`)
      console.error('Erro na validação:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setIsTesting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  const openLink = (code: string) => {
    const url = `http://localhost:5173/convite/${code}`
    window.open(url, '_blank')
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Sistema de Convites - Versão Funcional
          </CardTitle>
          <CardDescription>
            Sistema simplificado e confiável para criar e validar convites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/expenses')} variant="outline">
              ← Voltar ao Sistema
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
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            1. Gerar Novo Convite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={generateInvite}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? '⏳ Gerando...' : '🎟️ Gerar Convite'}
          </Button>

          {generatedCode && (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-green-800">✅ Convite Gerado com Sucesso!</h4>
              </div>
              
              <div className="bg-white p-3 rounded border font-mono text-lg text-center">
                {generatedCode}
              </div>
              
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button 
                  size="sm" 
                  onClick={() => copyToClipboard(generatedCode)}
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar Código
                </Button>
                <Button size="sm" onClick={() => openLink(generatedCode)} variant="outline">
                  Abrir Link
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setTestCode(generatedCode)}
                  variant="outline"
                >
                  📋 Testar Código
                </Button>
              </div>

              <div className="mt-3 text-sm space-y-1">
                <p><strong>PC:</strong> <code>http://localhost:5173/convite/{generatedCode}</code></p>
                <p><strong>Mobile:</strong> <code>http://192.168.1.9:5173/convite/{generatedCode}</code></p>
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
              maxLength={8}
            />
            <Button 
              onClick={testInviteCode}
              disabled={isTesting}
            >
              {isTesting ? '⏳ Testando...' : '🔍 Testar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Logs do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Nenhuma ação executada ainda...</p>
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

      {/* Instruções Mobile */}
      <Card>
        <CardHeader>
          <CardTitle>📱 Instruções para Teste Mobile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="font-semibold mb-2">Passo a passo:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Gere um convite clicando no botão acima</li>
                <li>Copie o código gerado</li>
                <li>No celular (mesma rede WiFi), acesse:</li>
              </ol>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><code>http://192.168.1.9:5173/convite/[CODIGO]</code></li>
                <li><code>http://192.168.56.1:5173/convite/[CODIGO]</code></li>
                <li><code>http://192.168.56.2:5173/convite/[CODIGO]</code></li>
              </ul>
            </div>
            
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold mb-1">💡 Dica:</p>
              <p>Sempre teste o código no campo "Testar Código" antes de usar no mobile para garantir que está funcionando.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}