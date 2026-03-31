/**
 * Capture and stacking mechanics for Yut Nori.
 *
 * Handles piece interactions when landing on occupied stations:
 * - Capture: landing on opponent sends them HOME, grants extra throw
 * - Stacking: landing on own piece offers player choice to merge
 * - Group movement: stacked pieces move together as one unit
 *
 * All functions are pure-functional: no mutation of input arrays/objects,
 * always return new data structures.
 *
 * Imports only from ./types -- zero rendering dependencies.
 */

import { HOME, FINISH } from '@/lib/yut/types'
import type {
  PieceState,
  CaptureResult,
  StackOpportunity,
  MoveOutcome,
  MoveResult,
  PiecePosition,
} from '@/lib/yut/types'

/** No-capture sentinel result */
const NO_CAPTURE: CaptureResult = {
  captured: false,
  capturedPieceIds: [],
  grantExtraThrow: false,
}

/** No-stack sentinel result */
const NO_STACK: StackOpportunity = {
  canStack: false,
  targetPieceId: null,
}

/**
 * Detect whether a capture occurs at the destination station.
 *
 * A capture happens when an opponent piece (or stacked group) occupies
 * the destination station. HOME and FINISH stations never trigger capture.
 * Per D-01, any capture grants an extra throw.
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
  // Guard: HOME and FINISH are never valid capture locations (Pitfall 5)
  if (destinationStation === HOME || destinationStation === FINISH) {
    return { ...NO_CAPTURE }
  }

  const movingPiece = pieces.find((p) => p.id === movingPieceId)
  if (!movingPiece) {
    return { ...NO_CAPTURE }
  }

  // Find opponent pieces at the destination station (on the board, not HOME/FINISH)
  const opponents = pieces.filter(
    (p) =>
      p.team !== movingPiece.team &&
      p.position.station === destinationStation &&
      p.position.station >= 0
  )

  if (opponents.length === 0) {
    return { ...NO_CAPTURE }
  }

  // Collect all captured piece IDs, including followers of any leader
  const capturedPieceIds: string[] = []
  for (const opponent of opponents) {
    capturedPieceIds.push(opponent.id)
    // Include any followers stacked on this opponent
    for (const followerId of opponent.stackedPieceIds) {
      if (!capturedPieceIds.includes(followerId)) {
        capturedPieceIds.push(followerId)
      }
    }
  }

  return {
    captured: true,
    capturedPieceIds,
    grantExtraThrow: true,
  }
}

/**
 * Execute a capture by sending all captured pieces to HOME.
 *
 * Resets each captured piece's position to HOME and clears all stacking
 * references (stackedPieceIds and stackedWith). Per D-02, stacked groups
 * are disbanded -- each piece returns individually to HOME.
 *
 * @param pieces - All pieces in the game
 * @param capturedPieceIds - IDs of pieces to send HOME
 * @returns New pieces array with captured pieces at HOME
 */
export function executeCapture(
  pieces: PieceState[],
  capturedPieceIds: string[]
): PieceState[] {
  return pieces.map((piece) => {
    if (!capturedPieceIds.includes(piece.id)) {
      return piece
    }

    return {
      ...piece,
      position: { station: HOME, routeId: '', routeIndex: -1 },
      stackedPieceIds: [],
      stackedWith: null,
    }
  })
}

