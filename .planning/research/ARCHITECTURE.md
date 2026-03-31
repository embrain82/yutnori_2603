# Architecture Patterns

**Domain:** HTML5 Turn-Based Board Game (Yut Nori) with Mixed 2D/3D Rendering
**Researched:** 2026-03-31

## Recommended Architecture

The system follows a **layered architecture with a pure game logic core**, matching the proven pattern from the existing RPS game but extended for board game complexity and mixed 2D/3D rendering.

```
+------------------------------------------------------------------+
|                        Next.js App Shell                         |
|  (app/page.tsx - dynamic import, SSR disabled, WebView bridge)   |
+------------------------------------------------------------------+
         |                                        |
+------------------+                    +-------------------+
|   2D Board View  |                    | 3D Throwing Scene |
|  (React/HTML/CSS)|                    | (R3F + Cannon.js) |
|  - Board SVG/CSS |                    | - Yut sticks mesh |
|  - Piece tokens  |                    | - Physics world   |
|  - Path highlights|                   | - Settle detect   |
|  - Animations    |                    | - Result readout  |
+------------------+                    +-------------------+
         |                                        |
+------------------------------------------------------------------+
|                    Zustand FSM Store                              |
|  (Single source of truth: phase, turn, board, pieces, throws)    |
+------------------------------------------------------------------+
         |
+------------------------------------------------------------------+
|                    Pure Game Logic Layer                          |
|  lib/yut/board.ts    - Board graph, path resolution              |
|  lib/yut/rules.ts    - Move validation, capture, stacking        |
|  lib/yut/throw.ts    - Result probabilities, AI throw bias       |
|  lib/yut/ai.ts       - AI decision making (piece selection)      |
|  lib/yut/types.ts    - All game types, enums, interfaces         |
+------------------------------------------------------------------+
```

### Key Architectural Principle: The Board is a Graph, Not a Grid

The Yut Nori board is fundamentally a directed graph with 29 nodes and conditional branching. This is NOT a grid-based board game. The graph structure drives everything -- rendering positions are derived from graph node coordinates, movement is path traversal, and shortcuts are alternate edges.

## Component Boundaries

| Component | Responsibility | Communicates With | Layer |
|-----------|---------------|-------------------|-------|
| `app/page.tsx` | Entry point, dynamic import, viewport config | Game component | App Shell |
| `Game.tsx` | Orchestrates screens, phase-driven rendering, timers | Store, all screens | Orchestrator |
| `BoardView` | Renders 2D board (SVG/CSS), piece positions, path highlights | Store (read), animation lib | 2D View |
| `PieceToken` | Individual game piece with position, team color, stack indicator | BoardView (parent), Store (read) | 2D View |
| `ThrowScene` | R3F Canvas with yut stick physics simulation | Store (write throw result), ThrowManager | 3D View |
| `ThrowManager` | Controls throw initiation, settle detection, result readout | ThrowScene (internal), Store | 3D View |
| `YutStick` (x4) | Individual yut stick mesh + physics body | ThrowManager (parent), Physics world | 3D View |
| `gameStore.ts` | Zustand FSM: all game state, phase transitions, action handlers | Game logic layer, all UI components | State |
| `lib/yut/board.ts` | Board graph definition, path resolution, adjacency | rules.ts, ai.ts | Logic |
| `lib/yut/rules.ts` | Move validation, capture detection, stacking, win check | board.ts, types.ts | Logic |
| `lib/yut/throw.ts` | Throw result generation, probability tables | types.ts | Logic |
| `lib/yut/ai.ts` | AI piece selection strategy (easy mode, player-favoring) | board.ts, rules.ts | Logic |
| `usePostMessage` | WebView/iframe bridge for coupon delivery | Store (read phase), parent window | Hook |

## Data Flow

### 1. Game Initialization Flow

```
User lands on page
  -> app/page.tsx dynamically imports Game (no SSR)
  -> Game mounts, registers usePostMessage hook
  -> Renders IdleScreen (start button)
  -> User taps "Start" -> store.start()
  -> store.start() initializes board state, places pieces at HOME, sets phase='throwing'
```

### 2. Yut Throwing Flow (The 3D Part)

