import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Format currency values in Brazilian Real
 */
export function formatCurrency(amount: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols and convert to number
  const cleaned = value.replace(/[^\d,-]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: ptBR })
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date | string, formatStr: string = 'dd/MM/yyyy HH:mm'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: ptBR })
}

/**
 * Format time only
 */
export function formatTime(date: Date | string, formatStr: string = 'HH:mm'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: ptBR })
}

/**
 * Format relative time (e.g., "há 2 horas")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: ptBR 
  })
}

/**
 * Format date for grouping (Today, Yesterday, or date)
 */
export function formatDateGroup(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (isToday(dateObj)) {
    return 'Hoje'
  }
  
  if (isYesterday(dateObj)) {
    return 'Ontem'
  }
  
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR })
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

/**
 * Format number with thousands separator
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    dinheiro: 'Dinheiro',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    pix: 'PIX',
    transferencia: 'Transferência',
    boleto: 'Boleto',
  }
  
  return methods[method] || method
}

/**
 * Format medication form for display
 */
export function formatMedicationForm(form: string): string {
  const forms: Record<string, string> = {
    comprimido: 'Comprimido',
    capsula: 'Cápsula',
    xarope: 'Xarope',
    spray: 'Spray',
    injecao: 'Injeção',
  }
  
  return forms[form] || form
}

/**
 * Format dosage for display
 */
export function formatDosage(value: number, unit: string): string {
  return `${formatNumber(value)} ${unit}`
}

/**
 * Format priority for display
 */
export function formatPriority(priority: string): string {
  const priorities: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
  }
  
  return priorities[priority] || priority
}

/**
 * Format task status for display
 */
export function formatTaskStatus(done: boolean, dueDate?: Date): string {
  if (done) {
    return 'Concluída'
  }
  
  if (dueDate && dueDate < new Date()) {
    return 'Atrasada'
  }
  
  return 'Pendente'
}

/**
 * Format medication status for display
 */
export function formatMedicationStatus(status: string): string {
  const statuses: Record<string, string> = {
    tomado: 'Tomado',
    atrasado: 'Atrasado',
    pulado: 'Pulado',
    pending: 'Pendente',
    snoozed: 'Adiado',
    skipped: 'Pulado',
  }
  
  return statuses[status] || status
}

/**
 * Format recurrence for display
 */
export function formatRecurrence(type: string, interval: number = 1): string {
  const types: Record<string, string> = {
    diario: interval === 1 ? 'Diário' : `A cada ${interval} dias`,
    semanal: interval === 1 ? 'Semanal' : `A cada ${interval} semanas`,
    mensal: interval === 1 ? 'Mensal' : `A cada ${interval} meses`,
    anual: interval === 1 ? 'Anual' : `A cada ${interval} anos`,
  }
  
  return types[type] || type
}

/**
 * Format installment info
 */
export function formatInstallment(current: number, total: number): string {
  return `${current}/${total}`
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Format initials from name
 */
export function formatInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

/**
 * Format phone number (Brazilian format)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  return phone
}

/**
 * Format CPF (Brazilian tax ID)
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  
  return cpf
}

