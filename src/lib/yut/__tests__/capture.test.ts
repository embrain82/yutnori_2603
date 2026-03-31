/**
 * Capture and stacking mechanics tests.
 *
 * Tests reference GAME-07 (capture), GAME-08 (stacking), GAME-09 (group movement),
 * GAME-10 (captured stacked group), and the applyMove orchestration that ties
 * all interactions together with correct ordering (capture before stack).
 */

import { describe, it, expect } from 'vitest'
import {
  detectCapture,
  executeCapture,
  detectStack,
  confirmStack,
  declineStack,
  moveStackGroup,
  applyMove,
} from '@/lib/yut/capture'
import { HOME, FINISH } from '@/lib/yut/types'
import type { PieceState, Team, MoveResult } from '@/lib/yut/types'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Create a piece at HOME (not yet on the board) */
function makeHomePiece(id: string, team: Team): PieceState {
  return {
    id,
    team,
    position: { station: HOME, routeId: '', routeIndex: -1 },
    stackedPieceIds: [],
    stackedWith: null,
  }
}

/** Create a piece that has finished the course */
function makeFinishedPiece(id: string, team: Team): PieceState {
  return {
    id,
    team,
    position: { station: FINISH, routeId: '', routeIndex: -1 },
    stackedPieceIds: [],
    stackedWith: null,
  }
}

/** Create a solo piece on the board at a specific route position */
function makeBoardPiece(
  id: string,
  team: Team,
  routeId: string,
  routeIndex: number,
  station: number
): PieceState {
  return {
    id,
    team,
    position: { station, routeId, routeIndex },
    stackedPieceIds: [],
    stackedWith: null,
  }
}

/** Create a leader piece with followers stacked on it */
function makeStackedPiece(
  id: string,
  team: Team,
  routeId: string,
  routeIndex: number,
  station: number,
  stackedPieceIds: string[]
): PieceState {
  return {
    id,
    team,
    position: { station, routeId, routeIndex },
    stackedPieceIds,
    stackedWith: null,
  }
}

/** Create a follower piece stacked under a leader */
function makeFollowerPiece(
  id: string,
  team: Team,
  routeId: string,
  routeIndex: number,
  station: number,
  stackedWith: string
): PieceState {
  return {
    id,
    team,
    position: { station, routeId, routeIndex },
    stackedPieceIds: [],
    stackedWith,
  }
}

/** Helper to create a MoveResult */
function makeMoveResult(
  station: number,
  routeId: string,
  routeIndex: number,
  finished: boolean = false
): MoveResult {
  return {
    newPosition: { station, routeId, routeIndex },
    finished,
    landedOnBranch: false,
    intermediateStations: [],
  }
}

// ---------------------------------------------------------------------------
// detectCapture (GAME-07)
// ---------------------------------------------------------------------------

