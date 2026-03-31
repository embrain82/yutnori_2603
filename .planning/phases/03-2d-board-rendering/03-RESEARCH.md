# Phase 3: 2D Board Rendering - Research

**Researched:** 2026-03-31
**Domain:** SVG board visualization, React SVG interaction, motion library SVG animation
**Confidence:** HIGH

## Summary

This phase renders the 29-station Yut Nori board as an interactive SVG with piece tokens, destination highlights, and hop animations. The existing game logic layer (`src/lib/yut/`) provides all data needed: station IDs (0-28), route arrays for path traversal, `MoveResult.intermediateStations` for hop animation waypoints, and `findValidMoves()` for highlighting valid destinations.

The core technical challenge is mapping 29 abstract station IDs to concrete SVG coordinates in a traditional diamond (rotated square) layout, then layering interaction (tap to select piece, tap to choose destination) and animation (sequential hop along intermediate stations) on top. The motion library (v12.38.0) supports all required SVG animation natively: `motion.circle` for animated tokens, `motion.g` for group transforms, and `useAnimate` for imperative sequential hop animations.

**Primary recommendation:** Build a pure coordinate mapping (`STATION_COORDS: Record<number, {x: number, y: number}>`) as the foundation, then compose SVG components (Board background, Station dots, Piece tokens, Highlight overlays) declaratively in React with motion for animation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** SVG rendering -- resolution independent, click/touch event friendly, motion library compatible
- **D-02:** Traditional diamond layout -- square rotated 45 degrees, outer 20 stations + diagonal shortcut 9 stations
- **D-03:** Top ~60-70% board area, bottom for throw button/info -- vertical mobile optimization
- **D-04:** Colored circular tokens -- player=blue, AI=red, replaceable with character images in Phase 6
- **D-05:** Stacked pieces shown with number badge -- small badge (2, 3) at top-right of token
- **D-06:** Selectable pieces indicated by glow ring -- pulsing animation to encourage touch
- **D-07:** Per-station hop animation -- ~200ms per hop, do(1)=0.2s, mo(5)=1s
- **D-08:** Capture animation -- captured piece animates to HOME + brief screen shake; particles deferred to Phase 6
- **D-09:** Valid destinations shown as bright pulsing dots
- **D-10:** Corner shortcut choice (S5/S10) -- two destinations highlighted in different colors, tap to choose path (no popup)

### Claude's Discretion
- SVG internal structure (viewBox size, coordinate system)
- Exact SVG coordinates for 29 positions
- Color palette specific values (within blue/red families)
- Animation easing function choices
- Component decomposition structure (Board, Piece, Station, etc.)

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BOARD-01 | Traditional board layout rendered as 2D SVG with all 29 positions visible | STATION_COORDS mapping + SVG viewBox coordinate system + diamond layout math |
| BOARD-02 | Each team's pieces display at current positions with distinct visual identity | motion.circle tokens with team colors (blue/red) + PieceState position mapping |
| BOARD-03 | Stacked pieces show count/overlap indicator | Number badge SVG element (motion.text or motion.circle+text) at token top-right |
| BOARD-04 | Tapping piece highlights valid destination positions | findValidMoves() + getAvailableMoves() provide destinations; pulsing dot overlay |
| BOARD-05 | Corner shortcut vs outer path choice visually distinct and selectable | BRANCH_POINTS at S5/S10 + two-color highlight + tap-to-select destination |
| BOARD-06 | Moving piece plays hop animation following board path step by step | MoveResult.intermediateStations + useAnimate sequential async/await pattern |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Component rendering | Already installed, project standard |
| motion | 12.38.0 | SVG animation (hop, pulse, glow) | Already installed, project convention for all animation |
| SVG (native) | N/A | Board rendering | D-01 locked decision, resolution independent |
| Tailwind CSS | v4 | Container styling | Already installed, utility-first CSS |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.1.2 | Unit testing coordinate mapping and component rendering | Already installed, all tests |
| @testing-library/react | 16.3.2 | Component interaction testing | Already installed, tap/click tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native SVG | Canvas 2D | Canvas lacks declarative React integration, no DOM events on shapes, harder to animate with motion |
| Native SVG | react-konva | Extra dependency, overkill for 29 static positions with simple tokens |
| motion SVG | CSS animations | Less control over sequential hop timing, no imperative sequence API |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    board/                    # Phase 3 board components
      Board.tsx               # Root SVG board component
      BoardBackground.tsx     # Diamond outline, decorative lines
      Station.tsx             # Single station dot (normal + highlighted states)
      PieceToken.tsx          # Circular team token with optional stack badge
      MoveHighlight.tsx       # Pulsing destination dot overlay
      HopAnimation.tsx        # Animated piece during movement (uses useAnimate)
    board/__tests__/
      Board.test.tsx          # Board renders 29 stations
      Station.test.tsx        # Station click handlers
      PieceToken.test.tsx     # Token renders with team color, stack badge
      MoveHighlight.test.tsx  # Highlights appear for valid moves
  lib/
    yut/
      boardCoords.ts          # STATION_COORDS: Record<number, {x, y}> -- pure data
      boardCoords.test.ts     # (in __tests__/) Verify all 29 stations have coords, no overlaps
