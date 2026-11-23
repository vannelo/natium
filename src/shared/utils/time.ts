/**
 * Swimming time utilities. Times are stored as integer centiseconds
 * (hundredths of a second). Floats are never used for official times.
 */

const TIME_RE = /^(?:(\d{1,2}):)?(\d{1,2})(?:[.,](\d{1,2}))?$/

/** Parse "mm:ss.cc", "m:ss.cc", "ss.cc" or "ss" into centiseconds. Returns null if invalid. */
export function parseTimeToCs(input: string): number | null {
  const value = input.trim()
  if (!value) return null
  const match = TIME_RE.exec(value)
  if (!match) return null
  const minutes = match[1] ? Number(match[1]) : 0
  const seconds = Number(match[2])
  const centisRaw = match[3] ?? '0'
  const centis = Number(centisRaw.length === 1 ? centisRaw + '0' : centisRaw)
  if (minutes > 59 || seconds > 59 || centis > 99) return null
  // "ss" without minutes may exceed 59 seconds (e.g. "75.20")? Not allowed: use mm:ss.
  const total = minutes * 6000 + seconds * 100 + centis
  return total > 0 ? total : null
}

/** Format centiseconds as "mm:ss.cc". */
export function formatCs(cs: number | null | undefined, opts: { compact?: boolean } = {}): string {
  if (cs == null) return '—'
  const minutes = Math.floor(cs / 6000)
  const seconds = Math.floor((cs % 6000) / 100)
  const centis = cs % 100
  const ss = String(seconds).padStart(2, '0')
  const cc = String(centis).padStart(2, '0')
  if (opts.compact && minutes === 0) return `${ss}.${cc}`
  return `${String(minutes).padStart(2, '0')}:${ss}.${cc}`
}

/** Normalize a free-text time into canonical "mm:ss.cc" or return the input if invalid. */
export function normalizeTimeInput(input: string): string {
  const cs = parseTimeToCs(input)
  return cs == null ? input : formatCs(cs)
}

export const MAX_TIME_CS = 359_999 // 59:59.99
