/**
 * Yut Nori board graph: 29 stations across 5 routes.
 *
 * Station layout (counterclockwise outer ring with two diagonal shortcuts):
 *
 *   S10 ---- S9 ---- S8 ---- S7 ---- S6 ---- S5
 *    |  \25                               20/  |
 *   S11   26                             21   S4
 *    |       \  22 (center/bang)  /       |
 *   S12       22 ---- 23                S3
 *    |      /    \          \             |
 *   S13   27      27         24          S2
 *    |  /28         \28                   |
 *   S14                           15 -- S1
 *    |                                    |
 *   S15 --- S16 --- S17 --- S18 --- S19 - S0
 *
 * Pieces move counterclockwise on the outer ring (S0 -> S1 -> ... -> S19).
 * At S5 (top-right corner), pieces may take the diag_right shortcut through center.
 * At S10 (top-left corner), pieces may take the diag_left shortcut through center.
 * Station 22 is the center (bang) where diagonals intersect.
 */

/** Identifier constants for the 5 board routes */
export const ROUTE_IDS = {
  OUTER: 'outer',
  DIAG_RIGHT: 'diag_right',
  DIAG_LEFT: 'diag_left',
  CENTER_DOWN: 'center_down',
  CENTER_UP: 'center_up',
} as const

/** Ordered station arrays for each route -- pieces advance by index */
export const ROUTES: Record<string, readonly number[]> = {
  [ROUTE_IDS.OUTER]: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  [ROUTE_IDS.DIAG_RIGHT]: [5, 20, 21, 22, 23, 24],
  [ROUTE_IDS.DIAG_LEFT]: [10, 25, 26, 22, 27, 28],
  [ROUTE_IDS.CENTER_DOWN]: [22, 23, 15],
  [ROUTE_IDS.CENTER_UP]: [22, 27, 28],
}

/**
 * Branch points where a piece may choose between continuing on the outer ring
 * or taking a diagonal shortcut through the center.
 */
export const BRANCH_POINTS: Record<number, { continueRoute: string; shortcutRoute: string }> = {
  5: { continueRoute: 'outer', shortcutRoute: 'diag_right' },
  10: { continueRoute: 'outer', shortcutRoute: 'diag_left' },
}