```
Phase: 'throwing'
  -> ThrowScene mounts (R3F Canvas appears as overlay/modal)
  -> User taps/swipes to trigger throw
  -> ThrowManager applies impulse to 4 YutStick physics bodies
  -> Physics simulation runs in useFrame loop
  -> Each stick: copy cannon body position/quaternion to Three.js mesh
  -> Settle detection: cannon-es sleep events on all 4 sticks
  -> When all 4 settled: read each stick's final orientation
  -> Determine face-up/face-down for each stick
  -> Calculate result: Do(1)/Gae(2)/Geol(3)/Yut(4)/Mo(5)
  -> store.setThrowResult(result)
  -> If Yut or Mo: store phase='throwing' again (extra throw, queue result)
  -> Else: store phase='selectingPiece'
  -> ThrowScene unmounts (or hides)
```

### 3. Piece Selection Flow (Player Turn)

```
Phase: 'selectingPiece'
  -> BoardView highlights movable pieces for current player
  -> For each piece: lib/yut/rules.ts calculates valid destinations
  -> Player taps a piece -> store.selectPiece(pieceId)
  -> If piece has shortcut choice (at branching node): phase='selectingPath'
  -> Else: phase='moving'
```

### 4. Path Selection Flow (Shortcut Branching)

```
Phase: 'selectingPath'
  -> BoardView highlights two possible destinations (outer vs diagonal)
  -> Player taps destination -> store.selectPath(destination)
  -> phase='moving'
```

### 5. Movement & Resolution Flow

```
Phase: 'moving'
  -> BoardView animates piece along path nodes (step by step)
  -> On arrival at destination:
     -> lib/yut/rules.ts checks destination occupancy
     -> Own piece there? -> Offer stacking choice (or auto-stack if v1 simplification)
     -> Opponent piece there? -> CAPTURE: opponent piece returns to HOME
        -> store grants extra turn (phase='throwing' for same player)
     -> Piece reaches FINISH? -> Mark piece as scored
     -> All pieces scored? -> VICTORY
  -> If no capture and no queued throws:
     -> Switch active player
     -> phase='throwing' (opponent's turn)
```

### 6. AI Turn Flow

```
Active player is AI:
  Phase: 'throwing'
    -> Auto-throw with short delay (simulated 3D animation or abbreviated)
    -> lib/yut/throw.ts generates result (biased toward player-favorable outcomes)
  Phase: 'selectingPiece'
    -> lib/yut/ai.ts evaluates all legal moves
    -> Selects piece (easy AI: semi-random, avoids optimal play)
    -> Auto-selects path if at branching node
  Phase: 'moving'
    -> Same animation flow, but automated
```

### 7. Victory/Gameover Flow

```
All pieces of a team finish:
  -> phase='victory' or phase='gameover'
  -> ResultScreen renders with celebration/defeat animation
  -> usePostMessage sends YUT_GAME_WIN to parent (if victory)
  -> User taps "Retry" -> store.retry() -> phase='idle'
```

## Board Graph Data Structure

This is the most critical data structure in the entire application.

### Node Layout (29 stations)

The Yut board has a plus/cross shape with an outer rectangular loop and two diagonal shortcuts through the center.

```
Numbering convention (0-indexed):

          0 (START/FINISH)
         / \
       19    1
       |      |
       18     2
       |      |
       17     3
       |      |
       16     4
       |      |
  15---14---13---12---11---10
               |   \   / |
               |   22  21 |
               |     \/   |
               |     23   |
               |     /\   |
               |   24  25 |
               | /    \   |
        5----6----7----8----9---10
               |
               ...

Actually, the standard layout is:
```

### Canonical Yut Board Graph

```typescript
// lib/yut/types.ts

/** 29 stations on the board + HOME + FINISH */
export enum Station {
  // Outer ring (counterclockwise from start): 0-19
  S0 = 0,   // START corner (bottom-right) -- also the finish line
  S1 = 1,   // right edge, going up
  S2 = 2,
  S3 = 3,
  S4 = 4,
  S5 = 5,   // TOP-RIGHT corner (branching point -> diagonal shortcut)
  S6 = 6,   // top edge, going left
  S7 = 7,
  S8 = 8,
  S9 = 9,
  S10 = 10, // TOP-LEFT corner (branching point -> diagonal shortcut)
  S11 = 11, // left edge, going down
  S12 = 12,
  S13 = 13,
  S14 = 14,
  S15 = 15, // BOTTOM-LEFT corner (branching point -> to center)
  S16 = 16, // bottom edge, going right
  S17 = 17,
  S18 = 18,
  S19 = 19, // last station before finish

  // Diagonal shortcuts
  S20 = 20, // from S5 toward center
  S21 = 21, // between S5-corner and center
  S22 = 22, // CENTER (shared by both diagonals)
  S23 = 23, // between center and S15-corner
  S24 = 24, // from center toward S0 (finish shortcut)

  S25 = 25, // from S10 toward center
  S26 = 26, // between S10-corner and center
  // S22 is shared center
  S27 = 27, // between center and S0-side
  S28 = 28, // approaching S0 from center-right diagonal

  HOME = -1,   // not yet on board
  FINISH = -2, // completed the circuit
}
```

