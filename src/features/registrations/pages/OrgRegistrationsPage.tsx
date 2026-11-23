import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, DataTable, PageHeader, Select, type Column } from '@/shared/ui'
import { fmtDateTime } from '@/shared/utils/dates'
import { registrationStatusLabel, registrationStatusTone } from '@/shared/utils/labels'
import { useOrgCompetitions } from '@/features/competitions/api'
import type { Enums } from '@/lib/supabase'
import { useOrgRegistrations, type RegistrationListItem } from '../api'

export function OrgRegistrationsPage() {
  const navigate = useNavigate()
  const [competitionId, setCompetitionId] = useState('')
  const [status, setStatus] = useState<Enums<'registration_status'> | ''>('')
  const comps = useOrgCompetitions()
  const regs = useOrgRegistrations(competitionId || undefined, status)
  const columns: Column<RegistrationListItem>[] = [
    {
      key: 'team',
      header: 'Equipo',
      cell: (r) => (
        <div>
          <p className="font-semibold">{r.team?.name}</p>
          <p className="tnum text-xs text-steel-600">{r.folio}</p>
        </div>
      ),
    },
    { key: 'comp', header: 'Competencia', hideOnMobile: true, cell: (r) => r.competition?.name },
    {
      key: 'athletes',
      header: 'Atletas',
      hideOnMobile: true,
      align: 'center',
      cell: (r) => <span className="tnum">{r.athletes_count}</span>,
    },
    {
      key: 'entries',
      header: 'Pruebas',
      hideOnMobile: true,
      align: 'center',
      cell: (r) => <span className="tnum">{r.entries_count}</span>,
    },
    {
      key: 'submitted',
      header: 'Enviada',
      hideOnMobile: true,
      cell: (r) => fmtDateTime(r.submitted_at),
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'right',
      cell: (r) => (
        <Badge tone={registrationStatusTone[r.status]}>{registrationStatusLabel[r.status]}</Badge>
      ),
    },
  ]
  return (
    <>
      <PageHeader
        title="Inscripciones recibidas"
        description="Revisa, solicita correcciones y acepta las inscripciones de cada competencia."
      />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_220px]">
        <Select
          value={competitionId}
          onChange={(e) => setCompetitionId(e.target.value)}
          aria-label="Competencia"
        >
          <option value="">Todas las competencias</option>
          {comps.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          aria-label="Estado"
        >
          <option value="">Todos los estados</option>
          {(Object.keys(registrationStatusLabel) as Enums<'registration_status'>[])
            .filter((s) => s !== 'draft')
            .map((s) => (
              <option key={s} value={s}>
                {registrationStatusLabel[s]}
              </option>
            ))}
        </Select>
      </div>
      <DataTable
        columns={columns}
        rows={regs.data}
        rowKey={(r) => r.id}
        loading={regs.isLoading}
        onRowClick={(r) => navigate(`/registrations/${r.id}`)}
        emptyState={
          <div className="p-8 text-center text-sm text-steel-600">
            No hay inscripciones con estos filtros.
          </div>
        }
      />
    </>
  )
}
