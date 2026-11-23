import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface Crumb {
  label: string
  to?: string
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  breadcrumbs?: Crumb[]
}) {
  return (
    <div className="mb-6 animate-rise">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Ruta"
          className="mb-2 flex flex-wrap items-center gap-1 text-xs text-steel-600"
        >
          {breadcrumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {c.to ? (
                <Link to={c.to} className="hover:text-ocean">
                  {c.label}
                </Link>
              ) : (
                <span className="text-steel-800">{c.label}</span>
              )}
              {i < breadcrumbs.length - 1 && <ChevronRight className="size-3" />}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-navy md:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-steel-600 md:text-base">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
