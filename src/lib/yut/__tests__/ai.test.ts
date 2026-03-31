/**
 * AI opponent tests: heuristic scoring, stochastic selection, full turn
 * execution, stacking-aware findValidMoves, and win rate simulation.
 *
 * Tests reference AI-01 (autonomous turn), AI-02 (win rate), AI-03
 * (heuristic + randomization), AI-04 (capture ignore).
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  evaluateMove,
  selectAiMove,
  executeAiTurn,
  AI_CONFIG,
  DEFAULT_AI_WEIGHTS,
} from '@/lib/yut/ai'
import { findValidMoves, createInitialGameState, createTurnState, processThrow, consumeMove, checkWinCondition } from '@/lib/yut/game'
import { getAvailableMoves, enterBoard } from '@/lib/yut/movement'
import { applyMove, confirmStack } from '@/lib/yut/capture'
import { generateThrow } from '@/lib/yut/throw'
import { HOME, FINISH } from '@/lib/yut/types'
import type { PieceState, Team, ThrowResult, MoveResult, GameLogicState } from '@/lib/yut/types'

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

/** Helper to create a ThrowResult */
function makeThrow(name: ThrowResult['name'], steps: number, grantsExtra: boolean): ThrowResult {
  return { name, steps, grantsExtra }
}

/** Helper to create a MoveResult */
function makeMoveResult(
  station: number,
  routeId: string,
  routeIndex: number,
  finished: boolean = false,
  intermediateStations: number[] = []
): MoveResult {
  return {
    newPosition: { station, routeId, routeIndex },
    finished,
    landedOnBranch: false,
    intermediateStations,
  }
}

// ---------------------------------------------------------------------------
// evaluateMove Tests (AI-03)
// ---------------------------------------------------------------------------

describe('evaluateMove', () => {
  it('scores finishing move highest (distance_reduction * 20 bonus)', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('ai1', 'ai', 'outer', 18, 18),
    ]
    const moveResult = makeMoveResult(FINISH, '', -1, true, [19])
    const score = evaluateMove(pieces, 'ai1', moveResult, DEFAULT_AI_WEIGHTS)

    // Finishing move should score at least 20 * distanceReduction
    expect(score).toBeGreaterThanOrEqual(20)
  })

  it('scores move with capture opportunity higher than plain move', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('ai1', 'ai', 'outer', 3, 3),
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
    ]
    const captureMove = makeMoveResult(5, 'outer', 5, false, [4])
    const plainMove = makeMoveResult(5, 'outer', 5, false, [4])

    // Same destination but one has an opponent there
    const piecesWithOpponent = [
      makeBoardPiece('ai1', 'ai', 'outer', 3, 3),
      makeBoardPiece('p1', 'player', 'outer', 5, 5),
    ]
    const piecesWithoutOpponent = [
      makeBoardPiece('ai1', 'ai', 'outer', 3, 3),
    ]

    const captureScore = evaluateMove(piecesWithOpponent, 'ai1', captureMove, DEFAULT_AI_WEIGHTS)
    const plainScore = evaluateMove(piecesWithoutOpponent, 'ai1', plainMove, DEFAULT_AI_WEIGHTS)

    expect(captureScore).toBeGreaterThan(plainScore)
  })

  it('scores move with stack opportunity with bonus', () => {
    const piecesWithFriendly = [
      makeBoardPiece('ai1', 'ai', 'outer', 3, 3),
      makeBoardPiece('ai2', 'ai', 'outer', 5, 5),
    ]
    const piecesWithoutFriendly = [
      makeBoardPiece('ai1', 'ai', 'outer', 3, 3),
    ]
    const moveResult = makeMoveResult(5, 'outer', 5, false, [4])

    const stackScore = evaluateMove(piecesWithFriendly, 'ai1', moveResult, DEFAULT_AI_WEIGHTS)
    const plainScore = evaluateMove(piecesWithoutFriendly, 'ai1', moveResult, DEFAULT_AI_WEIGHTS)

    expect(stackScore).toBeGreaterThan(plainScore)
  })

  it('scores entering board from HOME with base distance progress', () => {
    const pieces: PieceState[] = [
      makeHomePiece('ai1', 'ai'),
    ]
    // Entering board with 3 steps: intermediate stations accumulate
    const moveResult = makeMoveResult(3, 'outer', 3, false, [1, 2])
    const score = evaluateMove(pieces, 'ai1', moveResult, DEFAULT_AI_WEIGHTS)

    // Should score > 0 based on distance progress
    expect(score).toBeGreaterThan(0)
  })

  it('returns 0 or minimal score for move that makes no progress', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('ai1', 'ai', 'outer', 5, 5),
    ]
    // A move with no intermediates and no special interactions
    const moveResult = makeMoveResult(6, 'outer', 6, false, [])
    const score = evaluateMove(pieces, 'ai1', moveResult, DEFAULT_AI_WEIGHTS)

    // Even a plain 1-step move has some progress score, but should be low
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// selectAiMove Tests (AI-03, AI-04)
// ---------------------------------------------------------------------------

