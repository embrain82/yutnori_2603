/**
 * Movement resolution engine for Yut Nori.
 *
 * Core path traversal that advances pieces along routes, detects finish
 * conditions, and identifies branch point choices. This is the highest-risk
 * module -- the board graph with 5 routes, conditional branching at corners,
 * and pass-through finish semantics is the #1 source of bugs in Yut Nori
 * implementations.
 *
 * Imports only from ./types and ./board -- zero rendering dependencies.
 */
import { HOME, FINISH } from '@/lib/yut/types'
import type { PieceState, PiecePosition, MoveResult, Team } from '@/lib/yut/types'
import { ROUTES, ROUTE_IDS, BRANCH_POINTS } from '@/lib/yut/board'

/**
 * Resolve a piece's movement along its current route.
 *
 * Advances the piece `steps` positions forward, tracking intermediate
 * stations for animation. Detects finish conditions (D-07: landing on
 * finish point is NOT finished; D-08: passing through IS finished) and
 * branch points (only when landing, not passing through).
 *
 * @param piece - The piece to move (must be on the board, not HOME/FINISH)
 * @param steps - Number of steps to advance (1-5)
 * @returns MoveResult with new position, finish status, and branch info
 */
export function resolveMove(piece: PieceState, steps: number): MoveResult {
  const route = ROUTES[piece.position.routeId]
  const startIndex = piece.position.routeIndex
  const intermediateStations: number[] = []

  let currentIndex = startIndex

  for (let i = 0; i < steps; i++) {
    currentIndex++

    if (currentIndex >= route.length) {
      // Went past end of route -- entering finish zone
      const stepsRemaining = steps - i - 1
      const isOuterRoute = piece.position.routeId === ROUTE_IDS.OUTER

      if (!isOuterRoute) {
        // Diagonal/center routes: any step beyond last station = finished
        // No D-07 exception -- these routes don't loop back to 참먹이
        return makeFinishedResult(intermediateStations)
      }

      // Outer route finish semantics (D-07 / D-08):
      // The outer route is a loop. After index 19 (S19), the next step
      // is the "finish transition" back to 참먹이 (S0).
      if (stepsRemaining > 0) {
        // D-08: passed through 참먹이 -- piece IS finished
        return makeFinishedResult(intermediateStations)
      }

      // D-07: landed exactly at 참먹이 -- NOT finished
      // Piece is at the finish line but hasn't passed through it
      return {
        newPosition: {
          station: 0,
          routeId: piece.position.routeId,
          routeIndex: route.length,
        },
        finished: false,
        landedOnBranch: false,
        intermediateStations,
      }
    }

    // Still within route bounds
    if (i < steps - 1) {
      // Intermediate step (not the final landing position)
      intermediateStations.push(route[currentIndex])
    }
  }

  // Piece landed within the route
  const finalStation = route[currentIndex]
  const landedOnBranch = isBranchPoint(finalStation, piece.position.routeId)

  const result: MoveResult = {
    newPosition: {
      station: finalStation,
      routeId: piece.position.routeId,
      routeIndex: currentIndex,
    },
    finished: false,
    landedOnBranch,
    intermediateStations,
  }

  if (landedOnBranch) {
    result.branchOptions = BRANCH_POINTS[finalStation]
  }

  return result
}

/**
 * Enter a new piece onto the board from HOME.
 *
 * Places the piece conceptually at S0 (outer route index 0) and then
 * advances `steps` positions forward. A piece entering with mo(5) will
 * land on S5 and trigger branch detection.
 *
 * @param team - The team owning the piece
 * @param pieceId - Unique identifier for the piece
 * @param steps - Number of steps from the throw (1-5)
 * @returns MoveResult with the entry position
 */
export function enterBoard(team: Team, pieceId: string, steps: number): MoveResult {
  // Create a virtual piece at the start of the outer route (S0, index 0)
  const entryPiece: PieceState = {
    id: pieceId,
    team,
    position: {
      station: 0,
      routeId: ROUTE_IDS.OUTER,
      routeIndex: 0,
    },
  }

  return resolveMove(entryPiece, steps)
}

/**
 * Apply a branch choice when a piece has landed on a branch point.
 *
 * If the player chooses the shortcut route, the piece switches to that
 * route at index 0 (the branch station is the first station of the
 * shortcut route). If the player chooses to continue, the position
 * stays unchanged.
 *
 * @param piece - The piece at a branch point
 * @param chosenRoute - The route to switch to
 * @returns Updated PieceState with the new route
 */
export function applyBranchChoice(piece: PieceState, chosenRoute: string): PieceState {
  if (chosenRoute === piece.position.routeId) {
    // Continue on current route -- no change
    return { ...piece }
  }

  // Switch to shortcut route -- piece stays at same station but at index 0 of new route
  return {
    ...piece,
    position: {
      station: piece.position.station,
      routeId: chosenRoute,
      routeIndex: 0,
    },
  }
}

/**
 * Check if a piece can legally use a throw result.
 *
 * A piece at HOME can always enter the board. A piece at FINISH cannot
 * move. A piece on the board can always move (even if it would finish).
 *
 * @param piece - The piece to check
 * @param steps - Number of steps from the throw
 * @returns Object with canMove flag and optional preview MoveResult
 */
export function getAvailableMoves(
  piece: PieceState,
  steps: number
): { canMove: boolean; moveResult?: MoveResult } {
  if (piece.position.station === FINISH) {
    return { canMove: false }
  }

  if (piece.position.station === HOME) {
    const moveResult = enterBoard(piece.team, piece.id, steps)
    return { canMove: true, moveResult }
  }

  const moveResult = resolveMove(piece, steps)
  return { canMove: true, moveResult }
}

/**
 * Check if a station is a branch point AND the piece is on a route
 * where the branch applies (only outer route triggers branches).
 */
function isBranchPoint(station: number, routeId: string): boolean {
  return routeId === ROUTE_IDS.OUTER && station in BRANCH_POINTS
}

/** Create a finished MoveResult with FINISH sentinel position */
function makeFinishedResult(intermediateStations: number[]): MoveResult {
  return {
    newPosition: {
      station: FINISH,
      routeId: '',
      routeIndex: -1,
    },
    finished: true,
    landedOnBranch: false,
    intermediateStations,
  }
}
