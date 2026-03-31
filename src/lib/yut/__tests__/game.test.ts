/**
 * Game state operations tests: throw queue management with yut/mo chaining,
 * win condition detection, impossible move auto-skip, and initial game state.
 *
 * Tests reference GAME-02 (extra throw chaining), GAME-03 (FIFO move queue),
 * GAME-11 (win condition), GAME-12 (impossible move detection).
 */

import { describe, it, expect } from 'vitest'
import {
  createTurnState,
  processThrow,
  consumeMove,
  checkWinCondition,
  findValidMoves,
  createInitialGameState,
} from '@/lib/yut/game'
import { HOME, FINISH } from '@/lib/yut/types'
import type { PieceState, ThrowResult, Team } from '@/lib/yut/types'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Create a piece at HOME (not yet on the board) */
function makeHomePiece(id: string, team: Team): PieceState {
  return {
    id,
    team,
    position: { station: HOME, routeId: '', routeIndex: -1 },
  }
}

/** Create a piece that has finished the course */
function makeFinishedPiece(id: string, team: Team): PieceState {
  return {
    id,
    team,
    position: { station: FINISH, routeId: '', routeIndex: -1 },
  }
}

/** Create a piece on the board at a specific route position */
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
  }
}

/** Helper to create a ThrowResult */
function makeThrow(name: ThrowResult['name'], steps: number, grantsExtra: boolean): ThrowResult {
  return { name, steps, grantsExtra }
}

// ---------------------------------------------------------------------------
// createTurnState
// ---------------------------------------------------------------------------

