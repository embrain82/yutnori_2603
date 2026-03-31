# Phase 1: Board Graph & Movement Logic - Research

**Researched:** 2026-03-31
**Domain:** Pure TypeScript game logic -- Yut Nori board graph, path resolution, throw mechanics, win condition
**Confidence:** HIGH

## Summary

Phase 1 builds the foundational game logic library for Yut Nori (윷놀이) as pure TypeScript functions in `src/lib/yut/`. This is the highest-risk component in the entire project -- the board path graph with 29 nodes, 5 routes, and conditional branching at corners is the #1 source of bugs in Yut Nori implementations. The code must handle throw result generation with traditional probability (each stick 50/50), throw queue management for yut/mo chaining, path resolution including shortcut entry at corners, finish-line semantics (landing on 참먹이 does NOT finish -- piece must pass through), and victory detection when all 2 pieces complete.

The existing RPS project (`260330_rps/src/lib/rps/`) provides a proven pattern: pure functional logic with no DOM dependencies, exported types and constants, barrel exports via `index.ts`, and comprehensive Vitest unit tests in co-located `__tests__/` directories. Phase 1 follows this pattern exactly but with significantly more complex data structures.

**Primary recommendation:** Model the board as 5 hardcoded route arrays with piece position tracked as `(routeId, indexInRoute)`. Implement types first, then board graph, then throw logic, then movement resolution, then win condition -- each with exhaustive tests before moving to the next.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Route-based directed graph -- each piece tracks its current route and position within that route
- **D-02:** 5 routes (외곽, 좌상->우하 대각, 우상->좌하 대각, 중앙->하단, 중앙->상단) for path resolution at branching points
- **D-03:** Follow existing RPS pattern: pure logic in `src/lib/yut/` with zero rendering dependencies
- **D-04:** Traditional probability -- each of 4 yut sticks has independent 50/50 flat/round chance
- **D-05:** Resulting distribution: 도=25%, 개=37.5%, 걸=25%, 윷=6.25%, 모=6.25%
- **D-06:** AI and player use identical probability distribution -- AI difficulty controlled only via move selection strategy (Phase 2)
- **D-07:** Landing exactly on 참먹이 does NOT complete -- piece must have movement remaining to pass through
- **D-08:** Excess movement after passing 참먹이 is discarded -- piece is simply marked as finished
- **D-09:** Thorough test coverage using Vitest (matching existing RPS project setup)
- **D-10:** Full path traversal tests for all 5 routes, edge cases at branching points, throw queue management, and win condition

### Claude's Discretion
- Exact node ID naming convention and data structure shape
- Internal helper function decomposition
- Test file organization within `__tests__/`

### Deferred Ideas (OUT OF SCOPE)
- None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-01 | 윷 던지기 시 도/개/걸/윷/모 결과가 정확히 판정된다 | Throw generation with traditional 50/50 probability per stick; see Architecture Patterns: Throw Logic |
| GAME-02 | 윷/모 결과 시 추가 던지기가 부여되며 무제한 체이닝이 가능하다 | Throw queue data structure with unlimited chaining; see Architecture Patterns: Throw Queue |
| GAME-03 | 던지기 결과가 큐에 쌓이고 순서대로 말 이동에 사용된다 | FIFO queue consuming results one at a time; see Architecture Patterns: Throw Queue |
| GAME-04 | 29칸 윷판 경로 그래프가 외곽 20칸 + 지름길 9칸으로 구성된다 | 5-route directed graph with 29 stations; see Architecture Patterns: Board Graph |
| GAME-05 | 코너 위치(모/앞밭, 뒷모 등)에서 지름길 진입 여부를 선택할 수 있다 | Branch points at S5, S10 with choice between outer continuation and diagonal entry; see Architecture Patterns: Branching |
| GAME-06 | 말이 윷 결과 수만큼 경로를 따라 정확히 이동한다 | Step-by-step advancement along current route; see Architecture Patterns: Movement Resolution |
| GAME-11 | 2개 말이 모두 참먹이를 통과하면 승리한다 (정확히 도착은 통과 아님) | Finish detection with pass-through semantics; see Architecture Patterns: Finish Logic |
| GAME-12 | 이동 불가능한 던지기 결과는 자동으로 건너뛴다 | Skip validation in move resolution; see Common Pitfalls: Impossible Moves |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.7+ (bundled with Next.js 16) | Type safety for all game logic | Project constraint; strict mode enabled |
| Vitest | 4.1.2 | Unit test runner | Already used in RPS project; jsdom environment configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/coverage-v8 | 4.1.2 | Code coverage reporting | Running `npm test -- --coverage` for coverage checks |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain arrays for routes | Adjacency list/map | Route arrays are more predictable for linear traversal; adjacency lists better for arbitrary graph queries but overkill here |
| Enum for stations | String literal unions | Enum gives numeric station IDs useful for route array indexing; string literals are more verbose but self-documenting. Recommend numeric constants for array indexing. |

