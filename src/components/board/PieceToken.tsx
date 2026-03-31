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

const TEAM_FACE = {
  player: {
    tint: '#D8EEFF',
    blush: '#FAD0E8',
    detail: '#0B4C8C',
  },
  ai: {
    tint: '#FFE1D6',
    blush: '#FFC5B3',
    detail: '#8D231F',
  },
} as const

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
  const face = TEAM_FACE[team]

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

      <ellipse cx={0} cy={11.5} rx={11} ry={4.5} fill="rgba(74, 49, 25, 0.16)" />

      {/* Main token circle */}
      <circle
        r={TOKEN_RADIUS}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={2}
        data-testid="piece-token"
      />

      <circle cx={0} cy={1} r={10.5} fill={face.tint} opacity={0.92} />
      <circle cx={-4.6} cy={4.8} r={2.3} fill={face.blush} opacity={0.92} />
      <circle cx={4.6} cy={4.8} r={2.3} fill={face.blush} opacity={0.92} />

      {/* Keep character details lightweight so crowded board states stay readable on mobile. */}
      <g data-testid="character-details" pointerEvents="none">
        {team === 'player' ? (
          <>
            <ellipse cx={-5.2} cy={-12.2} rx={4} ry={6.1} fill="#EAF5FF" stroke={colors.stroke} strokeWidth={1.5} />
            <ellipse cx={5.2} cy={-12.2} rx={4} ry={6.1} fill="#EAF5FF" stroke={colors.stroke} strokeWidth={1.5} />
            <path
              d="M-7 -7.2C-5.4 -10.4 -2.2 -10.4 0 -7.6C2.1 -10.4 5.3 -10.4 7 -7.2C5.1 -5.6 2.6 -4.8 0 -4.8C-2.6 -4.8 -5.1 -5.6 -7 -7.2Z"
              fill="#FF8AB3"
              stroke="#C95685"
              strokeWidth={1}
              data-testid="player-ribbon"
            />
          </>
        ) : (
          <>
            <path
              d="M-6.5 -10.4L-1.8 -12.9L-0.4 -8.7L-6.5 -10.4Z"
              fill="#FFD35A"
              stroke="#B77713"
              strokeWidth={1}
            />
            <path
              d="M0 -12.9L4.3 -15.1L4.9 -10.6L0 -9.5L-4.9 -10.6L-4.3 -15.1L0 -12.9Z"
              fill="#FFD35A"
              stroke="#B77713"
              strokeWidth={1}
              data-testid="ai-crest"
            />
            <path
              d="M6.5 -10.4L1.8 -12.9L0.4 -8.7L6.5 -10.4Z"
              fill="#FFD35A"
              stroke="#B77713"
              strokeWidth={1}
            />
            <path
              d="M-2 0.2L0 2.8L2 0.2"
              fill="#FFCB6B"
              stroke="#B77713"
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </>
        )}

        <circle cx={-4.2} cy={-1.4} r={1.4} fill={face.detail} />
        <circle cx={4.2} cy={-1.4} r={1.4} fill={face.detail} />
        <path
          d="M-4.2 5.1C-2.4 7.3 2.4 7.3 4.2 5.1"
          fill="none"
          stroke={face.detail}
          strokeLinecap="round"
          strokeWidth={1.4}
        />
      </g>

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