describe('detectCapture', () => {
  it('detects opponent piece at destination station', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
      makeBoardPiece('ai1', 'ai', 'outer', 5, 5),
    ]
    const result = detectCapture(pieces, 'p1', 5)
    expect(result.captured).toBe(true)
    expect(result.capturedPieceIds).toEqual(['ai1'])
    expect(result.grantExtraThrow).toBe(true)
  })

  it('returns no capture when no opponent at destination', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
      makeBoardPiece('ai1', 'ai', 'outer', 3, 3),
    ]
    const result = detectCapture(pieces, 'p1', 5)
    expect(result.captured).toBe(false)
    expect(result.capturedPieceIds).toEqual([])
    expect(result.grantExtraThrow).toBe(false)
  })

  it('does not capture opponent at HOME (Pitfall 5)', () => {
    const pieces: PieceState[] = [
      makeHomePiece('p1', 'player'),
      makeHomePiece('ai1', 'ai'),
    ]
    const result = detectCapture(pieces, 'p1', HOME)
    expect(result.captured).toBe(false)
    expect(result.capturedPieceIds).toEqual([])
  })

  it('does not capture opponent at FINISH', () => {
    const pieces: PieceState[] = [
      makeFinishedPiece('p1', 'player'),
      makeFinishedPiece('ai1', 'ai'),
    ]
    const result = detectCapture(pieces, 'p1', FINISH)
    expect(result.captured).toBe(false)
    expect(result.capturedPieceIds).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// executeCapture (GAME-07, GAME-10)
// ---------------------------------------------------------------------------

describe('executeCapture', () => {
  it('sends single opponent piece to HOME with extra throw (D-01)', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
      makeBoardPiece('ai1', 'ai', 'outer', 5, 5),
    ]
    const result = executeCapture(pieces, ['ai1'])
    const captured = result.find((p) => p.id === 'ai1')!
    expect(captured.position.station).toBe(HOME)
    expect(captured.position.routeId).toBe('')
    expect(captured.position.routeIndex).toBe(-1)
  })

  it('sends stacked group (leader + 2 followers) all individually to HOME (D-02)', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
      makeStackedPiece('ai1', 'ai', 'outer', 5, 5, ['ai2', 'ai3']),
      makeFollowerPiece('ai2', 'ai', 'outer', 5, 5, 'ai1'),
      makeFollowerPiece('ai3', 'ai', 'outer', 5, 5, 'ai1'),
    ]
    const result = executeCapture(pieces, ['ai1', 'ai2', 'ai3'])
    const ai1 = result.find((p) => p.id === 'ai1')!
    const ai2 = result.find((p) => p.id === 'ai2')!
    const ai3 = result.find((p) => p.id === 'ai3')!

    expect(ai1.position.station).toBe(HOME)
    expect(ai1.stackedPieceIds).toEqual([])
    expect(ai1.stackedWith).toBeNull()

    expect(ai2.position.station).toBe(HOME)
    expect(ai2.stackedPieceIds).toEqual([])
    expect(ai2.stackedWith).toBeNull()

    expect(ai3.position.station).toBe(HOME)
    expect(ai3.stackedPieceIds).toEqual([])
    expect(ai3.stackedWith).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// detectStack (GAME-08)
// ---------------------------------------------------------------------------

describe('detectStack', () => {
  it('detects own piece at destination station', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
      makeBoardPiece('p2', 'player', 'outer', 5, 5),
    ]
    const result = detectStack(pieces, 'p1', 5)
    expect(result.canStack).toBe(true)
    expect(result.targetPieceId).toBe('p2')
  })

  it('returns no stack when no own piece at destination', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
      makeBoardPiece('p2', 'player', 'outer', 3, 3),
    ]
    const result = detectStack(pieces, 'p1', 5)
    expect(result.canStack).toBe(false)
    expect(result.targetPieceId).toBeNull()
  })

  it('does not stack with own piece at HOME (Pitfall 5)', () => {
    const pieces: PieceState[] = [
      makeHomePiece('p1', 'player'),
      makeHomePiece('p2', 'player'),
    ]
    const result = detectStack(pieces, 'p1', HOME)
    expect(result.canStack).toBe(false)
    expect(result.targetPieceId).toBeNull()
  })

  it('does not detect follower piece as stack target', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
      makeStackedPiece('p2', 'player', 'outer', 5, 5, ['p3']),
      makeFollowerPiece('p3', 'player', 'outer', 5, 5, 'p2'),
    ]
    // p1 arrives at station 5. p2 is a leader (valid target), p3 is a follower (not valid).
    const result = detectStack(pieces, 'p1', 5)
    expect(result.canStack).toBe(true)
    expect(result.targetPieceId).toBe('p2')
  })
})

// ---------------------------------------------------------------------------
// confirmStack / declineStack (GAME-08)
// ---------------------------------------------------------------------------

