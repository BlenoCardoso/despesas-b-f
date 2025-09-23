// React import not required explicitly in new JSX transforms
import { ShoppingCart, Home, Zap, Droplet, Wifi, Truck, Heart, Gamepad2, Book, AlertCircle, Tag as TagIcon } from 'lucide-react'

interface Props {
  icon?: string
  className?: string
}

export default function CategoryIcon({ icon, className }: Props) {
  if (!icon) return <TagIcon className={className} aria-hidden />

  const normalized = (icon || '').toLowerCase()
  switch (normalized) {
    case 'shopping-cart':
    case 'mercado':
    case 'market':
      return <ShoppingCart className={className} aria-hidden />
    case 'home':
    case 'aluguel':
      return <Home className={className} aria-hidden />
    case 'zap':
    case 'energia':
      return <Zap className={className} aria-hidden />
    case 'droplet':
    case 'agua':
      return <Droplet className={className} aria-hidden />
    case 'wifi':
    case 'internet':
      return <Wifi className={className} aria-hidden />
    case 'car':
    case 'transporte':
      return <Truck className={className} aria-hidden />
    case 'heart':
    case 'saude':
      return <Heart className={className} aria-hidden />
    case 'gamepad-2':
    case 'lazer':
      return <Gamepad2 className={className} aria-hidden />
    case 'book':
    case 'educacao':
      return <Book className={className} aria-hidden />
    case 'alert-circle':
    case 'imprevistos':
      return <AlertCircle className={className} aria-hidden />
    default:
      // If it's an emoji char, render as text
      if (/\p{Emoji}/u.test(icon)) return <span className={className}>{icon}</span>
      return <TagIcon className={className} aria-hidden />
  }
}
