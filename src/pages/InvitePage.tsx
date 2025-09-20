import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { auth } from '@/lib/firebase'
import { DatabaseMiddleware } from '@/lib/databaseMiddleware'
import { InviteService } from '@/features/households/services/inviteService'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { DatabaseError } from '@/lib/errors'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHousehold } from '@/features/households/hooks/useHousehold'

export default function InvitePage() {
  // Parâmetros e navegação
  const { code = '' } = useParams()
  const navigate = useNavigate()

  // Estado da página
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [householdId, setHouseholdId] = useState<string>()

  // Buscar household
  const { data: household } = useHousehold(householdId)

  // Validar convite ao carregar
  useEffect(() => {
    const validateInvite = async () => {
      try {
        // Verificar autenticação
        const user = auth.currentUser
        if (!user) {
          navigate('/login', { 
            state: { redirect: `/convite/${code}` }
          })
          return
        }

        // Validar convite
        const result = await InviteService.validate(code)
        
        if (!result.valid) {
          toast.error(result.error || 'Convite inválido')
          navigate('/')
          return
        }

        setHouseholdId(result.householdId)

      } catch (error) {
        toast.error('Erro ao validar convite')
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    }

    validateInvite()
  }, [code, navigate])

  // Aceitar convite
  const handleAcceptInvite = async () => {
    try {
      setIsJoining(true)

      const user = auth.currentUser
      if (!user || !householdId) return

      // Criar membro
      await DatabaseMiddleware.create({
        collection: 'members',
        data: {
          householdId,
          userId: user.uid,
          role: 'member'
        }
      })

      // Registrar uso do convite
      await InviteService.use(code)

      // Redirecionar
      navigate(`/app/h/${householdId}`)
      toast.success('Bem-vindo à casa!')

    } catch (error) {
      if (error instanceof DatabaseError) {
        toast.error(error.message)
      } else {
        toast.error('Erro ao aceitar convite')
      }
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading || !household) {
    return (
      <div className="container max-w-lg py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-lg py-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">
            Convite para {household.name}
          </h1>
        </CardHeader>

        <CardContent>
          <p>
            Você foi convidado para participar desta casa.
            Ao aceitar, você poderá:
          </p>

          <ul className="list-disc list-inside mt-4 space-y-2">
            <li>Ver todas as despesas da casa</li>
            <li>Adicionar novas despesas</li>
            <li>Participar dos rateios</li>
            <li>Receber notificações</li>
          </ul>
        </CardContent>

        <CardFooter>
          <div className="flex gap-4 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/')}
            >
              Recusar
            </Button>

            <Button
              className="flex-1"
              onClick={handleAcceptInvite}
              disabled={isJoining}
            >
              {isJoining ? 'Entrando...' : 'Aceitar Convite'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}