```

### Pattern 1: Pure Coordinate Mapping (Data Layer)

**What:** A single lookup table mapping station ID to SVG coordinates, separate from rendering.
**When to use:** Always -- this is the foundation for all visual positioning.

```typescript
// src/lib/yut/boardCoords.ts

/**
 * SVG coordinates for all 29 board stations.
 *
 * Coordinate system: viewBox="0 0 500 500"
 * Diamond layout: square rotated 45 degrees
 * - Top corner: (250, 30)   -- station 5 (top-right of board = S5)
 * - Right corner: (470, 250) -- station 10
 * - Bottom corner: (250, 470) -- station 15
 * - Left corner: (30, 250)   -- station 0 (start/참먹이)
 */
export interface StationCoord {
  x: number
  y: number
}

export const STATION_COORDS: Record<number, StationCoord> = {
  // Outer ring -- counterclockwise from S0 (left corner)
  0: { x: 30, y: 250 },    // 참먹이 (start/finish)
  1: { x: 74, y: 206 },
  2: { x: 118, y: 162 },
  3: { x: 162, y: 118 },
  4: { x: 206, y: 74 },
  5: { x: 250, y: 30 },    // Top corner (branch point -> diag_right)
  6: { x: 294, y: 74 },
  7: { x: 338, y: 118 },
  8: { x: 382, y: 162 },
  9: { x: 426, y: 206 },
  10: { x: 470, y: 250 },  // Right corner (branch point -> diag_left)
  11: { x: 426, y: 294 },
  12: { x: 382, y: 338 },
  13: { x: 338, y: 382 },
  14: { x: 294, y: 426 },
  15: { x: 250, y: 470 },  // Bottom corner
  16: { x: 206, y: 426 },
  17: { x: 162, y: 382 },
  18: { x: 118, y: 338 },
  19: { x: 74, y: 294 },

  // Diagonal shortcuts
  20: { x: 294, y: 118 },  // diag_right: S5 -> center (between S5 and S22)
  21: { x: 338, y: 162 },  // NOTE: shares visual space near S8, offset needed
  // Corrected: diag_right goes S5(250,30) -> 20 -> 21 -> 22(center) -> 23 -> 24
  // diag_left goes S10(470,250) -> 25 -> 26 -> 22(center) -> 27 -> 28

  22: { x: 250, y: 250 },  // Center (bang/방) -- intersection of diagonals
  23: { x: 206, y: 294 },  // center_down: toward S15
  24: { x: 162, y: 338 },  // center_down: approaching S15
  25: { x: 426, y: 294 },  // diag_left: between S10 and center
  26: { x: 338, y: 338 },  // diag_left: approaching center
  27: { x: 162, y: 162 },  // center_up: between center and S0 direction
  28: { x: 74, y: 74 },    // NOTE: this doesn't match -- see corrected layout below
}
```

**CRITICAL: The coordinate mapping above is an APPROXIMATION. The actual coordinates must be carefully calculated based on the board graph topology.**

The correct approach for calculating coordinates:

```typescript
/**
 * Diamond board coordinate calculation.
 *
 * The board is a square rotated 45 degrees (diamond shape).
 * Four corners of the diamond:
 *   Top:    S5  = (cx, cy - r)     -- top corner
 *   Right:  S10 = (cx + r, cy)     -- right corner
 *   Bottom: S15 = (cx, cy + r)     -- bottom corner
 *   Left:   S0  = (cx - r, cy)     -- left corner (start)
 *
 * Outer ring: 20 stations equally spaced, 5 per edge.
 *   Edge S0->S5:   stations 0,1,2,3,4,5   (left corner to top corner)
 *   Edge S5->S10:  stations 5,6,7,8,9,10  (top corner to right corner)
 *   Edge S10->S15: stations 10,11,12,13,14,15 (right to bottom)
 *   Edge S15->S0:  stations 15,16,17,18,19,0  (bottom to left)
 *
 * Diagonal shortcuts (through center):
 *   diag_right: S5 -> 20 -> 21 -> 22(center) -> 23 -> 24 -> exits toward S15
 *   diag_left:  S10 -> 25 -> 26 -> 22(center) -> 27 -> 28 -> exits toward S0
 *
 * Each diagonal has 2 intermediate stations between corner and center,
 * and 2 between center and the opposite corner's exit.
 */

