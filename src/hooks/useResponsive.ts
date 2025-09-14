import { useState, useEffect } from 'react'

export interface BreakpointConfig {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

export const breakpoints: BreakpointConfig = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export type BreakpointKey = keyof BreakpointConfig

export interface UseResponsiveReturn {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLarge: boolean
  currentBreakpoint: BreakpointKey | null
  isBreakpoint: (breakpoint: BreakpointKey) => boolean
  isAboveBreakpoint: (breakpoint: BreakpointKey) => boolean
  isBelowBreakpoint: (breakpoint: BreakpointKey) => boolean
  isTouchDevice: boolean
  isPortrait: boolean
  isLandscape: boolean
  isRetina: boolean
}

export function useResponsive(): UseResponsiveReturn {
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  }))

  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    const handleTouchDetection = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }

    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('touchstart', handleTouchDetection, { once: true, passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('touchstart', handleTouchDetection)
    }
  }, [])

  const { width, height } = dimensions

  // Determine current breakpoint
  const getCurrentBreakpoint = (): BreakpointKey | null => {
    if (width >= breakpoints['2xl']) return '2xl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    if (width >= breakpoints.xs) return 'xs'
    return null
  }

  const currentBreakpoint = getCurrentBreakpoint()

  // Helper functions
  const isBreakpoint = (breakpoint: BreakpointKey): boolean => {
    return currentBreakpoint === breakpoint
  }

  const isAboveBreakpoint = (breakpoint: BreakpointKey): boolean => {
    if (!currentBreakpoint) return false
    const currentValue = breakpoints[currentBreakpoint]
    const targetValue = breakpoints[breakpoint]
    return currentValue >= targetValue
  }

  const isBelowBreakpoint = (breakpoint: BreakpointKey): boolean => {
    const targetValue = breakpoints[breakpoint]
    return width < targetValue
  }

  // Common device categories
  const isMobile = width < breakpoints.md
  const isTablet = width >= breakpoints.md && width < breakpoints.lg
  const isDesktop = width >= breakpoints.lg
  const isLarge = width >= breakpoints.xl

  // Orientation
  const isPortrait = height > width
  const isLandscape = width > height

  // Retina detection
  const isRetina = typeof window !== 'undefined' ? window.devicePixelRatio > 1 : false

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLarge,
    currentBreakpoint,
    isBreakpoint,
    isAboveBreakpoint,
    isBelowBreakpoint,
    isTouchDevice,
    isPortrait,
    isLandscape,
    isRetina,
  }
}

// Hook para detectar se está em uma específica query de mídia
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches)

    setMatches(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

// Hook para detectar orientação
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'portrait'
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  })

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    window.addEventListener('resize', handleOrientationChange, { passive: true })
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true })

    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return orientation
}

// Hook para detectar safe areas (iOS)
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }))

  useEffect(() => {
    if (typeof window === 'undefined' || !CSS.supports('padding', 'env(safe-area-inset-top)')) {
      return
    }

    const updateSafeArea = () => {
      const computedStyle = window.getComputedStyle(document.documentElement)
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0,
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0,
      })
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea, { passive: true })
    window.addEventListener('orientationchange', updateSafeArea, { passive: true })

    return () => {
      window.removeEventListener('resize', updateSafeArea)
      window.removeEventListener('orientationchange', updateSafeArea)
    }
  }, [])

  return safeArea
}