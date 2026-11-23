import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/shared/utils/cn'

const base =
  'w-full rounded-md border bg-white px-3 text-sm text-navy placeholder:text-steel transition-colors focus:border-aqua focus:ring-2 focus:ring-aqua/30 focus:outline-none disabled:bg-ice disabled:text-steel-600 aria-invalid:border-danger aria-invalid:focus:ring-danger/20'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(base, 'h-10 border-ice-200', className)} {...rest} />
  },
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return (
    <textarea ref={ref} className={cn(base, 'min-h-20 border-ice-200 py-2', className)} {...rest} />
  )
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          base,
          'h-10 border-ice-200 pr-8 appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%2397ADBD%27 stroke-width=%272%27%3E%3Cpath d=%27m4 6 4 4 4-4%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_0.6rem_center]',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    )
  },
)

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Checkbox({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'size-4 rounded border-ice-200 text-aqua accent-aqua focus:ring-aqua/30',
          className,
        )}
        {...rest}
      />
    )
  },
)
