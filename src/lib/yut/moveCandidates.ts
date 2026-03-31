/**
 * UI-ready move candidate generation for Yut Nori.
 *
 * Converts the pure movement/capture rules into a shape the board layer can
 * consume directly when highlighting destinations and handling branch choices.
 */

import { FINISH } from '@/lib/yut/types'
import type { MoveResult, PieceState, Team, ThrowResult } from '@/lib/yut/types'
import { BRANCH_POINTS } from '@/lib/yut/board'
import { applyBranchChoice, getAvailableMoves, resolveMove } from '@/lib/yut/movement'

export type RouteChoice = 'continue' | 'shortcut'

export interface MoveCandidate {
  pieceId: string
  result: ThrowResult
  routeChoice: RouteChoice
  moveResult: MoveResult
}

export function buildMoveCandidates(
  pieces: PieceState[],
  team: Team,
  throwResult: ThrowResult
): MoveCandidate[] {
  const candidates: MoveCandidate[] = []
  const teamPieces = pieces.filter((piece) => piece.team === team && piece.stackedWith === null)

  for (const piece of teamPieces) {
    if (piece.position.station === FINISH) {
      continue
    }

    const baseMove = getAvailableMoves(piece, throwResult.steps)
    if (baseMove.canMove && baseMove.moveResult) {
      candidates.push({
        pieceId: piece.id,
        result: throwResult,
        routeChoice: 'continue',
        moveResult: baseMove.moveResult,
      })
    }

    const branch = BRANCH_POINTS[piece.position.station]
    // Phase 3's direct-tap branch UI needs both possible destinations up front.
    if (branch && piece.position.routeId === branch.continueRoute) {
      const switchedPiece = applyBranchChoice(piece, branch.shortcutRoute)
      candidates.push({
        pieceId: piece.id,
        result: throwResult,
        routeChoice: 'shortcut',
        moveResult: resolveMove(switchedPiece, throwResult.steps),
      })
    }
  }

  return candidates
}
