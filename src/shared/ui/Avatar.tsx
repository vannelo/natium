import { cn } from '@/shared/utils/cn'

export function Avatar({
  name,
  className,
  size = 'md',
}: {
  name: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-ocean font-bold text-white',
        size === 'sm' && 'size-7 text-[10px]',
        size === 'md' && 'size-9 text-xs',
        size === 'lg' && 'size-14 text-lg',
        className,
      )}
    >
      {initials || '?'}
    </span>
  )
}
