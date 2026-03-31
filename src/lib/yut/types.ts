/**
 * Yut Nori game type definitions and constants.
 *
 * All game logic contracts are defined here -- types flow to board, throw,
 * movement, and game modules. No rendering dependencies.
 */

/** The five possible throw outcomes in traditional yut nori */
export type ThrowName = 'do' | 'gae' | 'geol' | 'yut' | 'mo'

/** Number of steps each throw result advances a piece */
export const THROW_STEPS: Record<ThrowName, number> = {
  do: 1,
  gae: 2,
  geol: 3,
  yut: 4,
  mo: 5,
}

/** Whether a throw result grants an additional throw (yut and mo do) */
export const GRANTS_EXTRA_THROW: Record<ThrowName, boolean> = {
  do: false,
  gae: false,
  geol: false,
  yut: true,
  mo: true,
}

/** Sentinel value for pieces that haven't entered the board yet */
export const HOME = -1

/** Sentinel value for pieces that have completed the course */
export const FINISH = -2

/** The two competing sides */
export type Team = 'player' | 'ai'

/** A piece's position on the board, tracked by route and index within that route */
export interface PiecePosition {
  station: number
  routeId: string
  routeIndex: number
}

/** A single game piece with identity, team, and current position */
export interface PieceState {
  id: string
  team: Team
  position: PiecePosition
  /** IDs of pieces stacked onto this leader; empty array for solo/follower pieces */
  stackedPieceIds: string[]
  /** ID of the leader piece this is stacked onto; null for solo/leader pieces */
  stackedWith: string | null
}

/** The outcome of a single yut throw */
export interface ThrowResult {
  name: ThrowName
  steps: number
  grantsExtra: boolean
}

/**
 * The result of resolving a piece movement along its route.
 * Includes the new position, whether the piece finished, and branch info
 * if the piece landed on a branch point.
 */
export interface MoveResult {
  newPosition: PiecePosition
  finished: boolean
  landedOnBranch: boolean
  branchOptions?: {
    continueRoute: string
    shortcutRoute: string
  }
  intermediateStations: number[]
}

/** A candidate move for a piece given a throw result */
export interface MoveOption {
  pieceId: string
  result: ThrowResult
  isPossible: boolean
}

/** Tracks the active team's turn: who's throwing, how many throws remain, queued results */
export interface TurnState {
  activeTeam: Team
  throwsRemaining: number
  pendingMoves: ThrowResult[]
}

/** Top-level game logic state -- consumed by the Zustand store layer */
export interface GameLogicState {
  pieces: PieceState[]
  turnState: TurnState
  isGameOver: boolean
  winner: Team | null
}

/** Result of checking for capture at a destination */
export interface CaptureResult {
  captured: boolean
  capturedPieceIds: string[]
  grantExtraThrow: boolean
}

/** Result of checking for stacking opportunity at a destination */
export interface StackOpportunity {
  canStack: boolean
  targetPieceId: string | null
}

/** Complete outcome after applying a move with interaction detection */
export interface MoveOutcome {
  pieces: PieceState[]
  capture: CaptureResult
  stackOpportunity: StackOpportunity
}
