/**
 * AI opponent module for Yut Nori.
 *
 * Provides heuristic-based move evaluation, stochastic move selection
 * (easy difficulty), and full autonomous turn execution. The AI is
 * intentionally suboptimal: picks random moves 40% of the time and
 * ignores capture opportunities 30% of the time.
 *
 * Imports only from game logic modules -- zero rendering dependencies.
 */

import type {
  PieceState,
  Team,
  ThrowResult,
  MoveResult,
  GameLogicState,
} from '@/lib/yut/types'
import { findValidMoves, processThrow, consumeMove, checkWinCondition } from '@/lib/yut/game'
import { getAvailableMoves } from '@/lib/yut/movement'
import { applyMove, confirmStack } from '@/lib/yut/capture'
import { generateThrow } from '@/lib/yut/throw'
import { ROUTES } from '@/lib/yut/board'

/** AI difficulty configuration -- tuned for easy (player wins 70-80%) */
export const AI_CONFIG = {
  /** Probability of selecting a random move instead of the best-scored one */
  randomMoveRate: 0.85,
  /** Probability of ignoring a capture opportunity */
  captureIgnoreRate: 0.5,
  /** Whether AI always stacks when landing on own piece (D-08) */
  alwaysStack: true,
  /** Whether AI always takes shortcuts at branch points (D-12) */
  alwaysShortcut: true,
} as const

/** Heuristic weight configuration for move scoring */
export interface AiWeights {
  distanceReduction: number
  captureBonus: number
  stackBonus: number
}

/** Default heuristic weights for easy AI */
export const DEFAULT_AI_WEIGHTS: AiWeights = {
  distanceReduction: 1.0,
  captureBonus: 3.0,
  stackBonus: 2.0,
}

/** A scored move candidate with metadata for selection logic */
export interface ScoredMove {
  pieceId: string
  moveResult: MoveResult
  score: number
  wouldCapture: boolean
  wouldStack: boolean
}

/**
 * Check if an opponent piece occupies a given station.
 *
 * @param pieces - All pieces in the game
 * @param team - The team performing the move (opponents are the other team)
 * @param station - Station number to check
 * @returns Whether an opponent is present at the station
 */
function hasOpponentAt(pieces: PieceState[], team: Team, station: number): boolean {
  return pieces.some(
    (p) => p.team !== team && p.position.station === station && station >= 0
  )
}

/**
 * Check if a friendly piece occupies a given station.
 *
 * @param pieces - All pieces in the game
 * @param pieceId - ID of the moving piece (excluded from check)
 * @param team - The team performing the move
 * @param station - Station number to check
 * @returns Whether a friendly piece (not self) is present at the station
 */
function hasFriendlyAt(pieces: PieceState[], pieceId: string, team: Team, station: number): boolean {
  return pieces.some(
    (p) =>
      p.team === team &&
      p.id !== pieceId &&
      p.position.station === station &&
      station >= 0 &&
      p.stackedWith === null
  )
}

/**
 * Evaluate a single move and return a heuristic score.
 *
 * Scores finishing moves highest, then considers distance progress,
 * capture bonus, and stack bonus. Pure function, no side effects.
 *
 * @param pieces - Current piece positions
 * @param pieceId - ID of the piece to evaluate
 * @param moveResult - The resolved move result
 * @param weights - Heuristic weights for scoring
 * @returns Numeric score (higher is better)
 */
export function evaluateMove(
  pieces: PieceState[],
  pieceId: string,
  moveResult: MoveResult,
  weights: AiWeights
): number {
  let score = 0
  const piece = pieces.find((p) => p.id === pieceId)
  if (!piece) return 0

  // Finishing move gets massive bonus
  if (moveResult.finished) {
    score += weights.distanceReduction * 20
    return score
  }

  // Distance progress: count intermediate stations + 1 for the landing
  score += weights.distanceReduction * (moveResult.intermediateStations.length + 1)

  // Proximity bonus: pieces closer to end of route get a small tiebreaker
  // This encourages finishing pieces already near the goal
  const destRouteId = moveResult.newPosition.routeId
  const destRouteIndex = moveResult.newPosition.routeIndex
  if (destRouteId && ROUTES[destRouteId]) {
    const routeLength = ROUTES[destRouteId].length
    const progress = destRouteIndex / routeLength
    score += weights.distanceReduction * progress * 0.5
  }

  const destination = moveResult.newPosition.station

  // Capture bonus: opponent at destination
  if (hasOpponentAt(pieces, piece.team, destination)) {
    score += weights.captureBonus
  }

  // Stack bonus: friendly at destination
  if (hasFriendlyAt(pieces, pieceId, piece.team, destination)) {
    score += weights.stackBonus
  }

  return score
}

/**
 * Select the best AI move from all legal options for a given throw.
 *
 * Applies stochastic selection: 40% chance of random move, 30% chance
 * of ignoring captures. Otherwise picks highest-scored move.
 *
 * @param pieces - Current piece positions
 * @param team - The AI team
 * @param throwResult - The throw result to use
 * @param weights - Heuristic weights (optional, defaults to DEFAULT_AI_WEIGHTS)
 * @returns Selected move with pieceId and moveResult, or null if no valid moves
 */