**Installation:**

No additional packages needed for Phase 1. The project already has Vitest and TypeScript configured from the RPS reference. The new `src/lib/yut/` directory and test infrastructure follow the existing pattern.

**Note:** The project has not been scaffolded yet (no `package.json` in root). Phase 1's plan will need an initial scaffold task that mirrors the RPS project structure before game logic implementation begins.

## Architecture Patterns

### Recommended Project Structure
```
src/lib/yut/
├── types.ts           # All type definitions, enums, constants
├── board.ts           # Board graph: routes, stations, adjacency
├── throw.ts           # Throw result generation, probability
├── movement.ts        # Path resolution, step advancement, finish detection
├── game.ts            # Game state operations: throw queue, turn flow, win check
├── index.ts           # Barrel export
└── __tests__/
    ├── types.test.ts
    ├── board.test.ts
    ├── throw.test.ts
    ├── movement.test.ts
    └── game.test.ts
```

### Pattern 1: Station and Route Modeling

**What:** Define the 29 board stations as numeric constants and the 5 routes as ordered arrays of station IDs. A piece's position is a `(routeId, indexInRoute)` tuple rather than a single station number.

**When to use:** All board graph operations.

**Why:** A single station ID is ambiguous at the center (S22) because the center is shared by multiple routes -- a piece entering from the right diagonal exits differently than one entering from the left diagonal. Tracking `(route, index)` removes all ambiguity.

**Example:**
```typescript
// src/lib/yut/types.ts

/** Throw results and their step counts */
export type ThrowName = 'do' | 'gae' | 'geol' | 'yut' | 'mo'

export const THROW_STEPS: Record<ThrowName, number> = {
  do: 1,
  gae: 2,
  geol: 3,
  yut: 4,
  mo: 5,
} as const

/** Whether a throw grants an extra throw */
export const GRANTS_EXTRA_THROW: Record<ThrowName, boolean> = {
  do: false,
  gae: false,
  geol: false,
  yut: true,
  mo: true,
} as const

/** Special positions */
export const HOME = -1    // Not yet on board
export const FINISH = -2  // Completed the circuit

/** Piece position tracked as route + index within route */
export interface PiecePosition {
  station: number        // Current station number (or HOME/FINISH)
  routeId: string        // Which route the piece is following
  routeIndex: number     // Index within that route
}

export interface PieceState {
  id: string              // 'p1' | 'p2' | 'ai1' | 'ai2'
  team: 'player' | 'ai'
  position: PiecePosition
}

export interface ThrowResult {
  name: ThrowName
  steps: number
  grantsExtra: boolean
}
```

### Pattern 2: Board Graph as Route Arrays

**What:** 5 hardcoded route arrays define every possible path a piece can follow. Each route is an ordered array of station numbers ending at the finish transition point.

**When to use:** Board definition, path resolution.

**Critical design detail from FEATURES.md and ARCHITECTURE.md:**

```typescript
// src/lib/yut/board.ts

/**
 * Station layout (29 stations, 0-indexed):
 *
 * Outer ring (counterclockwise): S0(참먹이) -> S1 -> S2 -> S3 -> S4 -> S5(모/앞밭)
 *   -> S6 -> S7 -> S8 -> S9 -> S10(뒷모) -> S11 -> S12 -> S13 -> S14
 *   -> S15(날밭) -> S16 -> S17 -> S18 -> S19 -> back to S0
 *
 * Right diagonal (S5 -> center -> S0): S20 -> S21 -> S22(방) -> S23 -> S24
 * Left diagonal (S10 -> center -> S0): S25 -> S26 -> S22(방) -> S27 -> S28
 * Center to bottom-left exit: S22(방) -> S23 -> S15
 */

export const ROUTE_IDS = {
  OUTER: 'outer',
  DIAG_RIGHT: 'diag_right',   // S5 corner through center to S0
  DIAG_LEFT: 'diag_left',     // S10 corner through center to S0
  CENTER_DOWN: 'center_down',  // Center -> S15 (bottom-left corner exit)
  CENTER_UP: 'center_up',      // Center -> S0 (direct to finish)
} as const

/**
 * Route definitions. Each route is the ordered list of stations.
 * The last station in each route is the final station before the
 * piece transitions to FINISH (by passing through S0/참먹이).
 */
export const ROUTES: Record<string, readonly number[]> = {
  [ROUTE_IDS.OUTER]: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  [ROUTE_IDS.DIAG_RIGHT]: [5, 20, 21, 22, 23, 24],
  [ROUTE_IDS.DIAG_LEFT]: [10, 25, 26, 22, 27, 28],
  [ROUTE_IDS.CENTER_DOWN]: [22, 23, 15],
  [ROUTE_IDS.CENTER_UP]: [22, 27, 28],
} as const

/**
 * Branch points: stations where a piece that LANDS on them
 * (not passes through) can choose to switch routes.
 */
export const BRANCH_POINTS: Record<number, { continueRoute: string; shortcutRoute: string }> = {
  5:  { continueRoute: ROUTE_IDS.OUTER, shortcutRoute: ROUTE_IDS.DIAG_RIGHT },
  10: { continueRoute: ROUTE_IDS.OUTER, shortcutRoute: ROUTE_IDS.DIAG_LEFT },
}
```

