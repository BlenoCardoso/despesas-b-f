// Local shims for focused TypeScript checks
declare module '@/config/features' {
  export const ATTACHMENTS_ENABLED: boolean
}

// Widen MemberRole type locally to include 'guest' for focused checks
declare module '@/features/households/types' {
  export type MemberRole = 'owner' | 'member' | 'guest'
}
