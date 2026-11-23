import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Input } from './Input'
import { normalizeTimeInput, parseTimeToCs } from '@/shared/utils/time'
import { cn } from '@/shared/utils/cn'

interface TimeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
}

/**
 * Specialized swimming time input. Accepts mm:ss.cc, m:ss.c, ss.cc; normalizes
 * on blur to canonical "mm:ss.cc" and flags invalid input.
 */
export const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(function TimeInput(
  { value, onChange, className, onBlur, ...rest },
  ref,
) {
  const [touched, setTouched] = useState(false)
  const invalid = touched && value.trim() !== '' && parseTimeToCs(value) === null
  return (
    <Input
      ref={ref}
      inputMode="decimal"
      placeholder="00:00.00"
      autoComplete="off"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d:.,]/g, ''))}
      onBlur={(e) => {
        setTouched(true)
        onChange(normalizeTimeInput(e.target.value))
        onBlur?.(e)
      }}
      aria-invalid={invalid || rest['aria-invalid']}
      className={cn('tnum font-semibold tracking-wide', className)}
      {...rest}
    />
  )
})