### Pattern 3: Throw Result Generation

**What:** Generate throw results using traditional probability -- simulate 4 independent yut sticks each with 50/50 flat/round chance.

**When to use:** Every throw action.

```typescript
// src/lib/yut/throw.ts

/**
 * Generates a throw result using traditional yut probability.
 * Each of 4 sticks has 50% chance of landing flat (앞) or round (뒤).
 * - 도 (do): 1 flat = 1 step (probability: 4C1 * 0.5^4 = 25%)
 * - 개 (gae): 2 flat = 2 steps (probability: 4C2 * 0.5^4 = 37.5%)
 * - 걸 (geol): 3 flat = 3 steps (probability: 4C3 * 0.5^4 = 25%)
 * - 윷 (yut): 4 flat = 4 steps (probability: 4C4 * 0.5^4 = 6.25%)
 * - 모 (mo): 0 flat = 5 steps (probability: 4C0 * 0.5^4 = 6.25%)
 */
export function generateThrow(): ThrowResult {
  let flatCount = 0
  for (let i = 0; i < 4; i++) {
    if (Math.random() < 0.5) flatCount++
  }

  const name = flatCountToName(flatCount)
  return {
    name,
    steps: THROW_STEPS[name],
    grantsExtra: GRANTS_EXTRA_THROW[name],
  }
}

function flatCountToName(flatCount: number): ThrowName {
  switch (flatCount) {
    case 0: return 'mo'
    case 1: return 'do'
    case 2: return 'gae'
    case 3: return 'geol'
    case 4: return 'yut'
    default: throw new Error(`Invalid flat count: ${flatCount}`)
  }
}
```

### Pattern 4: Movement Resolution with Finish Logic

**What:** Given a piece position and step count, advance along the current route. Handle finish detection with pass-through semantics (D-07, D-08).

**When to use:** Every piece move.

**Critical rule:** A piece at station S19 (last outer station) with 1 step would land on S0 (참먹이). Per D-07, landing ON 참먹이 does NOT finish the piece. The piece must have remaining steps AFTER reaching the finish transition point. Per D-08, excess movement is discarded.

```typescript
// src/lib/yut/movement.ts

export interface MoveResult {
  newPosition: PiecePosition
  finished: boolean                // Did the piece complete the circuit?
  landedOnBranch: boolean          // Does player need to choose a path?
  branchOptions?: { continueRoute: string; shortcutRoute: string }
  intermediateStations: number[]   // Stations passed through (for animation)
}

/**
 * Resolves a piece's movement along its current route.
 *
 * Key rules:
 * - Piece advances `steps` stations along current route
 * - If piece reaches end of route and has remaining steps, it transitions
 *   toward finish (passing through S0/참먹이)
 * - Landing exactly on 참먹이 with 0 remaining steps = NOT finished (D-07)
 * - Having >= 1 remaining step after reaching route end = FINISHED (D-08)
 * - Excess movement after finishing is discarded (D-08)
 * - Landing on a branch point triggers a route choice (GAME-05)
 */
export function resolveMove(
  piece: PieceState,
  steps: number,
  currentRoute: readonly number[]
): MoveResult {
  // Implementation: step through route array from current index
  // Track intermediate stations for animation
  // Check finish condition at each step
  // Check branch point on final landing station
}
```

### Pattern 5: Throw Queue Management

**What:** Maintain a FIFO queue of pending throw results. Yut/mo results append additional throws to the queue. Results are consumed one at a time for piece movement.

**When to use:** Turn flow management.

```typescript
// src/lib/yut/game.ts

export interface TurnState {
  throwQueue: ThrowResult[]   // Pending results to be consumed
  throwsRemaining: number     // How many more throws before moving
  pendingMoves: ThrowResult[] // Results ready for piece selection
}

/**
 * Processes a new throw result into the turn state.
 * If the result grants an extra throw (yut/mo), increments throwsRemaining.
 * Otherwise, the throw result is added to pendingMoves.
 */
export function processThrow(
  turnState: TurnState,
  result: ThrowResult
): TurnState {
  const newPending = [...turnState.pendingMoves, result]

  if (result.grantsExtra) {
    return {
      ...turnState,
      pendingMoves: newPending,
      throwsRemaining: turnState.throwsRemaining + 1,
    }
  }

  return {
    ...turnState,
    pendingMoves: newPending,
    throwsRemaining: turnState.throwsRemaining - 1,
  }
}
```

