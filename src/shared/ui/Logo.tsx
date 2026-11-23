import { brand } from '@/config/brand'
import { cn } from '@/shared/utils/cn'

export function Logo({
  variant = 'dark',
  compact,
  className,
}: {
  variant?: 'dark' | 'light'
  compact?: boolean
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 64 64" className="size-8 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="14" fill={variant === 'light' ? '#43C9E8' : '#081826'} />
        <path
          d="M12 38c5 0 5-4 10-4s5 4 10 4 5-4 10-4 5 4 10 4"
          fill="none"
          stroke={variant === 'light' ? '#081826' : '#43C9E8'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M12 26c5 0 5-4 10-4s5 4 10 4 5-4 10-4 5 4 10 4"
          fill="none"
          stroke={variant === 'light' ? '#081826' : '#EEF6FA'}
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".8"
        />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span
            className={cn(
              'block text-lg font-extrabold tracking-tight',
              variant === 'light' ? 'text-white' : 'text-navy',
            )}
          >
            {brand.name}
          </span>
          <span
            className={cn(
              'block text-[10px] font-semibold tracking-[0.18em] uppercase',
              variant === 'light' ? 'text-aqua' : 'text-steel-600',
            )}
          >
            {brand.product.replace(brand.name, '').trim() || brand.descriptor}
          </span>
        </span>
      )}
    </span>
  )
}
