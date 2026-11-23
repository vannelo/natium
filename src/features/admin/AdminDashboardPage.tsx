import { ClipboardList, Flag, Shield, Trophy, UserRound, Users } from 'lucide-react'
import { PageHeader, StatCard } from '@/shared/ui'
import { useAdminCounts } from './api'

export function AdminDashboardPage() {
  const counts = useAdminCounts()
  const d = counts.data
  return (
    <>
      <PageHeader
        title="Administración de la plataforma"
        description="Supervisión global de organizaciones, usuarios y actividad."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Usuarios"
          value={d?.profiles}
          icon={<Shield className="size-5" />}
          to="/admin/users"
          loading={counts.isLoading}
        />
        <StatCard
          label="Organizaciones"
          value={d?.organizations}
          icon={<Flag className="size-5" />}
          loading={counts.isLoading}
        />
        <StatCard
          label="Equipos"
          value={d?.teams}
          icon={<Users className="size-5" />}
          loading={counts.isLoading}
        />
        <StatCard
          label="Atletas"
          value={d?.athletes}
          icon={<UserRound className="size-5" />}
          loading={counts.isLoading}
        />
        <StatCard
          label="Competencias"
          value={d?.competitions}
          icon={<Trophy className="size-5" />}
          loading={counts.isLoading}
        />
        <StatCard
          label="Inscripciones"
          value={d?.registrations}
          icon={<ClipboardList className="size-5" />}
          loading={counts.isLoading}
        />
      </div>
    </>
  )
}
