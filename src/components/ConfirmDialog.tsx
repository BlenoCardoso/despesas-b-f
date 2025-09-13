import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-react'

interface ConfirmDialogProps {
  children: React.ReactNode
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  onConfirm: () => void
  disabled?: boolean
}

const variantConfig = {
  default: {
    icon: Info,
    iconColor: 'text-blue-500',
    confirmColor: 'bg-blue-600 hover:bg-blue-700'
  },
  destructive: {
    icon: Trash2,
    iconColor: 'text-red-500',
    confirmColor: 'bg-red-600 hover:bg-red-700'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    confirmColor: 'bg-green-600 hover:bg-green-700'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
    confirmColor: 'bg-orange-600 hover:bg-orange-700'
  }
}

export function ConfirmDialog({
  children,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  disabled = false
}: ConfirmDialogProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild disabled={disabled}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            <Icon className={cn('w-6 h-6', config.iconColor)} />
            <AlertDialogTitle className="text-lg font-semibold">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <AlertDialogCancel className="mt-3 sm:mt-0">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              'text-white',
              config.confirmColor
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook para usar ConfirmDialog programaticamente
export function useConfirmDialog() {
  const confirm = ({
    title,
    description,
    confirmLabel = 'Confirmar',
    variant = 'default'
  }: {
    title: string
    description: string
    confirmLabel?: string
    variant?: 'default' | 'destructive' | 'success' | 'warning'
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      // Esta implementação seria mais complexa com um provider
      // Por agora, vamos usar window.confirm como fallback
      const result = window.confirm(`${title}\n\n${description}`)
      resolve(result)
    })
  }

  return { confirm }
}