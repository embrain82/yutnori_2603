import { describe, expect, it } from 'vitest'
import {
  appendTurnRecord,
  createSession,
  finalizeSession,
} from '@/lib/yut/session'

describe('session helpers', () => {
  it('createSession returns a fresh empty session payload', () => {
    const session = createSession()

    expect(session.sessionId).not.toBe('')
    expect(session.turns).toEqual([])
    expect(session.completedAt).toBe('')
    expect(session.winner).toBeNull()
    expect(session.totalTurns).toBe(0)
  })

  it('appendTurnRecord returns a new session with one more turn', () => {
    const session = createSession()
    const next = appendTurnRecord(session, {
      team: 'player',
      throws: [{ name: 'do', steps: 1, grantsExtra: false }],
      moves: [],
    })

    expect(session.turns).toEqual([])
    expect(next.turns).toHaveLength(1)
    expect(next.totalTurns).toBe(1)
  })

  it('finalizeSession sets completedAt and winner without mutating input', () => {
    const session = createSession()
    const endTime = new Date('2026-04-01T00:00:00.000Z')
    const finalSession = finalizeSession(session, 'player', endTime)

    expect(session.completedAt).toBe('')
    expect(session.winner).toBeNull()
    expect(finalSession.completedAt).toBe('2026-04-01T00:00:00.000Z')
    expect(finalSession.winner).toBe('player')
  })

  it('barrel exports createSession, appendTurnRecord, and finalizeSession', async () => {
    const barrel = await import('@/lib/yut')

    expect(barrel.createSession).toBeTypeOf('function')
    expect(barrel.appendTurnRecord).toBeTypeOf('function')
    expect(barrel.finalizeSession).toBeTypeOf('function')
  })
})
