/**
 * Deterministic target poses for the visual yut throw end-state.
 *
 * Physics in Phase 4 is presentation only. The authoritative throw result
 * stays in the game logic layer, and this module converts that result into
 * four stable stick faces/orientations that the 3D scene can correct toward
 * once simulation settles.
 */

import type { ThrowName, ThrowResult } from './types'

/** Which side of a yut stick should face upward in the final visual state */
export type YutStickFace = 'flat' | 'round'

/** Final pose contract for one rendered stick slot in the throw tray */
export interface YutStickTargetPose {
  face: YutStickFace
  yaw: number
  slot: 0 | 1 | 2 | 3
}

/** Number of flat-side-up sticks required for each traditional throw result */
export const YUT_THROW_FACE_COUNTS: Record<ThrowName, number> = {
  do: 1,
  gae: 2,
  geol: 3,
  yut: 4,
  mo: 0,
}

const BASE_YAWS = [-0.42, 0.28, -1.08, 0.92] as const
const SLOTS = [0, 1, 2, 3] as const

/**
 * Build the four target stick poses for a resolved throw result.
 *
 * The first N slots become flat according to the traditional throw count,
 * while the remaining slots stay round.
 */
export function buildTargetPoses(result: ThrowResult): YutStickTargetPose[] {
  const flatCount = YUT_THROW_FACE_COUNTS[result.name]

  return SLOTS.map((slot, index) => ({
    face: index < flatCount ? 'flat' : 'round',
    yaw: BASE_YAWS[index],
    slot,
  }))
}
