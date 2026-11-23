import { describe, expect, it } from 'vitest'
import { formatCs, parseTimeToCs, normalizeTimeInput } from './time'

describe('parseTimeToCs', () => {
  it('parses canonical formats', () => {
    expect(parseTimeToCs('00:29.45')).toBe(2945)
    expect(parseTimeToCs('01:05.32')).toBe(6532)
    expect(parseTimeToCs('02:14.78')).toBe(13478)
  })
  it('parses short formats', () => {
    expect(parseTimeToCs('29.45')).toBe(2945)
    expect(parseTimeToCs('1:05.3')).toBe(6530)
    expect(parseTimeToCs('29,45')).toBe(2945)
    expect(parseTimeToCs('30')).toBe(3000)
  })
  it('rejects invalid input', () => {
    expect(parseTimeToCs('')).toBeNull()
    expect(parseTimeToCs('abc')).toBeNull()
    expect(parseTimeToCs('1:75.00')).toBeNull()
    expect(parseTimeToCs('00:00.00')).toBeNull()
    expect(parseTimeToCs('1.2.3')).toBeNull()
  })
})

describe('formatCs', () => {
  it('formats with two-digit minutes', () => {
    expect(formatCs(2945)).toBe('00:29.45')
    expect(formatCs(13478)).toBe('02:14.78')
    expect(formatCs(5)).toBe('00:00.05')
  })
  it('compact drops zero minutes', () => {
    expect(formatCs(2945, { compact: true })).toBe('29.45')
    expect(formatCs(6532, { compact: true })).toBe('01:05.32')
  })
  it('handles null', () => expect(formatCs(null)).toBe('—'))
})

describe('normalizeTimeInput', () => {
  it('round-trips', () => {
    expect(normalizeTimeInput('29.4')).toBe('00:29.40')
    expect(normalizeTimeInput('bad')).toBe('bad')
  })
})