describe('confirmStack / declineStack', () => {
  it('merges arriving single piece under existing single piece', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
      makeBoardPiece('p2', 'player', 'outer', 5, 5),
    ]
    const result = confirmStack(pieces, 'p1', 'p2')
    const p2 = result.find((p) => p.id === 'p2')!
    const p1 = result.find((p) => p.id === 'p1')!

    // p2 is leader with p1 as follower
    expect(p2.stackedPieceIds).toContain('p1')
    expect(p1.stackedWith).toBe('p2')
    expect(p1.stackedPieceIds).toEqual([])
  })

  it('merges arriving single piece into existing group (leader keeps all followers)', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
      makeStackedPiece('p2', 'player', 'outer', 5, 5, ['p3']),
      makeFollowerPiece('p3', 'player', 'outer', 5, 5, 'p2'),
    ]
    const result = confirmStack(pieces, 'p1', 'p2')
    const p2 = result.find((p) => p.id === 'p2')!
    const p1 = result.find((p) => p.id === 'p1')!

    // p2 is leader with both p3 and p1 as followers
    expect(p2.stackedPieceIds).toContain('p3')
    expect(p2.stackedPieceIds).toContain('p1')
    expect(p1.stackedWith).toBe('p2')
  })

  it('merges arriving group into existing piece -- all become followers (Pitfall 6)', () => {
    const pieces: PieceState[] = [
      makeStackedPiece('p1', 'player', 'outer', 5, 5, ['p3']),
      makeFollowerPiece('p3', 'player', 'outer', 5, 5, 'p1'),
      makeBoardPiece('p2', 'player', 'outer', 5, 5),
    ]
    // p1 (with follower p3) arrives at p2's location
    const result = confirmStack(pieces, 'p1', 'p2')
    const p2 = result.find((p) => p.id === 'p2')!
    const p1 = result.find((p) => p.id === 'p1')!
    const p3 = result.find((p) => p.id === 'p3')!

    // p2 becomes leader of all
    expect(p2.stackedPieceIds).toContain('p1')
    expect(p2.stackedPieceIds).toContain('p3')
    expect(p1.stackedWith).toBe('p2')
    expect(p1.stackedPieceIds).toEqual([])
    expect(p3.stackedWith).toBe('p2')
  })

  it('declineStack is a no-op -- both pieces remain independent (D-05)', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
      makeBoardPiece('p2', 'player', 'outer', 5, 5),
    ]
    // declineStack takes no arguments and does nothing
    declineStack()
    // Pieces are unchanged (we verify by checking the original array)
    expect(pieces[0].stackedWith).toBeNull()
    expect(pieces[0].stackedPieceIds).toEqual([])
    expect(pieces[1].stackedWith).toBeNull()
    expect(pieces[1].stackedPieceIds).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// moveStackGroup (GAME-09)
// ---------------------------------------------------------------------------

