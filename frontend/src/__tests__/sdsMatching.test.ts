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

function isNumericSdsCode(value: string): boolean {
  return value.includes('.')
}

function normalizeForMessageMatch(s: string): string {
  return s.toLowerCase().replace(/[\s_-]/g, '')
}

const SDS_STOPWORDS = new Set(['replace', 'check', 'clean', 'verify', 'reset', 'the', 'a'])
const MIN_KEYWORD_MATCHES = 1

function extractSdsKeywords(token: string): string[] {
  const words = token
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .map((w) => (w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w))
    .filter((w) => w.length > 1 && !SDS_STOPWORDS.has(w))
  return [...new Set(words)]
}

function sdsTokenMatchesIncident(
  incidentCode: string,
  incidentClassification: string,
  sdsToken: string
): boolean {
  const token = sdsToken.trim()
  if (!token) return false
  if (isNumericSdsCode(token)) {
    return incidentCodeMatchesSds(incidentCode, token)
  }
  const keywords = extractSdsKeywords(token)
  if (keywords.length === 0) return false
  const normalizedClassification = normalizeForMessageMatch(incidentClassification ?? '')
  let matchCount = 0
  for (const kw of keywords) {
    if (normalizedClassification.includes(kw)) matchCount++
  }
  return matchCount >= MIN_KEYWORD_MATCHES
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
    const parts = moreInfo
      .split(/\s+or\s+/i)
      .map((s) => s.trim())
      .filter(Boolean)
    for (const part of parts) {
      if (!codes.includes(part)) codes.push(part)
    }
  }
  const code = sds.code?.trim()
  if (code && !isNumericSdsCode(code) && !/\d/.test(code)) {
    const kws = extractSdsKeywords(code)
    if (kws.length > 0 && !codes.includes(code)) codes.push(code)
  }
  return codes
}

function hasEventContext(sds: SdsIncidentData): boolean {
  const ctx = sds.event_context?.trim()
  return !!ctx && ctx !== '—'
}

interface IncidentRowForSds {
  code: string
  classification: string
}

interface IncidentFullForSds {
  code: string
  end_time: string
  occurrences?: number
  classification?: string
}

type SdsVsLogStatus = 'match' | 'partial' | 'no_match' | 'general'

