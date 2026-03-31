'use client'

/**
 * HomeZone -- off-board piece staging area for HOME pieces.
 *
 * Renders two team-colored zones (player left, AI right) that display
 * pieces not yet on the board. Each piece is rendered as a PieceToken
 * inside a small SVG, supporting selection for the player's turn.
 */
import type { JSX } from 'react'
import type { Team } from '@/lib/yut/types'
import { PieceToken } from '@/components/board/PieceToken'

/**
 * Represents a piece currently in the HOME zone.
 *
 * @param id - Unique piece identifier
 * @param team - Which team this piece belongs to
 * @param stackCount - Number of pieces stacked (usually 1 for HOME pieces)
 */
export interface HomePiece {
  id: string
  team: Team
  stackCount: number
}

/**
 * Props for the HomeZone component.
 *
 * @param playerHomePieces - Player pieces currently at HOME
 * @param aiHomePieces - AI pieces currently at HOME
 * @param selectablePieceIds - IDs of pieces that can be selected this turn
 * @param selectedPieceId - ID of the currently selected piece (or null)
 * @param onPieceSelect - Callback when a piece is tapped
 */
interface HomeZoneProps {
  playerHomePieces: HomePiece[]
  aiHomePieces: HomePiece[]
  selectablePieceIds: string[]
  selectedPieceId: string | null
  onPieceSelect: (pieceId: string) => void
}

/** X positions for HOME pieces (first and second piece) */
const PIECE_CX = [20, 50]

/** Y center for HOME pieces */
const PIECE_CY = 20

const HOME_ZONE_STYLES = {
  player: {
    surface: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(227,242,253,0.98) 100%)',
    border: 'rgba(116, 177, 230, 0.58)',
    labelBg: 'rgba(66, 165, 245, 0.16)',
    labelText: '#1565C0',
  },
  ai: {
    surface: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,235,238,0.98) 100%)',
    border: 'rgba(239, 83, 80, 0.36)',
    labelBg: 'rgba(239, 83, 80, 0.16)',
    labelText: '#B33633',
  },
} as const

/**
 * Renders a single team zone within the HOME area.
 *
 * @param team - Which team's zone to render
 * @param label - Display label for the zone
 * @param bgColor - Background color for the zone
 * @param pieces - Pieces to display in this zone
 * @param selectablePieceIds - IDs of selectable pieces
 * @param selectedPieceId - Currently selected piece ID
 * @param onPieceSelect - Selection callback
 * @returns JSX element for one team zone
 */
function TeamZone({
  team,
  label,
  bgColor,
  pieces,
  selectablePieceIds,
  selectedPieceId,
  onPieceSelect,
}: {
  team: Team
  label: string
  bgColor: string
  pieces: HomePiece[]
  selectablePieceIds: string[]
  selectedPieceId: string | null
  onPieceSelect: (pieceId: string) => void
}): JSX.Element {
  const zoneStyle = HOME_ZONE_STYLES[team]

  return (
    <div
      className="flex min-h-16 flex-1 flex-col items-center justify-center rounded-[22px] border px-2 py-2 shadow-[0_14px_30px_rgba(120,75,24,0.08)]"
      style={{
        backgroundColor: bgColor,
        backgroundImage: zoneStyle.surface,
        borderColor: zoneStyle.border,
      }}
      data-testid={`home-zone-${team}`}
    >
      <span
        className="rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.04em] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
        style={{
          backgroundColor: zoneStyle.labelBg,
          color: zoneStyle.labelText,
        }}
      >
        {label}
      </span>
      <svg
        width="80"
        height="40"
        viewBox="0 0 80 40"
        className="mt-1 overflow-visible"
      >
        {pieces.map((piece, index) => (
          <PieceToken
            key={piece.id}
            cx={PIECE_CX[index] ?? 20 + index * 30}
            cy={PIECE_CY}
            team={piece.team}
            stackCount={piece.stackCount}
            isSelectable={selectablePieceIds.includes(piece.id)}
            isSelected={selectedPieceId === piece.id}
            onSelect={() => onPieceSelect(piece.id)}
          />
        ))}
      </svg>
    </div>
  )
}

/**
 * Renders off-board HOME zones for both teams.
 *
 * Player zone is on the left with a blue tint, AI zone on the right
 * with a red tint. Each zone shows its HOME pieces as PieceToken
 * components that can be selected when it's the player's turn.
 *
 * @param props - HomeZone configuration
 * @returns Flex row with two team zones
 */
export function HomeZone({
  playerHomePieces,
  aiHomePieces,
  selectablePieceIds,
  selectedPieceId,
  onPieceSelect,
}: HomeZoneProps): JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-[500px] gap-4">
      {/* Phase 6 keeps HOME geometry stable and only warms the surface treatment. */}
      <TeamZone
        team="player"
        label={'내 말'}
        bgColor="#E3F2FD"
        pieces={playerHomePieces}
        selectablePieceIds={selectablePieceIds}
        selectedPieceId={selectedPieceId}
        onPieceSelect={onPieceSelect}
      />
      <TeamZone
        team="ai"
        label={'상대 말'}
        bgColor="#FFEBEE"
        pieces={aiHomePieces}
        selectablePieceIds={selectablePieceIds}
        selectedPieceId={selectedPieceId}
        onPieceSelect={onPieceSelect}
      />
    </div>
  )
}