export function selectAiMove(
  pieces: PieceState[],
  team: Team,
  throwResult: ThrowResult,
  weights: AiWeights = DEFAULT_AI_WEIGHTS
): { pieceId: string; moveResult: MoveResult } | null {
  // Enumerate all valid moves
  const validMoves = findValidMoves(pieces, team, throwResult)
  const possibleMoves = validMoves.filter((m) => m.isPossible)

  if (possibleMoves.length === 0) return null

  // Build scored move candidates
  const scoredMoves: ScoredMove[] = []
  for (const move of possibleMoves) {
    const piece = pieces.find((p) => p.id === move.pieceId)!
    const { moveResult } = getAvailableMoves(piece, throwResult.steps)
    if (!moveResult) continue

    const destination = moveResult.newPosition.station
    const wouldCapture = hasOpponentAt(pieces, team, destination)
    const wouldStack = hasFriendlyAt(pieces, move.pieceId, team, destination)

    const score = evaluateMove(pieces, move.pieceId, moveResult, weights)

    scoredMoves.push({
      pieceId: move.pieceId,
      moveResult,
      score,
      wouldCapture,
      wouldStack,
    })
  }

  if (scoredMoves.length === 0) return null

  // Step 1: Decide random vs best move
  const randomRoll = Math.random()
  if (randomRoll < AI_CONFIG.randomMoveRate) {
    // Pick a random move (AI-03: 40% random per D-09)
    const idx = Math.floor(Math.random() * scoredMoves.length)
    const selected = scoredMoves[idx]
    return { pieceId: selected.pieceId, moveResult: selected.moveResult }
  }

  // Step 2: Decide whether to ignore captures (AI-04: 30% per D-11)
  const captureIgnoreRoll = Math.random()
  let candidates = scoredMoves
  if (captureIgnoreRoll < AI_CONFIG.captureIgnoreRate) {
    // Filter out capture moves
    const nonCaptureMoves = scoredMoves.filter((m) => !m.wouldCapture)
    if (nonCaptureMoves.length > 0) {
      candidates = nonCaptureMoves
    }
    // If all moves capture, keep all candidates (fallback)
  }

  // Step 3: Pick the highest-scored move from candidates (60% of the time)
  candidates.sort((a, b) => b.score - a.score)
  const best = candidates[0]

  return { pieceId: best.pieceId, moveResult: best.moveResult }
}

/**
 * Execute a complete AI turn: throw until done, then apply all moves.
 *
 * Phase 1: THROW until throwsRemaining === 0 (handles yut/mo chaining).
 * Phase 2: CONSUME and APPLY each pending move sequentially.
 *
 * Handles capture extra throws, automatic stacking (D-08), and includes
 * a safety counter (max 100 iterations) to prevent infinite loops.
 *
 * @param state - Current game logic state (not mutated)
 * @returns New GameLogicState with all AI moves applied
 */
export function executeAiTurn(state: GameLogicState): GameLogicState {
  // Deep copy to avoid mutating input
  let pieces = state.pieces.map((p) => ({
    ...p,
    stackedPieceIds: [...p.stackedPieceIds],
  }))
  let turnState = {
    ...state.turnState,
    pendingMoves: [...state.turnState.pendingMoves],
  }

  // Phase 1: THROW until throwsRemaining === 0
  let safetyCounter = 0
  while (turnState.throwsRemaining > 0 && safetyCounter < 100) {
    safetyCounter++
    const throwResult = generateThrow()
    turnState = processThrow(turnState, throwResult)
  }

  // Phase 2: CONSUME and APPLY each pending move
  while (turnState.pendingMoves.length > 0 && safetyCounter < 100) {
    safetyCounter++
    const { consumed, newTurnState } = consumeMove(turnState)
    turnState = newTurnState
    if (!consumed) break

    // Select which piece to move
    const selection = selectAiMove(pieces, 'ai', consumed, DEFAULT_AI_WEIGHTS)
    if (!selection) continue // No valid move, skip this throw

    // Apply the move
    const outcome = applyMove(pieces, selection.pieceId, selection.moveResult)
    pieces = outcome.pieces

    // Handle capture extra throw (D-01, D-03, D-16)
    if (outcome.capture.grantExtraThrow) {
      turnState = { ...turnState, throwsRemaining: turnState.throwsRemaining + 1 }

      // Drain extra throws
      while (turnState.throwsRemaining > 0 && safetyCounter < 100) {
        safetyCounter++
        const extraThrow = generateThrow()
        turnState = processThrow(turnState, extraThrow)
      }
    }

    // Handle stacking (D-08: AI always stacks)
    if (outcome.stackOpportunity.canStack && AI_CONFIG.alwaysStack && outcome.stackOpportunity.targetPieceId) {
      pieces = confirmStack(pieces, selection.pieceId, outcome.stackOpportunity.targetPieceId)
    }

    // Check win condition
    const winCheck = checkWinCondition(pieces)
    if (winCheck.isGameOver) {
      return {
        pieces,
        turnState: { ...turnState, pendingMoves: [] },
        isGameOver: true,
        winner: winCheck.winner,
      }
    }
  }

  return {
    pieces,
    turnState,
    isGameOver: false,
    winner: null,
  }
}