### Route-Based Path Resolution

Rather than a raw adjacency list, model paths as **predefined routes** that pieces follow. A piece's position is defined by (routeIndex, positionInRoute).

```typescript
// lib/yut/board.ts

/**
 * Routes define the ordered sequence of stations a piece traverses.
 * A piece follows one route at a time. At branching stations,
 * the route changes.
 */
export const ROUTES = {
  /** Default outer ring: S0 -> S1 -> ... -> S19 -> FINISH */
  OUTER: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],

  /** Right diagonal: S5 -> S20 -> S21 -> S22 -> S23 -> S24 -> S0/FINISH */
  DIAG_RIGHT: [5, 20, 21, 22, 23, 24],

  /** Left diagonal: S10 -> S25 -> S26 -> S22 -> S27 -> S28 -> S0/FINISH */
  DIAG_LEFT: [10, 25, 26, 22, 27, 28],

  /** Center to bottom-left: S22 -> S23 -> S15 (from center, exit to outer) */
  CENTER_TO_OUTER: [22, 23, 15],
} as const;

/** Branching points where player chooses between routes */
export const BRANCH_POINTS: Record<number, { outer: number; shortcut: number }> = {
  5:  { outer: 6,  shortcut: 20 }, // S5: continue outer or take right diagonal
  10: { outer: 11, shortcut: 25 }, // S10: continue outer or take left diagonal
};

/**
 * Given a piece's current position and throw result,
 * return all valid destination stations.
 * Handles route-following, branching, and finish detection.
 */
export function getValidMoves(
  piece: PieceState,
  throwResult: ThrowResult,
  board: BoardState
): MoveOption[];
```

### Board State Shape

```typescript
// In Zustand store

interface PieceState {
  id: string;           // 'p1-a', 'p1-b', 'p2-a', 'p2-b'
  team: 'player' | 'ai';
  station: number;      // current station (-1 = HOME, -2 = FINISH)
  route: number[];      // current route array being followed
  routeIdx: number;     // index within current route
  isStacked: boolean;   // stacked with another own piece
  stackedWith?: string; // id of stacked partner
}

interface BoardState {
  pieces: PieceState[];
  occupancy: Map<number, string[]>; // station -> piece IDs at that station
}
```

## Zustand FSM Design

### Phase State Machine

```
                    +-------+
                    | idle  |
                    +---+---+
                        |  start()
                        v
                +--------+--------+
         +----->| throwing        |<--------+
         |      | (active player) |         |
         |      +--------+--------+         |
         |               |  setThrowResult  |
         |               v                  |
         |  yut/mo: +----+----+             |
         |  queue & |  extra   |             |
         |  repeat  | throwing |             |
         |          +----+-----+             |
         |               | all throws done  |
         |               v                  |
         |      +--------+--------+         |
         |      | selectingPiece  |         |  capture:
         |      | (show options)  |         |  extra turn
         |      +--------+--------+         |
         |               |  selectPiece     |
         |               v                  |
         |      +--------+--------+         |
         |      | selectingPath   |         |
         |      | (if at branch)  |         |
         |      +--------+--------+         |
         |               |  selectPath      |
         |               v                  |
         |      +--------+--------+         |
         |      |    moving       +---------+
  switch |      | (animate piece) |  (capture -> extra turn)
  turn   |      +--------+--------+
         |               |  moveComplete
         |               v
         |      +--------+--------+
         +------+ resolveTurn     |
                | (check win,     |
                |  switch player) |
                +--------+--------+
                         |  win detected
                         v
                +--------+--------+
                | victory/gameover|
                +--------+--------+
                         |  retry()
                         v
                      +--+--+
                      | idle |
                      +-----+
```

### Store Shape

