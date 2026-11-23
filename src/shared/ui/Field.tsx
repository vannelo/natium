import { useId, type ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby'?: string
  }) => ReactNode
}

/** Label + control + error wrapper that wires accessibility attributes. */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-xs font-semibold tracking-wide text-steel-800 uppercase">
        {label}
        {required && <span className="text-aqua-600"> *</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-steel-600">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
