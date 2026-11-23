import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-ice-200 bg-white shadow-card', className)}
      {...rest}
    />
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-ice-200 px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="text-base font-bold text-navy">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-steel-600">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...rest} />
}