describe('createTurnState', () => {
  it('creates a fresh player turn with 1 throw remaining', () => {
    const turn = createTurnState('player')
    expect(turn.activeTeam).toBe('player')
    expect(turn.throwsRemaining).toBe(1)
    expect(turn.pendingMoves).toEqual([])
  })

  it('creates a fresh AI turn with 1 throw remaining', () => {
    const turn = createTurnState('ai')
    expect(turn.activeTeam).toBe('ai')
    expect(turn.throwsRemaining).toBe(1)
    expect(turn.pendingMoves).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// processThrow - basic throws (no extra)
// ---------------------------------------------------------------------------

describe('processThrow - basic throws', () => {
  it('gae (no extra) decrements throwsRemaining and adds to pending', () => {
    const turn = createTurnState('player')
    const result = makeThrow('gae', 2, false)
    const newTurn = processThrow(turn, result)
    expect(newTurn.throwsRemaining).toBe(0)
    expect(newTurn.pendingMoves).toEqual([result])
  })

  it('do (no extra) decrements throwsRemaining and adds to pending', () => {
    const turn = createTurnState('player')
    const result = makeThrow('do', 1, false)
    const newTurn = processThrow(turn, result)
    expect(newTurn.throwsRemaining).toBe(0)
    expect(newTurn.pendingMoves).toEqual([result])
  })

  it('geol (no extra) decrements throwsRemaining and adds to pending', () => {
    const turn = createTurnState('player')
    const result = makeThrow('geol', 3, false)
    const newTurn = processThrow(turn, result)
    expect(newTurn.throwsRemaining).toBe(0)
    expect(newTurn.pendingMoves).toEqual([result])
  })
})

// ---------------------------------------------------------------------------
// processThrow - yut/mo extra throw chaining (GAME-02)
// ---------------------------------------------------------------------------

describe('processThrow - yut/mo extra throw chaining', () => {
  it('yut grants extra throw -- throwsRemaining stays at 1', () => {
    const turn = createTurnState('player')
    const result = makeThrow('yut', 4, true)
    const newTurn = processThrow(turn, result)
    expect(newTurn.throwsRemaining).toBe(1)
    expect(newTurn.pendingMoves).toEqual([result])
  })

  it('mo grants extra throw -- throwsRemaining stays at 1', () => {
    const turn = createTurnState('player')
    const result = makeThrow('mo', 5, true)
    const newTurn = processThrow(turn, result)
    expect(newTurn.throwsRemaining).toBe(1)
    expect(newTurn.pendingMoves).toEqual([result])
  })

  it('yut -> mo -> gae chains correctly: 3 pending, 0 remaining', () => {
    const yut = makeThrow('yut', 4, true)
    const mo = makeThrow('mo', 5, true)
    const gae = makeThrow('gae', 2, false)

    let turn = createTurnState('player')
    turn = processThrow(turn, yut)
    expect(turn.throwsRemaining).toBe(1)

    turn = processThrow(turn, mo)
    expect(turn.throwsRemaining).toBe(1)

    turn = processThrow(turn, gae)
    expect(turn.throwsRemaining).toBe(0)
    expect(turn.pendingMoves).toEqual([yut, mo, gae])
  })

  it('triple yut -> do: 4 pending, 0 remaining', () => {
    const yut = makeThrow('yut', 4, true)
    const doThrow = makeThrow('do', 1, false)

    let turn = createTurnState('player')
    turn = processThrow(turn, yut)
    turn = processThrow(turn, yut)
    turn = processThrow(turn, yut)
    turn = processThrow(turn, doThrow)

    expect(turn.throwsRemaining).toBe(0)
    expect(turn.pendingMoves).toHaveLength(4)
    expect(turn.pendingMoves).toEqual([yut, yut, yut, doThrow])
  })

  it('unlimited chaining: 5 consecutive yuts + final do', () => {
    const yut = makeThrow('yut', 4, true)
    const doThrow = makeThrow('do', 1, false)

    let turn = createTurnState('player')
    for (let i = 0; i < 5; i++) {
      turn = processThrow(turn, yut)
      expect(turn.throwsRemaining).toBe(1)
    }
    turn = processThrow(turn, doThrow)

    expect(turn.throwsRemaining).toBe(0)
    expect(turn.pendingMoves).toHaveLength(6)
  })

  it('triple mo -> geol: 4 pending, 0 remaining', () => {
    const mo = makeThrow('mo', 5, true)
    const geol = makeThrow('geol', 3, false)

    let turn = createTurnState('player')
    turn = processThrow(turn, mo)
    turn = processThrow(turn, mo)
    turn = processThrow(turn, mo)
    turn = processThrow(turn, geol)

    expect(turn.throwsRemaining).toBe(0)
    expect(turn.pendingMoves).toEqual([mo, mo, mo, geol])
  })
})

// ---------------------------------------------------------------------------
// consumeMove - FIFO queue (GAME-03)
// ---------------------------------------------------------------------------

describe('consumeMove - FIFO queue', () => {
  it('returns first pending move (FIFO order)', () => {
    const yut = makeThrow('yut', 4, true)
    const gae = makeThrow('gae', 2, false)

    let turn = createTurnState('player')
    turn = processThrow(turn, yut)
    turn = processThrow(turn, gae)

    const { consumed, newTurnState } = consumeMove(turn)
    expect(consumed).toEqual(yut)
    expect(newTurnState.pendingMoves).toEqual([gae])
  })

  it('returns null when queue is empty', () => {
    const turn = createTurnState('player')
    const { consumed, newTurnState } = consumeMove(turn)
    expect(consumed).toBeNull()
    expect(newTurnState.pendingMoves).toEqual([])
  })

  it('queue maintains order after multiple consumes', () => {
    const doThrow = makeThrow('do', 1, false)
    const gae = makeThrow('gae', 2, false)
    const geol = makeThrow('geol', 3, false)

    // Manually build a turn with 3 pending moves (simulating processed throws)
    const turn = {
      activeTeam: 'player' as Team,
      throwsRemaining: 0,
      pendingMoves: [doThrow, gae, geol],
    }

    const first = consumeMove(turn)
    expect(first.consumed).toEqual(doThrow)

    const second = consumeMove(first.newTurnState)
    expect(second.consumed).toEqual(gae)

    const third = consumeMove(second.newTurnState)
    expect(third.consumed).toEqual(geol)

    const fourth = consumeMove(third.newTurnState)
    expect(fourth.consumed).toBeNull()
  })

  it('consuming single pending move results in empty queue', () => {
    const doThrow = makeThrow('do', 1, false)

    let turn = createTurnState('player')
    turn = processThrow(turn, doThrow)

    const { consumed, newTurnState } = consumeMove(turn)
    expect(consumed).toEqual(doThrow)
    expect(newTurnState.pendingMoves).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// checkWinCondition (GAME-11)
// ---------------------------------------------------------------------------

describe('checkWinCondition', () => {
  it('all player pieces finished -> player wins', () => {
    const pieces: PieceState[] = [
      makeFinishedPiece('p1', 'player'),
      makeFinishedPiece('p2', 'player'),
      makeHomePiece('ai1', 'ai'),
      makeHomePiece('ai2', 'ai'),
    ]
    const result = checkWinCondition(pieces)
    expect(result.isGameOver).toBe(true)
    expect(result.winner).toBe('player')
  })

  it('all AI pieces finished -> AI wins', () => {
    const pieces: PieceState[] = [
      makeHomePiece('p1', 'player'),
      makeHomePiece('p2', 'player'),
      makeFinishedPiece('ai1', 'ai'),
      makeFinishedPiece('ai2', 'ai'),
    ]
    const result = checkWinCondition(pieces)
    expect(result.isGameOver).toBe(true)
    expect(result.winner).toBe('ai')
  })

  it('one piece finished, one at HOME -> not won', () => {
    const pieces: PieceState[] = [
      makeFinishedPiece('p1', 'player'),
      makeHomePiece('p2', 'player'),
      makeHomePiece('ai1', 'ai'),
      makeHomePiece('ai2', 'ai'),
    ]
    const result = checkWinCondition(pieces)
    expect(result.isGameOver).toBe(false)
    expect(result.winner).toBeNull()
  })

  it('one piece finished, one on board -> not won', () => {
    const pieces: PieceState[] = [
      makeFinishedPiece('p1', 'player'),
      makeBoardPiece('p2', 'player', 'outer', 5, 5),
      makeHomePiece('ai1', 'ai'),
      makeHomePiece('ai2', 'ai'),
    ]
    const result = checkWinCondition(pieces)
    expect(result.isGameOver).toBe(false)
    expect(result.winner).toBeNull()
  })

  it('no pieces finished -> not won', () => {
    const pieces: PieceState[] = [
      makeHomePiece('p1', 'player'),
      makeHomePiece('p2', 'player'),
      makeHomePiece('ai1', 'ai'),
      makeHomePiece('ai2', 'ai'),
    ]
    const result = checkWinCondition(pieces)
    expect(result.isGameOver).toBe(false)
    expect(result.winner).toBeNull()
  })

  it('both teams have pieces finished but not all -> not won', () => {
    const pieces: PieceState[] = [
      makeFinishedPiece('p1', 'player'),
      makeBoardPiece('p2', 'player', 'outer', 10, 10),
      makeFinishedPiece('ai1', 'ai'),
      makeBoardPiece('ai2', 'ai', 'outer', 3, 3),
    ]
    const result = checkWinCondition(pieces)
    expect(result.isGameOver).toBe(false)
    expect(result.winner).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// findValidMoves (GAME-12)
// ---------------------------------------------------------------------------

describe('findValidMoves', () => {
  it('pieces on board always have valid moves', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 3, 3),
      makeBoardPiece('p2', 'player', 'outer', 8, 8),
    ]
    const doThrow = makeThrow('do', 1, false)
    const options = findValidMoves(pieces, 'player', doThrow)

    expect(options).toHaveLength(2)
    expect(options.every((o) => o.isPossible)).toBe(true)
  })

  it('HOME piece can enter -> valid', () => {
    const pieces: PieceState[] = [
      makeHomePiece('p1', 'player'),
      makeFinishedPiece('p2', 'player'),
    ]
    const doThrow = makeThrow('do', 1, false)
    const options = findValidMoves(pieces, 'player', doThrow)

    const homePieceOption = options.find((o) => o.pieceId === 'p1')
    expect(homePieceOption?.isPossible).toBe(true)
  })

  it('FINISH piece cannot move -> invalid', () => {
    const pieces: PieceState[] = [
      makeHomePiece('p1', 'player'),
      makeFinishedPiece('p2', 'player'),
    ]
    const doThrow = makeThrow('do', 1, false)
    const options = findValidMoves(pieces, 'player', doThrow)

    const finishedPieceOption = options.find((o) => o.pieceId === 'p2')
    expect(finishedPieceOption?.isPossible).toBe(false)
  })

  it('all pieces at FINISH -> no valid moves (skip)', () => {
    const pieces: PieceState[] = [
      makeFinishedPiece('p1', 'player'),
      makeFinishedPiece('p2', 'player'),
    ]
    const doThrow = makeThrow('do', 1, false)
    const options = findValidMoves(pieces, 'player', doThrow)

    expect(options.every((o) => !o.isPossible)).toBe(true)
  })

  it('only returns options for the specified team', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
      makeHomePiece('ai1', 'ai'),
      makeHomePiece('ai2', 'ai'),
    ]
    const doThrow = makeThrow('do', 1, false)
    const options = findValidMoves(pieces, 'player', doThrow)

    expect(options).toHaveLength(1)
    expect(options[0].pieceId).toBe('p1')
  })
})

// ---------------------------------------------------------------------------
// createInitialGameState
// ---------------------------------------------------------------------------

describe('createInitialGameState', () => {
  it('creates 4 pieces at HOME (2 player, 2 AI)', () => {
    const state = createInitialGameState()
    expect(state.pieces).toHaveLength(4)

    const playerPieces = state.pieces.filter((p) => p.team === 'player')
    const aiPieces = state.pieces.filter((p) => p.team === 'ai')
    expect(playerPieces).toHaveLength(2)
    expect(aiPieces).toHaveLength(2)

    for (const piece of state.pieces) {
      expect(piece.position.station).toBe(HOME)
    }
  })

  it('player starts first', () => {
    const state = createInitialGameState()
    expect(state.turnState.activeTeam).toBe('player')
    expect(state.turnState.throwsRemaining).toBe(1)
    expect(state.turnState.pendingMoves).toEqual([])
  })

  it('game is not over at start', () => {
    const state = createInitialGameState()
    expect(state.isGameOver).toBe(false)
    expect(state.winner).toBeNull()
  })

  it('pieces have correct IDs', () => {
    const state = createInitialGameState()
    const ids = state.pieces.map((p) => p.id)
    expect(ids).toContain('p1')
    expect(ids).toContain('p2')
    expect(ids).toContain('ai1')
    expect(ids).toContain('ai2')
  })
})
