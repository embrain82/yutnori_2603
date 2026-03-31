'use client'

/**
 * PieceToken -- team-colored SVG circle token for the Yut Nori board.
 *
 * Renders a circular game piece with:
 * - Team-specific colors (player=blue, AI=red)
 * - Stack count badge when multiple pieces are grouped
 * - Pulsing glow ring for selectable pieces
 * - Gold selection ring for the currently selected piece
 * - Invisible 44px+ hit area for mobile touch targets
 *
 * Positioned via motion.g transform animation for smooth movement.
 */
import type { JSX } from 'react'
import { motion } from 'motion/react'
import type { Team } from '@/lib/yut/types'

/** Team-specific fill and stroke colors */
export const TEAM_COLORS: Record<Team, { fill: string; stroke: string }> = {
  player: { fill: '#42A5F5', stroke: '#1565C0' },
  ai: { fill: '#EF5350', stroke: '#C62828' },
}

/** Base radius of the token circle in viewBox units */
export const TOKEN_RADIUS = 14

/**
 * Props for the PieceToken component.
 *
 * @param cx - X coordinate center position in SVG viewBox units
 * @param cy - Y coordinate center position in SVG viewBox units
 * @param team - Which team this piece belongs to ('player' or 'ai')
 * @param stackCount - Number of pieces at this position (1 = solo, 2+ = stacked)
 * @param isSelectable - Whether the piece can be tapped to select
 * @param isSelected - Whether the piece is currently selected
 * @param onSelect - Callback when the piece is tapped
 */
interface PieceTokenProps {
  cx: number
  cy: number
  team: Team
  stackCount: number
  isSelectable: boolean
  isSelected: boolean
  onSelect: () => void
}

/**
 * Renders a team-colored SVG circle token with optional stack badge,
 * glow ring, and selection ring.
 *
 * @param props - PieceToken configuration
 * @returns SVG group element positioned at (cx, cy)
 */
export function PieceToken({
  cx,
  cy,
  team,
  stackCount,
  isSelectable,
  isSelected,
  onSelect,
}: PieceTokenProps): JSX.Element {
  const colors = TEAM_COLORS[team]

  return (
    <motion.g
      animate={{ x: cx, y: cy }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileTap={isSelectable ? { scale: 0.9 } : undefined}
    >
      {/* Invisible hit area for 44px+ touch target -- only when selectable */}
      {isSelectable && (
        <circle
          r={22}
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onClick={onSelect}
          data-testid="piece-hit-area"
          pointerEvents="all"
        />
      )}

      {/* Glow ring -- pulsing animation for selectable pieces */}
      {isSelectable && (
        <motion.circle
          r={18}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={2}
          animate={{
            r: [18, 22, 18],
            opacity: [0.3, 0.8, 0.3],
            strokeWidth: [2, 4, 2],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          data-testid="glow-ring"
        />
      )}

      {/* Selection ring -- gold ring for the currently selected piece */}
      {isSelected && (
        <motion.circle
          r={20}
          fill="none"
          stroke="#FFD700"
          strokeWidth={3}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          data-testid="selection-ring"
        />
      )}

      {/* Main token circle */}
      <circle
        r={TOKEN_RADIUS}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={2}
        data-testid="piece-token"
      />

      {/* Stack badge -- shows piece count when >1 */}
      {stackCount > 1 && (
        <g transform="translate(8.4, -8.4)">
          <circle
            r={8}
            fill="#FFF"
            stroke={colors.stroke}
            strokeWidth={1.5}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fontWeight="bold"
            fill={colors.stroke}
            data-testid="stack-badge"
          >
            {stackCount}
          </text>
        </g>
      )}
    </motion.g>
  )
}
