import { useState } from 'react'
import { Send } from 'lucide-react'
import { Badge, Button, SearchInput, Skeleton } from '@/shared/ui'
import { toast } from '@/shared/ui/Toaster'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { toAppError } from '@/lib/errors'
import { useMyMemberships, useRequestTeamAccess, useSearchTeamsDirectory } from '../api'
import { membershipStatusLabel } from '@/shared/utils/labels'

/** Find existing teams (fuzzy) and request access instead of creating duplicates. */
export function TeamDirectorySearch() {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q)
  const results = useSearchTeamsDirectory(debounced)
  const memberships = useMyMemberships()
  const request = useRequestTeamAccess()

  const statusFor = (teamId: string) => memberships.data?.find((m) => m.team_id === teamId)?.status

  return (
    <div className="flex flex-col gap-3">
      <SearchInput value={q} onChange={setQ} placeholder="Buscar equipo por nombre…" />
      {debounced.trim().length < 2 && (
        <p className="text-xs text-steel-600">
          Escribe al menos 2 caracteres para buscar equipos existentes.
        </p>
      )}
      {results.isLoading && <Skeleton className="h-12 w-full" />}
      {results.data && results.data.length === 0 && (
        <p className="text-sm text-steel-600">
          No encontramos equipos con ese nombre. Puedes crear uno nuevo.
        </p>
      )}
      <ul className="flex flex-col divide-y divide-ice-200 rounded-md border border-ice-200">
        {results.data?.map((t) => {
          const status = statusFor(t.id)
          return (
            <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">{t.name}</p>
                <p className="truncate text-xs text-steel-600">
                  {t.short_name}
                  {t.city ? ` · ${t.city}` : ''}
                  {t.state ? `, ${t.state}` : ''}
                </p>
              </div>
              {status && status !== 'rejected' && status !== 'revoked' ? (
                <Badge tone={status === 'approved' ? 'success' : 'warning'}>
                  {membershipStatusLabel[status]}
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Send className="size-3.5" />}
                  loading={request.isPending && request.variables === t.id}
                  onClick={() =>
                    request.mutate(t.id, {
                      onSuccess: () => toast.success('Solicitud enviada al equipo'),
                      onError: (err) => toast.error(toAppError(err).message),
                    })
                  }
                >
                  Solicitar acceso
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
