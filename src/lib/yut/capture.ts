/**
 * Capture and stacking mechanics for Yut Nori.
 *
 * Handles piece interactions when landing on occupied stations:
 * - Capture: landing on opponent sends them HOME, grants extra throw
 * - Stacking: landing on own piece offers player choice to merge
 * - Group movement: stacked pieces move together as one unit
 *
 * Imports only from ./types and ./movement -- zero rendering dependencies.
 */

import type {
  PieceState,
  CaptureResult,
  StackOpportunity,
  MoveOutcome,
  MoveResult,
  PiecePosition,
} from '@/lib/yut/types'

/**
 * Detect whether a capture occurs at the destination station.
 *
 * A capture happens when an opponent piece (or stacked group) occupies
 * the destination station. HOME and FINISH stations never trigger capture.
 *
 * @param pieces - All pieces in the game
 * @param movingPieceId - ID of the piece that just moved
 * @param destinationStation - Station number the piece landed on
 * @returns CaptureResult with captured flag, piece IDs, and extra throw grant
 */
export function detectCapture(
  pieces: PieceState[],
  movingPieceId: string,
  destinationStation: number
): CaptureResult {
  throw new Error('Not implemented')
}

/**
 * Execute a capture by sending all captured pieces to HOME.
 *
 * Resets each captured piece's position to HOME and clears all stacking
 * references (stackedPieceIds and stackedWith). Returns a new pieces array.
 *
 * @param pieces - All pieces in the game
 * @param capturedPieceIds - IDs of pieces to send HOME
 * @returns New pieces array with captured pieces at HOME
 */
export function executeCapture(
  pieces: PieceState[],
  capturedPieceIds: string[]
): PieceState[] {
  throw new Error('Not implemented')
}

/**
 * Detect whether a stacking opportunity exists at the destination station.
 *
 * Stacking is possible when a friendly piece (same team, not a follower)
 * occupies the destination. HOME and FINISH stations never trigger stacking.
 *
 * @param pieces - All pieces in the game
 * @param movingPieceId - ID of the piece that just moved
 * @param destinationStation - Station number the piece landed on
 * @returns StackOpportunity with canStack flag and target piece ID
 */
export function detectStack(
  pieces: PieceState[],
  movingPieceId: string,
  destinationStation: number
): StackOpportunity {
  throw new Error('Not implemented')
}

/**
 * Confirm a stack by merging the arriving piece under the existing piece.
 *
 * The existing piece becomes (or stays as) the leader. The arriving piece
 * becomes a follower. If the arriving piece had its own followers, they
 * are all transferred to the existing leader.
 *
 * @param pieces - All pieces in the game
 * @param arrivingPieceId - ID of the piece that just arrived
 * @param existingPieceId - ID of the piece already at the station (becomes leader)
 * @returns New pieces array with updated stacking references
 */
export function confirmStack(
  pieces: PieceState[],
  arrivingPieceId: string,
  existingPieceId: string
): PieceState[] {
  throw new Error('Not implemented')
}

/**
 * Decline a stack -- no-op per D-05.
 *
 * Both pieces remain at the same position independently. No state change needed.
 */
export function declineStack(): void {
  // No-op: pieces coexist independently at the same position (D-05)
}

/**
 * Move a stacked group (leader + all followers) to a new position.
 *
 * Updates the leader's position and all followers' positions atomically.
 *
 * @param pieces - All pieces in the game
 * @param leaderId - ID of the leader piece
 * @param newPosition - New position for the entire group
 * @returns New pieces array with updated positions
 */
export function moveStackGroup(
  pieces: PieceState[],
  leaderId: string,
  newPosition: PiecePosition
): PieceState[] {
  throw new Error('Not implemented')
}

/**
 * Apply a move and detect all interactions at the destination.
 *
 * Orchestrates the full move sequence:
 * 1. Update moving piece (and followers if leader) position
 * 2. If finished, skip interaction checks
 * 3. Detect and execute capture (opponent at destination)
 * 4. Detect stack opportunity (friendly at destination, AFTER capture)
 *
 * Critical ordering: capture FIRST, then stack detection (Pitfall 2).
 *
 * @param pieces - All pieces in the game
 * @param pieceId - ID of the piece to move
 * @param moveResult - The resolved move result from movement.ts
 * @returns MoveOutcome with updated pieces, capture result, and stack opportunity
 */
export function applyMove(
  pieces: PieceState[],
  pieceId: string,
  moveResult: MoveResult
): MoveOutcome {
  throw new Error('Not implemented')
}