describe('moveStackGroup', () => {
  it('leader moves to new position with 1 follower', () => {
    const pieces: PieceState[] = [
      makeStackedPiece('p1', 'player', 'outer', 3, 3, ['p2']),
      makeFollowerPiece('p2', 'player', 'outer', 3, 3, 'p1'),
    ]
    const newPosition = { station: 5, routeId: 'outer', routeIndex: 5 }
    const result = moveStackGroup(pieces, 'p1', newPosition)
    const p1 = result.find((p) => p.id === 'p1')!
    const p2 = result.find((p) => p.id === 'p2')!

    expect(p1.position.station).toBe(5)
    expect(p1.position.routeId).toBe('outer')
    expect(p1.position.routeIndex).toBe(5)
    expect(p2.position.station).toBe(5)
    expect(p2.position.routeId).toBe('outer')
    expect(p2.position.routeIndex).toBe(5)
  })

  it('leader moves to new position with 2 followers (3-piece group)', () => {
    const pieces: PieceState[] = [
      makeStackedPiece('p1', 'player', 'outer', 3, 3, ['p2', 'p3']),
      makeFollowerPiece('p2', 'player', 'outer', 3, 3, 'p1'),
      makeFollowerPiece('p3', 'player', 'outer', 3, 3, 'p1'),
      makeBoardPiece('ai1', 'ai', 'outer', 10, 10),
    ]
    const newPosition = { station: 6, routeId: 'outer', routeIndex: 6 }
    const result = moveStackGroup(pieces, 'p1', newPosition)
    const p1 = result.find((p) => p.id === 'p1')!
    const p2 = result.find((p) => p.id === 'p2')!
    const p3 = result.find((p) => p.id === 'p3')!
    const ai1 = result.find((p) => p.id === 'ai1')!

    expect(p1.position.station).toBe(6)
    expect(p2.position.station).toBe(6)
    expect(p3.position.station).toBe(6)
    // Other pieces unaffected
    expect(ai1.position.station).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// executeCapture on stacked group (GAME-10)
// ---------------------------------------------------------------------------

describe('captured stacked group', () => {
  it('capturing stacked leader returns leader AND all followers to HOME', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
      makeStackedPiece('ai1', 'ai', 'outer', 5, 5, ['ai2']),
      makeFollowerPiece('ai2', 'ai', 'outer', 5, 5, 'ai1'),
    ]
    const result = executeCapture(pieces, ['ai1', 'ai2'])
    const ai1 = result.find((p) => p.id === 'ai1')!
    const ai2 = result.find((p) => p.id === 'ai2')!

    expect(ai1.position.station).toBe(HOME)
    expect(ai1.stackedPieceIds).toEqual([])
    expect(ai1.stackedWith).toBeNull()
    expect(ai2.position.station).toBe(HOME)
    expect(ai2.stackedPieceIds).toEqual([])
    expect(ai2.stackedWith).toBeNull()
  })

  it('stack of 3 captured: all 3 pieces at HOME with stack references cleared', () => {
    const pieces: PieceState[] = [
      makeStackedPiece('ai1', 'ai', 'outer', 7, 7, ['ai2', 'ai3']),
      makeFollowerPiece('ai2', 'ai', 'outer', 7, 7, 'ai1'),
      makeFollowerPiece('ai3', 'ai', 'outer', 7, 7, 'ai1'),
    ]
    const result = executeCapture(pieces, ['ai1', 'ai2', 'ai3'])

    for (const id of ['ai1', 'ai2', 'ai3']) {
      const piece = result.find((p) => p.id === id)!
      expect(piece.position.station).toBe(HOME)
      expect(piece.position.routeId).toBe('')
      expect(piece.position.routeIndex).toBe(-1)
      expect(piece.stackedPieceIds).toEqual([])
      expect(piece.stackedWith).toBeNull()
    }
  })
})

// ---------------------------------------------------------------------------
// applyMove orchestration
// ---------------------------------------------------------------------------

describe('applyMove orchestration', () => {
  it('piece lands on opponent -> captures, returns captured=true', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 3, 3),
      makeBoardPiece('ai1', 'ai', 'outer', 5, 5),
    ]
    const moveResult = makeMoveResult(5, 'outer', 5)
    const outcome = applyMove(pieces, 'p1', moveResult)

    expect(outcome.capture.captured).toBe(true)
    expect(outcome.capture.capturedPieceIds).toContain('ai1')
    expect(outcome.capture.grantExtraThrow).toBe(true)

    const ai1 = outcome.pieces.find((p) => p.id === 'ai1')!
    expect(ai1.position.station).toBe(HOME)
  })

  it('piece lands on friendly -> returns stackPending=true (no auto-stack)', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 3, 3),
      makeBoardPiece('p2', 'player', 'outer', 5, 5),
    ]
    const moveResult = makeMoveResult(5, 'outer', 5)
    const outcome = applyMove(pieces, 'p1', moveResult)

    expect(outcome.capture.captured).toBe(false)
    expect(outcome.stackOpportunity.canStack).toBe(true)
    expect(outcome.stackOpportunity.targetPieceId).toBe('p2')
  })

  it('piece lands on empty station -> no capture, no stack', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 3, 3),
      makeBoardPiece('ai1', 'ai', 'outer', 10, 10),
    ]
    const moveResult = makeMoveResult(5, 'outer', 5)
    const outcome = applyMove(pieces, 'p1', moveResult)

    expect(outcome.capture.captured).toBe(false)
    expect(outcome.stackOpportunity.canStack).toBe(false)
  })

  it('piece lands on station with BOTH opponent and friendly -> captures first, then offers stack (Pitfall 2)', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 3, 3),
      makeBoardPiece('ai1', 'ai', 'outer', 5, 5),
      makeBoardPiece('p2', 'player', 'outer', 5, 5),
    ]
    const moveResult = makeMoveResult(5, 'outer', 5)
    const outcome = applyMove(pieces, 'p1', moveResult)

    // Capture happened
    expect(outcome.capture.captured).toBe(true)
    expect(outcome.capture.capturedPieceIds).toContain('ai1')

    // Stack opportunity also detected (after capture removed opponent)
    expect(outcome.stackOpportunity.canStack).toBe(true)
    expect(outcome.stackOpportunity.targetPieceId).toBe('p2')
  })

  it('piece finishes (station=FINISH) -> no capture/stack check', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 18, 18),
    ]
    const moveResult = makeMoveResult(FINISH, '', -1, true)
    const outcome = applyMove(pieces, 'p1', moveResult)

    expect(outcome.capture.captured).toBe(false)
    expect(outcome.stackOpportunity.canStack).toBe(false)

    const p1 = outcome.pieces.find((p) => p.id === 'p1')!
    expect(p1.position.station).toBe(FINISH)
  })

  it('leader piece moves with followers via applyMove', () => {
    const pieces: PieceState[] = [
      makeStackedPiece('p1', 'player', 'outer', 3, 3, ['p2']),
      makeFollowerPiece('p2', 'player', 'outer', 3, 3, 'p1'),
      makeBoardPiece('ai1', 'ai', 'outer', 10, 10),
    ]
    const moveResult = makeMoveResult(5, 'outer', 5)
    const outcome = applyMove(pieces, 'p1', moveResult)

    const p1 = outcome.pieces.find((p) => p.id === 'p1')!
    const p2 = outcome.pieces.find((p) => p.id === 'p2')!

    expect(p1.position.station).toBe(5)
    expect(p2.position.station).toBe(5)
  })
})
