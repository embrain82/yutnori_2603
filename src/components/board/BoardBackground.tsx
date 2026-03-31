'use client'

/**
 * Board background layer: diamond outline and diagonal shortcut lines.
 *
 * Renders the visual skeleton of the Yut Nori board as SVG primitives.
 * The diamond is formed by connecting the four corner stations (S0, S5, S10, S15).
 * Two diagonal lines cross through the center (S22) connecting opposite corners.
 */

import { STATION_COORDS } from '@/lib/yut/boardCoords'

/**
 * Renders the board diamond outline and diagonal shortcut lines.
 *
 * @returns SVG group containing the board background elements
 */
export function BoardBackground(): React.JSX.Element {
  const s0 = STATION_COORDS[0]
  const s5 = STATION_COORDS[5]
  const s10 = STATION_COORDS[10]
  const s15 = STATION_COORDS[15]

  const diamondPoints = `${s0.x},${s0.y} ${s5.x},${s5.y} ${s10.x},${s10.y} ${s15.x},${s15.y}`

  return (
    <g>
      {/* Board background fill */}
      <polygon
        points={diamondPoints}
        fill="#FFFDE7"
        stroke="#8D6E63"
        strokeWidth={2}
      />

      {/* Outer edge lines (reinforced on top of polygon edges) */}
      <line x1={s0.x} y1={s0.y} x2={s5.x} y2={s5.y} stroke="#8D6E63" strokeWidth={2} />
      <line x1={s5.x} y1={s5.y} x2={s10.x} y2={s10.y} stroke="#8D6E63" strokeWidth={2} />
      <line x1={s10.x} y1={s10.y} x2={s15.x} y2={s15.y} stroke="#8D6E63" strokeWidth={2} />
      <line x1={s15.x} y1={s15.y} x2={s0.x} y2={s0.y} stroke="#8D6E63" strokeWidth={2} />

      {/* Diagonal shortcut lines through center */}
      <line x1={s5.x} y1={s5.y} x2={s15.x} y2={s15.y} stroke="#A1887F" strokeWidth={1.5} />
      <line x1={s10.x} y1={s10.y} x2={s0.x} y2={s0.y} stroke="#A1887F" strokeWidth={1.5} />
    </g>
  )
}