### Pattern 6: Pure Function Game Logic (Following RPS Pattern)

**What:** All functions are pure -- no side effects, no DOM, no React. Functions take state as input and return new state as output.

**When to use:** Every function in `src/lib/yut/`.

**Reference from RPS:**
```typescript
// RPS pattern (proven): gameRules.ts
export function determineOutcome(playerChoice: Choice, aiChoice: Choice): Outcome {
  if (playerChoice === aiChoice) return 'draw'
  if (BEATS[aiChoice] === playerChoice) return 'lose'
  return 'win'
}

// Yut pattern (same approach): movement.ts
export function resolveMove(piece: PieceState, steps: number): MoveResult {
  // Pure computation, returns new state
}
```

### Anti-Patterns to Avoid

- **Class-based game objects:** Do not create `Piece` or `Board` classes. Use plain objects and pure functions. Matches RPS pattern (no classes anywhere).
- **Mutating state:** Never mutate `PieceState` or route arrays. Return new objects. Zustand (Phase 5) expects immutable updates.
- **Grid-based board:** The Yut board is NOT a grid. Do not use 2D arrays. Use route arrays with `(routeId, index)` positions.
- **Implicit route decisions:** When a piece lands on a branch point, the function MUST return a branch indicator so the UI can ask the player. Do not auto-decide.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom ID generator | `crypto.randomUUID()` | Built-in, matches RPS session pattern |
| Probability math | Custom distribution sampler | 4 independent `Math.random() < 0.5` calls | Naturally produces correct binomial distribution per D-04/D-05 |
| Test runner | Custom test harness | Vitest 4.1.2 | Already configured with jsdom, coverage, alias resolution |
| Deep clone for immutability | `JSON.parse(JSON.stringify())` | Spread operator `{...obj}` / `[...arr]` | Shallow copies sufficient for flat game state objects |

**Key insight:** This phase is pure logic with no external dependencies. The "don't hand-roll" risk is minimal. The biggest risk is hand-rolling graph traversal logic incorrectly -- hence the route-array approach that reduces graph algorithms to simple array index arithmetic.

## Common Pitfalls

### Pitfall 1: Center Station Ambiguity (S22 / 방)
**What goes wrong:** S22 (the center) is shared by both diagonals. A piece entering from the right diagonal (S5 -> S20 -> S21 -> S22) should exit toward S23 -> S24 -> finish. A piece entering from the left diagonal (S10 -> S25 -> S26 -> S22) should exit toward S27 -> S28 -> finish. If you only track station number, a piece at S22 has ambiguous exit direction.
**Why it happens:** Developers model position as a single station ID without tracking which route the piece is on.
**How to avoid:** Track position as `(routeId, indexInRoute)`. The route determines exit direction unambiguously. A piece on `diag_right` at index 3 (S22) continues to index 4 (S23). A piece on `diag_left` at index 3 (S22) continues to index 4 (S27).
**Warning signs:** Pieces at center move in unexpected direction; test failures at S22.

### Pitfall 2: Finish Line Off-By-One
**What goes wrong:** Piece at S19 with `do` (1 step) should land on S0 (참먹이) but NOT finish. Piece at S19 with `gae` (2 steps) should finish (passes through S0 with 1 remaining step, which is discarded). Developers implement `if station === S0 then finish` which is WRONG.
**Why it happens:** Confusion between "landing on" vs "passing through" the finish point.
**How to avoid:** Count remaining steps after reaching the route endpoint. If remaining steps > 0 after the piece would land on/pass S0, the piece finishes. If remaining steps === 0 and piece lands exactly on S0, piece stays at S0. Per D-07 and D-08.
**Warning signs:** Pieces at S0 are incorrectly marked finished; pieces with excess movement after finish are not marked finished.

### Pitfall 3: Branch Point Pass-Through vs Landing
**What goes wrong:** Piece at S3 with `gae` (2 steps) would pass through S4 and land on S5 (a branch point). This SHOULD offer a shortcut choice. Piece at S3 with `geol` (3 steps) would pass through S4, S5, and land on S6. This should NOT offer a shortcut choice -- the piece passed through S5 without landing on it.
**Why it happens:** Developers check if any intermediate station is a branch point, instead of only checking the final landing station.
**How to avoid:** Only check for branch point on the FINAL station after all steps are consumed. Intermediate stations are just passed through.
**Warning signs:** Shortcut prompt appears when piece passes through a corner without landing on it.

