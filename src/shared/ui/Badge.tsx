import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'aqua'

const tones: Record<Tone, string> = {
  neutral: 'bg-ice text-steel-800 border-ice-200',
  info: 'bg-ocean/10 text-ocean border-ocean/20',
  warning: 'bg-warning-100 text-[#8a5a00] border-warning/30',
  success: 'bg-success-100 text-[#126b49] border-success/30',
  danger: 'bg-danger-100 text-[#9b2c34] border-danger/30',
  aqua: 'bg-aqua-100 text-ocean border-aqua/40',
}

export function Badge({
  tone = 'neutral',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...rest}
    />
  )
}
