import { Logo } from './Logo'

export function FullPageLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ice"
    >
      <Logo compact />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-ice-200">
        <div className="h-full w-1/2 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-aqua" />
      </div>
      <p className="text-xs font-semibold tracking-wide text-steel-600 uppercase">{label}</p>
    </div>
  )
}
