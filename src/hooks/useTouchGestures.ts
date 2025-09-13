// Hook para gestos touch avançados
import { useState, useCallback, useRef } from 'react'

interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'long-press'
  direction?: 'left' | 'right' | 'up' | 'down'
  distance?: number
  scale?: number
  target?: HTMLElement
}

interface UseTouchGesturesOptions {
  onSwipe?: (gesture: TouchGesture) => void
  onPinch?: (gesture: TouchGesture) => void
  onLongPress?: (gesture: TouchGesture) => void
  onDoubleTap?: (gesture: TouchGesture) => void
  swipeThreshold?: number
  longPressDelay?: number
  pinchThreshold?: number
}

export function useTouchGestures(options: UseTouchGesturesOptions = {}) {
  const {
    onSwipe,
    onPinch,
    onLongPress,
    onDoubleTap,
    swipeThreshold = 50,
    longPressDelay = 500,
    pinchThreshold = 0.1
  } = options

  const [isPressed, setIsPressed] = useState(false)
  const touchStart = useRef<React.TouchList | null>(null)
  const touchEnd = useRef<React.TouchList | null>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const lastTap = useRef<number>(0)
  const initialDistance = useRef<number>(0)

  // Calcular distância entre dois pontos de toque
  const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Detectar direção do swipe
  const getSwipeDirection = useCallback((startTouch: React.Touch, endTouch: React.Touch) => {
    const dx = endTouch.clientX - startTouch.clientX
    const dy = endTouch.clientY - startTouch.clientY
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx > absDy) {
      return dx > 0 ? 'right' : 'left'
    } else {
      return dy > 0 ? 'down' : 'up'
    }
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.touches
    setIsPressed(true)
    
    // Long press detection
    if (onLongPress && e.touches.length === 1) {
      longPressTimer.current = setTimeout(() => {
        onLongPress({
          type: 'long-press',
          target: e.target as HTMLElement
        })
      }, longPressDelay)
    }

    // Multi-touch (pinch) detection
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches[0], e.touches[1])
    }

    // Double tap detection
    const now = Date.now()
    const timeDiff = now - lastTap.current
    if (timeDiff < 300 && timeDiff > 0 && onDoubleTap) {
      onDoubleTap({
        type: 'tap',
        target: e.target as HTMLElement
      })
    }
    lastTap.current = now
  }, [onLongPress, onDoubleTap, longPressDelay, getDistance])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = e.touches
    
    // Clear long press if moving
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    // Pinch gesture
    if (e.touches.length === 2 && onPinch && touchStart.current) {
      const currentDistance = getDistance(e.touches[0], e.touches[1])
      const scale = currentDistance / initialDistance.current
      
      if (Math.abs(scale - 1) > pinchThreshold) {
        onPinch({
          type: 'pinch',
          scale,
          target: e.target as HTMLElement
        })
      }
    }
  }, [onPinch, getDistance, pinchThreshold])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setIsPressed(false)
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    // Swipe detection
    if (touchStart.current && touchEnd.current && onSwipe) {
      const startTouch = touchStart.current[0]
      const endTouch = touchEnd.current[0]
      
      const dx = endTouch.clientX - startTouch.clientX
      const dy = endTouch.clientY - startTouch.clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > swipeThreshold) {
        const direction = getSwipeDirection(startTouch, endTouch)
        onSwipe({
          type: 'swipe',
          direction,
          distance,
          target: e.target as HTMLElement
        })
      }
    }

    touchStart.current = null
    touchEnd.current = null
  }, [onSwipe, swipeThreshold, getSwipeDirection])

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isPressed
  }
}