### Pitfall 4: Route Transition When Taking Shortcut from Home
**What goes wrong:** A new piece entering the board starts at S0 (참먹이) on the outer route. With `mo` (5 steps) it would land exactly on S5 (first corner). This should offer the shortcut choice. If player chooses the shortcut, the piece's route must change from OUTER to DIAG_RIGHT. The next move must follow the diagonal route, not the outer route.
**Why it happens:** Route is set at entry and never updated.
**How to avoid:** When a piece lands on a branch point AND the player chooses the shortcut, update the piece's `routeId` and `routeIndex` to the new route. The piece's index in the new route is 0 (the first station of the shortcut route is the corner itself).
**Warning signs:** Piece takes shortcut but subsequent moves follow outer route.

### Pitfall 5: Throw Queue + Extra Throw Accounting
**What goes wrong:** Player throws `yut` (extra throw), then `mo` (extra throw), then `gae` (no extra). Now the player has 3 pending results to apply as moves. If during one of those moves the player captures an opponent (Phase 2), that grants ANOTHER throw. The throw queue must handle arbitrary interleaving of "throw phase" and "move phase."
**Why it happens:** Simple state machine assumes throw-then-move-then-switch-turn, but yut/mo and captures break this assumption.
**How to avoid:** Model turn state with explicit `throwsRemaining` counter and `pendingMoves` queue. After each throw, check if more throws are needed. After all throws, consume moves one at a time. Captures (Phase 2) increment `throwsRemaining` again. Note: Phase 1 only needs the queue structure and yut/mo chaining. Capture-triggered extra throws are Phase 2.
**Warning signs:** Game gets stuck after multiple yut/mo; remaining throw results cannot be applied.

### Pitfall 6: Impossible Move Detection (GAME-12)
**What goes wrong:** Near end-game, a piece on the board may be very close to finish, and the throw result may be impossible to apply (e.g., piece at S24 with `yut` = 4 steps, but only 1 step remains to finish). With 2-piece teams, both pieces might be in positions where a throw result cannot be used.
**Why it happens:** Developers assume every throw result can always be applied to at least one piece.
**How to avoid:** For each pending throw result, check ALL pieces to see if any legal move exists. If no piece can use the result, skip it automatically. Return a clear "skipped" indicator so the UI can communicate this to the player.
**Warning signs:** Game hangs when no piece can move; throw result stays in queue forever.

## Code Examples

### Complete Types File Pattern
```typescript
// src/lib/yut/types.ts
// All type definitions for Yut Nori game logic.
// Consumed by lib/yut/* functions and Phase 5 Zustand store.

/** Yut throw result names */
export type ThrowName = 'do' | 'gae' | 'geol' | 'yut' | 'mo'

/** Steps each throw result advances a piece */
export const THROW_STEPS: Record<ThrowName, number> = {
  do: 1,
  gae: 2,
  geol: 3,
  yut: 4,
  mo: 5,
} as const

/** Which throws grant an additional throw */
export const GRANTS_EXTRA_THROW: Record<ThrowName, boolean> = {
  do: false,
  gae: false,
  geol: false,
  yut: true,
  mo: true,
} as const

/** Special position constants */
export const HOME = -1
export const FINISH = -2

/** Team identifier */
export type Team = 'player' | 'ai'

/** Piece position tracked as route + index */
export interface PiecePosition {
  station: number
  routeId: string
  routeIndex: number
}

/** Individual piece state */
export interface PieceState {
  id: string
  team: Team
  position: PiecePosition
}

/** Result of a single throw */
export interface ThrowResult {
  name: ThrowName
  steps: number
  grantsExtra: boolean
}

/** Result of resolving a move */
export interface MoveResult {
  newPosition: PiecePosition
  finished: boolean
  landedOnBranch: boolean
  branchOptions?: {
    continueRoute: string
    shortcutRoute: string
  }
  intermediateStations: number[]
}

/** Whether a move is possible for a given piece and throw */
export interface MoveOption {
  pieceId: string
  result: ThrowResult
  isPossible: boolean
}

/** Turn state for throw queue management */
export interface TurnState {
  activeTeam: Team
  throwsRemaining: number
  pendingMoves: ThrowResult[]
}

/** Full game state (Phase 1 scope -- no capture/stacking yet) */
export interface GameLogicState {
  pieces: PieceState[]
  turnState: TurnState
  isGameOver: boolean
  winner: Team | null
}
```

