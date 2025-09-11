import { isValid, parseISO, isFuture, isPast } from 'date-fns'

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string = 'Campo'): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} é obrigatório`
  }
  return null
}

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
  if (!email) return 'E-mail é obrigatório'
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'E-mail inválido'
  }
  
  return null
}

/**
 * Validate currency amount
 */
export function validateAmount(amount: number | string, fieldName: string = 'Valor'): string | null {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    return `${fieldName} deve ser um número válido`
  }
  
  if (numAmount <= 0) {
    return `${fieldName} deve ser maior que zero`
  }
  
  if (numAmount > 999999999) {
    return `${fieldName} é muito alto`
  }
  
  return null
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: number | string, fieldName: string = 'Valor'): string | null {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return `${fieldName} deve ser um número válido`
  }
  
  if (numValue < 0) {
    return `${fieldName} deve ser positivo`
  }
  
  return null
}

/**
 * Validate date
 */
export function validateDate(date: Date | string | null, fieldName: string = 'Data'): string | null {
  if (!date) {
    return `${fieldName} é obrigatória`
  }
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(dateObj)) {
    return `${fieldName} inválida`
  }
  
  return null
}

/**
 * Validate future date
 */
export function validateFutureDate(date: Date | string | null, fieldName: string = 'Data'): string | null {
  const dateValidation = validateDate(date, fieldName)
  if (dateValidation) return dateValidation
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date!
  
  if (!isFuture(dateObj)) {
    return `${fieldName} deve ser no futuro`
  }
  
  return null
}

/**
 * Validate past date
 */
export function validatePastDate(date: Date | string | null, fieldName: string = 'Data'): string | null {
  const dateValidation = validateDate(date, fieldName)
  if (dateValidation) return dateValidation
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date!
  
  if (isFuture(dateObj)) {
    return `${fieldName} não pode ser no futuro`
  }
  
  return null
}

/**
 * Validate time format (HH:mm)
 */
export function validateTime(time: string, fieldName: string = 'Horário'): string | null {
  if (!time) {
    return `${fieldName} é obrigatório`
  }
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(time)) {
    return `${fieldName} deve estar no formato HH:mm`
  }
  
  return null
}

/**
 * Validate text length
 */
export function validateTextLength(
  text: string, 
  minLength: number = 0, 
  maxLength: number = 255, 
  fieldName: string = 'Texto'
): string | null {
  if (text.length < minLength) {
    return `${fieldName} deve ter pelo menos ${minLength} caracteres`
  }
  
  if (text.length > maxLength) {
    return `${fieldName} deve ter no máximo ${maxLength} caracteres`
  }
  
  return null
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): string | null {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  
  if (file.size > maxSizeBytes) {
    return `Arquivo deve ter no máximo ${maxSizeMB}MB`
  }
  
  return null
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): string | null {
  if (!allowedTypes.includes(file.type)) {
    return `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
  }
  
  return null
}

/**
 * Validate CPF (Brazilian tax ID)
 */
export function validateCPF(cpf: string): string | null {
  if (!cpf) return 'CPF é obrigatório'
  
  // Remove non-digits
  const cleaned = cpf.replace(/\D/g, '')
  
  if (cleaned.length !== 11) {
    return 'CPF deve ter 11 dígitos'
  }
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return 'CPF inválido'
  }
  
  // Validate check digits
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(9))) {
    return 'CPF inválido'
  }
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(10))) {
    return 'CPF inválido'
  }
  
  return null
}

/**
 * Validate phone number (Brazilian format)
 */
export function validatePhoneNumber(phone: string): string | null {
  if (!phone) return 'Telefone é obrigatório'
  
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length < 10 || cleaned.length > 11) {
    return 'Telefone deve ter 10 ou 11 dígitos'
  }
  
  return null
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): string | null {
  if (!password) return 'Senha é obrigatória'
  
  if (password.length < 8) {
    return 'Senha deve ter pelo menos 8 caracteres'
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Senha deve conter pelo menos uma letra maiúscula'
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Senha deve conter pelo menos uma letra minúscula'
  }
  
  if (!/\d/.test(password)) {
    return 'Senha deve conter pelo menos um número'
  }
  
  return null
}

/**
 * Validate URL
 */
export function validateURL(url: string): string | null {
  if (!url) return 'URL é obrigatória'
  
  try {
    new URL(url)
    return null
  } catch {
    return 'URL inválida'
  }
}

/**
 * Validate medication dosage
 */
export function validateDosage(value: number, unit: string): string | null {
  if (!value || value <= 0) {
    return 'Dosagem deve ser maior que zero'
  }
  
  if (!unit || unit.trim() === '') {
    return 'Unidade da dosagem é obrigatória'
  }
  
  return null
}

/**
 * Validate medication schedule times
 */
export function validateScheduleTimes(times: string[]): string | null {
  if (!times || times.length === 0) {
    return 'Pelo menos um horário deve ser definido'
  }
  
  for (const time of times) {
    const timeValidation = validateTime(time)
    if (timeValidation) {
      return timeValidation
    }
  }
  
  // Check for duplicate times
  const uniqueTimes = new Set(times)
  if (uniqueTimes.size !== times.length) {
    return 'Horários não podem ser duplicados'
  }
  
  return null
}

/**
 * Validate stock threshold
 */
export function validateStockThreshold(current: number, threshold: number): string | null {
  if (threshold < 0) {
    return 'Limite de estoque deve ser positivo'
  }
  
  if (threshold >= current) {
    return 'Limite de estoque deve ser menor que o estoque atual'
  }
  
  return null
}

/**
 * Validate installment data
 */
export function validateInstallment(current: number, total: number): string | null {
  if (current < 1 || total < 1) {
    return 'Número de parcelas deve ser maior que zero'
  }
  
  if (current > total) {
    return 'Parcela atual não pode ser maior que o total'
  }
  
  if (total > 999) {
    return 'Número máximo de parcelas é 999'
  }
  
  return null
}

/**
 * Validate budget amount
 */
export function validateBudget(amount: number, spent: number = 0): string | null {
  const amountValidation = validateAmount(amount, 'Orçamento')
  if (amountValidation) return amountValidation
  
  if (amount < spent) {
    return 'Orçamento não pode ser menor que o valor já gasto'
  }
  
  return null
}

/**
 * Generic form validation helper
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  validators: Record<keyof T, (value: any) => string | null>
): Record<keyof T, string | null> {
  const errors: Record<keyof T, string | null> = {} as any
  
  for (const field in validators) {
    const validator = validators[field]
    const value = data[field]
    errors[field] = validator(value)
  }
  
  return errors
}

/**
 * Check if form has any errors
 */
export function hasFormErrors<T extends Record<string, any>>(
  errors: Record<keyof T, string | null>
): boolean {
  return Object.values(errors).some(error => error !== null)
}

