import { Toaster as Sonner, toast } from 'sonner'

export { toast }

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: { toast: 'font-sans rounded-lg border border-ice-200 shadow-float' },
      }}
    />
  )
}
