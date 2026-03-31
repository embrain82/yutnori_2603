'use client'

/**
 * Root SVG board component for the Yut Nori game.
 *
 * Renders the complete static board with layered SVG elements:
 * 1. Background (diamond outline + diagonal lines)
 * 2. Station dots (29 positions)
 * 3-5. Placeholder layers for highlights, pieces, and animations (future plans)
 *
 * Imports STATION_COORDS to position all 29 stations in a diamond layout.
 */

import { STATION_COORDS, BOARD_VIEWBOX } from '@/lib/yut/boardCoords'
import { BoardBackground } from '@/components/board/BoardBackground'
import { Station } from '@/components/board/Station'

/** Corner station IDs that get larger dots */
const CORNER_IDS = new Set([0, 5, 10, 15])

/** Center station ID */
const CENTER_ID = 22

/**
 * Determines the visual type of a station by its ID.
 *
 * @param stationId - Numeric station identifier (0-28)
 * @returns Station visual type for sizing and coloring
 */
function getStationType(stationId: number): 'normal' | 'corner' | 'center' {
  if (stationId === CENTER_ID) return 'center'
  if (CORNER_IDS.has(stationId)) return 'corner'
  return 'normal'
}

/**
 * Renders the complete Yut Nori game board as an SVG element.
 *
 * Scales responsively to container width up to 500px while maintaining
 * a square aspect ratio. Touch action is disabled to prevent scrolling
 * during piece interaction.
 *
 * @returns SVG element containing the full board visualization
 */
export function Board(): React.JSX.Element {
  return (
    <svg
      viewBox={BOARD_VIEWBOX}
      className="w-full max-w-[500px] aspect-square"
      style={{ touchAction: 'none' }}
      role="img"
      aria-label="윷놀이 게임판"
    >
      {/* Layer 1: Background -- diamond outline and diagonal lines */}
      <BoardBackground />

      {/* Layer 2: Station dots -- 29 positions */}
      <g>
        {Object.entries(STATION_COORDS).map(([id, coord]) => {
          const stationId = Number(id)
          return (
            <Station
              key={stationId}
              stationId={stationId}
              cx={coord.x}
              cy={coord.y}
              type={getStationType(stationId)}
            />
          )
        })}
      </g>

      {/* Layer 3: Destination highlights (future -- Plan 03-02) */}

      {/* Layer 4: Piece tokens (future -- Plan 03-02) */}

      {/* Layer 5: Animating piece (future -- Plan 03-03) */}
    </svg>
  )
}
