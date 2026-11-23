import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Timer } from 'lucide-react'
import { Badge, Card, CardBody } from '@/shared/ui'
import { fmtDate, fmtDateTime, fmtRelative } from '@/shared/utils/dates'
import {
  competitionStatusLabel,
  competitionStatusTone,
  poolCourseLabel,
} from '@/shared/utils/labels'
import { registrationWindow, type Competition } from '../api'

export function CompetitionCard({
  competition: c,
  to,
  organizer,
}: {
  competition: Competition
  to: string
  organizer?: string | null
}) {
  const win = registrationWindow(c)
  return (
    <Link to={to} className="group block rounded-lg focus-visible:outline-2">
      <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-float">
        <CardBody>
          <div className="flex items-start justify-between gap-2">
            <span className="tnum rounded bg-navy px-2 py-0.5 text-[11px] font-bold tracking-wider text-aqua">
              {c.code}
            </span>
            <Badge tone={competitionStatusTone[c.status]}>{competitionStatusLabel[c.status]}</Badge>
          </div>
          <h3 className="mt-3 line-clamp-2 text-base font-bold text-navy">{c.name}</h3>
          {organizer && <p className="truncate text-xs text-steel-600">{organizer}</p>}
          <dl className="mt-3 flex flex-col gap-1.5 text-xs text-steel-800">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-3.5 text-steel" />
              {fmtDate(c.start_date)}
              {c.end_date !== c.start_date ? ` – ${fmtDate(c.end_date)}` : ''}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 text-steel" />
              {[c.venue, c.city].filter(Boolean).join(', ') || 'Sede por confirmar'} ·{' '}
              {poolCourseLabel[c.pool_course]}
            </div>
            <div className="flex items-center gap-2">
              <Timer className="size-3.5 text-steel" />
              {win === 'open' && (
                <span className="font-semibold text-success">
                  Cierra {fmtRelative(c.registration_closes_at)}
                </span>
              )}
              {win === 'upcoming' && <span>Abre {fmtDateTime(c.registration_opens_at)}</span>}
              {win === 'closed' && <span>Inscripciones cerradas</span>}
            </div>
          </dl>
        </CardBody>
      </Card>
    </Link>
  )
}
