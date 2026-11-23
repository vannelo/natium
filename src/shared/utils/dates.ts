import { format, formatDistanceToNowStrict, isPast, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const fmtDate = (iso: string | null | undefined) =>
  iso ? format(parseISO(iso), 'd MMM yyyy', { locale: es }) : '—'
export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? format(parseISO(iso), 'd MMM yyyy, HH:mm', { locale: es }) : '—'
export const fmtRelative = (iso: string) =>
  formatDistanceToNowStrict(parseISO(iso), { locale: es, addSuffix: true })
export const isPastIso = (iso: string) => isPast(parseISO(iso))
export const toDateInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '')
export const toDateTimeLocalInput = (iso: string | null | undefined) =>
  iso ? format(parseISO(iso), "yyyy-MM-dd'T'HH:mm") : ''

export function ageOn(birthDate: string, reference: string | Date = new Date()): number {
  const b = parseISO(birthDate)
  const r = typeof reference === 'string' ? parseISO(reference) : reference
  let age = r.getFullYear() - b.getFullYear()
  const m = r.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && r.getDate() < b.getDate())) age--
  return age
}
