import React from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Settings,
  Menu,
  User,
  Home,
  LogOut,
  Calendar,
  Bell,
  PiggyBank,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHouseholds } from '@/hooks/useHouseholds'
import { NotificationButton } from '@/features/notifications/components/NotificationButton'
import { GlobalSearch } from './GlobalSearch'
import { ErrorBoundary } from './ErrorBoundary'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ConnectivityStatus } from './ConnectivityStatus'
import { ThemeToggle } from './ThemeToggle'
import { NotificationCenter } from './NotificationCenter'
import { useAuth } from '@/hooks/useAuth'

const navigation = [
  {
    name: 'Hambúrguer',
    href: '/app/menu',
    icon: Menu,
    badge: 0,
  },
  {
    name: 'Despesas',
    href: '/app/expenses',
    icon: CreditCard,
    badge: 0,
  },
  {
    name: 'Despesas Pessoais',
    href: '/app/personal',
    icon: PiggyBank,
    badge: 0,
  },
  {
    name: 'Calendário',
    href: '/app/calendar',
    icon: Calendar,
    badge: 0,
  },
  {
    name: 'Lembretes',
    href: '/app/reminders',
    icon: Bell,
    badge: 0,
  },
  {
    name: 'Configurações',
    href: '/app/settings',
    icon: Settings,
    badge: 0,
  },
]

