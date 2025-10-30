import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Bell,
  CreditCard,
  PiggyBank,
  Settings,
  ArrowRight,
  Menu,
  Sparkles
} from 'lucide-react'

const quickLinks = [
  {
    title: 'Registrar Despesa',
    description: 'Adicionar uma nova despesa compartilhada em poucos toques.',
    to: '/app/expenses',
    icon: CreditCard,
    action: 'Nova despesa'
  },
  {
    title: 'Organizar Agenda',
    description: 'Visualize compromissos e eventos importantes da casa.',
    to: '/app/calendar',
    icon: Calendar,
    action: 'Abrir calendário'
  },
  {
    title: 'Gerenciar Lembretes',
    description: 'Veja alertas de pagamentos, eventos e tarefas pendentes.',
    to: '/app/reminders',
    icon: Bell,
    action: 'Central de lembretes'
  },
  {
    title: 'Acompanhar Meu Gasto',
    description: 'Filtre rapidamente as despesas que impactam apenas você.',
    to: '/app/personal',
    icon: PiggyBank,
    action: 'Ver despesas pessoais'
  },
  {
    title: 'Configurações do Grupo',
    description: 'Gerencie integrantes, convites e preferências da casa.',
    to: '/app/settings',
    icon: Settings,
    action: 'Abrir configurações'
  }
]

export function HamburgerPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <Menu className="h-3.5 w-3.5" />
          Menu Hambúrguer Inteligente
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tudo o que você precisa em um só lugar
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
            Acesse rapidamente as principais seções do Despesas B&F. Personalizamos os atalhos mais usados
            para agilizar seu dia a dia e reduzir o tempo entre a intenção e a ação.
          </p>
        </div>
      </header>

      <Card className="border-dashed border-2 border-blue-100 bg-gradient-to-br from-white via-white to-blue-50">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-blue-900">
              <Sparkles className="h-5 w-5" /> Sugestões inteligentes
            </CardTitle>
            <CardDescription className="text-sm text-blue-800/80">
              Baseadas no que usuários mais acessam para manter o controle financeiro em dia.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
            atualizado em tempo real
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {quickLinks.slice(0, 2).map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.title}
                to={link.to}
                className="group rounded-xl border border-blue-100 bg-white/80 p-4 transition-all hover:border-blue-300 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                      <Icon className="h-4 w-4" />
                      {link.action}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {link.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-500 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )
          })}
        </CardContent>
      </Card>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {quickLinks.map((link) => {
          const Icon = link.icon
          return (
            <Card key={link.title} className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="rounded-lg bg-blue-100 p-2 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    {link.title}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    recomendado
                  </Badge>
                </div>
                <CardDescription className="text-sm text-gray-600">
                  {link.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  {link.action}
                </div>
                <Button asChild className="w-full">
                  <Link to={link.to}>
                    Acessar agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
