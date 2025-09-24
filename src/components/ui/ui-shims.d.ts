declare module '@/components/ui/*' {
  // Minimal shim to provide named exports for JS-based UI components during Batch 1 cleanup.
  // Each export is typed as 'any' to avoid cascading TS errors. Replace with proper types later.
  export const Sheet: any;
  export const SheetContent: any;
  export const SheetHeader: any;
  export const SheetTitle: any;
  export const SheetDescription: any;
  export const SheetTrigger: any;

  export const Popover: any;
  export const PopoverContent: any;
  export const PopoverTrigger: any;
  export const PopoverClose: any;

  export const Card: any;
  export const CardHeader: any;
  export const CardFooter: any;
  export const CardContent: any;
  export const CardTitle: any;
  export const CardDescription: any;

  export const Button: any;
  export const Input: any;
  export const Textarea: any;
  export const Form: any;
  export const Slider: any;
  export const Progress: any;
  export const Select: any;
  export const DropdownMenu: any;
  export const DropdownMenuTrigger: any;
  export const DropdownMenuContent: any;
  export const DropdownMenuItem: any;

  export const Tooltip: any;
  export const Switch: any;
  export const Checkbox: any;
  export const Spinner: any;
  export const Table: any;
  export const Badge: any;
  export const SheetRoot: any;

  const _default: any
  export default _default
}
