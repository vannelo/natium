import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { Badge, DataTable, PageHeader, SearchInput, Select, type Column } from '@/shared/ui'
import { toast } from '@/shared/ui/Toaster'
import { toAppError } from '@/lib/errors'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { fmtDateTime } from '@/shared/utils/dates'
import { roleLabel } from '@/shared/utils/labels'
import type { Enums, Tables } from '@/lib/supabase'
import { useAllProfiles, useSetProfileRole } from './api'

export function AdminUsersPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const profiles = useAllProfiles(useDebounce(search))
  const setRole = useSetProfileRole()
  const columns: Column<Tables<'profiles'>>[] = [
    {
      key: 'name',
      header: 'Usuario',
      cell: (p) => (
        <div>
          <p className="font-semibold">{p.full_name || '—'}</p>
          <p className="text-xs text-steel-600">{p.email}</p>
        </div>
      ),
    },
    {
      key: 'created',
      header: 'Registro',
      hideOnMobile: true,
      cell: (p) => fmtDateTime(p.created_at),
    },
    {
      key: 'role',
      header: 'Rol',
      align: 'right',
      cell: (p) =>
        p.id === user?.id ? (
          <Badge tone="aqua">{roleLabel[p.role]} (tú)</Badge>
        ) : (
          <Select
            value={p.role}
            aria-label="Rol"
            className="h-8 w-44 text-xs"
            onChange={(e) =>
              setRole.mutate(
                { id: p.id, role: e.target.value as Enums<'app_role'> },
                {
                  onSuccess: () => toast.success('Rol actualizado'),
                  onError: (er) => toast.error(toAppError(er).message),
                },
              )
            }
          >
            {(Object.keys(roleLabel) as Enums<'app_role'>[]).map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </Select>
        ),
    },
  ]
  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Asigna roles de plataforma. Los permisos se aplican en el servidor."
      />
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nombre o correo…"
        className="mb-4 max-w-md"
      />
      <DataTable
        columns={columns}
        rows={profiles.data}
        rowKey={(p) => p.id}
        loading={profiles.isLoading}
      />
    </>
  )
}
