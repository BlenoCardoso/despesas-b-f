declare module 'next/navigation' {
  export function usePathname(): string
}

declare module 'next/link' {
  import * as React from 'react'
  const Link: React.ComponentType<any>
  export default Link
}
