import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ProFeature, features } from '@/lib/features'
import { useProStore } from '@/stores/proStore'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Sparkles } from 'lucide-react'

interface ProFeatureBlockerProps {
  feature: ProFeature
  children: React.ReactNode
}

export function ProFeatureBlocker({ feature, children }: ProFeatureBlockerProps) {
  // Verificar se é pro
  const isPro = useProStore(state => state.isPro)
  const activateProTrial = useProStore(state => state.activateProTrial)

  // Se for pro, renderizar conteúdo normal
  if (isPro) {
    return <>{children}</>
  }

  // Configuração da feature
  const config = features[feature]

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Recurso Pro
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Features Pro */}
          <div className="grid gap-2">
            {Object.entries(features)
              .filter(([_, config]) => config.requiresPro)
              .map(([key, config]) => (
                <div 
                  key={key}
                  className="flex items-start gap-2"
                >
                  {config.comingSoon ? (
                    <Sparkles className="h-4 w-4 text-yellow-500 mt-1" />
                  ) : (
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                  )}

                  <div>
                    <div className="font-medium">
                      {config.description}
                      {config.beta && (
                        <Badge variant="secondary" className="ml-2">
                          Beta
                        </Badge>
                      )}
                      {config.comingSoon && (
                        <Badge variant="secondary" className="ml-2">
                          Em breve
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Botões */}
          <div className="flex flex-col gap-2">
            <Button
              size="lg" 
              className="w-full"
              onClick={() => {
                activateProTrial()
              }}
            >
              Ativar Plano Pro
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Grátis por tempo limitado
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}