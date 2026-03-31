/**
 * Movement resolution engine tests.
 *
 * Covers all 5 routes, branch point detection (landing vs pass-through),
 * finish semantics (D-07: land on finish = not finished, D-08: pass through = finished),
 * board entry from HOME, branch choice application, and intermediate station tracking.
 */
import { describe, it, expect } from 'vitest'
import { resolveMove, enterBoard, applyBranchChoice, getAvailableMoves } from '@/lib/yut/movement'
import { ROUTES, ROUTE_IDS } from '@/lib/yut/board'
import { HOME, FINISH } from '@/lib/yut/types'
import type { PieceState } from '@/lib/yut/types'

/** Helper: create a piece at a given route and index */
function makePiece(routeId: string, routeIndex: number): PieceState {
  const station = ROUTES[routeId][routeIndex]
  return {
    id: 'test-piece',
    team: 'player',
    position: { station, routeId, routeIndex },
    stackedPieceIds: [],
    stackedWith: null,
  }
}

/** Helper: create a piece at HOME */
function makeHomePiece(): PieceState {
  return {
    id: 'test-piece',
    team: 'player',
    position: { station: HOME, routeId: '', routeIndex: -1 },
    stackedPieceIds: [],
    stackedWith: null,
  }
}

/** Helper: create a finished piece */
function makeFinishedPiece(): PieceState {
  return {
    id: 'test-piece',
    team: 'player',
    position: { station: FINISH, routeId: '', routeIndex: -1 },
    stackedPieceIds: [],
    stackedWith: null,
  }
}

describe('resolveMove - outer route', () => {
  it('advances piece from S0 by 1 step to S1', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 0)
    const result = resolveMove(piece, 1)
    expect(result.newPosition.station).toBe(1)
    expect(result.newPosition.routeIndex).toBe(1)
    expect(result.newPosition.routeId).toBe(ROUTE_IDS.OUTER)
    expect(result.finished).toBe(false)
    expect(result.landedOnBranch).toBe(false)
  })

  it('advances piece from S0 by 5 steps to S5 with branch detection', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 0)
    const result = resolveMove(piece, 5)
    expect(result.newPosition.station).toBe(5)
    expect(result.newPosition.routeIndex).toBe(5)
    expect(result.finished).toBe(false)
    expect(result.landedOnBranch).toBe(true)
    expect(result.branchOptions).toEqual({
      continueRoute: 'outer',
      shortcutRoute: 'diag_right',
    })
  })

  it('advances piece from S5 by 1 step to S6 (no branch since already on outer past S5)', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 5)
    const result = resolveMove(piece, 1)
    expect(result.newPosition.station).toBe(6)
    expect(result.newPosition.routeIndex).toBe(6)
    expect(result.finished).toBe(false)
    expect(result.landedOnBranch).toBe(false)
  })

  it('passes through S5 without branch detection (S3 + geol(3) = S6)', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 3)
    const result = resolveMove(piece, 3)
    expect(result.newPosition.station).toBe(6)
    expect(result.newPosition.routeIndex).toBe(6)
    expect(result.finished).toBe(false)
    expect(result.landedOnBranch).toBe(false)
  })

  it('lands on S5 from S4 with do(1) and detects branch', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 4)
    const result = resolveMove(piece, 1)
    expect(result.newPosition.station).toBe(5)
    expect(result.newPosition.routeIndex).toBe(5)
    expect(result.landedOnBranch).toBe(true)
    expect(result.branchOptions).toBeDefined()
  })

  it('lands on S10 from S9 with do(1) and detects branch', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 9)
    const result = resolveMove(piece, 1)
    expect(result.newPosition.station).toBe(10)
    expect(result.newPosition.routeIndex).toBe(10)
    expect(result.landedOnBranch).toBe(true)
    expect(result.branchOptions).toEqual({
      continueRoute: 'outer',
      shortcutRoute: 'diag_left',
    })
  })

  it('advances piece from S18 by 1 step to S19', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 18)
    const result = resolveMove(piece, 1)
    expect(result.newPosition.station).toBe(19)
    expect(result.newPosition.routeIndex).toBe(19)
    expect(result.finished).toBe(false)
  })
})

