import { useEffect, useState } from 'react'
import { DatabaseMiddleware } from '@/lib/databaseMiddleware'
import { Household } from '@/types/household'

export function useHousehold(householdId?: string) {
  const [data, setData] = useState<Household | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!householdId) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }

    const fetchHousehold = async () => {
      try {
        setLoading(true)
        const household = await DatabaseMiddleware.get({
          collection: 'households',
          id: householdId
        }) as Household

        setData(household)
        setError(null)
      } catch (err) {
        setError(err as Error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchHousehold()
  }, [householdId])

  return {
    data,
    error,
    loading
  }
}