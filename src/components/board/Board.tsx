'use client'

/**
 * Root SVG board component for the Yut Nori game.
 *
 * Renders the complete interactive board with layered SVG elements:
 * 1. Background (diamond outline + diagonal lines)
 * 2. Station dots (29 positions)
 * 3. Destination highlights (pulsing dots for valid moves)
 * 4. Piece tokens (team-colored circles at station positions)
 * 5. Animating piece (single overlay during hop animation)
 *
 * Accepts optional BoardProps for interactive mode. When called with
 * no props, renders the static board only (backward compatible with Plan 01).
 */

import { STATION_COORDS, BOARD_VIEWBOX } from '@/lib/yut/boardCoords'
import { BoardBackground } from '@/components/board/BoardBackground'
import { Station } from '@/components/board/Station'
import { PieceToken } from '@/components/board/PieceToken'
import { MoveHighlight } from '@/components/board/MoveHighlight'
import { HOME, FINISH } from '@/lib/yut/types'
import type { PieceState } from '@/lib/yut/types'

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

/** A valid move destination with branch type info */
interface ValidDestination {
  stationId: number
  isBranchShortcut: boolean
  isBranchContinue: boolean
}

/**
 * Props for the interactive Board component.
 *
 * @param pieces - All game pieces with current positions
 * @param selectedPieceId - ID of the currently selected piece (or null)
 * @param validDestinations - Stations the selected piece can move to
 * @param isAnimating - Whether a hop animation is in progress
 * @param animatingPieceId - ID of piece currently animating (or null)
 * @param animatingPosition - Current animated position coordinates (or null)
 * @param onPieceSelect - Callback when a piece token is tapped
 * @param onDestinationSelect - Callback when a destination highlight is tapped
 */
interface BoardProps {
  pieces?: PieceState[]
  selectedPieceId?: string | null
  validDestinations?: ValidDestination[]
  isAnimating?: boolean
  animatingPieceId?: string | null
  animatingPosition?: { x: number; y: number } | null
  onPieceSelect?: (pieceId: string) => void
  onDestinationSelect?: (stationId: number) => void
}

/**
 * X-offset for multiple pieces sharing the same station.
 * First piece shifts left, second shifts right.
 */
const STACK_OFFSET_X = [-8, 8]

const BOARD_PRESENTATION_CLASS_NAME =
  'w-full max-w-[500px] aspect-square overflow-visible drop-shadow-[0_18px_28px_rgba(114,72,23,0.14)]'

/**
 * Renders the complete Yut Nori game board as an SVG element.
 *
 * Scales responsively to container width up to 500px while maintaining
 * a square aspect ratio. Touch action is disabled to prevent scrolling
 * during piece interaction.
 *
 * @param props - Optional BoardProps for interactive mode
 * @returns SVG element containing the full board visualization
 */
export function Board({
  pieces = [],
  selectedPieceId = null,
  validDestinations = [],
  isAnimating = false,
  animatingPieceId = null,
  animatingPosition = null,
  onPieceSelect = () => {},
  onDestinationSelect = () => {},
}: BoardProps = {}): React.JSX.Element {
  // Filter to on-board pieces: not HOME, not FINISH, and not stacked onto another piece
  const onBoardPieces = pieces.filter(
    (p) =>
      p.position.station !== HOME &&
      p.position.station !== FINISH &&
      p.stackedWith === null,
  )

  // Group pieces by station for offset calculation
  const piecesByStation = new Map<number, PieceState[]>()
  for (const piece of onBoardPieces) {
    const station = piece.position.station
    const group = piecesByStation.get(station) ?? []
    group.push(piece)
    piecesByStation.set(station, group)
  }

  // Determine highlight type for each destination
  const getHighlightType = (dest: ValidDestination): 'continue' | 'shortcut' => {
    if (dest.isBranchShortcut) return 'shortcut'
    return 'continue'
  }

  // Should we show interactive elements?
  const showInteraction = !isAnimating
  // Phase 6 keeps the station geometry frozen and only refreshes the board surface presentation.

  return (
    <svg
      viewBox={BOARD_VIEWBOX}
      className={BOARD_PRESENTATION_CLASS_NAME}
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

      {/* Layer 3: Destination highlights -- only when a piece is selected and not animating */}
      {showInteraction && selectedPieceId !== null && (
        <g>
          {validDestinations.map((dest) => {
            const coord = STATION_COORDS[dest.stationId]
            if (!coord) return null
            return (
              <MoveHighlight
                key={`highlight-${dest.stationId}`}
                cx={coord.x}
                cy={coord.y}
                type={getHighlightType(dest)}
                onSelect={() => onDestinationSelect(dest.stationId)}
              />
            )
          })}
        </g>
      )}

      {/* Layer 4: Piece tokens -- on-board pieces at station positions */}
      <g>
        {onBoardPieces.map((piece) => {
          // Skip the animating piece in the static layer
          if (piece.id === animatingPieceId) return null

          const coord = STATION_COORDS[piece.position.station]
          if (!coord) return null

          // Calculate offset for multiple pieces at same station
          const group = piecesByStation.get(piece.position.station) ?? []
          const indexInGroup = group.indexOf(piece)
          const offsetX = group.length > 1 ? (STACK_OFFSET_X[indexInGroup] ?? 0) : 0

          const stackCount = 1 + piece.stackedPieceIds.length

          return (
            <PieceToken
              key={piece.id}
              cx={coord.x + offsetX}
              cy={coord.y}
              team={piece.team}
              stackCount={stackCount}
              isSelectable={showInteraction}
              isSelected={piece.id === selectedPieceId}
              onSelect={() => onPieceSelect(piece.id)}
            />
          )
        })}
      </g>

      {/* Layer 5: Animating piece -- single overlay during hop animation */}
      {animatingPieceId !== null && animatingPosition !== null && (
        <g data-testid="animating-piece">
          {(() => {
            const piece = pieces.find((p) => p.id === animatingPieceId)
            if (!piece) return null
            return (
              <PieceToken
                cx={animatingPosition.x}
                cy={animatingPosition.y}
                team={piece.team}
                stackCount={1 + piece.stackedPieceIds.length}
                isSelectable={false}
                isSelected={false}
                onSelect={() => {}}
              />
            )
          })()}
        </g>
      )}
    </svg>
  )
}
