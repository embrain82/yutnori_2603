'use client'

/**
 * MoveHighlight -- pulsing SVG circle overlay for valid move destinations.
 *
 * Rendered at station coordinates when a piece is selected, indicating
 * where the piece can legally move. Branch points use two colors:
 * gold for continuing on the outer route, green for taking the shortcut.
 *
 * Includes an invisible hit area (r=22) for 44px+ mobile touch targets.
 */
import type { JSX } from 'react'
import { motion } from 'motion/react'

/** Color configuration for destination highlight types */
const HIGHLIGHT_COLORS = {
  continue: { fill: 'rgba(255, 215, 0, 0.4)', stroke: '#FFD700' },
  shortcut: { fill: 'rgba(102, 187, 106, 0.4)', stroke: '#66BB6A' },
}

/**
 * Props for the MoveHighlight component.
 *
 * @param cx - X coordinate center position in SVG viewBox units
 * @param cy - Y coordinate center position in SVG viewBox units
 * @param type - Highlight variant: 'continue' for outer path (gold), 'shortcut' for diagonal (green)
 * @param onSelect - Callback when the destination is tapped
 */
interface MoveHighlightProps {
  cx: number
  cy: number
  type: 'continue' | 'shortcut'
  onSelect: () => void
}

/**
 * Renders a pulsing destination indicator at the given SVG coordinates.
 *
 * The pulse animation cycles radius between 14-18 and opacity between
 * 0.6-1.0 over 1200ms (per UI-SPEC Animation Contract D-09).
 *
 * @param props - MoveHighlight configuration
 * @returns SVG group element with hit area and pulsing circle
 */
export function MoveHighlight({
  cx,
  cy,
  type,
  onSelect,
}: MoveHighlightProps): JSX.Element {
  const colors = HIGHLIGHT_COLORS[type]

  return (
    <motion.g animate={{ x: cx, y: cy }}>
      {/* Invisible hit area for 44px+ touch target */}
      <circle
        r={22}
        fill="transparent"
        onClick={onSelect}
        style={{ cursor: 'pointer' }}
        pointerEvents="all"
        data-testid="highlight-hit-area"
      />

      {/* Pulsing destination dot */}
      <motion.circle
        r={14}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={2}
        animate={{
          r: [14, 18, 14],
          opacity: [0.6, 1.0, 0.6],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        data-testid={`move-highlight-${type}`}
      />
    </motion.g>
  )
}