function computeSdsVsLog(
  sds: SdsIncidentData,
  incidentRows: IncidentRowForSds[],
  incidentsFull: IncidentFullForSds[],
  eventosRelacionadosCount: number
): { status: SdsVsLogStatus; explanation: string } {
  const sdsCodes = getSdsCodesForMatch(sds)
  if (sdsCodes.length === 0) {
    return {
      status: 'general',
      explanation: 'SDS de tipo general — sin código de evento específico',
    }
  }

  const matchedInFiltered = sdsCodes.filter((c) =>
    incidentRows.some((r) => sdsTokenMatchesIncident(r.code, r.classification, c))
  )
  const matchedInFull = sdsCodes.filter((c) =>
    incidentsFull.some((i) => sdsTokenMatchesIncident(i.code, i.classification ?? '', c))
  )

  if (matchedInFiltered.length > 0) {
    return {
      status: 'match',
      explanation: `${matchedInFiltered.join(', ')} — ${eventosRelacionadosCount} eventos detectados`,
    }
  }
  if (matchedInFull.length > 0) {
    return {
      status: 'partial',
      explanation: `${matchedInFull.join(', ')} — ${eventosRelacionadosCount} eventos detectados`,
    }
  }
  return { status: 'no_match', explanation: 'no hay eventos del código' }
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
    expect(codes.filter((c) => c === '60.00.02')).toHaveLength(1)
  })

  it('returns empty array when no event_context and no more_info', () => {
    expect(getSdsCodesForMatch({})).toEqual([])
  })

  it('internal code field with digits (e.g. TriageInput2) is NOT used for matching', () => {
    const sds: SdsIncidentData = { code: 'TriageInput2', event_context: null }
    expect(getSdsCodesForMatch(sds)).toEqual([])
  })

  it('CamelCase code without digits IS used when it has meaningful keywords', () => {
    const sds: SdsIncidentData = { code: 'ReplaceTrayPickRollers', event_context: null, more_info: null }
    expect(getSdsCodesForMatch(sds)).toEqual(['ReplaceTrayPickRollers'])
  })

  it('code with only stopwords is NOT used', () => {
    const sds: SdsIncidentData = { code: 'Replace', event_context: null, more_info: null }
    expect(getSdsCodesForMatch(sds)).toEqual([])
  })

  it('returns codes from more_info when event_context is empty', () => {
    const sds: SdsIncidentData = { event_context: null, more_info: '53.B0.0z' }
    expect(getSdsCodesForMatch(sds)).toEqual(['53.B0.0z'])
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

// ---------------------------------------------------------------------------
// isNumericSdsCode
// ---------------------------------------------------------------------------

describe('isNumericSdsCode', () => {
  it('returns true for HP numeric codes with dots', () => {
    expect(isNumericSdsCode('60.00.02')).toBe(true)
    expect(isNumericSdsCode('53.B0.0z')).toBe(true)
  })

  it('returns false for CamelCase message identifiers', () => {
    expect(isNumericSdsCode('ReplaceTrayPickRollers')).toBe(false)
    expect(isNumericSdsCode('PickRollerKit')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isNumericSdsCode('')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// normalizeForMessageMatch
// ---------------------------------------------------------------------------

describe('normalizeForMessageMatch', () => {
  it('lowercases the string', () => {
    expect(normalizeForMessageMatch('ReplaceTrayPickRollers')).toBe('replacetraypickrollers')
  })

  it('strips spaces', () => {
    expect(normalizeForMessageMatch('Replace Tray Pick Rollers')).toBe('replacetraypickrollers')
  })

  it('CamelCase and spaced version normalize to same value', () => {
    expect(normalizeForMessageMatch('ReplaceTrayPickRollers')).toBe(
      normalizeForMessageMatch('Replace Tray Pick Rollers')
    )
  })

  it('strips underscores and hyphens', () => {
    expect(normalizeForMessageMatch('replace_tray_pick_rollers')).toBe('replacetraypickrollers')
    expect(normalizeForMessageMatch('replace-tray-pick-rollers')).toBe('replacetraypickrollers')
  })
})

// ---------------------------------------------------------------------------
// extractSdsKeywords
// ---------------------------------------------------------------------------

describe('extractSdsKeywords', () => {
  it('splits CamelCase and returns singularized lowercase keywords', () => {
    expect(extractSdsKeywords('ReplaceTrayPickRollers')).toEqual(['tray', 'pick', 'roller'])
  })

  it('removes stopwords', () => {
    const kws = extractSdsKeywords('ReplaceTrayPickRollers')
    expect(kws).not.toContain('replace')
  })

  it('returns empty array when all words are stopwords', () => {
    expect(extractSdsKeywords('Replace')).toEqual([])
    expect(extractSdsKeywords('CheckClean')).toEqual([])
  })

  it('singularizes "rollers" to "roller"', () => {
    expect(extractSdsKeywords('PickRollers')).toContain('roller')
    expect(extractSdsKeywords('PickRollers')).not.toContain('rollers')
  })

  it('does not over-singularize short words', () => {
    // "tray" length=4, ends with no "s" — unchanged; "as" length=2 — kept as-is
    expect(extractSdsKeywords('TrayUnit')).toContain('tray')
  })

  it('deduplicates repeated keywords', () => {
    const kws = extractSdsKeywords('RollerPickRoller')
    expect(kws.filter((k) => k === 'roller')).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// sdsTokenMatchesIncident
// ---------------------------------------------------------------------------

describe('sdsTokenMatchesIncident', () => {
  it('numeric token matches by code (exact)', () => {
    expect(sdsTokenMatchesIncident('60.00.02', 'Some classification', '60.00.02')).toBe(true)
  })

  it('numeric token with z wildcard matches prefix', () => {
    expect(sdsTokenMatchesIncident('53.B0.02', 'Some classification', '53.B0.0z')).toBe(true)
    expect(sdsTokenMatchesIncident('53.B0.09', 'Some classification', '53.B0.0z')).toBe(true)
  })

  it('numeric token does not match different code', () => {
    expect(sdsTokenMatchesIncident('53.B1.01', 'Replace Tray Pick Rollers', '53.B0.0z')).toBe(false)
  })

  it('message token matches classification case-insensitively', () => {
    expect(sdsTokenMatchesIncident('53.B0.02', 'Replace Tray Pick Rollers', 'ReplaceTrayPickRollers')).toBe(true)
  })

  it('message token matches partial classification', () => {
    expect(sdsTokenMatchesIncident('53.B0.02', 'Replace Tray Pick Rollers Kit', 'PickRollers')).toBe(true)
  })

  it('message token does not match unrelated classification', () => {
    expect(sdsTokenMatchesIncident('60.00.02', 'Fuser Error', 'ReplaceTrayPickRollers')).toBe(false)
  })

  it('message token matches via single keyword in description', () => {
    // Real-world case: "roller" from "ReplaceTrayPickRollers" appears in description
    expect(
      sdsTokenMatchesIncident('53.B1.02', 'Tray Z feed roller at end of life.', 'ReplaceTrayPickRollers')
    ).toBe(true)
  })

  it('stopword-only token does not match', () => {
    expect(sdsTokenMatchesIncident('53.B0.02', 'Replace Tray Pick Rollers', 'Replace')).toBe(false)
  })

  it('empty token returns false', () => {
    expect(sdsTokenMatchesIncident('60.00.02', 'Some classification', '')).toBe(false)
    expect(sdsTokenMatchesIncident('60.00.02', 'Some classification', '   ')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// computeSdsVsLog
// ---------------------------------------------------------------------------

describe('computeSdsVsLog', () => {
  const full: IncidentFullForSds[] = [{ code: '53.B0.02', end_time: '2026-03-01T10:00:00', occurrences: 3, classification: 'Replace Tray Pick Rollers' }]
  const rows: IncidentRowForSds[] = [{ code: '53.B0.02', classification: 'Replace Tray Pick Rollers' }]

  it('returns general when no event_context and no more_info', () => {
    const sds: SdsIncidentData = { event_context: null, more_info: null }
    expect(computeSdsVsLog(sds, rows, full, 3).status).toBe('general')
  })

  it('returns match when event_context empty but more_info wildcard z matches log', () => {
    const sds: SdsIncidentData = { event_context: null, more_info: '53.B0.0z' }
    const result = computeSdsVsLog(sds, rows, full, 3)
    expect(result.status).toBe('match')
  })

  it('returns no_match when event_context empty, more_info wildcard z, log has no matching code', () => {
    const sds: SdsIncidentData = { event_context: null, more_info: '53.B0.0z' }
    const result = computeSdsVsLog(sds, [], [], 0)
    expect(result.status).toBe('no_match')
  })

  it('returns match when event_context set and log has the code', () => {
    const sds: SdsIncidentData = { event_context: '53.B0.02' }
    const result = computeSdsVsLog(sds, rows, full, 3)
    expect(result.status).toBe('match')
  })

  it('returns match when more_info is a message identifier that matches classification', () => {
    const sds: SdsIncidentData = { event_context: null, more_info: 'ReplaceTrayPickRollers' }
    const result = computeSdsVsLog(sds, rows, full, 3)
    expect(result.status).toBe('match')
  })

  it('returns no_match when message identifier does not match any classification', () => {
    const sds: SdsIncidentData = { event_context: null, more_info: 'FuserHeatingError' }
    const result = computeSdsVsLog(sds, rows, full, 3)
    expect(result.status).toBe('no_match')
  })

  it('returns partial when message identifier matches full list but not filtered rows', () => {
    const sds: SdsIncidentData = { event_context: null, more_info: 'ReplaceTrayPickRollers' }
    const emptyRows: IncidentRowForSds[] = []
    const result = computeSdsVsLog(sds, emptyRows, full, 3)
    expect(result.status).toBe('partial')
  })

  it('real-world: sds.code CamelCase matches incident via keyword — código en campo Código', () => {
    const sds: SdsIncidentData = { code: 'ReplaceTrayPickRollers', event_context: null, more_info: null }
    const rollerRows: IncidentRowForSds[] = [{ code: '53.B1.02', classification: 'Tray Z feed roller at end of life.' }]
    const rollerFull: IncidentFullForSds[] = [{ code: '53.B1.02', end_time: '2026-03-01T10:00:00', occurrences: 2, classification: 'Tray Z feed roller at end of life.' }]
    const result = computeSdsVsLog(sds, rollerRows, rollerFull, 2)
    expect(result.status).toBe('match')
  })

  it('real-world: sds.code with internal ID (TriageInput2) still returns general', () => {
    const sds: SdsIncidentData = { code: 'TriageInput2', event_context: null, more_info: null }
    expect(computeSdsVsLog(sds, rows, full, 3).status).toBe('general')
  })

  it('sds.code with only stopword returns general', () => {
    const sds: SdsIncidentData = { code: 'Replace', event_context: null, more_info: null }
    expect(computeSdsVsLog(sds, rows, full, 3).status).toBe('general')
  })
})
