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
  return (
    <div
      className="flex-1 flex flex-col items-center rounded-lg"
      style={{ backgroundColor: bgColor }}
      data-testid={`home-zone-${team}`}
    >
      <span className="font-semibold text-xs text-gray-700 mt-1">
        {label}
      </span>
      <svg width="80" height="40" viewBox="0 0 80 40">
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
    <div className="flex gap-4 w-full max-w-[500px] mx-auto h-12">
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
