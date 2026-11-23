import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  type Column,
} from '@/shared/ui'
import { toast } from '@/shared/ui/Toaster'
import { toAppError } from '@/lib/errors'
import { strokeLabel } from '@/shared/utils/labels'
import {
  catalogEventSchema,
  useEventCatalog,
  useToggleCatalogEvent,
  useUpsertCatalogEvent,
  type CatalogEvent,
  type CatalogEventInput,
} from './api'

export function CatalogPage() {
  const catalog = useEventCatalog()
  const upsert = useUpsertCatalogEvent()
  const toggle = useToggleCatalogEvent()
  const [editing, setEditing] = useState<CatalogEvent | 'new' | null>(null)
  const form = useForm<CatalogEventInput>({ resolver: zodResolver(catalogEventSchema) })

  const openEditor = (ev: CatalogEvent | 'new') => {
    setEditing(ev)
    form.reset(
      ev === 'new'
        ? {
            distance_m: 50,
            stroke: 'free',
            name: '',
            external_code: '',
            is_relay: false,
            sort_order: (catalog.data?.length ?? 0) * 10 + 10,
          }
        : {
            distance_m: ev.distance_m,
            stroke: ev.stroke,
            name: ev.name,
            external_code: ev.external_code ?? '',
            is_relay: ev.is_relay,
            sort_order: ev.sort_order,
          },
    )
  }

  const columns: Column<CatalogEvent>[] = [
    { key: 'name', header: 'Prueba', cell: (e) => <span className="font-semibold">{e.name}</span> },
    {
      key: 'distance',
      header: 'Distancia',
      hideOnMobile: true,
      cell: (e) => <span className="tnum">{e.distance_m} m</span>,
    },
    { key: 'stroke', header: 'Estilo', hideOnMobile: true, cell: (e) => strokeLabel[e.stroke] },
    {
      key: 'code',
      header: 'Código externo',
      hideOnMobile: true,
      cell: (e) => <span className="tnum text-steel-600">{e.external_code ?? '—'}</span>,
    },
    {
      key: 'active',
      header: 'Estado',
      align: 'right',
      cell: (e) => (
        <div className="flex items-center justify-end gap-2">
          <Badge tone={e.is_active ? 'success' : 'neutral'}>
            {e.is_active ? 'Activa' : 'Inactiva'}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={(ev) => {
              ev.stopPropagation()
              toggle.mutate(
                { id: e.id, is_active: !e.is_active },
                { onError: (err) => toast.error(toAppError(err).message) },
              )
            }}
          >
            {e.is_active ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Catálogo de pruebas"
        description="Pruebas disponibles para habilitar en cada competencia. El código externo se usa en las exportaciones."
        actions={
          <Button leftIcon={<Plus className="size-4" />} onClick={() => openEditor('new')}>
            Nueva prueba
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={catalog.data}
        rowKey={(e) => e.id}
        loading={catalog.isLoading}
        onRowClick={openEditor}
        dense
      />
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Nueva prueba' : 'Editar prueba'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              loading={upsert.isPending}
              onClick={form.handleSubmit(async (v) => {
                try {
                  await upsert.mutateAsync({
                    ...v,
                    id: editing && editing !== 'new' ? editing.id : undefined,
                  })
                  toast.success('Prueba guardada')
                  setEditing(null)
                } catch (err) {
                  const e = toAppError(err)
                  toast.error(
                    e.code === 'duplicate'
                      ? 'Ya existe una prueba con esa distancia y estilo.'
                      : e.message,
                  )
                }
              })}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Distancia (m)" error={form.formState.errors.distance_m?.message} required>
            {(p) => <Input {...p} type="number" {...form.register('distance_m')} />}
          </Field>
          <Field label="Estilo" error={form.formState.errors.stroke?.message} required>
            {(p) => (
              <Select {...p} {...form.register('stroke')}>
                {Object.entries(strokeLabel).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field
            label="Nombre"
            error={form.formState.errors.name?.message}
            required
            className="sm:col-span-2"
          >
            {(p) => <Input {...p} {...form.register('name')} placeholder="50 m libre" />}
          </Field>
          <Field
            label="Código externo"
            error={form.formState.errors.external_code?.message}
            hint="Identificador en el software del organizador"
          >
            {(p) => <Input {...p} {...form.register('external_code')} />}
          </Field>
          <Field label="Orden" error={form.formState.errors.sort_order?.message}>
            {(p) => <Input {...p} type="number" {...form.register('sort_order')} />}
          </Field>
          <label className="flex items-center gap-2 text-sm text-navy sm:col-span-2">
            <Checkbox {...form.register('is_relay')} /> Es relevo
          </label>
        </div>
      </Modal>
    </>
  )
}