const CX = 250  // center x
const CY = 250  // center y
const R = 220   // half-diagonal (corner to center distance)

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Corner coordinates
const corners = {
  S0:  { x: CX - R, y: CY },       // Left  (start)
  S5:  { x: CX, y: CY - R },       // Top
  S10: { x: CX + R, y: CY },       // Right
  S15: { x: CX, y: CY + R },       // Bottom
}
```

### Pattern 2: Declarative SVG Board Component

**What:** React component renders SVG with layered groups: background, stations, pieces, highlights.
**When to use:** Main board rendering -- all visual state derived from props.

```typescript
// src/components/board/Board.tsx
'use client'

import { motion } from 'motion/react'
import type { PieceState, MoveResult } from '@/lib/yut/types'
import type { StationCoord } from '@/lib/yut/boardCoords'

interface BoardProps {
  pieces: PieceState[]
  selectedPieceId: string | null
  validDestinations: number[]         // station IDs to highlight
  branchHighlights: {                 // for D-10 corner choice
    shortcut: number | null
    continue: number | null
  } | null
  onPieceSelect: (pieceId: string) => void
  onDestinationSelect: (station: number) => void
  animatingPiece: {                   // hop animation state
    pieceId: string
    intermediateStations: number[]
  } | null
}

export function Board({
  pieces,
  selectedPieceId,
  validDestinations,
  branchHighlights,
  onPieceSelect,
  onDestinationSelect,
  animatingPiece,
}: BoardProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 500 500"
      className="w-full max-w-[500px] aspect-square"
      style={{ touchAction: 'none' }}
    >
      {/* Layer 1: Board background (diamond outline + edge lines) */}
      {/* Layer 2: Station dots (all 29) */}
      {/* Layer 3: Highlight overlays (pulsing valid destinations) */}
      {/* Layer 4: Piece tokens (on top of everything) */}
      {/* Layer 5: Animating piece (topmost during animation) */}
    </svg>
  )
}
```

### Pattern 3: Imperative Hop Animation with useAnimate

**What:** Sequential async/await animation for piece movement across intermediate stations.
**When to use:** When a piece moves and needs to visually hop station-by-station per D-07.

```typescript
// Hop animation pattern using useAnimate
import { useAnimate } from 'motion/react'

const [scope, animate] = useAnimate()

