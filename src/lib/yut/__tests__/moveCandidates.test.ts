import { describe, expect, it } from 'vitest'
import { ROUTE_IDS } from '@/lib/yut/board'
import { HOME, FINISH } from '@/lib/yut/types'
import type { PieceState, ThrowResult, Team } from '@/lib/yut/types'
import { buildMoveCandidates } from '@/lib/yut/moveCandidates'

function makePiece(
  id: string,
  team: Team,
  station: number,
  routeId: string,
  routeIndex: number,
  stackedWith: string | null = null
): PieceState {
  return {
    id,
    team,
    position: { station, routeId, routeIndex },
    stackedPieceIds: [],
    stackedWith,
  }
}

function makeThrow(name: ThrowResult['name'], steps: number, grantsExtra: boolean): ThrowResult {
  return { name, steps, grantsExtra }
}

describe('buildMoveCandidates', () => {
  it('creates one continue candidate for a HOME piece', () => {
    const pieces = [
      makePiece('p1', 'player', HOME, '', -1),
      makePiece('p2', 'player', HOME, '', -1),
    ]

    const candidates = buildMoveCandidates(pieces, 'player', makeThrow('do', 1, false))

    expect(candidates).toEqual([
      expect.objectContaining({
        pieceId: 'p1',
        routeChoice: 'continue',
        moveResult: expect.objectContaining({
          newPosition: expect.objectContaining({ station: 1 }),
        }),
      }),
      expect.objectContaining({
        pieceId: 'p2',
        routeChoice: 'continue',
        moveResult: expect.objectContaining({
          newPosition: expect.objectContaining({ station: 1 }),
        }),
      }),
    ])
  })

  it('creates continue and shortcut candidates from branch station 5', () => {
    const pieces = [makePiece('p1', 'player', 5, ROUTE_IDS.OUTER, 5)]

    const candidates = buildMoveCandidates(pieces, 'player', makeThrow('geol', 3, false))

    expect(candidates).toHaveLength(2)
    expect(candidates[0].routeChoice).toBe('continue')
    expect(candidates[0].moveResult.newPosition.station).toBe(8)
    expect(candidates[1].routeChoice).toBe('shortcut')
    expect(candidates[1].moveResult.newPosition.station).toBe(22)
  })

  it('creates one continue candidate for a normal on-board piece', () => {
    const pieces = [makePiece('p1', 'player', 3, ROUTE_IDS.OUTER, 3)]

    const candidates = buildMoveCandidates(pieces, 'player', makeThrow('gae', 2, false))

    expect(candidates).toHaveLength(1)
    expect(candidates[0].routeChoice).toBe('continue')
    expect(candidates[0].moveResult.newPosition.station).toBe(5)
  })

  it('skips follower pieces stacked under a leader', () => {
    const pieces = [
      makePiece('p1', 'player', 3, ROUTE_IDS.OUTER, 3),
      makePiece('p2', 'player', 3, ROUTE_IDS.OUTER, 3, 'p1'),
    ]

    const candidates = buildMoveCandidates(pieces, 'player', makeThrow('do', 1, false))

    expect(candidates).toHaveLength(1)
    expect(candidates[0].pieceId).toBe('p1')
  })

  it('skips FINISH pieces', () => {
    const pieces = [makePiece('p1', 'player', FINISH, '', -1)]

    const candidates = buildMoveCandidates(pieces, 'player', makeThrow('do', 1, false))

    expect(candidates).toEqual([])
  })
})