describe('resolveMove - outer route finish semantics', () => {
  it('D-07: piece at S19 + do(1) lands at finish point but is NOT finished', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 19)
    const result = resolveMove(piece, 1)
    expect(result.finished).toBe(false)
    expect(result.newPosition.station).toBe(0)
    expect(result.newPosition.routeId).toBe(ROUTE_IDS.OUTER)
    expect(result.newPosition.routeIndex).toBe(20)
  })

  it('D-08: piece at S19 + gae(2) IS finished (passes through finish)', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 19)
    const result = resolveMove(piece, 2)
    expect(result.finished).toBe(true)
    expect(result.newPosition.station).toBe(FINISH)
  })

  it('piece at S18 + geol(3) IS finished (passes through S19 and through finish)', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 18)
    const result = resolveMove(piece, 3)
    expect(result.finished).toBe(true)
    expect(result.newPosition.station).toBe(FINISH)
  })
})

describe('resolveMove - diagonal right route', () => {
  it('advances from diag_right index 0 (S5) by 1 to S20', () => {
    const piece = makePiece(ROUTE_IDS.DIAG_RIGHT, 0)
    const result = resolveMove(piece, 1)
    expect(result.newPosition.station).toBe(20)
    expect(result.newPosition.routeIndex).toBe(1)
    expect(result.newPosition.routeId).toBe(ROUTE_IDS.DIAG_RIGHT)
    expect(result.finished).toBe(false)
  })

  it('advances from diag_right index 3 (S22/center) by 1 to S23', () => {
    const piece = makePiece(ROUTE_IDS.DIAG_RIGHT, 3)
    const result = resolveMove(piece, 1)
    expect(result.newPosition.station).toBe(23)
    expect(result.newPosition.routeIndex).toBe(4)
    expect(result.finished).toBe(false)
  })

  it('piece at diag_right index 5 (S24) + do(1) finishes', () => {
    const piece = makePiece(ROUTE_IDS.DIAG_RIGHT, 5)
    const result = resolveMove(piece, 1)
    expect(result.finished).toBe(true)
    expect(result.newPosition.station).toBe(FINISH)
  })

  it('piece at diag_right index 4 (S23) + gae(2) finishes', () => {
    const piece = makePiece(ROUTE_IDS.DIAG_RIGHT, 4)
    const result = resolveMove(piece, 2)
    expect(result.finished).toBe(true)
    expect(result.newPosition.station).toBe(FINISH)
  })
})

describe('resolveMove - diagonal left route', () => {
  it('advances from diag_left index 0 (S10) by 1 to S25', () => {
    const piece = makePiece(ROUTE_IDS.DIAG_LEFT, 0)
    const result = resolveMove(piece, 1)
    expect(result.newPosition.station).toBe(25)
    expect(result.newPosition.routeIndex).toBe(1)
    expect(result.newPosition.routeId).toBe(ROUTE_IDS.DIAG_LEFT)
    expect(result.finished).toBe(false)
  })

  it('advances from diag_left index 3 (S22/center) by 1 to S27 (NOT S23)', () => {
    const piece = makePiece(ROUTE_IDS.DIAG_LEFT, 3)
    const result = resolveMove(piece, 1)
    expect(result.newPosition.station).toBe(27)
    expect(result.newPosition.routeIndex).toBe(4)
    expect(result.newPosition.routeId).toBe(ROUTE_IDS.DIAG_LEFT)
    expect(result.finished).toBe(false)
  })

  it('piece at diag_left index 5 (S28) + do(1) finishes', () => {
    const piece = makePiece(ROUTE_IDS.DIAG_LEFT, 5)
    const result = resolveMove(piece, 1)
    expect(result.finished).toBe(true)
    expect(result.newPosition.station).toBe(FINISH)
  })
})

describe('resolveMove - branch point detection', () => {
  it('landing on S5 from outer route triggers branch', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 4)
    const result = resolveMove(piece, 1)
    expect(result.landedOnBranch).toBe(true)
    expect(result.branchOptions).toBeDefined()
  })

  it('passing through S5 does NOT trigger branch (S3 + geol(3))', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 3)
    const result = resolveMove(piece, 3)
    expect(result.landedOnBranch).toBe(false)
    expect(result.branchOptions).toBeUndefined()
  })

  it('landing on S10 from outer route triggers branch', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 9)
    const result = resolveMove(piece, 1)
    expect(result.landedOnBranch).toBe(true)
    expect(result.branchOptions).toBeDefined()
  })

  it('passing through S10 does NOT trigger branch (S8 + geol(3))', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 8)
    const result = resolveMove(piece, 3)
    expect(result.landedOnBranch).toBe(false)
    expect(result.branchOptions).toBeUndefined()
  })

  it('piece already on diag_right at S5 does NOT trigger branch', () => {
    const piece = makePiece(ROUTE_IDS.DIAG_RIGHT, 0)
    const result = resolveMove(piece, 0)
    // Moving 0 steps: stays in place, no branch
    // Actually 0 steps is degenerate; test with 2 steps from index 0
    // which lands on S21 (index 2) -- not a branch point
    const result2 = resolveMove(makePiece(ROUTE_IDS.DIAG_RIGHT, 0), 2)
    expect(result2.landedOnBranch).toBe(false)
  })
})

