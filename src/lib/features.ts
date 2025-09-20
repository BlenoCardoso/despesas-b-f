// Enum de features Pro
export enum ProFeature {
  ATTACHMENTS = 'attachments',
  PUSH_NOTIFICATIONS = 'push-notifications',
  OCR = 'ocr',
  EXPORT = 'export',
  CHARTS = 'charts',
  BUDGET = 'budget',
  TAGS = 'tags',
  SHARING = 'sharing',
  SYNC = 'sync'
}

// Interface de configuração de feature
export interface FeatureConfig {
  enabled: boolean
  requiresPro: boolean
  beta?: boolean
  description: string
  comingSoon?: boolean
}

// Configuração das features
export const features: Record<ProFeature, FeatureConfig> = {
  [ProFeature.ATTACHMENTS]: {
    enabled: true,
    requiresPro: true,
    description: 'Anexe recibos e comprovantes às suas despesas'
  },
  [ProFeature.PUSH_NOTIFICATIONS]: {
    enabled: false,
    requiresPro: true,
    comingSoon: true,
    description: 'Receba notificações de novas despesas e lembretes'
  },
  [ProFeature.OCR]: {
    enabled: false,
    requiresPro: true,
    beta: true,
    comingSoon: true,
    description: 'Extraia dados automaticamente de recibos e notas fiscais'
  },
  [ProFeature.EXPORT]: {
    enabled: true,
    requiresPro: false,
    description: 'Exporte seus dados em CSV, PDF ou imagem'
  },
  [ProFeature.CHARTS]: {
    enabled: true,
    requiresPro: false,
    description: 'Visualize seus gastos com gráficos e relatórios'
  },
  [ProFeature.BUDGET]: {
    enabled: false,
    requiresPro: true,
    comingSoon: true,
    description: 'Defina e acompanhe orçamentos por categoria'
  },
  [ProFeature.TAGS]: {
    enabled: false,
    requiresPro: true,
    comingSoon: true,
    description: 'Organize despesas com tags personalizadas'
  },
  [ProFeature.SHARING]: {
    enabled: true,
    requiresPro: false,
    description: 'Compartilhe despesas com outras pessoas'
  },
  [ProFeature.SYNC]: {
    enabled: true,
    requiresPro: false,
    description: 'Sincronize seus dados em todos os dispositivos'
  }
}

// Função para verificar se feature está disponível
export function isFeatureEnabled(
  feature: ProFeature,
  isPro: boolean = false
): boolean {
  const config = features[feature]
  if (!config) return false
  
  return config.enabled && (!config.requiresPro || isPro)
}