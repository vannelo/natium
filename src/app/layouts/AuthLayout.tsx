import { Outlet } from 'react-router-dom'
import { brand } from '@/config/brand'
import { WaveBackground } from '@/features/auth/components/WaveBackground'
import { Logo } from '@/shared/ui/Logo'

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-navy p-10 text-white lg:flex">
        <WaveBackground />
        <div className="relative">
          <Logo variant="light" />
        </div>
        <div className="relative max-w-md">
          <p className="text-xs font-semibold tracking-[0.2em] text-aqua uppercase">
            {brand.descriptor}
          </p>
          <h2 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight">
            {brand.tagline}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-steel">
            Equipos, nadadores, pruebas y marcas en un solo lugar. Inscripciones sin doble captura,
            listas para importar en el software del organizador.
          </p>
        </div>
        <p className="relative text-xs text-steel">
          © {new Date().getFullYear()} {brand.name}
        </p>
      </aside>
      <main className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="absolute inset-0 lg:hidden">
          <div className="h-40 bg-navy">
            <div className="relative h-full overflow-hidden">
              <WaveBackground />
            </div>
          </div>
        </div>
        <div className="relative w-full max-w-md animate-rise">
          <div className="mb-6 lg:hidden">
            <Logo variant="light" />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
