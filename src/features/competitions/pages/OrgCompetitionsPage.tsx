import { Link, useNavigate } from 'react-router-dom'
import { Plus, Trophy } from 'lucide-react'
import { Alert, Button, Card, CardSkeleton, EmptyState, PageHeader } from '@/shared/ui'
import { useMyOrganization, useOrgCompetitions } from '../api'
import { CompetitionCard } from '../components/CompetitionCard'

export function OrgCompetitionsPage() {
  const navigate = useNavigate()
  const org = useMyOrganization()
  const comps = useOrgCompetitions()

  if (org.data === null) {
    return (
      <>
        <PageHeader title="Competencias" />
        <Alert tone="info" title="Configura tu organización primero">
          Para crear competencias necesitas registrar tu organización.{' '}
          <Link to="/org/organization" className="font-semibold underline">
            Ir a Organización
          </Link>
        </Alert>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Competencias"
        description="Crea convocatorias, configura categorías y pruebas, y publica cuando estén listas."
        actions={
          <Button
            leftIcon={<Plus className="size-4" />}
            onClick={() => navigate('/org/competitions/new')}
            disabled={!org.data}
          >
            Nueva competencia
          </Button>
        }
      />
      {(org.isLoading || comps.isLoading) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}
      {comps.data?.length === 0 && (
        <Card>
          <EmptyState
            icon={<Trophy className="size-6" />}
            title="Aún no tienes competencias"
            description="Crea tu primera convocatoria para recibir inscripciones."
            action={
              <Button onClick={() => navigate('/org/competitions/new')}>Nueva competencia</Button>
            }
          />
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comps.data?.map((c) => (
          <CompetitionCard key={c.id} competition={c} to={`/org/competitions/${c.id}`} />
        ))}
      </div>
    </>
  )
}
