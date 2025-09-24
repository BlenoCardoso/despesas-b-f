// Barrel file for UI components — re-export the common named exports used
// across the codebase. This reduces import mismatches during the initial
// cleanup batch. Files may be .jsx/.tsx/.ts — most export named functions.

export * from './card'
export * from './button'
export * from './input'
export * from './select'
export * from './dropdown-menu'
export * from './popover'
export * from './dialog'
export * from './sheet'
export * from './modal'
export * from './toast'
export * from './checkbox'
export * from './spinner'
export * from './icons'
export * from './calendar'
export * from './date-picker'
export * from './table'
export * from './badge'
export * from './scroll-area'
export * from './tooltip'
export * from './switch'

// Note: This barrel intentionally re-exports many modules to quickly resolve
// missing export errors (TS2614). It's a conservative stop-gap for Batch 1.
// Later we should audit imports and export shapes and remove any duplicates.