```typescript
// store/gameStore.ts

type Phase =
  | 'idle'
  | 'throwing'
  | 'selectingPiece'
  | 'selectingPath'
  | 'moving'
  | 'victory'
  | 'gameover';

interface GameState {
  // FSM
  phase: Phase;
  activeTeam: 'player' | 'ai';

  // Throw state
  throwQueue: ThrowResult[];    // queued results from Yut/Mo extra throws
  currentThrow: ThrowResult | null;

  // Board state
  pieces: PieceState[];
  selectedPiece: string | null;
  selectedPath: number[] | null;
  moveAnimation: { from: number; to: number; path: number[] } | null;

  // Session tracking
  session: SessionPayload | null;
  couponConfig: CouponConfig | null;

  // Actions
  start: () => void;
  setThrowResult: (result: ThrowResult) => void;
  selectPiece: (pieceId: string) => void;
  selectPath: (destination: number) => void;
  completeMove: () => void;
  retry: () => void;
  setCouponConfig: (config: CouponConfig) => void;
}
```

### Why Zustand Over XState

The existing RPS codebase uses Zustand FSM successfully. For Yut Nori, Zustand remains the right choice because:

1. **Simpler mental model**: Phase is just a string enum; transitions are guarded in action handlers with `if (phase !== 'expected') return` checks.
2. **No learning curve**: Team already knows the pattern from RPS.
3. **Selective subscriptions**: `useGameStore(s => s.phase)` prevents unnecessary re-renders, critical when 3D scene is mounted.
4. **XState overhead unnecessary**: The game FSM has ~7 states. XState's visual tooling and parallel states are overkill for this complexity.

## Mixed 2D/3D Rendering Strategy

### Approach: Separate Layers, Not Embedded

The board is 2D (HTML/CSS/SVG). The yut throwing is 3D (R3F Canvas). These should NOT be composited into a single Three.js scene.

**Why separate layers:**
- Board rendering is trivially done in HTML/CSS -- no need for WebGL overhead
- 3D scene only needed during throw phase (~3-5 seconds per turn)
- Mobile WebView performance: one WebGL context is expensive; minimize active time
- Touch interaction on the board (tap pieces) is far simpler with DOM events than raycasting

### Implementation Pattern

```
+-------------------------------------------+
|           Game Container (relative)        |
|                                            |
|  +---------------------------------------+ |
|  |        2D Board Layer                 | |
|  |  (always mounted, SVG/CSS positioned) | |
|  |  - Board background SVG               | |
|  |  - Piece tokens (absolute positioned)  | |
|  |  - Path highlight overlays            | |
|  +---------------------------------------+ |
|                                            |
|  +---------------------------------------+ |
|  |    3D Throw Overlay (conditional)     | |
|  |  (mounted only during 'throwing')     | |
|  |  - R3F <Canvas> with transparent bg   | |
|  |  - 4 YutStick physics bodies          | |
|  |  - Floor plane (invisible)            | |
|  |  - Camera looking down                | |
|  +---------------------------------------+ |
|                                            |
|  +---------------------------------------+ |
|  |        UI Overlay (HUD)               | |
|  |  - Turn indicator                     | |
|  |  - Throw result display               | |
|  |  - Action buttons                     | |
|  +---------------------------------------+ |
+-------------------------------------------+
```

### Mounting Strategy for 3D Scene

**Mount/unmount the Canvas, not visibility toggle.** Contrary to the general R3F advice of toggling visibility, for this use case unmounting is better because:

1. The 3D scene is used for ~3-5 seconds per turn, idle for 10-30 seconds.
2. WebGL context on mobile WebView is resource-intensive.
3. The scene has minimal geometry (4 sticks + floor plane) -- recompilation cost is negligible.
4. Memory pressure matters more than compilation time in mobile WebView.

```tsx
// In Game.tsx or ThrowingScreen
{phase === 'throwing' && (
  <div className="absolute inset-0 z-10">
    <Canvas
      camera={{ position: [0, 8, 0], fov: 45, near: 0.1, far: 50 }}
      gl={{ alpha: true }}  // transparent background
    >
      <Physics gravity={[0, -50, 0]}>
        <ThrowScene onResult={handleThrowResult} />
      </Physics>
    </Canvas>
  </div>
)}
```

### Board Rendering: SVG Over Canvas

Use SVG for the board because:

