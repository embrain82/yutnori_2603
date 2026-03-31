/**
 * Game state operations for Yut Nori.
 *
 * Manages the throw queue (yut/mo chaining), FIFO move consumption,
 * win condition detection, and impossible move identification.
 * This module completes the Phase 1 game logic library.
 *
 * Imports only from ./types and ./movement -- zero rendering dependencies.
 */

import { HOME, FINISH } from '@/lib/yut/types'
import type {
  Team,
  TurnState,
  ThrowResult,
  PieceState,
  GameLogicState,
  MoveOption,
} from '@/lib/yut/types'
import { getAvailableMoves } from '@/lib/yut/movement'

/**
 * Create a fresh turn state for the given team.
 *
 * A new turn starts with 1 throw remaining and no pending moves.
 *
 * @param team - The team whose turn it is
 * @returns Fresh TurnState with 1 throw remaining
 */
export function createTurnState(team: Team): TurnState {
  return {
    activeTeam: team,
    throwsRemaining: 1,
    pendingMoves: [],
  }
}

/**
 * Process a throw result and update the turn state.
 *
 * Each throw consumes 1 throwsRemaining. If the throw grants an extra
 * (yut or mo), throwsRemaining is incremented by 1 -- net effect is
 * no change. Non-extra throws (do, gae, geol) simply decrement.
 *
 * The result is appended to the pending moves queue for later consumption.
 *
 * @param turnState - Current turn state
 * @param result - The throw result to process
 * @returns New TurnState with updated throwsRemaining and pendingMoves
 */
export function processThrow(turnState: TurnState, result: ThrowResult): TurnState {
  const newPending = [...turnState.pendingMoves, result]
  const base = turnState.throwsRemaining - 1
  const extra = result.grantsExtra ? 1 : 0

  return {
    ...turnState,
    pendingMoves: newPending,
    throwsRemaining: base + extra,
  }
}

/**
 * Consume the first pending move from the queue (FIFO order).
 *
 * Returns the consumed ThrowResult and the updated TurnState. If there
 * are no pending moves, consumed is null and the state is unchanged.
 *
 * @param turnState - Current turn state with pending moves
 * @returns Object with consumed ThrowResult (or null) and new TurnState
 */
export function consumeMove(
  turnState: TurnState
): { consumed: ThrowResult | null; newTurnState: TurnState } {
  if (turnState.pendingMoves.length === 0) {
    return { consumed: null, newTurnState: { ...turnState } }
  }

  const [first, ...rest] = turnState.pendingMoves

  return {
    consumed: first,
    newTurnState: {
      ...turnState,
      pendingMoves: rest,
    },
  }
}

/**
 * Check if any team has won the game.
 *
 * A team wins when ALL of its pieces have reached FINISH. With 2 pieces
 * per team, both must be at the FINISH sentinel station.
 *
 * @param pieces - All pieces in the game
 * @returns Object with isGameOver flag and winner (or null)
 */
export function checkWinCondition(
  pieces: PieceState[]
): { isGameOver: boolean; winner: Team | null } {
  const teams: Team[] = ['player', 'ai']

  for (const team of teams) {
    const teamPieces = pieces.filter((p) => p.team === team)
    const allFinished = teamPieces.length > 0 && teamPieces.every((p) => p.position.station === FINISH)

    if (allFinished) {
      return { isGameOver: true, winner: team }
    }
  }

  return { isGameOver: false, winner: null }
}

/**
 * Find all valid moves for a team given a throw result.
 *
 * For each piece of the specified team, determines whether the piece
 * can legally use the throw result:
 * - FINISH pieces cannot move (isPossible: false)
 * - HOME pieces can enter the board (isPossible: true)
 * - On-board pieces can always move (isPossible: true)
 *
 * If ALL options have isPossible=false, the throw must be auto-skipped
 * (GAME-12: impossible move detection).
 *
 * @param pieces - All pieces in the game
 * @param team - The team to find moves for
 * @param throwResult - The throw result to evaluate
 * @returns Array of MoveOption objects, one per team piece
 */
export function findValidMoves(
  pieces: PieceState[],
  team: Team,
  throwResult: ThrowResult
): MoveOption[] {
  const teamPieces = pieces.filter((p) => p.team === team)

  return teamPieces.map((piece) => {
    const { canMove } = getAvailableMoves(piece, throwResult.steps)

    return {
      pieceId: piece.id,
      result: throwResult,
      isPossible: canMove,
    }
  })
}

/**
 * Create the initial game state with 4 pieces at HOME.
 *
 * Sets up 2 player pieces (p1, p2) and 2 AI pieces (ai1, ai2),
 * all starting at HOME. Player goes first with 1 throw remaining.
 *
 * @returns Initial GameLogicState ready for the first throw
 */
export function createInitialGameState(): GameLogicState {
  return {
    pieces: [
      { id: 'p1', team: 'player', position: { station: HOME, routeId: '', routeIndex: -1 } },
      { id: 'p2', team: 'player', position: { station: HOME, routeId: '', routeIndex: -1 } },
      { id: 'ai1', team: 'ai', position: { station: HOME, routeId: '', routeIndex: -1 } },
      { id: 'ai2', team: 'ai', position: { station: HOME, routeId: '', routeIndex: -1 } },
    ],
    turnState: createTurnState('player'),
    isGameOver: false,
    winner: null,
  }
}
