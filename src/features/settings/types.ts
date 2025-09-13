export interface UserPreferences {
  // Aparência e Interface
  theme: 'light' | 'dark' | 'system'
  language: 'pt-BR' | 'en-US' | 'es-ES'
  currency: 'BRL' | 'USD' | 'EUR'
  dateFormat: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd'
  
  // Notificações
  notifications: {
    push: boolean
    email: boolean
    sms: boolean
    reminders: boolean
    weeklyReport: boolean
    monthlyReport: boolean
    budgetAlerts: boolean
    medicationReminders: boolean
    taskDeadlines: boolean
  }
  
  // Privacidade e Segurança
  biometricAuth: boolean
  autoLock: boolean
  autoLockTimeout: number // minutos
  dataSharing: boolean
  analytics: boolean
  
  // Funcionalidades
  defaultExpenseCategory: string
  defaultPaymentMethod: string
  budgetWarningPercentage: number
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  syncFrequency: 'realtime' | 'hourly' | 'daily'
}

export interface NotificationSettings {
  id: string
  type: 'expense' | 'medication' | 'task' | 'calendar' | 'budget'
  enabled: boolean
  methods: ('push' | 'email' | 'sms')[]
  timing: {
    immediate: boolean
    daily: string // HH:mm
    weekly: string // day-HH:mm
    monthly: number // day of month
  }
}

export interface BackupSettings {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  location: 'local' | 'cloud' | 'both'
  retention: number // days
  includeAttachments: boolean
  encryption: boolean
}

export interface PrivacySettings {
  dataCollection: boolean
  analytics: boolean
  crashReports: boolean
  personalizedAds: boolean
  dataSharing: boolean
  location: boolean
  contacts: boolean
  calendar: boolean
}

export interface SecuritySettings {
  biometricAuth: boolean
  pinCode: boolean
  autoLock: boolean
  autoLockTimeout: number
  sessionTimeout: number
  twoFactorAuth: boolean
  deviceTrust: boolean
  loginAlerts: boolean
}