import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

type Tone = 'info' | 'success' | 'warning' | 'danger'
const styles: Record<Tone, string> = {
  info: 'border-ocean/20 bg-ocean/5 text-ocean',
  success: 'border-success/30 bg-success-100 text-[#126b49]',
  warning: 'border-warning/30 bg-warning-100 text-[#8a5a00]',
  danger: 'border-danger/30 bg-danger-100 text-[#9b2c34]',
}
const icons: Record<Tone, ReactNode> = {
  info: <Info className="size-4" />,
  success: <CheckCircle2 className="size-4" />,
  warning: <AlertTriangle className="size-4" />,
  danger: <XCircle className="size-4" />,
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: Tone
  title?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-md border px-4 py-3 text-sm', styles[tone], className)}
    >
      <span className="mt-0.5 shrink-0">{icons[tone]}</span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  )
}
