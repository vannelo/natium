import { Link } from 'react-router-dom'
import { ShieldOff, SearchX, WifiOff } from 'lucide-react'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

export function ForbiddenPage() {
  return (
    <EmptyState
      icon={<ShieldOff className="size-6" />}
      title="Permisos insuficientes"
      description="Tu cuenta no tiene acceso a esta sección. Si crees que es un error, contacta al administrador."
      action={
        <Button variant="secondary" onClick={() => history.back()}>
          Regresar
        </Button>
      }
      className="min-h-[60vh]"
    />
  )
}

export function NotFoundPage() {
  return (
    <EmptyState
      icon={<SearchX className="size-6" />}
      title="Página no encontrada"
      description="La ruta que buscas no existe o fue movida."
      action={
        <Link to="/">
          <Button>Ir al inicio</Button>
        </Link>
      }
      className="min-h-[60vh]"
    />
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<WifiOff className="size-6" />}
      title="No se pudo cargar la información"
      description={message ?? 'Intenta de nuevo en unos segundos.'}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        )
      }
    />
  )
}