### Test Pattern: Exhaustive Path Traversal
```typescript
// src/lib/yut/__tests__/movement.test.ts
import { describe, it, expect } from 'vitest'
import { resolveMove } from '../movement'
import { ROUTES, ROUTE_IDS } from '../board'
import { HOME, FINISH } from '../types'

describe('resolveMove - outer route full traversal', () => {
  it('piece at S0 with do(1) moves to S1', () => {
    const piece = makePiece('outer', 0) // S0
    const result = resolveMove(piece, 1, ROUTES[ROUTE_IDS.OUTER])
    expect(result.newPosition.station).toBe(1)
    expect(result.finished).toBe(false)
  })

  it('piece at S19 with do(1) lands on S0 (참먹이) -- NOT finished (D-07)', () => {
    const piece = makePiece('outer', 19) // S19
    const result = resolveMove(piece, 1, ROUTES[ROUTE_IDS.OUTER])
    expect(result.newPosition.station).toBe(0) // Back at 참먹이
    expect(result.finished).toBe(false) // D-07: landing exactly = not finished
  })

  it('piece at S19 with gae(2) finishes -- passes through S0 (D-08)', () => {
    const piece = makePiece('outer', 19) // S19
    const result = resolveMove(piece, 2, ROUTES[ROUTE_IDS.OUTER])
    expect(result.finished).toBe(true) // D-08: excess movement discarded
  })

  it('piece at S4 with do(1) lands on S5 -- branch point offered', () => {
    const piece = makePiece('outer', 4) // S4
    const result = resolveMove(piece, 1, ROUTES[ROUTE_IDS.OUTER])
    expect(result.newPosition.station).toBe(5)
    expect(result.landedOnBranch).toBe(true)
    expect(result.branchOptions).toEqual({
      continueRoute: ROUTE_IDS.OUTER,
      shortcutRoute: ROUTE_IDS.DIAG_RIGHT,
    })
  })

  it('piece at S3 with geol(3) passes through S5 -- NO branch offered', () => {
    const piece = makePiece('outer', 3) // S3
    const result = resolveMove(piece, 3, ROUTES[ROUTE_IDS.OUTER])
    expect(result.newPosition.station).toBe(6) // Passed through S5
    expect(result.landedOnBranch).toBe(false)
  })
})

describe('resolveMove - diagonal right route', () => {
  it('piece at S5 entering diagonal with do(1) moves to S20', () => {
    const piece = makePiece('diag_right', 0) // S5 on diagonal
    const result = resolveMove(piece, 1, ROUTES[ROUTE_IDS.DIAG_RIGHT])
    expect(result.newPosition.station).toBe(20)
  })

  it('piece at S24 (last diagonal station) with do(1) finishes', () => {
    const piece = makePiece('diag_right', 5) // S24
    const result = resolveMove(piece, 1, ROUTES[ROUTE_IDS.DIAG_RIGHT])
    expect(result.finished).toBe(true)
  })
})

// Helper
function makePiece(routeId: string, routeIndex: number): PieceState {
  const route = ROUTES[routeId]
  return {
    id: 'test-piece',
    team: 'player',
    position: {
      station: route[routeIndex],
      routeId,
      routeIndex,
    },
  }
}
```

### Test Pattern: Throw Probability Distribution
```typescript
// src/lib/yut/__tests__/throw.test.ts
import { describe, it, expect, vi } from 'vitest'
import { generateThrow } from '../throw'

describe('generateThrow - deterministic tests with mocked Math.random', () => {
  it('all sticks flat (4 flat) = yut, 4 steps, grants extra', () => {
    const spy = vi.spyOn(Math, 'random')
    // All 4 calls return < 0.5 = flat
    spy.mockReturnValueOnce(0.1)
       .mockReturnValueOnce(0.2)
       .mockReturnValueOnce(0.3)
       .mockReturnValueOnce(0.4)

    const result = generateThrow()
    expect(result.name).toBe('yut')
    expect(result.steps).toBe(4)
    expect(result.grantsExtra).toBe(true)
    spy.mockRestore()
  })

  it('all sticks round (0 flat) = mo, 5 steps, grants extra', () => {
    const spy = vi.spyOn(Math, 'random')
    spy.mockReturnValueOnce(0.6)
       .mockReturnValueOnce(0.7)
       .mockReturnValueOnce(0.8)
       .mockReturnValueOnce(0.9)

    const result = generateThrow()
    expect(result.name).toBe('mo')
    expect(result.steps).toBe(5)
    expect(result.grantsExtra).toBe(true)
    spy.mockRestore()
  })

  it('1 flat = do, 1 step, no extra', () => {
    const spy = vi.spyOn(Math, 'random')
    spy.mockReturnValueOnce(0.1)  // flat
       .mockReturnValueOnce(0.6)  // round
       .mockReturnValueOnce(0.7)  // round
       .mockReturnValueOnce(0.8)  // round

    const result = generateThrow()
    expect(result.name).toBe('do')
    expect(result.steps).toBe(1)
    expect(result.grantsExtra).toBe(false)
    spy.mockRestore()
  })
})

describe('generateThrow - statistical distribution', () => {
  it('over 10000 throws, distribution matches expected probabilities', () => {
    const counts: Record<string, number> = { do: 0, gae: 0, geol: 0, yut: 0, mo: 0 }
    const N = 10000

    for (let i = 0; i < N; i++) {
      const result = generateThrow()
      counts[result.name]++
    }

    // Expected: do=25%, gae=37.5%, geol=25%, yut=6.25%, mo=6.25%
    // Allow 3% tolerance for statistical variation
    expect(counts.do / N).toBeCloseTo(0.25, 1)
    expect(counts.gae / N).toBeCloseTo(0.375, 1)
    expect(counts.geol / N).toBeCloseTo(0.25, 1)
    expect(counts.yut / N).toBeCloseTo(0.0625, 1)
    expect(counts.mo / N).toBeCloseTo(0.0625, 1)
  })
})
```

