'use client'

/**
 * Individual station dot on the Yut Nori board.
 *
 * Renders an SVG circle at the given coordinates with size and color
 * varying by station type: normal (small, brown), corner (large, dark),
 * or center (large, dark).
 */

/** Props for the Station component */
export interface StationProps {
  /** Numeric station identifier (0-28) */
  stationId: number
  /** SVG x coordinate */
  cx: number
  /** SVG y coordinate */
  cy: number
  /** Visual type determining size and color */
  type: 'normal' | 'corner' | 'center'
}

/** Radius by station type */
const RADIUS: Record<StationProps['type'], number> = {
  normal: 6,
  corner: 10,
  center: 10,
}

/** Fill color by station type */
const FILL: Record<StationProps['type'], string> = {
  normal: '#5D4037',
  corner: '#3E2723',
  center: '#3E2723',
}

/**
 * Renders a single station dot on the board.
 *
 * @param props - Station position and visual type
 * @returns SVG circle element for the station
 */
export function Station({ stationId, cx, cy, type }: StationProps): React.JSX.Element {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={RADIUS[type]}
      fill={FILL[type]}
      data-station-id={stationId}
    />
  )
}
