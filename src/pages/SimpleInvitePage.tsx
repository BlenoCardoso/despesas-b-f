import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SimpleInvitePage() {
  const { code = '' } = useParams()

  return (
    <div className="container max-w-lg mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>🎯 Página de Convite Simples</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Código recebido: <strong>{code}</strong></p>
          <p className="mt-4 text-sm text-gray-600">
            Esta é uma página de teste simples para verificar se o roteamento está funcionando.
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              ✅ Se você está vendo esta página, o roteamento está funcionando.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}