import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'aqua'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-700 active:bg-navy-800 disabled:bg-steel',
  aqua: 'bg-aqua text-navy hover:bg-aqua-600 active:bg-aqua-600 disabled:bg-steel disabled:text-white',
  secondary:
    'bg-white text-navy border border-ice-200 hover:bg-ice hover:border-steel disabled:text-steel',
  ghost: 'bg-transparent text-ocean hover:bg-ice disabled:text-steel',
  danger: 'bg-danger text-white hover:brightness-95 disabled:bg-steel',
}
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading,
    leftIcon,
    disabled,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-semibold transition-all duration-150 select-none whitespace-nowrap disabled:cursor-not-allowed active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : leftIcon}
      {children}
    </button>
  )
})
