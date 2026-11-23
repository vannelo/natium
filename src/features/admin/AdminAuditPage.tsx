import { useState } from 'react'
import { Badge, DataTable, PageHeader, Pagination, Select, type Column } from '@/shared/ui'
import { fmtDateTime } from '@/shared/utils/dates'
import { useAuditLogs } from './api'

type Row = NonNullable<ReturnType<typeof useAuditLogs>['data']>['rows'][number]
const ENTITIES = [
  'teams',
  'athletes',
  'competitions',
  'registrations',
  'team_members',
  'export_jobs',
]

export function AdminAuditPage() {
  const [entity, setEntity] = useState('')
  const [page, setPage] = useState(1)
  const logs = useAuditLogs(entity, page)
  const columns: Column<Row>[] = [
    {
      key: 'when',
      header: 'Fecha',
      cell: (r) => <span className="tnum text-xs">{fmtDateTime(r.created_at)}</span>,
    },
    {
      key: 'actor',
      header: 'Actor',
      hideOnMobile: true,
      cell: (r) => {
        const a = r.actor as { full_name: string; email: string } | null
        return a ? (
          <span title={a.email}>{a.full_name || a.email}</span>
        ) : (
          <span className="text-steel-600">sistema</span>
        )
      },
    },
    {
      key: 'action',
      header: 'Acción',
      cell: (r) => (
        <Badge
          tone={
            r.action.startsWith('rpc')
              ? 'aqua'
              : r.action === 'delete'
                ? 'danger'
                : r.action === 'update'
                  ? 'info'
                  : 'success'
          }
        >
          {r.action}
        </Badge>
      ),
    },
    {
      key: 'entity',
      header: 'Entidad',
      cell: (r) => <span className="font-semibold">{r.entity}</span>,
    },
    {
      key: 'id',
      header: 'ID',
      hideOnMobile: true,
      cell: (r) => <span className="tnum text-xs text-steel-600">{r.entity_id?.slice(0, 8)}…</span>,
    },
  ]
  return (
    <>
      <PageHeader
        title="Auditoría"
        description="Registro de operaciones críticas sobre equipos, atletas, competencias e inscripciones."
      />
      <Select
        value={entity}
        onChange={(e) => {
          setEntity(e.target.value)
          setPage(1)
        }}
        aria-label="Entidad"
        className="mb-4 max-w-xs"
      >
        <option value="">Todas las entidades</option>
        {ENTITIES.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </Select>
      <DataTable
        columns={columns}
        rows={logs.data?.rows}
        rowKey={(r) => String(r.id)}
        loading={logs.isLoading}
        dense
      />
      <Pagination page={page} pageSize={50} total={logs.data?.total ?? 0} onChange={setPage} />
    </>
  )
}