export function Layout() {
  const location = useLocation()
  const { currentHousehold } = useHouseholds()
  const { user, signOut } = useAuth()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false)
  
  // Ativar atalhos de teclado globais
  useKeyboardShortcuts()

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Fechar sidebar mobile ao navegar
  React.useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname])

  // Fallback: permitir abrir a sidebar mobile via evento customizado
  React.useEffect(() => {
    const handleOpenSidebar = () => {
      console.debug('[Layout] received open-mobile-sidebar')
      setIsMobileSidebarOpen(true)
    }
    window.addEventListener('open-mobile-sidebar', handleOpenSidebar)
    return () => window.removeEventListener('open-mobile-sidebar', handleOpenSidebar)
  }, [])

  // Forçar exibição temporária da sidebar mobile (útil quando o app está em desktop
  // mas queremos mostrar a navegação mobile como fallback). O evento 'open-mobile-sidebar-forced'
  // ativa esse modo por alguns segundos.
  const [forceMobileSidebarVisible, setForceMobileSidebarVisible] = React.useState(false)
  const forceSidebarTimeoutRef = React.useRef<number | null>(null)
  React.useEffect(() => {
    const handleForced = () => {
      console.debug('[Layout] received open-mobile-sidebar-forced')
      setForceMobileSidebarVisible(true)
      setIsMobileSidebarOpen(true)
      // desligar após 6 segundos
      if (forceSidebarTimeoutRef.current) {
        window.clearTimeout(forceSidebarTimeoutRef.current)
      }
      forceSidebarTimeoutRef.current = window.setTimeout(
        () => setForceMobileSidebarVisible(false),
        6000
      )
    }
    window.addEventListener('open-mobile-sidebar-forced', handleForced)
    return () => {
      window.removeEventListener('open-mobile-sidebar-forced', handleForced)
      if (forceSidebarTimeoutRef.current) {
        window.clearTimeout(forceSidebarTimeoutRef.current)
      }
    }
  }, [])

  const activeNavigation = React.useMemo(
    () =>
      navigation.find(
        (item) =>
          location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
      ),
    [location.pathname]
  )

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <ConnectivityStatus />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[-35%] top-[-220px] h-[360px] rounded-full bg-blue-200/40 blur-3xl transition-opacity duration-500 dark:bg-blue-900/30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-220px] right-[-160px] h-[320px] w-[320px] rounded-full bg-emerald-200/40 blur-3xl transition-opacity duration-500 dark:bg-emerald-900/30"
      />

      <div className="relative z-10 flex min-h-screen w-full flex-col gap-6 px-3 pb-28 pt-4 sm:px-6 lg:flex-row lg:gap-8 lg:pb-16">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 xl:w-72">
          <div className="flex h-full flex-1 flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-5 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/80 dark:ring-white/10">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-4 text-white shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Home className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold leading-tight">Despesas B&F</h1>
                <p className="text-xs text-blue-50/90">
                  {currentHousehold?.name || 'Carregando...'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100/70 bg-white/70 p-3 shadow-inner backdrop-blur dark:border-blue-900/40 dark:bg-gray-900/80">
              <GlobalSearch />
            </div>

            <nav className="mt-4 flex-1 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                {navigation.map((item) => {
                  const isActive =
                    location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-blue-100/90 text-blue-900 shadow-sm ring-1 ring-blue-300/70 dark:bg-blue-900/80 dark:text-blue-100 dark:ring-blue-700/60'
                          : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow dark:text-slate-300 dark:hover:bg-gray-800/80 dark:hover:text-white'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
                          isActive
                            ? 'bg-blue-500/90 text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-gray-800 dark:text-slate-300 dark:group-hover:bg-blue-900/60 dark:group-hover:text-blue-200'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="truncate">{item.name}</span>
                      {item.badge > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-auto h-5 min-w-[1.5rem] rounded-full px-0 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      <ArrowRight className="ml-auto hidden h-4 w-4 text-blue-400 transition-transform group-hover:translate-x-1 lg:block" />
                    </Link>
                  )
                })}
              </div>
            </nav>

            <div className="mt-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-inner backdrop-blur dark:border-white/10 dark:bg-gray-900/70">
              <div className="flex items-center gap-3">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover shadow"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-gray-700 dark:text-gray-200">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {user?.email || 'usuario@exemplo.com'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-8 w-8 rounded-full text-slate-500 hover:text-red-500 dark:text-slate-300 dark:hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <ThemeToggle />
                  <NotificationCenter />
                </div>
                <NotificationButton />
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {(isMobileSidebarOpen || forceMobileSidebarVisible) && (
          <div
            className={cn(
              'fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity',
              !forceMobileSidebarVisible && 'lg:hidden'
            )}
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile sidebar */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-300 ease-in-out',
            !forceMobileSidebarVisible && 'lg:hidden',
            isMobileSidebarOpen || forceMobileSidebarVisible ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-full flex-col overflow-hidden rounded-r-3xl border border-slate-200/70 bg-white/95 shadow-2xl backdrop-blur dark:border-gray-700/80 dark:bg-gray-900/95">
            <div className="safe-top flex items-center justify-between border-b border-slate-200/70 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-4 text-white dark:border-blue-900/40">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                  <Home className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-semibold leading-tight">Despesas B&F</h1>
                  <p className="text-xs text-blue-50/80">
                    {currentHousehold?.name || 'Carregando...'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                ✕
              </Button>
            </div>

            <div className="border-b border-slate-200/70 bg-white/70 p-4 backdrop-blur dark:border-gray-700/70 dark:bg-gray-900/80">
              <GlobalSearch />
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
              {navigation.map((item) => {
                const isActive =
                  location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-blue-100 text-blue-900 shadow-sm ring-1 ring-blue-200 dark:bg-blue-900/80 dark:text-blue-100'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-gray-800 dark:hover:text-white'
                    )}
                    onClick={() => setIsMobileSidebarOpen(false)}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                        isActive
                          ? 'bg-blue-500/90 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-gray-800 dark:text-slate-300 dark:group-hover:bg-blue-900/60 dark:group-hover:text-blue-200'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="truncate">{item.name}</span>
                    {item.badge > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-auto h-5 min-w-[1.5rem] rounded-full px-0 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-slate-200/70 bg-white/80 p-4 backdrop-blur dark:border-gray-700/70 dark:bg-gray-900/80">
              <div className="flex items-center gap-3">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-9 w-9 rounded-full object-cover shadow"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-gray-700 dark:text-gray-200">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {user?.email || 'usuario@exemplo.com'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-8 w-8 rounded-full text-slate-500 hover:text-red-500 dark:text-slate-300 dark:hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <ThemeToggle />
                  <NotificationCenter />
                </div>
                <NotificationButton />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-xl ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-gray-900/70 dark:ring-white/10">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/60 via-white/30 to-white/0 dark:from-gray-950/60 dark:via-gray-950/30" aria-hidden />

          {/* Mobile header */}
          <div className="safe-top relative z-10 flex flex-col border-b border-slate-200/70 bg-white/80 px-3 py-3 backdrop-blur dark:border-gray-700/70 dark:bg-gray-900/80 lg:hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-1 items-center gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="h-10 w-10 rounded-full border border-slate-200/70 bg-white/80 p-0 text-slate-600 shadow-sm hover:text-blue-600 dark:border-gray-700/70 dark:bg-gray-900/80 dark:text-slate-200"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {currentHousehold?.name || 'Minha casa'}
                  </p>
                  <h1 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                    {activeNavigation?.name || 'Despesas'}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <NotificationButton />
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="relative z-10 flex-1 overflow-y-auto pb-28 pt-4 sm:pt-6 lg:pb-10 lg:pt-8">
            <ErrorBoundary>
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:px-10">
                <Outlet />
              </div>
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-3xl px-4 pb-4 safe-bottom lg:hidden">
        <nav className="pointer-events-auto flex items-center justify-between gap-1 rounded-3xl border border-white/60 bg-white/95 px-2 py-2 shadow-2xl ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-gray-900/95 dark:ring-white/10">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={`mobile-${item.name}`}
                to={item.href}
                className={cn(
                  'flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-blue-100 text-blue-700 shadow-inner dark:bg-blue-900/60 dark:text-blue-100'
                    : 'text-slate-500 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-200'
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-sm transition-all',
                    isActive
                      ? 'border-blue-200 bg-white text-blue-600 dark:border-blue-700 dark:bg-blue-950'
                      : 'bg-transparent'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}


