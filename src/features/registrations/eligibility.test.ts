import { describe, expect, it } from 'vitest'
import { eligibleEvents, resolveCategory } from './eligibility'

const cats = [
  { id: 'c10', sex: null, min_age: 0, max_age: 10, sort_order: 1 },
  { id: 'c12', sex: null, min_age: 11, max_age: 12, sort_order: 2 },
  { id: 'c18f', sex: 'F' as const, min_age: 13, max_age: 99, sort_order: 3 },
]
const events = [
  { id: 'e1', sex: 'F' as const, category_id: null, is_active: true },
  { id: 'e2', sex: 'M' as const, category_id: null, is_active: true },
  { id: 'e3', sex: null, category_id: 'c12', is_active: true },
  { id: 'e4', sex: null, category_id: null, is_active: false },
]

describe('resolveCategory', () => {
  it('uses age on the reference date', () => {
    expect(resolveCategory(cats, { birth_date: '2014-03-12', sex: 'F' }, '2026-03-11')?.id).toBe(
      'c12',
    ) // 11
    expect(resolveCategory(cats, { birth_date: '2014-03-12', sex: 'F' }, '2024-03-11')?.id).toBe(
      'c10',
    ) // 9
  })
  it('respects sex restriction and returns null when none fits', () => {
    expect(resolveCategory(cats, { birth_date: '2010-01-01', sex: 'F' }, '2026-01-01')?.id).toBe(
      'c18f',
    )
    expect(resolveCategory(cats, { birth_date: '2010-01-01', sex: 'M' }, '2026-01-01')).toBeNull()
  })
})

describe('eligibleEvents', () => {
  it('filters by sex, category and active flag', () => {
    const ids = eligibleEvents(
      events,
      cats,
      { birth_date: '2014-03-12', sex: 'F' },
      '2026-03-11',
    ).map((e) => e.id)
    expect(ids).toEqual(['e1', 'e3'])
  })
  it('excludes category-restricted events for other categories', () => {
    const ids = eligibleEvents(
      events,
      cats,
      { birth_date: '2016-01-01', sex: 'M' },
      '2026-01-01',
    ).map((e) => e.id)
    expect(ids).toEqual(['e2'])
  })
})
