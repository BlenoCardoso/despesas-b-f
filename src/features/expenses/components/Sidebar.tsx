import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Home,
  Receipt,
  PieChart,
  Settings,
  ChevronLeft
} from 'lucide-react'

interface SidebarProps {
  className?: string
  householdId: string
}

export function Sidebar({ className, householdId }: SidebarProps) {
  const pathname = usePathname()

  const routes = [
    {
      href: `/app/h/${householdId}`,
      label: 'Início',
      icon: Home
    },
    {
      href: `/app/h/${householdId}/expenses`,
      label: 'Despesas',
      icon: Receipt
    },
    {
      href: `/app/h/${householdId}/reports`,
      label: 'Relatórios',
      icon: PieChart
    },
    {
      href: `/app/h/${householdId}/settings`,
      label: 'Configurações',
      icon: Settings
    }
  ]

  return (
    <div className={cn('pb-12', className)}>
      <div className="space-y-4 py-4">
        {/* Cabeçalho */}
        <div className="px-4 py-2">
          <Link href="/app">
            <Button variant="ghost" className="p-2">
              <ChevronLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
          </Link>
        </div>

        {/* Links principais */}
        <nav className="space-y-1 px-2">
          {routes.map(route => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                'hover:bg-accent hover:text-accent-foreground',
                'transition-colors',
                pathname === route.href
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}