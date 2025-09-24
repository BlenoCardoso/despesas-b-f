declare module '../types/guards' {
  export function hasAttachment(doc: any): boolean
  export function hasFileFilter(filter: any): boolean
  export function hasFileStats(doc: any): boolean
}

declare module '@/features/docs/types/guards' {
  export function hasAttachment(doc: any): boolean
  export function hasFileFilter(filter: any): boolean
  export function hasFileStats(doc: any): boolean
}

declare module './blobStorage' {
  export const blobStorage: {
    store(ref: string, data: Blob | File): Promise<void>
    get(ref: string): Promise<Blob | undefined>
    delete(ref: string): Promise<void>
  }
}

declare module '@/features/docs/services/blobStorage' {
  export const blobStorage: {
    store(ref: string, data: Blob | File): Promise<void>
    get(ref: string): Promise<Blob | undefined>
    delete(ref: string): Promise<void>
  }
}

// UI modal shim for open/onOpenChange props and named exports used in BalanceSummary
declare module '@/components/ui/modal' {
  import { ReactNode } from 'react'
  export interface ModalProps {
    children?: ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    title?: string
  }
  export const Modal: (props: ModalProps) => JSX.Element
  export const ModalContent: any
  export const ModalHeader: any
  export const ModalFooter: any
  export const ModalBody: any
}

// Also provide a loose wildcard for ui components
declare module '@/components/ui/*' {
  const anyExport: any
  export = anyExport
}
