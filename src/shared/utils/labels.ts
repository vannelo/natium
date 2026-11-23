import type { Enums } from '@/lib/supabase'

export const registrationStatusLabel: Record<Enums<'registration_status'>, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  in_review: 'En revisión',
  needs_correction: 'Requiere corrección',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  exported: 'Exportada',
}

export const registrationStatusTone: Record<
  Enums<'registration_status'>,
  'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'aqua'
> = {
  draft: 'neutral',
  submitted: 'info',
  in_review: 'info',
  needs_correction: 'warning',
  accepted: 'success',
  rejected: 'danger',
  exported: 'aqua',
}

export const competitionStatusLabel: Record<Enums<'competition_status'>, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  closed: 'Inscripciones cerradas',
  finished: 'Finalizada',
}

export const competitionStatusTone: Record<
  Enums<'competition_status'>,
  'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'aqua'
> = {
  draft: 'neutral',
  published: 'success',
  closed: 'warning',
  finished: 'info',
}

export const roleLabel: Record<Enums<'app_role'>, string> = {
  platform_admin: 'Administrador',
  organizer: 'Organizador',
  coach: 'Entrenador',
}

export const sexLabel: Record<Enums<'athlete_sex'>, string> = { F: 'Femenil', M: 'Varonil' }
export const sexShort: Record<Enums<'athlete_sex'>, string> = { F: 'F', M: 'M' }

export const strokeLabel: Record<Enums<'stroke'>, string> = {
  free: 'Libre',
  back: 'Dorso',
  breast: 'Pecho',
  fly: 'Mariposa',
  medley: 'Combinado',
}

export const poolCourseLabel: Record<Enums<'pool_course'>, string> = {
  SCM: 'Curso corto (25 m)',
  LCM: 'Curso largo (50 m)',
  OTHER: 'Otra configuración',
}

export const membershipStatusLabel: Record<Enums<'membership_status'>, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  revoked: 'Revocado',
}
