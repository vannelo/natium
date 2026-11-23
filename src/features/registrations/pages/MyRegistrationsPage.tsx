import { useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { Badge, Button, DataTable, EmptyState, PageHeader, type Column } from '@/shared/ui'
import { fmtDate, fmtDateTime } from '@/shared/utils/dates'
import { registrationStatusLabel, registrationStatusTone } from '@/shared/utils/labels'
import { useMyRegistrations, type RegistrationListItem } from '../api'

export function MyRegistrationsPage() {
  const navigate = useNavigate()
  const regs = useMyRegistrations()
  const editable = (s: RegistrationListItem['status']) => s === 'draft' || s === 'needs_correction'
  const columns: Column<RegistrationListItem>[] = [
    {
      key: 'comp',
      header: 'Competencia',
      cell: (r) => (
        <div>
          <p className="font-semibold">{r.competition?.name}</p>
          <p className="text-xs text-steel-600">
            {r.team?.name}
            {r.folio ? ` · ${r.folio}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Fecha',
      hideOnMobile: true,
      cell: (r) => fmtDate(r.competition?.start_date),
    },
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
      key: 'updated',
      header: 'Actualizada',
      hideOnMobile: true,
      cell: (r) => fmtDateTime(r.updated_at),
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
        title="Inscripciones"
        description="Borradores, envíos y su estado de revisión."
        actions={<Button onClick={() => navigate('/competitions')}>Inscribir nadadores</Button>}
      />
      <DataTable
        columns={columns}
        rows={regs.data}
        rowKey={(r) => r.id}
        loading={regs.isLoading}
        onRowClick={(r) =>
          navigate(editable(r.status) ? `/registrations/${r.id}/wizard` : `/registrations/${r.id}`)
        }
        emptyState={
          <EmptyState
            icon={<ClipboardList className="size-6" />}
            title="Sin inscripciones"
            description="Elige una competencia publicada para comenzar."
            action={<Button onClick={() => navigate('/competitions')}>Ver competencias</Button>}
          />
        }
      />
    </>
  )
}