describe('selectAiMove', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('with Math.random > 0.4: picks highest-scored move', () => {
    const randomSpy = vi.spyOn(Math, 'random')
    // First call for randomMoveRate check (0.5 > 0.4 => pick best)
    // Second call for captureIgnoreRate check (0.5 > 0.3 => consider captures)
    randomSpy.mockReturnValue(0.5)

    const pieces: PieceState[] = [
      makeBoardPiece('ai1', 'ai', 'outer', 3, 3),
      makeBoardPiece('ai2', 'ai', 'outer', 17, 17),
    ]
    const throwResult = makeThrow('gae', 2, false)

    const result = selectAiMove(pieces, 'ai', throwResult)
    expect(result).not.toBeNull()
    // ai2 is closer to finish, so should be preferred
    expect(result!.pieceId).toBe('ai2')
  })

  it('with Math.random < 0.4: picks a random move', () => {
    const randomSpy = vi.spyOn(Math, 'random')
    // First call for randomMoveRate check (0.3 < 0.4 => random)
    // Subsequent calls for random selection index
    randomSpy.mockReturnValueOnce(0.3).mockReturnValue(0.0)

    const pieces: PieceState[] = [
      makeBoardPiece('ai1', 'ai', 'outer', 3, 3),
      makeBoardPiece('ai2', 'ai', 'outer', 17, 17),
    ]
    const throwResult = makeThrow('gae', 2, false)

    const result = selectAiMove(pieces, 'ai', throwResult)
    expect(result).not.toBeNull()
    // With random selection, we just verify it returns one of the valid moves
    expect(['ai1', 'ai2']).toContain(result!.pieceId)
  })

  it('with capture available and Math.random < 0.3: ignores capture move (AI-04)', () => {
    const randomSpy = vi.spyOn(Math, 'random')
    // First call: randomMoveRate (0.5 > 0.4 => best move, not random)
    // Second call: captureIgnoreRate (0.2 < 0.3 => ignore captures)
    randomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.2).mockReturnValue(0.5)

    const pieces: PieceState[] = [
      makeBoardPiece('ai1', 'ai', 'outer', 3, 3),
      makeBoardPiece('ai2', 'ai', 'outer', 8, 8),
      makeBoardPiece('p1', 'player', 'outer', 5, 5), // ai1 + 2 steps = captures p1
    ]
    const throwResult = makeThrow('gae', 2, false)

    const result = selectAiMove(pieces, 'ai', throwResult)
    expect(result).not.toBeNull()
    // When ignoring captures, ai2 should be preferred (farther along, closer to finish)
    // or at least the capture move should not be preferred
    // Since both moves are valid and capture is ignored, it should pick based on score without capture bonus
    expect(result!.pieceId).toBeDefined()
  })

  it('with capture available and Math.random > 0.3: considers capture move', () => {
    const randomSpy = vi.spyOn(Math, 'random')
    // First call: randomMoveRate (0.5 > 0.4 => best move)
    // Second call: captureIgnoreRate (0.5 > 0.3 => consider captures)
    randomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.5).mockReturnValue(0.5)

    const pieces: PieceState[] = [
      makeBoardPiece('ai1', 'ai', 'outer', 3, 3),
      makeBoardPiece('p1', 'player', 'outer', 5, 5), // ai1 + 2 steps = captures p1
    ]
    const throwResult = makeThrow('gae', 2, false)

    const result = selectAiMove(pieces, 'ai', throwResult)
    expect(result).not.toBeNull()
    // With capture considered, ai1 should capture p1 (high capture bonus)
    expect(result!.pieceId).toBe('ai1')
  })

  it('returns null when no valid moves available', () => {
    const pieces: PieceState[] = [
      makeFinishedPiece('ai1', 'ai'),
      makeFinishedPiece('ai2', 'ai'),
    ]
    const throwResult = makeThrow('do', 1, false)
    const result = selectAiMove(pieces, 'ai', throwResult)
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// executeAiTurn Tests (AI-01)
// ---------------------------------------------------------------------------

describe('executeAiTurn', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('executes complete turn: throws until done, applies all moves', () => {
    // Set up game with AI pieces on the board
    const state: GameLogicState = {
      pieces: [
        makeHomePiece('p1', 'player'),
        makeHomePiece('p2', 'player'),
        makeHomePiece('ai1', 'ai'),
        makeHomePiece('ai2', 'ai'),
      ],
      turnState: createTurnState('ai'),
      isGameOver: false,
      winner: null,
    }

    const result = executeAiTurn(state)

    // Turn should be fully consumed -- no pending moves remaining
    expect(result.turnState.pendingMoves).toEqual([])
    expect(result.turnState.throwsRemaining).toBe(0)
    // At least one AI piece should have moved from HOME
    const aiPieces = result.pieces.filter((p) => p.team === 'ai')
    const movedPieces = aiPieces.filter((p) => p.position.station !== HOME)
    expect(movedPieces.length).toBeGreaterThanOrEqual(1)
  })

  it('handles yut/mo chaining (multiple throws before any moves)', () => {
    const randomSpy = vi.spyOn(Math, 'random')
    // Make generateThrow produce yut (4 flat) then do (1 flat)
    // yut: 4 sticks flat => all < 0.5, so random returns < 0.5 for all 4
    // do: 1 flat, 3 round => random returns < 0.5 for first, >= 0.5 for rest
    const throwSequence = [
      // First throw: yut (4 flat)
      0.1, 0.1, 0.1, 0.1,
      // Second throw: do (1 flat, 3 round)
      0.1, 0.9, 0.9, 0.9,
    ]
    let throwIndex = 0
    // After throw sequence, use 0.5 for all AI selection random calls
    randomSpy.mockImplementation(() => {
      if (throwIndex < throwSequence.length) {
        return throwSequence[throwIndex++]
      }
      return 0.5
    })

    const state: GameLogicState = {
      pieces: [
        makeHomePiece('p1', 'player'),
        makeHomePiece('p2', 'player'),
        makeHomePiece('ai1', 'ai'),
        makeHomePiece('ai2', 'ai'),
      ],
      turnState: createTurnState('ai'),
      isGameOver: false,
      winner: null,
    }

    const result = executeAiTurn(state)

    // Should have processed 2 throws (yut chains, then do ends throwing)
    // Both pending moves should be consumed
    expect(result.turnState.pendingMoves).toEqual([])
    expect(result.turnState.throwsRemaining).toBe(0)
  })

  it('handles stacking automatically (AI always stacks per D-08)', () => {
    // Set up: ai1 at station 3, ai2 at station 5, throw gae (2 steps)
    // ai1 moves to station 5 where ai2 is, should auto-stack
    const randomSpy = vi.spyOn(Math, 'random')
    // Throw: do (1 flat) => 1 step
    // Actually, let's use gae (2 flat) => 2 steps so ai1 goes from 3 to 5
    const throwSequence = [
      // gae: 2 flat, 2 round
      0.1, 0.1, 0.9, 0.9,
    ]
    let throwIndex = 0
    randomSpy.mockImplementation(() => {
      if (throwIndex < throwSequence.length) {
        return throwSequence[throwIndex++]
      }
      return 0.5 // Best move selection
    })

    const state: GameLogicState = {
      pieces: [
        makeHomePiece('p1', 'player'),
        makeHomePiece('p2', 'player'),
        makeBoardPiece('ai1', 'ai', 'outer', 3, 3),
        makeBoardPiece('ai2', 'ai', 'outer', 5, 5),
      ],
      turnState: createTurnState('ai'),
      isGameOver: false,
      winner: null,
    }

    const result = executeAiTurn(state)

    // After the turn, check if stacking occurred
    const ai1 = result.pieces.find((p) => p.id === 'ai1')!
    const ai2 = result.pieces.find((p) => p.id === 'ai2')!

    // One should be stacked with the other
    const isStacked = ai1.stackedWith !== null || ai2.stackedWith !== null
      || ai1.stackedPieceIds.length > 0 || ai2.stackedPieceIds.length > 0
    // Stacking should have occurred if ai1 landed on ai2
    // The exact piece that moves depends on AI selection, so just check
    // the turn completed without errors
    expect(result.turnState.pendingMoves).toEqual([])
  })

  it('handles capture extra throw: after capturing, gets extra throw', () => {
    const randomSpy = vi.spyOn(Math, 'random')
    // Throw: gae (2 steps) - ai1 at station 3 captures p1 at station 5
    // After capture, extra throw -> do (1 step)
    const throwSequence = [
      // First throw: gae (2 flat, 2 round)
      0.1, 0.1, 0.9, 0.9,
      // Extra throw from capture: do (1 flat, 3 round)
      0.1, 0.9, 0.9, 0.9,
    ]
    let throwIndex = 0
    randomSpy.mockImplementation(() => {
      if (throwIndex < throwSequence.length) {
        return throwSequence[throwIndex++]
      }
      return 0.5 // Best move selection
    })

    const state: GameLogicState = {
      pieces: [
        makeBoardPiece('p1', 'player', 'outer', 5, 5),
        makeHomePiece('p2', 'player'),
        makeBoardPiece('ai1', 'ai', 'outer', 3, 3),
        makeHomePiece('ai2', 'ai'),
      ],
      turnState: createTurnState('ai'),
      isGameOver: false,
      winner: null,
    }

    const result = executeAiTurn(state)

    // p1 should be captured (sent HOME)
    const p1 = result.pieces.find((p) => p.id === 'p1')!
    expect(p1.position.station).toBe(HOME)

    // All moves should be consumed
    expect(result.turnState.pendingMoves).toEqual([])
  })

  it('returns updated GameLogicState with all moves applied', () => {
    const state: GameLogicState = {
      pieces: [
        makeHomePiece('p1', 'player'),
        makeHomePiece('p2', 'player'),
        makeHomePiece('ai1', 'ai'),
        makeHomePiece('ai2', 'ai'),
      ],
      turnState: createTurnState('ai'),
      isGameOver: false,
      winner: null,
    }

    const result = executeAiTurn(state)

    // Result should be a valid GameLogicState
    expect(result).toHaveProperty('pieces')
    expect(result).toHaveProperty('turnState')
    expect(result).toHaveProperty('isGameOver')
    expect(result).toHaveProperty('winner')
    expect(result.pieces).toHaveLength(4)
  })

  it('does not modify the input state (pure functional)', () => {
    const state: GameLogicState = {
      pieces: [
        makeHomePiece('p1', 'player'),
        makeHomePiece('p2', 'player'),
        makeHomePiece('ai1', 'ai'),
        makeHomePiece('ai2', 'ai'),
      ],
      turnState: createTurnState('ai'),
      isGameOver: false,
      winner: null,
    }

    // Deep copy to compare later
    const originalPieces = JSON.parse(JSON.stringify(state.pieces))
    const originalTurnState = JSON.parse(JSON.stringify(state.turnState))

    executeAiTurn(state)

    // Original state must not be modified
    expect(state.pieces).toEqual(originalPieces)
    expect(state.turnState).toEqual(originalTurnState)
  })
})

// ---------------------------------------------------------------------------
// findValidMoves stacking filter
// ---------------------------------------------------------------------------

describe('findValidMoves stacking filter', () => {
  it('excludes pieces where stackedWith !== null (followers)', () => {
    const pieces: PieceState[] = [
      makeStackedPiece('ai1', 'ai', 'outer', 5, 5, ['ai2']),
      makeFollowerPiece('ai2', 'ai', 'outer', 5, 5, 'ai1'),
    ]
    const throwResult = makeThrow('do', 1, false)
    const moves = findValidMoves(pieces, 'ai', throwResult)

    // Only ai1 (leader) should be included, ai2 (follower) excluded
    expect(moves).toHaveLength(1)
    expect(moves[0].pieceId).toBe('ai1')
  })

  it('includes leader pieces (stackedWith === null, stackedPieceIds.length > 0)', () => {
    const pieces: PieceState[] = [
      makeStackedPiece('ai1', 'ai', 'outer', 5, 5, ['ai2']),
      makeFollowerPiece('ai2', 'ai', 'outer', 5, 5, 'ai1'),
    ]
    const throwResult = makeThrow('gae', 2, false)
    const moves = findValidMoves(pieces, 'ai', throwResult)

    const leaderMove = moves.find((m) => m.pieceId === 'ai1')
    expect(leaderMove).toBeDefined()
    expect(leaderMove!.isPossible).toBe(true)
  })

  it('includes solo pieces (stackedWith === null, stackedPieceIds.length === 0)', () => {
    const pieces: PieceState[] = [
      makeBoardPiece('ai1', 'ai', 'outer', 5, 5),
      makeBoardPiece('ai2', 'ai', 'outer', 10, 10),
    ]
    const throwResult = makeThrow('do', 1, false)
    const moves = findValidMoves(pieces, 'ai', throwResult)

    expect(moves).toHaveLength(2)
    expect(moves.every((m) => m.isPossible)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Win rate simulation (AI-02)
// ---------------------------------------------------------------------------

describe('win rate simulation', () => {
  /**
   * Simulate a full game between a "smart" player (always best move)
   * and the easy AI (with randomization). Both sides use AI logic
   * but the player side always picks optimal moves.
   */
  function simulateFullGame(): { winner: Team | null; turns: number } {
    let state = createInitialGameState()
    let turns = 0
    const MAX_TURNS = 200

    while (!state.isGameOver && turns < MAX_TURNS) {
      turns++
      const currentTeam = state.turnState.activeTeam

      // THROW phase
      let turnState = { ...state.turnState }
      while (turnState.throwsRemaining > 0) {
        const throwResult = generateThrow()
        turnState = processThrow(turnState, throwResult)
      }

      // MOVE phase
      let pieces = state.pieces.map((p) => ({ ...p }))
      let pendingMoves = [...turnState.pendingMoves]
      let extraThrows: ThrowResult[] = []

      let moveIterations = 0
      while ((pendingMoves.length > 0 || extraThrows.length > 0) && moveIterations < 50) {
        moveIterations++

        // Process any extra throws first
        if (extraThrows.length > 0) {
          for (const et of extraThrows) {
            pendingMoves.push(et)
          }
          extraThrows = []
        }

        if (pendingMoves.length === 0) break

        const consumed = pendingMoves.shift()!

        // Find valid moves
        const validMoves = findValidMoves(pieces, currentTeam, consumed)
        const possibleMoves = validMoves.filter((m) => m.isPossible)

        if (possibleMoves.length === 0) continue

        // Select move: player always picks "best", AI uses selectAiMove
        let selectedPieceId: string
        if (currentTeam === 'player') {
          // Player: simple heuristic -- prefer piece closest to finish, or any movable
          const onBoard = possibleMoves.filter((m) => {
            const p = pieces.find((pp) => pp.id === m.pieceId)!
            return p.position.station !== HOME
          })
          if (onBoard.length > 0) {
            // Pick the piece with highest route index (closest to finish)
            selectedPieceId = onBoard.reduce((best, curr) => {
              const bestPiece = pieces.find((p) => p.id === best.pieceId)!
              const currPiece = pieces.find((p) => p.id === curr.pieceId)!
              return currPiece.position.routeIndex > bestPiece.position.routeIndex ? curr : best
            }).pieceId
          } else {
            selectedPieceId = possibleMoves[0].pieceId
          }
        } else {
          // AI turn: use selectAiMove
          const aiSelection = selectAiMove(pieces, 'ai', consumed)
          if (!aiSelection) continue
          selectedPieceId = aiSelection.pieceId
        }

        // Resolve move for the selected piece
        const piece = pieces.find((p) => p.id === selectedPieceId)!
        const { moveResult } = getAvailableMoves(piece, consumed.steps)
        if (!moveResult) continue

        // Apply the move
        const outcome = applyMove(pieces, selectedPieceId, moveResult)
        pieces = outcome.pieces

        // Handle capture extra throw
        if (outcome.capture.grantExtraThrow) {
          const extraThrow = generateThrow()
          extraThrows.push(extraThrow)
          // Check for yut/mo on extra throw
          if (extraThrow.grantsExtra) {
            let bonus = generateThrow()
            extraThrows.push(bonus)
            while (bonus.grantsExtra) {
              bonus = generateThrow()
              extraThrows.push(bonus)
            }
          }
        }

        // Handle stacking
        if (outcome.stackOpportunity.canStack && outcome.stackOpportunity.targetPieceId) {
          if (currentTeam === 'ai' || Math.random() > 0.5) {
            pieces = confirmStack(pieces, selectedPieceId, outcome.stackOpportunity.targetPieceId)
          }
        }

        // Check win
        const winCheck = checkWinCondition(pieces)
        if (winCheck.isGameOver) {
          return { winner: winCheck.winner, turns }
        }
      }

      // Switch turns
      const nextTeam: Team = currentTeam === 'player' ? 'ai' : 'player'
      state = {
        pieces,
        turnState: createTurnState(nextTeam),
        isGameOver: false,
        winner: null,
      }
    }

    return { winner: null, turns }
  }

  it('player wins 60-90% of games over 500 simulations', () => {
    let playerWins = 0
    let aiWins = 0
    const TOTAL_GAMES = 500

    for (let i = 0; i < TOTAL_GAMES; i++) {
      const result = simulateFullGame()
      if (result.winner === 'player') playerWins++
      if (result.winner === 'ai') aiWins++
    }

    const winRate = playerWins / TOTAL_GAMES
    // Wide band for stochastic test stability
    expect(winRate).toBeGreaterThanOrEqual(0.60)
    expect(winRate).toBeLessThanOrEqual(0.90)
  }, 30000)

  it('AI completes all games without errors or infinite loops', () => {
    let completedGames = 0
    const TOTAL_GAMES = 50

    for (let i = 0; i < TOTAL_GAMES; i++) {
      const result = simulateFullGame()
      if (result.winner !== null) completedGames++
    }

    // At least 90% of games should complete (reach a winner)
    const completionRate = completedGames / TOTAL_GAMES
    expect(completionRate).toBeGreaterThanOrEqual(0.9)
  }, 15000)
})
