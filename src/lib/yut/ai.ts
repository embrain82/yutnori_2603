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

/** AI difficulty configuration -- tuned for easy (player wins 70-80%) */
export const AI_CONFIG = {
  /** Probability of selecting a random move instead of the best-scored one */
  randomMoveRate: 0.4,
  /** Probability of ignoring a capture opportunity */
  captureIgnoreRate: 0.3,
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
  captureBonus: 5.0,
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
 * Evaluate a single move and return a heuristic score.
 *
 * Scores finishing moves highest, then considers distance progress,
 * capture bonus, and stack bonus.
 *
 * @param pieces - Current piece positions
 * @param pieceId - ID of the piece to evaluate
 * @param moveResult - The resolved move result
 * @param weights - Heuristic weights for scoring
 * @returns Numeric score (higher is better)
 */
export function evaluateMove(
  _pieces: PieceState[],
  _pieceId: string,
  _moveResult: MoveResult,
  _weights: AiWeights
): number {
  throw new Error('Not implemented')
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
  _pieces: PieceState[],
  _team: Team,
  _throwResult: ThrowResult,
  _weights: AiWeights = DEFAULT_AI_WEIGHTS
): { pieceId: string; moveResult: MoveResult } | null {
  throw new Error('Not implemented')
}

/**
 * Execute a complete AI turn: throw until done, then apply all moves.
 *
 * Handles yut/mo chaining, capture extra throws, and automatic stacking.
 * Includes a safety counter (max 100 iterations) to prevent infinite loops.
 *
 * @param state - Current game logic state (not mutated)
 * @returns New GameLogicState with all AI moves applied
 */
export function executeAiTurn(_state: GameLogicState): GameLogicState {
  throw new Error('Not implemented')
}
