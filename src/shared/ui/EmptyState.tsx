import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center animate-fade-in',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-aqua-100 text-ocean">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-navy">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-steel-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
