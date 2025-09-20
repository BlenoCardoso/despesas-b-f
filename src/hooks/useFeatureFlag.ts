import { useProStore } from '@/stores/proStore'
import { isFeatureEnabled, ProFeature } from '@/lib/features'

export function useFeatureFlag(feature: ProFeature): boolean {
  const isPro = useProStore(state => state.isPro)
  return isFeatureEnabled(feature, isPro)
}