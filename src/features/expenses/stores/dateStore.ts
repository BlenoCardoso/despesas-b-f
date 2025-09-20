import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DateState {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
}

export const useDateStore = create<DateState>()(
  persist(
    (set) => ({
      selectedDate: new Date(),
      setSelectedDate: (date) => set({ selectedDate: date })
    }),
    {
      name: 'date-store'
    }
  )
)