### Test Pattern: Throw Queue / Chaining
```typescript
// src/lib/yut/__tests__/game.test.ts
import { describe, it, expect } from 'vitest'
import { processThrow, createTurnState } from '../game'

describe('processThrow - queue management', () => {
  it('gae (no extra) decrements throwsRemaining and adds to pending', () => {
    const turn = createTurnState('player')
    const result = { name: 'gae' as const, steps: 2, grantsExtra: false }

    const newTurn = processThrow(turn, result)
    expect(newTurn.throwsRemaining).toBe(0)
    expect(newTurn.pendingMoves).toHaveLength(1)
    expect(newTurn.pendingMoves[0].name).toBe('gae')
  })

  it('yut (extra throw) increments throwsRemaining', () => {
    const turn = createTurnState('player')
    const result = { name: 'yut' as const, steps: 4, grantsExtra: true }

    const newTurn = processThrow(turn, result)
    expect(newTurn.throwsRemaining).toBe(1) // Still needs to throw again
    expect(newTurn.pendingMoves).toHaveLength(1)
  })

  it('yut then mo then gae: 3 pending moves, 0 throws remaining', () => {
    let turn = createTurnState('player')

    turn = processThrow(turn, { name: 'yut', steps: 4, grantsExtra: true })
    expect(turn.throwsRemaining).toBe(1)

    turn = processThrow(turn, { name: 'mo', steps: 5, grantsExtra: true })
    expect(turn.throwsRemaining).toBe(1) // mo gives another

    turn = processThrow(turn, { name: 'gae', steps: 2, grantsExtra: false })
    expect(turn.throwsRemaining).toBe(0) // done throwing
    expect(turn.pendingMoves).toHaveLength(3) // yut, mo, gae queued
  })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Adjacency list graph | Route-based arrays | Common in modern implementations | Simpler path traversal, unambiguous center station |
| Single position ID | (route, index) tuple | Standard in competitive programming solutions | Resolves center station ambiguity |
| Physics-determined throw result | Predetermined RNG + visual animation | Standard in commercial yut apps | Guaranteed correct results, controllable difficulty |

**Deprecated/outdated:**
- Grid-based board representation: Does not model the Yut Nori topology correctly
- Class-based game objects (e.g., `class Board`, `class Piece`): Project convention uses pure functions

## Open Questions

1. **Center station (S22) exit when taking shortcut from S15 corner**
   - What we know: S5 and S10 are confirmed branch points with shortcuts
   - What's unclear: Whether the center itself (S22) should offer a route choice when a piece arrives there from a specific diagonal and could theoretically exit toward S15 instead of continuing to S0. The ARCHITECTURE.md defines a `CENTER_TO_OUTER` route (S22 -> S23 -> S15) but it is unclear when a piece would enter this route vs continuing on its current diagonal.
   - Recommendation: For Phase 1, keep it simple -- a piece on a diagonal continues on that diagonal through center to finish. The `CENTER_TO_OUTER` route may only be relevant for edge cases in Phase 2 (e.g., if a piece needs to exit to the outer ring). Implement the 2 diagonal routes and outer route first, verify with tests, then assess if CENTER routes are needed.

2. **New piece entry mechanics**
   - What we know: A new piece enters from HOME to the board when a throw result is used to "enter" it
   - What's unclear: Does a new piece enter at S0 (참먹이) and then advance `steps` positions? Or does it enter directly at the station `steps` away from S0?
   - Recommendation: Standard rule is that new pieces start from S0 and advance. So `do` puts the piece at S1, `gae` at S2, etc. `mo` (5 steps) puts it at S5, which is a branch point -- player should be offered the shortcut choice. Implement as: set piece at S0 on outer route, then advance `steps`.

3. **Diagonal route finish transition**
   - What we know: Outer route finishes by wrapping past S0. Diagonal routes (S24 and S28) end near S0.
   - What's unclear: Whether S24 and S28 connect directly to "finish" (passing through S0) or whether the piece physically lands on S0 first.
   - Recommendation: Model diagonal routes as finishing when the piece passes beyond the last station in the route array. S24 (end of diag_right) with 1+ remaining step = finished. S28 (end of diag_left) with 1+ remaining step = finished. This parallels the outer route behavior where S19 + excess = finished.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime, build, test | Yes | 24.11.0 | -- |
| npm | Package management | Yes | 11.6.1 | -- |
| TypeScript | Type checking | Yes | 5.7+ (via Next.js) | -- |
| Vitest | Unit testing | Yes | 4.1.2 | -- |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

**Note:** The main project has not been scaffolded yet (no `package.json` or `src/` directory at project root). The planner must include a scaffolding task that creates the Next.js project structure with the same dependencies as the RPS reference project. The RPS project at `260330_rps/` provides exact version references.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` (needs creation -- follows RPS pattern) |
| Quick run command | `npx vitest run src/lib/yut/__tests__/ --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAME-01 | Throw produces correct do/gae/geol/yut/mo results | unit | `npx vitest run src/lib/yut/__tests__/throw.test.ts -x` | Wave 0 |
| GAME-02 | Yut/mo grants extra throw, unlimited chaining | unit | `npx vitest run src/lib/yut/__tests__/game.test.ts -x` | Wave 0 |
| GAME-03 | Throw results queue in FIFO order for sequential consumption | unit | `npx vitest run src/lib/yut/__tests__/game.test.ts -x` | Wave 0 |
| GAME-04 | 29-station board graph with 20 outer + 9 inner | unit | `npx vitest run src/lib/yut/__tests__/board.test.ts -x` | Wave 0 |
| GAME-05 | Branch point choice at corners (S5, S10) | unit | `npx vitest run src/lib/yut/__tests__/movement.test.ts -x` | Wave 0 |
| GAME-06 | Piece advances exact step count along route | unit | `npx vitest run src/lib/yut/__tests__/movement.test.ts -x` | Wave 0 |
| GAME-11 | Win when all 2 pieces pass through finish (exact landing != finish) | unit | `npx vitest run src/lib/yut/__tests__/game.test.ts -x` | Wave 0 |
| GAME-12 | Impossible moves auto-skipped | unit | `npx vitest run src/lib/yut/__tests__/game.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/yut/__tests__/ --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/yut/__tests__/types.test.ts` -- covers constant validation (THROW_STEPS, GRANTS_EXTRA_THROW)
- [ ] `src/lib/yut/__tests__/board.test.ts` -- covers GAME-04 (route definitions, station counts, branch points)
- [ ] `src/lib/yut/__tests__/throw.test.ts` -- covers GAME-01 (throw generation, probability distribution)
- [ ] `src/lib/yut/__tests__/movement.test.ts` -- covers GAME-05, GAME-06 (path traversal, branch detection, finish logic)
- [ ] `src/lib/yut/__tests__/game.test.ts` -- covers GAME-02, GAME-03, GAME-11, GAME-12 (queue, chaining, win condition, skip logic)
- [ ] `vitest.config.ts` -- Vitest configuration (mirror from RPS project)
- [ ] `src/__tests__/setup.ts` -- Test setup with testing-library matchers

## Sources

### Primary (HIGH confidence)
- `260330_rps/src/lib/rps/` -- Proven pure game logic pattern (types, constants, gameRules, aiEngine, session, barrel export)
- `260330_rps/src/lib/rps/__tests__/` -- Test patterns (deterministic tests with mocked Math.random, constant validation, exhaustive case coverage)
- `260330_rps/vitest.config.ts` -- Vitest configuration reference (jsdom, v8 coverage, alias resolution, setup files)
- `.planning/research/ARCHITECTURE.md` -- Board graph data structure, route definitions, branch points, FSM design
- `.planning/research/FEATURES.md` -- Game rules edge cases, board position naming, route decision points
- `.planning/research/PITFALLS.md` -- Board path graph complexity (#4), throw queue explosion (#6), finish line bugs (#11)
- `.planning/codebase/TESTING.md` -- Test framework setup, assertion patterns, mocking conventions
- `.planning/codebase/CONVENTIONS.md` -- Naming patterns, function design, module design

### Secondary (MEDIUM confidence)
- [Yunnori - Wikipedia](https://en.wikipedia.org/wiki/Yunnori) -- Board structure (29 stations), movement rules
- [윷놀이 - 한국민족문화대백과사전](https://encykorea.aks.ac.kr/Article/E0042794) -- Detailed 29-position names, route descriptions
- [BOJ 15778 - Yut Nori](https://www.acmicpc.net/problem/15778) -- Board position naming for programming reference
- [Cornell ECE Yutnori Implementation](https://people.ece.cornell.edu/land/courses/ece4760/FinalProjects/s2011/dl462_ghl27/dl462_ghl27/MainFrame.htm) -- Route-based data structure approach

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- using exact same tools (Vitest, TypeScript) as proven RPS project
- Architecture: HIGH -- route-based graph approach confirmed across multiple sources (ARCHITECTURE.md, competitive programming references, domain research)
- Pitfalls: HIGH -- finish-line semantics, center ambiguity, and branch-point logic confirmed in both domain research and Pitfalls analysis

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable domain -- board game rules don't change)
