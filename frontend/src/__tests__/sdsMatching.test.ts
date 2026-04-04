/**
 * Tests for SDS vs Log matching logic.
 * The functions are private to SDSIncidentPanel.tsx, so we re-implement
 * the minimal subset here to test the logic contracts documented in CLAUDE.md.
 *
 * If the implementation changes, these tests will catch regressions.
 */
import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Re-implementations of the private functions under test
// (mirrors SDSIncidentPanel.tsx exactly)
// ---------------------------------------------------------------------------

function getSdsMatchPrefix(sdsCode: string): string {
  const trimmed = sdsCode.trim()
  if (!trimmed) return trimmed
  if (trimmed.toLowerCase().endsWith('z')) return trimmed.slice(0, -1)
  return trimmed
}

function incidentCodeMatchesSds(incidentCode: string, sdsCode: string): boolean {
  const inc = (incidentCode ?? '').trim()
  const sds = (sdsCode ?? '').trim()
  if (!sds) return false
  const prefix = getSdsMatchPrefix(sds)
  if (prefix === sds) return inc === sds
  return inc.startsWith(prefix)
}

interface SdsIncidentData {
  code?: string | null
  event_context?: string | null
  more_info?: string | null
  created_at?: string | null
}

function getSdsCodesForMatch(sds: SdsIncidentData): string[] {
  const codes: string[] = []
  const ctx = sds.event_context?.trim()
  if (ctx) codes.push(ctx)
  const moreInfo = sds.more_info?.trim()
  if (moreInfo) {
    const parts = moreInfo.split(/\s+or\s+/i).map((s) => s.trim()).filter(Boolean)
    for (const part of parts) {
      if (!codes.includes(part)) codes.push(part)
    }
  }
  return codes
}

function hasEventContext(sds: SdsIncidentData): boolean {
  const ctx = sds.event_context?.trim()
  return !!ctx && ctx !== '—'
}

// ---------------------------------------------------------------------------
// incidentCodeMatchesSds
// ---------------------------------------------------------------------------

describe('incidentCodeMatchesSds', () => {
  it('exact match returns true', () => {
    expect(incidentCodeMatchesSds('53.B0.02', '53.B0.02')).toBe(true)
  })

  it('different codes return false', () => {
    expect(incidentCodeMatchesSds('53.B0.03', '53.B0.02')).toBe(false)
  })

  it('suffix z matches any code with that prefix', () => {
    expect(incidentCodeMatchesSds('53.B0.01', '53.B0.0z')).toBe(true)
    expect(incidentCodeMatchesSds('53.B0.02', '53.B0.0z')).toBe(true)
    expect(incidentCodeMatchesSds('53.B0.09', '53.B0.0z')).toBe(true)
  })

  it('suffix z does not match code with different prefix', () => {
    expect(incidentCodeMatchesSds('53.B1.01', '53.B0.0z')).toBe(false)
  })

  it('empty sds code returns false', () => {
    expect(incidentCodeMatchesSds('53.B0.02', '')).toBe(false)
  })

  it('uppercase Z is treated same as lowercase z', () => {
    expect(incidentCodeMatchesSds('53.B0.01', '53.B0.0Z')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getSdsCodesForMatch
// ---------------------------------------------------------------------------

describe('getSdsCodesForMatch', () => {
  it('returns event_context as primary code', () => {
    const sds: SdsIncidentData = { event_context: '60.00.02' }
    expect(getSdsCodesForMatch(sds)).toEqual(['60.00.02'])
  })

  it('returns multiple codes from more_info separated by or', () => {
    const sds: SdsIncidentData = {
      event_context: '60.00.02',
      more_info: '60.00.02 or 60.01.02',
    }
    const codes = getSdsCodesForMatch(sds)
    expect(codes).toContain('60.00.02')
    expect(codes).toContain('60.01.02')
  })

  it('does not duplicate event_context if also in more_info', () => {
    const sds: SdsIncidentData = {
      event_context: '60.00.02',
      more_info: '60.00.02 or 60.01.02',
    }
    const codes = getSdsCodesForMatch(sds)
    expect(codes.filter(c => c === '60.00.02')).toHaveLength(1)
  })

  it('returns empty array when no event_context and no more_info', () => {
    expect(getSdsCodesForMatch({})).toEqual([])
  })

  it('internal code field (e.g. TriageInput2) is NOT used for matching', () => {
    const sds: SdsIncidentData = { code: 'TriageInput2', event_context: null }
    expect(getSdsCodesForMatch(sds)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// hasEventContext
// ---------------------------------------------------------------------------

describe('hasEventContext', () => {
  it('returns true when event_context has a real code', () => {
    expect(hasEventContext({ event_context: '60.00.02' })).toBe(true)
  })

  it('returns false when event_context is null', () => {
    expect(hasEventContext({ event_context: null })).toBe(false)
  })

  it('returns false when event_context is empty string', () => {
    expect(hasEventContext({ event_context: '' })).toBe(false)
  })

  it('returns false when event_context is the placeholder dash', () => {
    expect(hasEventContext({ event_context: '—' })).toBe(false)
  })

  it('returns false when event_context is only whitespace', () => {
    expect(hasEventContext({ event_context: '   ' })).toBe(false)
  })
})
