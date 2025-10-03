import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSpring, animated } from '@react-spring/web'
import { useState } from 'react'

interface FloatingActionButtonProps {
  onClick: () => void
  className?: string
  children?: React.ReactNode
}

export function FloatingActionButton({ 
  onClick, 
  className, 
  children 
}: FloatingActionButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const springProps = useSpring({
    transform: isPressed ? 'scale(0.95)' : 'scale(1)',
    config: { tension: 300, friction: 10 }
  })

  const glowProps = useSpring({
    boxShadow: isPressed 
      ? '0 4px 20px rgba(59, 130, 246, 0.4)' 
      : '0 8px 25px rgba(59, 130, 246, 0.3)',
    config: { tension: 300, friction: 10 }
  })

  return (
    <animated.div
      style={{ ...springProps, ...glowProps }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        onClick={onClick}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        className={cn(
          "w-14 h-14 rounded-full",
          "bg-primary hover:bg-primary/90",
          "shadow-strong hover:shadow-glow",
          "transition-all duration-200",
          "touch-target no-select",
          "active:scale-95 touch:active:scale-95",
          "border-2 border-primary-200/50",
          className
        )}
        size="icon"
      >
        {children || <Plus className="h-6 w-6 text-primary-foreground" />}
      </Button>
    </animated.div>
  )
}

interface ExpandableFABProps {
  mainAction: () => void
  actions: Array<{
    icon: React.ReactNode
    label: string
    onClick: () => void
    color?: string
  }>
  className?: string
}

export function ExpandableFAB({ 
  mainAction, 
  actions, 
  className 
}: ExpandableFABProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const mainButtonSpring = useSpring({
    transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
    config: { tension: 300, friction: 20 }
  })

  const overlaySpring = useSpring({
    opacity: isExpanded ? 1 : 0,
    config: { tension: 300, friction: 20 }
  })

  const actionsSpring = useSpring({
    transform: isExpanded ? 'translateY(0px)' : 'translateY(20px)',
    opacity: isExpanded ? 1 : 0,
    config: { tension: 300, friction: 20 }
  })

  const handleMainClick = () => {
    if (isExpanded) {
      setIsExpanded(false)
    } else if (actions.length > 0) {
      setIsExpanded(true)
    } else {
      mainAction()
    }
  }

  return (
    <>
      {/* Overlay */}
      <animated.div
        style={overlaySpring}
        className={cn(
          "fixed inset-0 bg-black/20 z-40",
          isExpanded ? "pointer-events-auto" : "pointer-events-none"
        )}
        onClick={() => setIsExpanded(false)}
      />

      {/* Action Buttons */}
      {actions.length > 0 && (
        <animated.div
          style={actionsSpring}
          className="fixed bottom-24 right-6 z-50 space-y-3"
        >
          {actions.map((action, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="bg-white px-3 py-2 rounded-2xl shadow-medium text-sm font-medium whitespace-nowrap">
                {action.label}
              </div>
              <Button
                onClick={() => {
                  action.onClick()
                  setIsExpanded(false)
                }}
                className={cn(
                  "w-12 h-12 rounded-full shadow-medium",
                  "transition-all duration-200",
                  "hover:scale-110 active:scale-95",
                  action.color || "bg-white hover:bg-gray-50 text-gray-700"
                )}
                size="icon"
              >
                {action.icon}
              </Button>
            </div>
          ))}
        </animated.div>
      )}

      {/* Main Button */}
      <animated.div
        style={mainButtonSpring}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={handleMainClick}
          className={cn(
            "w-14 h-14 rounded-full",
            "bg-primary hover:bg-primary/90",
            "shadow-strong hover:shadow-glow",
            "transition-all duration-200",
            "touch-target no-select",
            "border-2 border-primary-200/50",
            className
          )}
          size="icon"
        >
          <Plus className="h-6 w-6 text-primary-foreground" />
        </Button>
      </animated.div>
    </>
  )
}