1. **Declarative with React**: SVG elements are DOM nodes, composable as React components.
2. **CSS animations**: Piece movement can use CSS transitions or Motion library.
3. **Touch events**: Native DOM event handlers on each piece/station node.
4. **Resolution independence**: Looks crisp on all mobile DPIs.
5. **Accessibility**: SVG nodes can have aria labels.

Canvas would only be better for 100+ animated entities. Yut Nori has ~33 nodes and 4 pieces.

## Patterns to Follow

### Pattern 1: Pure Logic Core

**What:** All game rules, board graph traversal, move validation, and AI decisions are pure TypeScript functions with zero DOM/React/Three.js dependencies.

**When:** Every function in `lib/yut/`.

**Why:** Testable in isolation with unit tests. No mocking needed. Can be reused if board game is ported to different rendering stack.

```typescript
// lib/yut/rules.ts -- pure function, no side effects
export function resolveMove(
  piece: PieceState,
  steps: number,
  allPieces: PieceState[]
): MoveResolution {
  const destination = advanceAlongRoute(piece, steps);
  const occupants = allPieces.filter(p => p.station === destination.station);
  const enemyOccupants = occupants.filter(p => p.team !== piece.team);
  const friendlyOccupants = occupants.filter(p => p.team === piece.team && p.id !== piece.id);

  return {
    destination,
    captures: enemyOccupants.map(p => p.id),
    canStack: friendlyOccupants.length > 0,
    isFinish: destination.station === Station.FINISH,
    grantsExtraTurn: enemyOccupants.length > 0,
  };
}
```

### Pattern 2: Zustand Actions as FSM Guards

**What:** Each store action checks the current phase before executing. Invalid transitions are silently ignored.

**When:** Every action in `gameStore.ts`.

```typescript
// store/gameStore.ts
selectPiece: (pieceId: string) => {
  const { phase, activeTeam } = get();
  if (phase !== 'selectingPiece') return; // guard
  if (activeTeam !== 'player') return;    // guard

  const piece = get().pieces.find(p => p.id === pieceId);
  if (!piece || piece.team !== 'player') return; // guard

  // ... execute selection logic
}
```

### Pattern 3: Throw Result via Callback, Not Store Subscription

**What:** The 3D scene communicates throw results to the store via a callback prop, not by writing to the store directly from within R3F.

**When:** ThrowScene -> Game -> Store communication.

**Why:** Keeps the R3F component tree decoupled from Zustand. The 3D scene doesn't need to know about game phases.

```tsx
// ThrowScene receives onResult callback
<ThrowScene onResult={(result: ThrowResult) => {
  store.getState().setThrowResult(result);
}} />
```

### Pattern 4: Animation-Driven Phase Transitions

**What:** Movement animation completes before triggering the next phase transition. Use `onAnimationComplete` callbacks, not timers.

**When:** Piece movement on the board, throw animation settling.

```tsx
// BoardView piece movement
<motion.div
  animate={{ x: targetX, y: targetY }}
  transition={{ duration: 0.4, ease: 'easeInOut' }}
  onAnimationComplete={() => store.getState().completeMove()}
/>
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Putting Board State in 3D Scene

**What:** Storing piece positions or game state inside Three.js objects or R3F component state.

**Why bad:** Creates two sources of truth. 3D scene state is lost on unmount. Debugging becomes impossible.

**Instead:** Zustand store is the single source of truth. 3D scene reads from store, writes results via callbacks.

### Anti-Pattern 2: Grid-Based Board Representation

**What:** Modeling the Yut board as a 2D grid or matrix.

**Why bad:** The Yut board is a graph with branching paths. A grid wastes memory, complicates path traversal, and doesn't naturally express shortcuts.

**Instead:** Model as a directed graph with route arrays. Position in the graph is (route, index).

### Anti-Pattern 3: Global requestAnimationFrame Loop

**What:** Running a manual game loop with requestAnimationFrame alongside React rendering.

**Why bad:** R3F already manages its own animation loop via `useFrame`. A separate rAF loop will fight React's scheduler and cause timing bugs.

**Instead:** Use `useFrame` inside R3F for physics. Use CSS transitions/Motion for 2D animations. Use `setTimeout` for turn delays (as in RPS pattern).

### Anti-Pattern 4: Physics Running When Not Throwing

**What:** Keeping the cannon-es physics world active between throws.

**Why bad:** Wastes CPU cycles. Physics should only run during the ~3-5 second throw animation.

**Instead:** Mount/unmount the `<Physics>` provider with the throw scene. Or pause the physics world via cannon-es `world.step` control.

## Scalability Considerations

| Concern | Current (v1) | Future (v2+) |
|---------|-------------|--------------|
| Players | 1 human + 1 AI | Multiplayer via WebSocket |
| Pieces per team | 2 | 4 (standard rules) |
| Board complexity | Standard 29 nodes | Same graph, more pieces |
| 3D quality | Basic stick meshes | Textured models, particle effects |
| AI difficulty | Easy (biased) | Multiple levels, minimax |
| Sound | None | SFX for throws, captures, victory |

**Key scaling consideration:** The pure logic layer (`lib/yut/`) should work identically regardless of piece count or player count. The store shape uses arrays/maps, not hardcoded piece slots. Moving from 2 to 4 pieces requires zero logic layer changes if designed correctly.

## Build Order (Dependencies)

The component dependencies determine build order:

```
Phase 1: Foundation (no visual output yet)
  lib/yut/types.ts       -- types and enums (dependency of everything)
  lib/yut/board.ts        -- board graph, route definitions, path resolution
  lib/yut/rules.ts        -- move validation, capture, stacking, win detection
  lib/yut/throw.ts        -- throw result generation, probability tables
  lib/yut/ai.ts           -- AI decision engine
  [Unit tests for all of the above]

