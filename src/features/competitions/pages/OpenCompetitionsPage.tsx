import { Trophy } from 'lucide-react'
import { Card, CardSkeleton, EmptyState, PageHeader } from '@/shared/ui'
import { ErrorState } from '@/shared/ui/StatusPages'
import { toAppError } from '@/lib/errors'
import { useOpenCompetitions } from '../api'
import { CompetitionCard } from '../components/CompetitionCard'

export function OpenCompetitionsPage() {
  const comps = useOpenCompetitions()
  return (
    <>
      <PageHeader
        title="Competencias"
        description="Convocatorias publicadas. Inscribe a tus nadadores dentro del periodo habilitado."
      />
      {comps.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}
      {comps.isError && (
        <ErrorState message={toAppError(comps.error).message} onRetry={() => comps.refetch()} />
      )}
      {comps.data?.length === 0 && (
        <Card>
          <EmptyState
            icon={<Trophy className="size-6" />}
            title="No hay competencias publicadas"
            description="Cuando un organizador publique una convocatoria aparecerá aquí."
          />
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comps.data?.map((c) => (
          <CompetitionCard
            key={c.id}
            competition={c}
            to={`/competitions/${c.id}`}
            organizer={(c.organization as { name: string } | null)?.name}
          />
        ))}
      </div>
    </>
  )
}