/**
 * Detect whether a stacking opportunity exists at the destination station.
 *
 * Stacking is possible when a friendly piece (same team, not a follower)
 * occupies the destination. HOME and FINISH stations never trigger stacking.
 * Only independent pieces or leaders are valid stack targets (not followers).
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
  // Guard: HOME and FINISH are never valid stacking locations (Pitfall 5)
  if (destinationStation === HOME || destinationStation === FINISH) {
    return { ...NO_STACK }
  }

  const movingPiece = pieces.find((p) => p.id === movingPieceId)
  if (!movingPiece) {
    return { ...NO_STACK }
  }

  // Find friendly pieces at destination that are independent or leaders (not followers)
  const friendly = pieces.find(
    (p) =>
      p.team === movingPiece.team &&
      p.id !== movingPieceId &&
      p.position.station === destinationStation &&
      p.stackedWith === null
  )

  if (!friendly) {
    return { ...NO_STACK }
  }

  return {
    canStack: true,
    targetPieceId: friendly.id,
  }
}

/**
 * Confirm a stack by merging the arriving piece under the existing piece.
 *
 * The existing piece becomes (or stays as) the leader. The arriving piece
 * and all its followers become followers of the existing piece.
 * Per Pitfall 6, when an arriving group merges into an existing piece,
 * all members of the arriving group transfer to the existing leader.
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
  const arriving = pieces.find((p) => p.id === arrivingPieceId)
  const existing = pieces.find((p) => p.id === existingPieceId)
  if (!arriving || !existing) {
    return pieces
  }

  // Collect all followers being transferred from the arriving piece
  const transferredFollowerIds = [...arriving.stackedPieceIds]

  // Build the new followers list for the existing leader:
  // existing's current followers + arrivingPieceId + arriving's transferred followers
  const newExistingFollowers = [
    ...existing.stackedPieceIds,
    arrivingPieceId,
    ...transferredFollowerIds,
  ]

  return pieces.map((piece) => {
    if (piece.id === existingPieceId) {
      // Existing piece becomes/stays leader with all new followers
      return {
        ...piece,
        stackedPieceIds: newExistingFollowers,
      }
    }

    if (piece.id === arrivingPieceId) {
      // Arriving piece becomes a follower of existing
      return {
        ...piece,
        stackedPieceIds: [],
        stackedWith: existingPieceId,
      }
    }

    if (transferredFollowerIds.includes(piece.id)) {
      // Transferred followers now point to the existing leader
      return {
        ...piece,
        stackedWith: existingPieceId,
      }
    }

    return piece
  })
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
 * Non-group pieces are left unchanged.
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
  const leader = pieces.find((p) => p.id === leaderId)
  if (!leader) {
    return pieces
  }

  const followerIds = leader.stackedPieceIds

  return pieces.map((piece) => {
    if (piece.id === leaderId || followerIds.includes(piece.id)) {
      return {
        ...piece,
        position: { ...newPosition },
      }
    }

    return piece
  })
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
 * Critical ordering per Pitfall 2: capture FIRST, then stack detection.
 * This ensures opponent is removed before checking for friendly stacking.
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
  const movingPiece = pieces.find((p) => p.id === pieceId)
  if (!movingPiece) {
    return {
      pieces,
      capture: { ...NO_CAPTURE },
      stackOpportunity: { ...NO_STACK },
    }
  }

  // Step 1: Update moving piece position
  let updatedPieces = pieces.map((piece) => {
    if (piece.id === pieceId) {
      return {
        ...piece,
        position: { ...moveResult.newPosition },
      }
    }
    return piece
  })

  // Step 2: If piece is a leader, move followers too
  if (movingPiece.stackedPieceIds.length > 0) {
    updatedPieces = moveStackGroup(updatedPieces, pieceId, moveResult.newPosition)
  }

  // Step 3: If piece finished, skip capture/stack checks
  if (moveResult.finished) {
    return {
      pieces: updatedPieces,
      capture: { ...NO_CAPTURE },
      stackOpportunity: { ...NO_STACK },
    }
  }

  const destinationStation = moveResult.newPosition.station

  // Step 4: Detect and execute capture
  const captureResult = detectCapture(updatedPieces, pieceId, destinationStation)
  if (captureResult.captured) {
    updatedPieces = executeCapture(updatedPieces, captureResult.capturedPieceIds)
  }

  // Step 5: Detect stack opportunity (AFTER capture per Pitfall 2)
  const stackOpportunity = detectStack(updatedPieces, pieceId, destinationStation)

  return {
    pieces: updatedPieces,
    capture: captureResult,
    stackOpportunity,
  }
}