async function animateHop(
  intermediateStations: number[],
  finalStation: number,
  coords: Record<number, StationCoord>
): Promise<void> {
  // Hop through each intermediate station
  for (const station of intermediateStations) {
    const { x, y } = coords[station]
    await animate(scope.current, { cx: x, cy: y }, {
      duration: 0.2,          // D-07: ~200ms per hop
      ease: 'easeOut',
    })
  }

  // Final landing
  const { x, y } = coords[finalStation]
  await animate(scope.current, { cx: x, cy: y }, {
    duration: 0.2,
    type: 'spring',
    stiffness: 300,
    damping: 20,
  })
}
```

### Pattern 4: Pulsing Highlight for Valid Destinations (D-09)

**What:** motion.circle with infinite pulsing animation on valid destination stations.
**When to use:** When a piece is selected and valid moves are computed.

```typescript
// Pulsing destination highlight
<motion.circle
  cx={coord.x}
  cy={coord.y}
  r={14}
  fill="rgba(255, 215, 0, 0.4)"
  stroke="#FFD700"
  strokeWidth={2}
  animate={{
    r: [14, 18, 14],
    opacity: [0.6, 1, 0.6],
  }}
  transition={{
    duration: 1.2,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
  onClick={() => onDestinationSelect(stationId)}
  style={{ cursor: 'pointer' }}
/>
```

### Pattern 5: Glow Ring for Selectable Pieces (D-06)

**What:** Animated ring around pieces that can be selected.
**When to use:** When it is the player's turn and pieces have valid moves.

```typescript
// Glow ring on selectable piece
<motion.circle
  cx={coord.x}
  cy={coord.y}
  r={18}
  fill="none"
  stroke="#4FC3F7"
  strokeWidth={3}
  animate={{
    r: [18, 22, 18],
    opacity: [0.5, 1, 0.5],
    strokeWidth: [2, 4, 2],
  }}
  transition={{
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
/>
```

### Anti-Patterns to Avoid

- **Direct DOM manipulation for SVG positions:** Use React state + motion animate props, never `element.setAttribute()`. Motion bypasses React re-renders internally for performance.
- **Canvas for the board:** SVG is locked per D-01. Canvas lacks DOM events on individual shapes, breaks accessible interaction.
- **Giant monolithic Board component:** Split into sub-components (Station, PieceToken, MoveHighlight) for readability and testability.
- **Animating with CSS transitions instead of motion:** motion provides `useAnimate` for imperative sequential hops, CSS cannot await intermediate steps.
- **Hardcoding pixel coordinates in component JSX:** Extract to `STATION_COORDS` data file for testability and reuse.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG animation sequencing | Custom requestAnimationFrame loop | motion `useAnimate` with async/await | Handles timing, easing, cancellation automatically |
| Touch/click on SVG shapes | Custom hit testing | Native SVG event handlers (onClick on motion.circle) | SVG shapes have built-in hit areas matching their geometry |
| Responsive SVG scaling | Manual resize observers | SVG viewBox + CSS width:100% | viewBox auto-scales; no JS needed |
| Pulsing/glowing effects | setInterval opacity toggling | motion `animate` with `repeat: Infinity` | Declarative, GPU-accelerated, cancels on unmount |
| Coordinate interpolation | Manual lerp in animation loop | motion `animate({ cx, cy })` | motion handles interpolation natively for SVG attributes |

**Key insight:** SVG + motion covers 100% of the rendering and animation needs. No additional graphics libraries are needed. The motion library natively supports all SVG elements as `motion.*` components and can animate SVG-specific attributes (cx, cy, r, fill, opacity, stroke) directly.

## Common Pitfalls

### Pitfall 1: Station Coordinate Overlap on Diagonals
**What goes wrong:** Diagonal shortcut stations (20-28) share visual proximity with outer ring stations. Station 21 on diag_right is near station 8 on the outer ring. If coordinates overlap, pieces on different routes appear stacked when they are not.
**Why it happens:** The diagonal paths cut through the interior of the diamond, crossing near outer edge midpoints.
**How to avoid:** Calculate diagonal station coordinates along the actual diagonal lines (corner-to-corner through center), NOT parallel to the outer edges. Verify all 29 coordinates have minimum distance (at least 30px in a 500x500 viewBox).
**Warning signs:** Visual test shows two stations rendered on top of each other.

### Pitfall 2: SVG Click Events Not Reaching Targets on Mobile
**What goes wrong:** Tapping a piece token does not fire onClick on mobile devices.
**Why it happens:** SVG elements with `fill: none` or very small radius have tiny/zero hit areas. iOS requires explicit touch-action CSS. Overlapping SVG elements can intercept events.
**How to avoid:** (1) Always use a visible fill on clickable elements (even transparent: `fill="transparent"`). (2) Set `style={{ touchAction: 'none' }}` on the root SVG. (3) Use `pointerEvents="all"` on clickable groups. (4) Ensure minimum 44px touch target equivalent (at viewBox scale, r >= ~20 for a 500x500 viewBox displayed at ~375px width on mobile, which maps to ~15px physical -- so r=20 in viewBox gives ~15px physical, which is below 44px. Solution: use invisible larger hit area circle behind the visible token).
**Warning signs:** Works on desktop mouse clicks but not on mobile taps.

### Pitfall 3: Hop Animation Interrupted by State Update
**What goes wrong:** Piece hop animation starts, but a React state update mid-animation causes the component to re-render, resetting the animation or showing the piece at the final position instantly.
**Why it happens:** If the game state (piece positions) updates before the animation completes, React re-renders the piece at its new position.
**How to avoid:** Separate "visual position" from "logical position". During animation, the piece's logical position in game state updates immediately, but the visual token is a separate animated element (overlay) that plays the hop sequence. After animation completes, remove the overlay and show the piece at its logical position. Use an `isAnimating` flag.
**Warning signs:** Piece "teleports" to destination without visible hop.

### Pitfall 4: Stacked Piece Badge Clipped by SVG Bounds
**What goes wrong:** The number badge at top-right of a token gets cut off when the piece is near the SVG edge.
**Why it happens:** SVG clips content to its viewBox by default. Tokens near corners (S0, S5, S10, S15) have badges that extend beyond the viewBox.
**How to avoid:** Add padding in the viewBox (use "0 0 500 500" but keep station coordinates within 30-470 range). Or use `overflow="visible"` on the SVG element. The recommended approach is sufficient padding.
**Warning signs:** Badge numbers disappear near board corners.

### Pitfall 5: Branch Choice (D-10) Confusion with Multiple Pending Moves
**What goes wrong:** Player sees branch highlights for S5/S10, but the underlying throw result does not match the highlighted destinations.
**Why it happens:** If multiple throw results are pending, the first throw's branch options might display while the UI context implies a different throw.
**How to avoid:** Branch choice UI should be triggered only for the currently consumed throw result. Always pass the specific `MoveResult` (which has `landedOnBranch: true` and `branchOptions`) to determine what to highlight. Do not compute branch options independently.
**Warning signs:** Player selects a shortcut but the piece moves a different number of steps.

### Pitfall 6: motion.circle `cx`/`cy` vs Transform-based Positioning
**What goes wrong:** Animating `cx` and `cy` on motion.circle does not produce smooth animation, or the values don't update.
**Why it happens:** motion distinguishes between style-based animation and attribute-based animation. SVG attributes like `cx`, `cy` need attribute animation, not transform animation.
**How to avoid:** For positioning SVG circles, animate `cx` and `cy` directly as props on `motion.circle`:
```tsx
<motion.circle animate={{ cx: targetX, cy: targetY }} />
```
For transform-based positioning (motion.g with translate), use the `x` and `y` shorthand props:
```tsx
<motion.g animate={{ x: targetX, y: targetY }}>
  <circle cx={0} cy={0} r={12} />
</motion.g>
```
The `motion.g` approach may be easier for grouping token + badge together.
**Warning signs:** Token jumps to position without animating, or animates along wrong axis.

## Code Examples

### Board Coordinate Calculation (Verified Pattern)

```typescript
// src/lib/yut/boardCoords.ts
// Pure data -- no React, no DOM

export interface StationCoord {
  x: number
  y: number
}

const CX = 250
const CY = 250
const R = 210  // corner distance from center

/** Linear interpolation between two points */
function lerp(x1: number, y1: number, x2: number, y2: number, t: number): StationCoord {
  return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t }
}

// Four corners of the diamond
const TOP = { x: CX, y: CY - R }       // S5
const RIGHT = { x: CX + R, y: CY }     // S10
const BOTTOM = { x: CX, y: CY + R }    // S15
const LEFT = { x: CX - R, y: CY }      // S0
const CENTER = { x: CX, y: CY }        // S22

function buildStationCoords(): Record<number, StationCoord> {
  const coords: Record<number, StationCoord> = {}

  // Outer ring: 4 edges, 5 segments each (5 intervals, 6 points per edge including both corners)
  // Edge: LEFT(S0) -> TOP(S5): stations 0,1,2,3,4,5
  for (let i = 0; i <= 5; i++) {
    coords[i] = lerp(LEFT.x, LEFT.y, TOP.x, TOP.y, i / 5)
  }
  // Edge: TOP(S5) -> RIGHT(S10): stations 5,6,7,8,9,10
  for (let i = 1; i <= 5; i++) {
    coords[5 + i] = lerp(TOP.x, TOP.y, RIGHT.x, RIGHT.y, i / 5)
  }
  // Edge: RIGHT(S10) -> BOTTOM(S15): stations 10,11,12,13,14,15
  for (let i = 1; i <= 5; i++) {
    coords[10 + i] = lerp(RIGHT.x, RIGHT.y, BOTTOM.x, BOTTOM.y, i / 5)
  }
  // Edge: BOTTOM(S15) -> LEFT(S0): stations 15,16,17,18,19
  for (let i = 1; i <= 4; i++) {
    coords[15 + i] = lerp(BOTTOM.x, BOTTOM.y, LEFT.x, LEFT.y, i / 5)
  }
  // S0 already set from first edge

  // Center
  coords[22] = { ...CENTER }

  // Diagonal: S5(TOP) -> S22(CENTER): diag_right route [5, 20, 21, 22, ...]
  // 20 and 21 are between TOP and CENTER
  coords[20] = lerp(TOP.x, TOP.y, CENTER.x, CENTER.y, 1 / 3)
  coords[21] = lerp(TOP.x, TOP.y, CENTER.x, CENTER.y, 2 / 3)

  // Diagonal: S22(CENTER) -> toward S15(BOTTOM): route continues [22, 23, 24]
  // 23 and 24 are between CENTER and BOTTOM
  coords[23] = lerp(CENTER.x, CENTER.y, BOTTOM.x, BOTTOM.y, 1 / 3)
  coords[24] = lerp(CENTER.x, CENTER.y, BOTTOM.x, BOTTOM.y, 2 / 3)

  // Diagonal: S10(RIGHT) -> S22(CENTER): diag_left route [10, 25, 26, 22, ...]
  // 25 and 26 are between RIGHT and CENTER
  coords[25] = lerp(RIGHT.x, RIGHT.y, CENTER.x, CENTER.y, 1 / 3)
  coords[26] = lerp(RIGHT.x, RIGHT.y, CENTER.x, CENTER.y, 2 / 3)

  // Diagonal: S22(CENTER) -> toward S0(LEFT): route continues [22, 27, 28]
  // 27 and 28 are between CENTER and LEFT
  coords[27] = lerp(CENTER.x, CENTER.y, LEFT.x, LEFT.y, 1 / 3)
  coords[28] = lerp(CENTER.x, CENTER.y, LEFT.x, LEFT.y, 2 / 3)

  return coords
}

export const STATION_COORDS: Record<number, StationCoord> = buildStationCoords()

/** Viewbox dimensions for the board SVG */
export const BOARD_VIEWBOX = '0 0 500 500'
```

### Piece Token Component

```typescript
// src/components/board/PieceToken.tsx
'use client'

import { motion } from 'motion/react'
import type { Team } from '@/lib/yut/types'

interface PieceTokenProps {
  cx: number
  cy: number
  team: Team
  stackCount: number       // 1 = solo, 2+ = stacked
  isSelectable: boolean
  isSelected: boolean
  onSelect: () => void
}

const TEAM_COLORS: Record<Team, { fill: string; stroke: string }> = {
  player: { fill: '#42A5F5', stroke: '#1565C0' },  // Blue family
  ai: { fill: '#EF5350', stroke: '#C62828' },       // Red family
}

const TOKEN_RADIUS = 14

export function PieceToken({
  cx, cy, team, stackCount, isSelectable, isSelected, onSelect,
}: PieceTokenProps): JSX.Element {
  const colors = TEAM_COLORS[team]

  return (
    <motion.g
      animate={{ x: cx, y: cy }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Invisible hit area for 44px touch target */}
      {isSelectable && (
        <circle
          r={22}
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onClick={onSelect}
        />
      )}

      {/* Glow ring for selectable pieces (D-06) */}
      {isSelectable && (
        <motion.circle
          r={18}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={2}
          animate={{
            r: [18, 22, 18],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <motion.circle
          r={20}
          fill="none"
          stroke="#FFD700"
          strokeWidth={3}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        />
      )}

      {/* Main token circle */}
      <circle
        r={TOKEN_RADIUS}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={2}
      />

      {/* Stack count badge (D-05) */}
      {stackCount > 1 && (
        <g transform={`translate(${TOKEN_RADIUS * 0.6}, ${-TOKEN_RADIUS * 0.6})`}>
          <circle r={8} fill="#FFF" stroke={colors.stroke} strokeWidth={1.5} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fontWeight="bold"
            fill={colors.stroke}
          >
            {stackCount}
          </text>
        </g>
      )}
    </motion.g>
  )
}
```

### Hop Animation Hook

```typescript
// src/hooks/useHopAnimation.ts
'use client'

import { useRef, useCallback } from 'react'
import { useAnimate } from 'motion/react'
import { STATION_COORDS } from '@/lib/yut/boardCoords'

const HOP_DURATION = 0.2  // D-07: ~200ms per hop

interface HopAnimationResult {
  scope: React.RefObject<SVGGElement | null>
  isAnimating: boolean
  startHop: (
    intermediateStations: number[],
    finalStation: number
  ) => Promise<void>
}

export function useHopAnimation(): HopAnimationResult {
  const [scope, animate] = useAnimate<SVGGElement>()
  const isAnimatingRef = useRef(false)

  const startHop = useCallback(async (
    intermediateStations: number[],
    finalStation: number
  ): Promise<void> => {
    isAnimatingRef.current = true

    // Hop through each intermediate station
    for (const station of intermediateStations) {
      const coord = STATION_COORDS[station]
      if (!coord) continue
      await animate(scope.current!, { x: coord.x, y: coord.y }, {
        duration: HOP_DURATION,
        ease: [0.25, 0.1, 0.25, 1], // ease-out
      })
    }

    // Final landing with spring bounce
    const finalCoord = STATION_COORDS[finalStation]
    if (finalCoord) {
      await animate(scope.current!, { x: finalCoord.x, y: finalCoord.y }, {
        type: 'spring',
        stiffness: 400,
        damping: 20,
      })
    }

    isAnimatingRef.current = false
  }, [scope, animate])

  return {
    scope,
    isAnimating: isAnimatingRef.current,
    startHop,
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| framer-motion import | motion/react import | 2024 (v11+) | Package name changed; import from 'motion/react' not 'framer-motion' |
| useAnimation() hook | useAnimate() hook | 2024 (motion v11) | useAnimate provides scope ref + imperative animate function; useAnimation is deprecated |
| CSS transform for SVG positioning | motion.g with x/y props | Current | motion handles SVG transform animation natively |

**Deprecated/outdated:**
- `framer-motion` package name: Renamed to `motion`. Project already uses correct `motion/react` import.
- `useAnimation()` hook: Replaced by `useAnimate()` which returns [scope, animate] tuple.
- `AnimationControls` class: Replaced by imperative `animate()` function from `useAnimate`.

## Open Questions

1. **Exact diagonal station visual spacing**
   - What we know: Diagonal stations (20-28) lie on lines from corners through center. Coordinates calculated via lerp at 1/3 and 2/3 intervals.
   - What's unclear: Whether 1/3 spacing provides sufficient visual separation from adjacent outer ring stations. Some inner stations may appear very close to outer edge midpoints.
   - Recommendation: Implement calculated coordinates, then visual QA. Adjust spacing if needed (e.g., use 1/4 and 1/2 instead of 1/3 and 2/3).

2. **Home zone and finish zone visual representation**
   - What we know: HOME (-1) and FINISH (-2) are sentinel values, not board stations. Pieces at HOME need to be shown off-board.
   - What's unclear: Where to position HOME pieces visually. Options: below the board in team-colored zones, or as a count indicator.
   - Recommendation: Place HOME pieces in a small staging area below the board (within the bottom 30-40% area per D-03). Show as stacked tokens with count badge.

3. **Multiple pieces at the same station (different routes)**
   - What we know: Station 22 (center) exists in 4 routes. Two pieces at station 22 on different routes are at the same physical position.
   - What's unclear: How to offset multiple pieces at the same station to avoid visual overlap.
   - Recommendation: When multiple pieces occupy the same station, offset them slightly (e.g., -8px and +8px horizontally) from the station center.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 with jsdom environment |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BOARD-01 | 29 stations render with correct positions | unit | `npx vitest run src/lib/yut/__tests__/boardCoords.test.ts -x` | Wave 0 |
| BOARD-01 | Board SVG renders diamond layout | integration | `npx vitest run src/components/board/__tests__/Board.test.tsx -x` | Wave 0 |
| BOARD-02 | Piece tokens display at correct positions with team colors | integration | `npx vitest run src/components/board/__tests__/PieceToken.test.tsx -x` | Wave 0 |
| BOARD-03 | Stacked pieces show count badge | unit | `npx vitest run src/components/board/__tests__/PieceToken.test.tsx -x` | Wave 0 |
| BOARD-04 | Selecting piece highlights valid destinations | integration | `npx vitest run src/components/board/__tests__/Board.test.tsx -x` | Wave 0 |
| BOARD-05 | Branch choice shows two-color highlights at S5/S10 | integration | `npx vitest run src/components/board/__tests__/Board.test.tsx -x` | Wave 0 |
| BOARD-06 | Hop animation traverses intermediate stations | unit (mock) | `npx vitest run src/components/board/__tests__/HopAnimation.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/yut/__tests__/boardCoords.test.ts` -- covers BOARD-01 (29 coords, no overlaps, correct diamond geometry)
- [ ] `src/components/board/__tests__/Board.test.tsx` -- covers BOARD-01, BOARD-04, BOARD-05 (SVG renders, highlights, branch choice)
- [ ] `src/components/board/__tests__/PieceToken.test.tsx` -- covers BOARD-02, BOARD-03 (team colors, stack badge)
- [ ] `src/components/board/__tests__/HopAnimation.test.tsx` -- covers BOARD-06 (hop animation sequence)
- [ ] `src/__mocks__/motion/react.tsx` -- motion library mock for component tests (does not exist yet)

## Sources

### Primary (HIGH confidence)
- [motion.dev/docs/react-svg-animation](https://motion.dev/docs/react-svg-animation) - SVG animation support, motion.circle, attribute animation (cx, cy)
- [motion.dev/docs/react-use-animate](https://motion.dev/docs/react-use-animate) - useAnimate hook for sequential animations, scope ref pattern
- [motion.dev/docs/react-motion-component](https://motion.dev/docs/react-motion-component) - motion component API, animate/initial/transition/variants props
- [motion.dev/docs/react-animation](https://motion.dev/docs/react-animation) - Keyframe arrays, spring vs tween, dynamic animate updates
- [motion.dev/docs/react-gestures](https://motion.dev/docs/react-gestures) - whileTap, onTap for touch interaction
- `src/lib/yut/board.ts` - ROUTES, BRANCH_POINTS (source of truth for station topology)
- `src/lib/yut/movement.ts` - resolveMove returns intermediateStations for hop animation
- `src/lib/yut/types.ts` - PieceState, MoveResult type definitions

### Secondary (MEDIUM confidence)
- [developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox) - SVG viewBox coordinate system
- [smashingmagazine.com/2018/05/svg-interaction-pointer-events-property](https://www.smashingmagazine.com/2018/05/svg-interaction-pointer-events-property/) - SVG pointer events, fill:none pitfall

### Tertiary (LOW confidence)
- Diamond layout coordinate math: Self-derived from board graph topology. Needs visual QA validation.

## Project Constraints (from CLAUDE.md)

- **Animation import:** Always `import { motion } from 'motion/react'` (NOT framer-motion)
- **'use client' directive:** Required on all interactive components
- **Import paths:** Use `@/` absolute paths, never relative
- **Touch targets:** Minimum 44px touch targets on mobile
- **Tailwind CSS:** Utility-first styling, no CSS Modules
- **TypeScript strict mode:** All parameters typed, explicit return types
- **Named exports:** Preferred over default exports
- **JSDoc comments:** Required with @param and @returns
- **Component naming:** PascalCase .tsx files
- **Test location:** `__tests__/` subdirectory co-located with source
- **No console.log:** Debug via DevTools, not logging

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and used in project
- Architecture: HIGH - SVG + motion for board rendering is well-documented and proven
- Coordinate mapping: MEDIUM - Math is straightforward but needs visual QA for spacing
- Pitfalls: HIGH - Based on direct motion docs and SVG interaction known issues

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable domain, no fast-moving dependencies)
