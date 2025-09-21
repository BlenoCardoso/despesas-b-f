export type FeatureFlagKey = 'ATTACHMENTS_ENABLED' | 'PUSH_ENABLED' | 'PRO_ENABLED'

export const FEATURE_FLAGS: Record<FeatureFlagKey, boolean> = {
  ATTACHMENTS_ENABLED: false,
  PUSH_ENABLED: false,
  PRO_ENABLED: false,
}

const STORAGE_KEY = 'despesas_feature_flags'

export function getFlag<K extends FeatureFlagKey>(key: K): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return FEATURE_FLAGS[key]
    const parsed = JSON.parse(raw) as Partial<Record<FeatureFlagKey, boolean>>
    if (parsed && typeof parsed[key] === 'boolean') return parsed[key] as boolean
  } catch (e) {
    // ignore
  }
  return FEATURE_FLAGS[key]
}

export function setFlag<K extends FeatureFlagKey>(key: K, value: boolean) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
    parsed[key] = value
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  } catch (e) {
    // ignore
  }
}

export default { FEATURE_FLAGS, getFlag, setFlag }
