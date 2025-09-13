// Hook para geolocalização inteligente
import { useState, useCallback, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface LocationData {
  lat: number
  lng: number
  accuracy: number
  address?: string
  placeName?: string
  category?: string
}

export interface ExpenseLocation extends LocationData {
  id: string
  expenseId: string
  timestamp: Date
  isFrequent?: boolean
  visitCount?: number
}

export interface LocationSuggestion {
  location: LocationData
  distance: number
  visitCount: number
  lastVisit: Date
  suggestedCategory?: string
  averageAmount?: number
}

export function useGeolocation() {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [locationHistory, setLocationHistory] = useLocalStorage<ExpenseLocation[]>('location-history', [])
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')

  // Verificar permissões de localização
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          setLocationPermission(result.state as any)
          
          result.onchange = () => {
            setLocationPermission(result.state as any)
          }
        })
        .catch(() => {
          // Fallback se não suportar Permissions API
          setLocationPermission('prompt')
        })
    }
  }, [])

  // Obter localização atual
  const getCurrentLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada neste navegador'))
        return
      }

      setIsLocating(true)
      setLocationError(null)

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minuto de cache
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const locationData: LocationData = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            }

            // Tentar obter endereço via reverse geocoding
            try {
              const address = await reverseGeocode(locationData.lat, locationData.lng)
              locationData.address = address.formatted
              locationData.placeName = address.placeName
              locationData.category = address.category
            } catch (geoError) {
              console.warn('Erro no reverse geocoding:', geoError)
            }

            setCurrentLocation(locationData)
            setIsLocating(false)
            resolve(locationData)
          } catch (error) {
            setIsLocating(false)
            const errorMessage = 'Erro ao processar localização'
            setLocationError(errorMessage)
            reject(new Error(errorMessage))
          }
        },
        (error) => {
          setIsLocating(false)
          let errorMessage = 'Erro desconhecido de localização'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permissão de localização negada'
              setLocationPermission('denied')
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Localização indisponível'
              break
            case error.TIMEOUT:
              errorMessage = 'Timeout na obtenção da localização'
              break
          }
          
          setLocationError(errorMessage)
          reject(new Error(errorMessage))
        },
        options
      )
    })
  }, [])

  // Reverse geocoding simplificado (sem API externa por enquanto)
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<{
    formatted: string
    placeName: string
    category: string
  }> => {
    // Mock implementation - em produção usar Google Maps, Mapbox, etc.
    const mockAddresses = [
      { 
        formatted: 'Rua das Flores, 123 - Centro, São Paulo - SP',
        placeName: 'Restaurante do João',
        category: 'Alimentação'
      },
      {
        formatted: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
        placeName: 'Shopping Center',
        category: 'Compras'
      },
      {
        formatted: 'Rua Augusta, 456 - Consolação, São Paulo - SP',
        placeName: 'Posto de Gasolina',
        category: 'Transporte'
      }
    ]

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return mockAddresses[Math.floor(Math.random() * mockAddresses.length)]
  }, [])

  // Salvar localização de uma despesa
  const saveExpenseLocation = useCallback(async (expenseId: string, location?: LocationData) => {
    try {
      const locationToSave = location || await getCurrentLocation()
      
      const expenseLocation: ExpenseLocation = {
        ...locationToSave,
        id: `loc-${Date.now()}-${Math.random()}`,
        expenseId,
        timestamp: new Date()
      }

      setLocationHistory(prev => {
        const updated = [expenseLocation, ...prev]
        
        // Marcar locais frequentes (3+ visitas no mesmo raio de 100m)
        const frequentLocations = updated.map(loc => {
          const nearbyCount = updated.filter(other => 
            other.id !== loc.id &&
            calculateDistance(loc.lat, loc.lng, other.lat, other.lng) <= 100
          ).length

          return {
            ...loc,
            isFrequent: nearbyCount >= 2,
            visitCount: nearbyCount + 1
          }
        })

        return frequentLocations.slice(0, 1000) // Manter últimas 1000 localizações
      })

      return expenseLocation
    } catch (error) {
      console.error('Erro ao salvar localização:', error)
      throw error
    }
  }, [getCurrentLocation, setLocationHistory])

  // Calcular distância entre dois pontos
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3 // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }, [])

  // Obter sugestões baseadas na localização atual
  const getLocationSuggestions = useCallback(async (currentLoc?: LocationData): Promise<LocationSuggestion[]> => {
    try {
      const location = currentLoc || await getCurrentLocation()
      
      // Agrupar localizações próximas (raio de 200m)
      const locationGroups = new Map<string, ExpenseLocation[]>()
      
      locationHistory.forEach(histLoc => {
        const distance = calculateDistance(
          location.lat, location.lng,
          histLoc.lat, histLoc.lng
        )
        
        if (distance <= 200) {
          const key = `${Math.round(histLoc.lat * 1000)}_${Math.round(histLoc.lng * 1000)}`
          if (!locationGroups.has(key)) {
            locationGroups.set(key, [])
          }
          locationGroups.get(key)!.push(histLoc)
        }
      })

      // Criar sugestões baseadas nos grupos
      const suggestions: LocationSuggestion[] = []
      
      locationGroups.forEach(group => {
        if (group.length >= 2) { // Pelo menos 2 visitas
          const representative = group[0] // Usar primeira localização como representativa
          const lastVisit = new Date(Math.max(...group.map(g => g.timestamp.getTime())))
          const distance = calculateDistance(
            location.lat, location.lng,
            representative.lat, representative.lng
          )

          suggestions.push({
            location: {
              lat: representative.lat,
              lng: representative.lng,
              accuracy: representative.accuracy,
              address: representative.address,
              placeName: representative.placeName,
              category: representative.category
            },
            distance,
            visitCount: group.length,
            lastVisit,
            suggestedCategory: representative.category,
            averageAmount: 0 // TODO: calcular com base no histórico de despesas
          })
        }
      })

      // Ordenar por relevância (frequência + proximidade + recência)
      return suggestions
        .sort((a, b) => {
          const scoreA = (a.visitCount * 10) - (a.distance / 100) + (Date.now() - a.lastVisit.getTime()) / (1000 * 60 * 60 * 24)
          const scoreB = (b.visitCount * 10) - (b.distance / 100) + (Date.now() - b.lastVisit.getTime()) / (1000 * 60 * 60 * 24)
          return scoreB - scoreA
        })
        .slice(0, 5)
        
    } catch (error) {
      console.error('Erro ao obter sugestões de localização:', error)
      return []
    }
  }, [getCurrentLocation, locationHistory, calculateDistance])

  // Obter locais frequentes
  const getFrequentLocations = useCallback(() => {
    return locationHistory
      .filter(loc => loc.isFrequent)
      .sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0))
      .slice(0, 10)
  }, [locationHistory])

  // Obter estatísticas de localização
  const getLocationStats = useCallback(() => {
    const totalLocations = locationHistory.length
    const frequentCount = locationHistory.filter(loc => loc.isFrequent).length
    const categoryCounts = locationHistory.reduce((acc, loc) => {
      if (loc.category) {
        acc[loc.category] = (acc[loc.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const topCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0]

    return {
      totalLocations,
      frequentCount,
      categoryCounts,
      topCategory,
      averageAccuracy: totalLocations > 0 
        ? locationHistory.reduce((sum, loc) => sum + loc.accuracy, 0) / totalLocations 
        : 0
    }
  }, [locationHistory])

  // Limpar histórico de localizações
  const clearLocationHistory = useCallback(() => {
    setLocationHistory([])
  }, [setLocationHistory])

  // Exportar localizações para análise
  const exportLocations = useCallback(() => {
    const data = {
      locations: locationHistory,
      stats: getLocationStats(),
      exportDate: new Date()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expense-locations-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [locationHistory, getLocationStats])

  return {
    // Estado
    currentLocation,
    locationHistory,
    isLocating,
    locationError,
    locationPermission,

    // Ações principais
    getCurrentLocation,
    saveExpenseLocation,
    
    // Sugestões e análise
    getLocationSuggestions,
    getFrequentLocations,
    getLocationStats,
    
    // Utilitários
    calculateDistance,
    clearLocationHistory,
    exportLocations,
    
    // Estado de permissões
    isLocationAvailable: locationPermission === 'granted' && !locationError
  }
}