describe('enterBoard - new piece entry', () => {
  it('HOME piece with do(1) enters at S1 on outer route', () => {
    const result = enterBoard('player', 'piece-1', 1)
    expect(result.newPosition.station).toBe(1)
    expect(result.newPosition.routeId).toBe(ROUTE_IDS.OUTER)
    expect(result.newPosition.routeIndex).toBe(1)
    expect(result.finished).toBe(false)
    expect(result.landedOnBranch).toBe(false)
  })

  it('HOME piece with mo(5) enters at S5 on outer route with branch detection', () => {
    const result = enterBoard('player', 'piece-1', 5)
    expect(result.newPosition.station).toBe(5)
    expect(result.newPosition.routeId).toBe(ROUTE_IDS.OUTER)
    expect(result.newPosition.routeIndex).toBe(5)
    expect(result.finished).toBe(false)
    expect(result.landedOnBranch).toBe(true)
    expect(result.branchOptions).toEqual({
      continueRoute: 'outer',
      shortcutRoute: 'diag_right',
    })
  })

  it('HOME piece with gae(2) enters at S2', () => {
    const result = enterBoard('player', 'piece-1', 2)
    expect(result.newPosition.station).toBe(2)
    expect(result.newPosition.routeIndex).toBe(2)
    expect(result.finished).toBe(false)
  })
})

describe('applyBranchChoice', () => {
  it('choosing shortcut at S5 switches to diag_right route', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 5) // at S5 on outer
    const result = applyBranchChoice(piece, ROUTE_IDS.DIAG_RIGHT)
    expect(result.position.routeId).toBe(ROUTE_IDS.DIAG_RIGHT)
    expect(result.position.routeIndex).toBe(0)
    expect(result.position.station).toBe(5) // same station
  })

  it('choosing shortcut at S10 switches to diag_left route', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 10) // at S10 on outer
    const result = applyBranchChoice(piece, ROUTE_IDS.DIAG_LEFT)
    expect(result.position.routeId).toBe(ROUTE_IDS.DIAG_LEFT)
    expect(result.position.routeIndex).toBe(0)
    expect(result.position.station).toBe(10) // same station
  })

  it('choosing continue at S5 keeps outer route position', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 5) // at S5 on outer
    const result = applyBranchChoice(piece, ROUTE_IDS.OUTER)
    expect(result.position.routeId).toBe(ROUTE_IDS.OUTER)
    expect(result.position.routeIndex).toBe(5)
    expect(result.position.station).toBe(5)
  })
})

describe('intermediateStations tracking', () => {
  it('tracks intermediate stations for S0 + geol(3) -> [1, 2]', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 0)
    const result = resolveMove(piece, 3)
    expect(result.intermediateStations).toEqual([1, 2])
  })

  it('tracks intermediate stations for S18 + gae(2) -> [19] (finished)', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 18)
    const result = resolveMove(piece, 2)
    expect(result.intermediateStations).toEqual([19])
  })

  it('do(1) step has no intermediate stations', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 0)
    const result = resolveMove(piece, 1)
    expect(result.intermediateStations).toEqual([])
  })

  it('tracks intermediates on diagonal route', () => {
    const piece = makePiece(ROUTE_IDS.DIAG_RIGHT, 0)
    const result = resolveMove(piece, 3) // S5 -> S20 -> S21 -> S22
    expect(result.intermediateStations).toEqual([20, 21])
  })
})

describe('getAvailableMoves', () => {
  it('HOME piece can always enter the board', () => {
    const piece = makeHomePiece()
    const result = getAvailableMoves(piece, 3)
    expect(result.canMove).toBe(true)
    expect(result.moveResult).toBeDefined()
  })

  it('FINISHED piece cannot move', () => {
    const piece = makeFinishedPiece()
    const result = getAvailableMoves(piece, 3)
    expect(result.canMove).toBe(false)
    expect(result.moveResult).toBeUndefined()
  })

  it('piece on board can always move', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 5)
    const result = getAvailableMoves(piece, 2)
    expect(result.canMove).toBe(true)
    expect(result.moveResult).toBeDefined()
  })

  it('piece on board that would finish can still move', () => {
    const piece = makePiece(ROUTE_IDS.OUTER, 19)
    const result = getAvailableMoves(piece, 2)
    expect(result.canMove).toBe(true)
    expect(result.moveResult).toBeDefined()
    expect(result.moveResult!.finished).toBe(true)
  })
})
