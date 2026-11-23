import { fmtDateTime } from '@/shared/utils/dates'
import { registrationStatusLabel } from '@/shared/utils/labels'
import type { Tables } from '@/lib/supabase'

type Row = Tables<'registration_status_history'> & { actor: { full_name: string } | null }

export function StatusTimeline({ rows }: { rows: Row[] | undefined }) {
  if (!rows?.length)
    return <p className="px-5 py-4 text-sm text-steel-600">Sin cambios de estado todavía.</p>
  return (
    <ol className="flex flex-col gap-0 px-5 py-2">
      {rows.map((r, i) => (
        <li key={r.id} className="relative flex gap-3 pb-4 last:pb-2">
          {i < rows.length - 1 && (
            <span aria-hidden className="absolute top-4 left-[5px] h-full w-px bg-ice-200" />
          )}
          <span
            aria-hidden
            className={`mt-1.5 size-2.5 shrink-0 rounded-full ${i === 0 ? 'bg-aqua' : 'bg-steel'}`}
          />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-navy">
              {r.from_status ? `${registrationStatusLabel[r.from_status]} → ` : ''}
              {registrationStatusLabel[r.to_status]}
            </p>
            <p className="text-xs text-steel-600">
              {fmtDateTime(r.changed_at)}
              {r.actor?.full_name ? ` · ${r.actor.full_name}` : ''}
            </p>
            {r.reason && (
              <p className="mt-1 rounded bg-warning-100 px-2 py-1 text-xs text-[#8a5a00]">
                {r.reason}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
