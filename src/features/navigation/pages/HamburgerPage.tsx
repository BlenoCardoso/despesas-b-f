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
    action: 'Nova despesa',
    accent: 'from-blue-500/15 via-blue-500/5 to-transparent',
    iconStyle: 'bg-blue-500/15 text-blue-600',
    badgeStyle: 'bg-blue-100 text-blue-700'
  },
  {
    title: 'Organizar Agenda',
    description: 'Visualize compromissos e eventos importantes da casa.',
    to: '/app/calendar',
    icon: Calendar,
    action: 'Abrir calendário',
    accent: 'from-purple-500/15 via-purple-500/5 to-transparent',
    iconStyle: 'bg-purple-500/15 text-purple-600',
    badgeStyle: 'bg-purple-100 text-purple-700'
  },
  {
    title: 'Gerenciar Lembretes',
    description: 'Veja alertas de pagamentos, eventos e tarefas pendentes.',
    to: '/app/reminders',
    icon: Bell,
    action: 'Central de lembretes',
    accent: 'from-amber-500/15 via-amber-500/5 to-transparent',
    iconStyle: 'bg-amber-500/15 text-amber-600',
    badgeStyle: 'bg-amber-100 text-amber-700'
  },
  {
    title: 'Acompanhar Meu Gasto',
    description: 'Filtre rapidamente as despesas que impactam apenas você.',
    to: '/app/personal',
    icon: PiggyBank,
    action: 'Ver despesas pessoais',
    accent: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    iconStyle: 'bg-emerald-500/15 text-emerald-600',
    badgeStyle: 'bg-emerald-100 text-emerald-700'
  },
  {
    title: 'Configurações do Grupo',
    description: 'Gerencie integrantes, convites e preferências da casa.',
    to: '/app/settings',
    icon: Settings,
    action: 'Abrir configurações',
    accent: 'from-slate-500/15 via-slate-500/5 to-transparent',
    iconStyle: 'bg-slate-500/15 text-slate-600',
    badgeStyle: 'bg-slate-200 text-slate-700'
  }
]

const smartHighlights = [
  {
    title: 'Sincronização em tempo real',
    description: 'Todos os dados continuam conectados ao Firebase com atualizações instantâneas.',
    icon: Sparkles
  },
  {
    title: 'Agenda e lembretes integrados',
    description: 'Calendário, tarefas e notificações atuando juntos para evitar atrasos.',
    icon: Calendar
  },
  {
    title: 'Foco nos seus objetivos',
    description: 'Dashboards pessoais e compartilhados otimizados para telas pequenas.',
    icon: PiggyBank
  }
]

export function HamburgerPage() {
  return (
    <div className="space-y-10 pb-6">
      <section className="relative overflow-hidden rounded-3xl border border-blue-200/60 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold tracking-wide uppercase">
            <Menu className="h-3.5 w-3.5" />
            Menu inteligente
          </span>

          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Controle total em poucos toques
            </h1>
            <p className="text-base text-blue-50/90">
              A navegação central reúne despesas, agenda e alertas em uma experiência fluida, 100% responsiva e integrada ao Firebase.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-white text-blue-600 hover:bg-blue-50"
            >
              <Link to="/app/expenses">Registrar despesa agora</Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="rounded-full border-white/30 bg-white/20 text-white hover:bg-white/30"
            >
              <Link to="/app/reminders">Ver lembretes</Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/15 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-50/80">
                Sincronia
              </p>
              <p className="mt-1 text-sm font-medium">Dados em tempo real com Firebase</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-50/80">
                Mobilidade
              </p>
              <p className="mt-1 text-sm font-medium">Design responsivo para celulares</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-50/80">
                Produtividade
              </p>
              <p className="mt-1 text-sm font-medium">Acesso rápido aos principais fluxos</p>
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="absolute -right-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-blue-300/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-white/20 blur-3xl"
        />
      </section>

      <section className="space-y-5">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Ações rápidas</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Escolha um atalho e continue de onde parou. Tudo otimizado para toque e com feedback imediato.
            </p>
          </div>
          <Badge variant="outline" className="w-fit rounded-full border-blue-200 bg-blue-50 text-blue-700">
            Atualização instantânea
          </Badge>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.title}
                to={link.to}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-5 text-left shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700/70 dark:bg-gray-900/80 dark:ring-white/10"
              >
                <div
                  aria-hidden
                  className={`absolute inset-0 bg-gradient-to-br ${link.accent} opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
                />
                <div className="relative flex flex-1 flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${link.iconStyle}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${link.badgeStyle}`}>
                      {link.action}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{link.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{link.description}</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition-transform duration-200 group-hover:translate-x-1 dark:text-blue-300">
                    Acessar agora
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <Card className="overflow-hidden border-dashed border-2 border-blue-200/80 bg-white/80 shadow-lg dark:border-blue-900/40 dark:bg-gray-900/80">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-blue-900 dark:text-blue-100">
                <Sparkles className="h-5 w-5" /> Sugestões inteligentes
              </CardTitle>
              <CardDescription className="text-sm text-blue-900/80 dark:text-blue-100/80">
                Rotas favoritas baseadas no seu uso mais recente para continuar as tarefas em segundos.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-100">
              Personalizado automaticamente
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickLinks.slice(0, 3).map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={`suggestion-${link.title}`}
                  to={link.to}
                  className="group flex items-start gap-4 rounded-2xl border border-blue-100/80 bg-blue-50/60 p-4 transition hover:bg-blue-100/70 dark:border-blue-900/40 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.iconStyle}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{link.title}</p>
                    <p className="text-xs text-blue-900/80 dark:text-blue-100/80">{link.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-500 transition-transform group-hover:translate-x-1" />
                </Link>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/80 shadow-lg dark:border-gray-700/70 dark:bg-gray-900/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 dark:text-white">Por que esta navegação é diferente?</CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-300">
              Benefícios pensados para jornadas móveis, mantendo toda a infraestrutura em Firebase ativa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {smartHighlights.map((highlight) => {
                const Icon = highlight.icon
                return (
                  <li key={highlight.title} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/60 p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/60">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{highlight.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{highlight.description}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
