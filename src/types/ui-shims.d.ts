// Minimal shims for UI components used in TS checking
declare module '@/components/ui/card' {
  import * as React from 'react'
  export const Card: React.ComponentType<any>
  export const CardContent: React.ComponentType<any>
  export default Card
}

declare module '@/components/ui/button' {
  import * as React from 'react'
  const Button: React.ComponentType<any>
  export { Button }
  export default Button
}

declare module '@/components/ui/badge' {
  import * as React from 'react'
  export const Badge: React.ComponentType<any>
  export default Badge
}

declare module '@/components/ui/dropdown-menu' {
  import * as React from 'react'
  export const DropdownMenu: React.ComponentType<any>
  export const DropdownMenuTrigger: React.ComponentType<any>
  export const DropdownMenuContent: React.ComponentType<any>
  export const DropdownMenuItem: React.ComponentType<any>
  export const DropdownMenuSeparator: React.ComponentType<any>
  export default DropdownMenu
}

declare module '@/components/ui/spinner' {
  import * as React from 'react'
  export const Spinner: React.ComponentType<any>
  export default Spinner
}

declare module '@/components/ui/toast' {
  export const toast: any
}
