import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, UserRound } from 'lucide-react'
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  type Column,
} from '@/shared/ui'
import { toast } from '@/shared/ui/Toaster'
import { toAppError } from '@/lib/errors'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { ageOn, fmtDate } from '@/shared/utils/dates'
import { sexShort } from '@/shared/utils/labels'
import { useMyTeams } from '@/features/teams/api'
import { useAthletes, useCreateAthlete, type AthleteWithTeam } from '../api'
import { AthleteForm } from '../components/AthleteForm'

const PAGE_SIZE = 25

export function AthletesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const teamId = params.get('team') ?? ''
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('active')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(search)
  const teams = useMyTeams()
  const athletes = useAthletes({ teamId: teamId || undefined, search: debounced, status })
  const create = useCreateAthlete()
  const [open, setOpen] = useState(false)

  const rows = useMemo(
    () => athletes.data?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [athletes.data, page],
  )

  const columns: Column<AthleteWithTeam>[] = [
    {
      key: 'name',
      header: 'Atleta',
      cell: (a) => (
        <div>
          <p className="font-semibold">
            {a.last_name}, {a.first_name}
          </p>
          <p className="text-xs text-steel-600 md:hidden">
            {a.team?.short_name} · {sexShort[a.sex]} · {ageOn(a.birth_date)} años
          </p>
        </div>
      ),
    },
    {
      key: 'id',
      header: 'ID',
      hideOnMobile: true,
      cell: (a) => <span className="tnum text-xs text-steel-600">{a.display_id}</span>,
    },
    { key: 'team', header: 'Equipo', hideOnMobile: true, cell: (a) => a.team?.short_name ?? '—' },
    {
      key: 'sex',
      header: 'Rama',
      hideOnMobile: true,
      align: 'center',
      cell: (a) => sexShort[a.sex],
    },
    {
      key: 'birth',
      header: 'Nacimiento',
      hideOnMobile: true,
      cell: (a) => (
        <span className="tnum">
          {fmtDate(a.birth_date)} · {ageOn(a.birth_date)} años
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'right',
      cell: (a) => (
        <Badge tone={a.status === 'active' ? 'success' : 'neutral'}>
          {a.status === 'active' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ]

  const noTeams = teams.data && teams.data.length === 0

  return (
    <>
      <PageHeader
        title="Atletas"
        description="Expedientes permanentes de tus nadadores, reutilizables en cada competencia."
        actions={
          <Button
            leftIcon={<Plus className="size-4" />}
            onClick={() => setOpen(true)}
            disabled={noTeams}
          >
            Agregar atleta
          </Button>
        }
      />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px_160px]">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder="Buscar por nombre o ID…"
        />
        <Select
          value={teamId}
          onChange={(e) => {
            setParams(e.target.value ? { team: e.target.value } : {})
            setPage(1)
          }}
          aria-label="Equipo"
        >
          <option value="">Todos los equipos</option>
          {teams.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.short_name}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status)
            setPage(1)
          }}
          aria-label="Estado"
        >
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="all">Todos</option>
        </Select>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(a) => a.id}
        loading={athletes.isLoading}
        onRowClick={(a) => navigate(`/athletes/${a.id}`)}
        emptyState={
          <EmptyState
            icon={<UserRound className="size-6" />}
            title={noTeams ? 'Primero necesitas un equipo' : 'Sin atletas'}
            description={
              noTeams
                ? 'Crea o únete a un equipo para registrar nadadores.'
                : debounced
                  ? 'Ningún atleta coincide con la búsqueda.'
                  : 'Agrega tu primer nadador para comenzar.'
            }
            action={
              noTeams ? (
                <Button onClick={() => navigate('/teams')}>Ir a equipos</Button>
              ) : (
                <Button onClick={() => setOpen(true)}>Agregar atleta</Button>
              )
            }
          />
        }
      />
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={athletes.data?.length ?? 0}
        onChange={setPage}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo atleta"
        description="Los datos mínimos necesarios para inscribir. Se detectan duplicados automáticamente."
        size="lg"
      >
        <AthleteForm
          defaultTeamId={teamId || teams.data?.[0]?.id}
          submitLabel="Registrar atleta"
          onCancel={() => setOpen(false)}
          onSubmit={async (values) => {
            try {
              await create.mutateAsync(values)
              toast.success('Atleta registrado')
              setOpen(false)
            } catch (err) {
              const e = toAppError(err)
              toast.error(
                e.code === 'duplicate'
                  ? 'Ya existe un atleta con el mismo nombre y fecha de nacimiento en este equipo.'
                  : e.message,
              )
            }
          }}
        />
      </Modal>
    </>
  )
}