Phase 2: State Management
  store/gameStore.ts       -- Zustand FSM (depends on lib/yut/*)
  [Integration tests: phase transitions, full game simulation]

Phase 3: 2D Board Rendering
  components/board/BoardView.tsx     -- board SVG background + station nodes
  components/board/PieceToken.tsx    -- piece visualization
  components/board/PathHighlight.tsx -- valid move indicators
  [Visual verification: board renders, pieces move on click]

Phase 4: 3D Throw Scene
  components/throw/ThrowScene.tsx     -- R3F Canvas wrapper
  components/throw/YutStick.tsx       -- single stick mesh + physics body
  components/throw/ThrowManager.tsx   -- throw initiation + settle detection
  [Visual verification: sticks fall, results detected]

Phase 5: Screen Integration
  components/screens/IdleScreen.tsx
  components/screens/PlayScreen.tsx    -- composes BoardView + throw trigger
  components/screens/ResultScreen.tsx
  components/Game.tsx                  -- phase-driven screen rendering
  hooks/usePostMessage.ts              -- WebView bridge (reuse from RPS)

Phase 6: Polish
  AI turn automation + delays
  Animations (piece movement, capture effects, victory celebration)
  Mobile optimization (touch targets, safe areas, WebView testing)
```

**Critical path:** Phase 1 (logic) and Phase 3 (board rendering) can partially overlap since board rendering only needs the graph node positions from `board.ts`. Phase 4 (3D) is independent and can be developed in parallel with Phase 3. Phase 2 (store) must complete before Phase 5 (integration).

## Sources

- [React Three Fiber documentation](https://r3f.docs.pmnd.rs/getting-started/introduction) - HIGH confidence
- [R3F performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls) - HIGH confidence
- [@react-three/cannon](https://github.com/pmndrs/use-cannon) - HIGH confidence
- [Crafting a Dice Roller with Three.js and Cannon-es (Codrops)](https://tympanus.net/codrops/2023/01/25/crafting-a-dice-roller-with-three-js-and-cannon-es/) - MEDIUM confidence (dice pattern applicable to yut sticks)
- [Yunnori - Wikipedia](https://en.wikipedia.org/wiki/Yunnori) - HIGH confidence (board structure)
- [Cornell ECE Yutnori Implementation](https://people.ece.cornell.edu/land/courses/ece4760/FinalProjects/s2011/dl462_ghl27/dl462_ghl27/MainFrame.htm) - MEDIUM confidence (route-based data structure)
- [Game Programming Patterns: State](https://gameprogrammingpatterns.com/state.html) - HIGH confidence (FSM pattern)
- [FSM for Turn-Based Games (GameDev.net)](https://gamedev.net/blogs/entry/2274204-finite-state-machine-for-turn-based-games/) - MEDIUM confidence
- [drei Html component](https://drei.docs.pmnd.rs/misc/html) - HIGH confidence
- Existing RPS architecture (`.planning/codebase/ARCHITECTURE.md`) - HIGH confidence (proven patterns)

---

*Architecture research: 2026-03-31*
