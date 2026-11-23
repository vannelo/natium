/**
 * Client-side mirror of the SQL functions resolve_category / eligible_events,
 * used for instant UI feedback in the wizard. The server re-validates on submit.
 */
import { ageOn } from '@/shared/utils/dates'

export interface CategoryLike {
  id: string
  sex: 'F' | 'M' | null
  min_age: number
  max_age: number
  sort_order: number
}
export interface EventLike {
  id: string
  sex: 'F' | 'M' | null
  category_id: string | null
  is_active: boolean
}
export interface AthleteLike {
  birth_date: string
  sex: 'F' | 'M'
}

export function resolveCategory(
  categories: CategoryLike[],
  athlete: AthleteLike,
  referenceDate: string,
): CategoryLike | null {
  const age = ageOn(athlete.birth_date, referenceDate)
  return (
    [...categories]
      .sort((a, b) => a.sort_order - b.sort_order || a.min_age - b.min_age)
      .find(
        (c) => (c.sex === null || c.sex === athlete.sex) && age >= c.min_age && age <= c.max_age,
      ) ?? null
  )
}

export function eligibleEvents<E extends EventLike>(
  events: E[],
  categories: CategoryLike[],
  athlete: AthleteLike,
  referenceDate: string,
): E[] {
  const cat = resolveCategory(categories, athlete, referenceDate)
  return events.filter(
    (e) =>
      e.is_active &&
      (e.sex === null || e.sex === athlete.sex) &&
      (e.category_id === null || e.category_id === cat?.id),
  )
}
