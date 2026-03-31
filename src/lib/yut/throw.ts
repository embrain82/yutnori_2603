/**
 * Yut throw result generation using traditional probability.
 *
 * Each of the 4 yut sticks has an independent 50/50 chance of landing
 * flat (< 0.5) or round (>= 0.5). The number of flat sticks determines
 * the throw result. AI and player use the same function -- AI difficulty
 * is controlled via move selection strategy, not throw probability.
 */

import type { ThrowName, ThrowResult } from './types'
import { THROW_STEPS, GRANTS_EXTRA_THROW } from './types'

/**
 * Simulate throwing 4 yut sticks and return the result.
 *
 * @returns ThrowResult with name, step count, and whether it grants an extra throw
 */
export function generateThrow(): ThrowResult {
  let flatCount = 0
  for (let i = 0; i < 4; i++) {
    if (Math.random() < 0.5) flatCount++
  }

  const name = flatCountToName(flatCount)
  return {
    name,
    steps: THROW_STEPS[name],
    grantsExtra: GRANTS_EXTRA_THROW[name],
  }
}

/** Map the count of flat-side sticks to the corresponding throw name */
function flatCountToName(flatCount: number): ThrowName {
  switch (flatCount) {
    case 0: return 'mo'
    case 1: return 'do'
    case 2: return 'gae'
    case 3: return 'geol'
    case 4: return 'yut'
    default: throw new Error(`Invalid flat count: ${flatCount}`)
  }
}
