/**
 * Board coordinate system for SVG rendering.
 *
 * Maps all 29 station IDs to (x, y) positions within a 500x500 SVG viewBox.
 * The board is a diamond (rotated square) centered at (250, 250) with corners
 * at radius 210 from center. Outer ring stations are evenly spaced along
 * diamond edges; diagonal stations are evenly spaced along shortcuts through
 * the center.
 *
 * This module is pure data -- no React, no DOM dependencies.
 */

/** A station's position in SVG coordinate space */
export interface StationCoord {
  x: number
  y: number
}

/** SVG viewBox attribute value for the board */
export const BOARD_VIEWBOX = '0 0 500 500'

/** Center of the board in SVG coordinates */
const CX = 250
const CY = 250
/** Distance from center to each diamond corner */
const R = 210

/** Four diamond corners */
const LEFT = { x: CX - R, y: CY }    // S0 (40, 250)
const TOP = { x: CX, y: CY - R }     // S5 (250, 40)
const RIGHT = { x: CX + R, y: CY }   // S10 (460, 250)
const BOTTOM = { x: CX, y: CY + R }  // S15 (250, 460)
const CENTER = { x: CX, y: CY }      // S22 (250, 250)

/**
 * Linear interpolation between two points.
 *
 * @param x1 - Start point x
 * @param y1 - Start point y
 * @param x2 - End point x
 * @param y2 - End point y
 * @param t - Interpolation factor (0 = start, 1 = end)
 * @returns Interpolated coordinate
 */
function lerp(x1: number, y1: number, x2: number, y2: number, t: number): StationCoord {
  return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t }
}

/**
 * Builds the complete station coordinate mapping for all 29 board positions.
 *
 * Station layout:
 * - 0-19: Outer ring (diamond edges, counterclockwise)
 * - 20-21: Diagonal from S5 (top) toward center
 * - 22: Center (bang)
 * - 23-24: Diagonal from center toward S15 (bottom)
 * - 25-26: Diagonal from S10 (right) toward center
 * - 27-28: Diagonal from center toward S0 (left)
 *
 * @returns Record mapping station ID to SVG coordinates
 */
function buildStationCoords(): Record<number, StationCoord> {
  const coords: Record<number, StationCoord> = {}

  // Outer ring: 4 edges, 5 segments each
  // Edge: LEFT(S0) -> TOP(S5): stations 0,1,2,3,4,5
  for (let i = 0; i <= 5; i++) {
    coords[i] = lerp(LEFT.x, LEFT.y, TOP.x, TOP.y, i / 5)
  }
  // Edge: TOP(S5) -> RIGHT(S10): stations 6,7,8,9,10
  for (let i = 1; i <= 5; i++) {
    coords[5 + i] = lerp(TOP.x, TOP.y, RIGHT.x, RIGHT.y, i / 5)
  }
  // Edge: RIGHT(S10) -> BOTTOM(S15): stations 11,12,13,14,15
  for (let i = 1; i <= 5; i++) {
    coords[10 + i] = lerp(RIGHT.x, RIGHT.y, BOTTOM.x, BOTTOM.y, i / 5)
  }
  // Edge: BOTTOM(S15) -> LEFT(S0): stations 16,17,18,19
  // S0 already set from first edge, so only 4 intermediate stations
  for (let i = 1; i <= 4; i++) {
    coords[15 + i] = lerp(BOTTOM.x, BOTTOM.y, LEFT.x, LEFT.y, i / 5)
  }

  // Center station (bang)
  coords[22] = { ...CENTER }

  // Diagonal: S5(TOP) -> S22(CENTER) -- diag_right route inner stations
  coords[20] = lerp(TOP.x, TOP.y, CENTER.x, CENTER.y, 1 / 3)
  coords[21] = lerp(TOP.x, TOP.y, CENTER.x, CENTER.y, 2 / 3)

  // Diagonal: S22(CENTER) -> S15(BOTTOM) -- center_down route inner stations
  coords[23] = lerp(CENTER.x, CENTER.y, BOTTOM.x, BOTTOM.y, 1 / 3)
  coords[24] = lerp(CENTER.x, CENTER.y, BOTTOM.x, BOTTOM.y, 2 / 3)

  // Diagonal: S10(RIGHT) -> S22(CENTER) -- diag_left route inner stations
  coords[25] = lerp(RIGHT.x, RIGHT.y, CENTER.x, CENTER.y, 1 / 3)
  coords[26] = lerp(RIGHT.x, RIGHT.y, CENTER.x, CENTER.y, 2 / 3)

  // Diagonal: S22(CENTER) -> S0(LEFT) -- center_up route inner stations
  coords[27] = lerp(CENTER.x, CENTER.y, LEFT.x, LEFT.y, 1 / 3)
  coords[28] = lerp(CENTER.x, CENTER.y, LEFT.x, LEFT.y, 2 / 3)

  return coords
}

/** All 29 station coordinates indexed by station ID */
export const STATION_COORDS: Record<number, StationCoord> = buildStationCoords()
