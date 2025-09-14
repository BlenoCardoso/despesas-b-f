import React from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  fluid?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  as?: keyof JSX.IntrinsicElements
}

export function ResponsiveContainer({
  children,
  className,
  fluid = false,
  maxWidth = 'full',
  padding = 'md',
  as: Component = 'div'
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12'
  }

  return (
    <Component
      className={cn(
        'w-full mx-auto',
        fluid ? 'container-fluid' : 'container',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </Component>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: 'none' | 'sm' | 'md' | 'lg'
  as?: keyof JSX.IntrinsicElements
}

export function ResponsiveGrid({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  as: Component = 'div'
}: ResponsiveGridProps) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  }

  const gridCols = Object.entries(cols)
    .map(([breakpoint, colCount]) => {
      if (breakpoint === 'xs') return `grid-cols-${colCount}`
      return `${breakpoint}:grid-cols-${colCount}`
    })
    .join(' ')

  return (
    <Component
      className={cn(
        'grid',
        gridCols,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </Component>
  )
}

interface ResponsiveStackProps {
  children: React.ReactNode
  className?: string
  direction?: {
    xs?: 'row' | 'col'
    sm?: 'row' | 'col'
    md?: 'row' | 'col'
    lg?: 'row' | 'col'
  }
  gap?: 'none' | 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  as?: keyof JSX.IntrinsicElements
}

export function ResponsiveStack({
  children,
  className,
  direction = { xs: 'col', md: 'row' },
  gap = 'md',
  align = 'start',
  justify = 'start',
  as: Component = 'div'
}: ResponsiveStackProps) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  }

  const flexDirection = Object.entries(direction)
    .map(([breakpoint, dir]) => {
      const directionClass = dir === 'row' ? 'flex-row' : 'flex-col'
      if (breakpoint === 'xs') return directionClass
      return `${breakpoint}:${directionClass}`
    })
    .join(' ')

  return (
    <Component
      className={cn(
        'flex',
        flexDirection,
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        className
      )}
    >
      {children}
    </Component>
  )
}

interface ResponsiveShowProps {
  children: React.ReactNode
  breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  direction?: 'up' | 'down' | 'only'
}

export function ResponsiveShow({ 
  children, 
  breakpoint, 
  direction = 'up' 
}: ResponsiveShowProps) {
  const showClasses = {
    up: {
      sm: 'hidden sm:block',
      md: 'hidden md:block',
      lg: 'hidden lg:block',
      xl: 'hidden xl:block',
      '2xl': 'hidden 2xl:block'
    },
    down: {
      sm: 'block sm:hidden',
      md: 'block md:hidden',
      lg: 'block lg:hidden',
      xl: 'block xl:hidden',
      '2xl': 'block 2xl:hidden'
    },
    only: {
      sm: 'hidden sm:block md:hidden',
      md: 'hidden md:block lg:hidden',
      lg: 'hidden lg:block xl:hidden',
      xl: 'hidden xl:block 2xl:hidden',
      '2xl': 'hidden 2xl:block'
    }
  }

  return (
    <div className={showClasses[direction][breakpoint]}>
      {children}
    </div>
  )
}

interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
  size?: {
    xs?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  }
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function ResponsiveText({
  children,
  className,
  size = { xs: 'base', sm: 'base', md: 'lg' },
  weight = 'normal',
  as: Component = 'p'
}: ResponsiveTextProps) {
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }

  const textSizes = Object.entries(size)
    .map(([breakpoint, textSize]) => {
      if (breakpoint === 'xs') return `text-${textSize}`
      return `${breakpoint}:text-${textSize}`
    })
    .join(' ')

  return (
    <Component
      className={cn(
        textSizes,
        weightClasses[weight],
        className
      )}
    >
      {children}
    </Component>
  )
}