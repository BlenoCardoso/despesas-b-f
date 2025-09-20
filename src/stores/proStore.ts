import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProState {
  isPro: boolean
  activateProTrial: () => void
}

export const useProStore = create<ProState>()(
  persist(
    (set) => ({
      isPro: false,
      activateProTrial: () => set({ isPro: true })
    }),
    {
      name: 'pro-store'
    }
  )
)