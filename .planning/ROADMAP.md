# Roadmap: Yut Nori Game

## Overview

Build a complete Yut Nori (윷놀이) HTML5 game from pure logic outward. Start with the board graph and movement rules (the highest-risk foundation), then layer capture/stacking interactions and AI strategy. Once the logic is solid and unit-tested, build the two independent visual layers in parallel: the 2D SVG board and the 3D physics throwing scene. Wire everything together into playable game screens with WebView integration, then polish with character art and celebration effects.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Board Graph & Movement Logic** - Pure game logic: 29-node board graph, path resolution, throw generation, movement rules, win condition
- [ ] **Phase 2: Capture, Stacking & AI** - Interaction rules (capture, stacking, groups) and easy-difficulty AI with turn orchestration
- [ ] **Phase 3: 2D Board Rendering** - SVG board visualization with piece tokens, path highlights, movement animation, and shortcut choice UI
- [ ] **Phase 4: 3D Yut Throwing** - Three.js + cannon-es physics scene with predetermined results, settle detection, and GPU resource management
- [ ] **Phase 5: Game Screens & Integration** - Full game flow with turn indicators, AI persona, screen orchestration, and WebView bridge
- [ ] **Phase 6: Visual Polish & Delight** - Cute character pieces, victory/defeat celebrations, and visual refinement

## Phase Details

### Phase 1: Board Graph & Movement Logic
**Goal**: A complete, unit-tested game logic library that can simulate piece movement across the full 29-node Yut Nori board with all path variants
**Depends on**: Nothing (first phase)
**Requirements**: GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06, GAME-11, GAME-12
**Success Criteria** (what must be TRUE):
  1. Throwing produces correct do/gae/geol/yut/mo results with proper probability distribution
  2. Yut/mo results chain into additional throws and all results queue in order
  3. A piece placed at any board position moves exactly the correct number of steps along the right path, including shortcut entry at corners
  4. When all 2 pieces of a team pass through the finish point, the game correctly detects victory
  5. Impossible moves (no valid piece to move) are automatically skipped without breaking game flow
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md -- Project scaffold + types + board graph + throw generation
- [x] 01-02-PLAN.md -- Movement resolution engine (TDD)
- [x] 01-03-PLAN.md -- Game state operations: throw queue, win condition, impossible moves (TDD)

### Phase 2: Capture, Stacking & AI
**Goal**: Complete game rules including piece interactions (capture and stacking) and an AI opponent that plays full games at easy difficulty
**Depends on**: Phase 1
**Requirements**: GAME-07, GAME-08, GAME-09, GAME-10, AI-01, AI-02, AI-03, AI-04
**Success Criteria** (what must be TRUE):
  1. Landing on an opponent's piece sends it home and grants an extra turn
  2. Landing on own piece offers a stack choice, and stacked pieces move together as a group
  3. When a stacked group is captured, all pieces in the group return individually to start
  4. AI automatically throws and selects moves, completing full games without human input
  5. Over many games, the player wins approximately 70-80% of the time against AI
**Plans:** 2 plans

Plans:
- [ ] 02-01-PLAN.md -- Capture and stacking mechanics with type extensions (TDD)
- [ ] 02-02-PLAN.md -- AI opponent with heuristic scoring, win rate validation, and barrel export (TDD)

### Phase 3: 2D Board Rendering
**Goal**: Users see the Yut Nori board with pieces, can select pieces to move, see valid destinations highlighted, and watch pieces animate along their path
**Depends on**: Phase 2
**Requirements**: BOARD-01, BOARD-02, BOARD-03, BOARD-04, BOARD-05, BOARD-06
**Success Criteria** (what must be TRUE):
  1. The traditional Yut Nori board layout renders with all 29 positions clearly visible (outer ring + diagonal shortcuts)
  2. Each team's pieces display at their current positions with distinct visual identity, and stacked pieces show a count or overlap indicator
  3. Tapping a piece highlights all valid destination positions for available throw results
  4. At corner positions, the shortcut vs outer path choice is visually distinct and selectable
  5. Moving a piece plays a hop animation that follows the actual board path step by step
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: 3D Yut Throwing
**Goal**: Users tap a throw button and watch four yut sticks tumble through a 3D physics simulation, landing to reveal the predetermined result
**Depends on**: Phase 1
**Requirements**: THROW-01, THROW-02, THROW-03, THROW-04, THROW-05
**Success Criteria** (what must be TRUE):
  1. Pressing the throw button launches a 3D scene where 4 yut sticks fly, bounce, and settle on a surface
  2. The physics animation looks natural -- sticks tumble, bounce off the ground, and come to rest
  3. The final stick orientations match the predetermined RNG result (not physics-determined)
  4. After sticks settle, the result (do/gae/geol/yut/mo) displays prominently on screen
  5. The 3D scene cleans up GPU resources after each throw (no memory leaks across repeated throws)
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Game Screens & Integration
**Goal**: A complete playable game flow from start to finish -- player and AI take turns, the game tracks whose turn it is, and victory triggers coupon delivery to the native app
**Depends on**: Phase 2, Phase 3, Phase 4
**Requirements**: VIS-02, VIS-03, VIS-04, INTG-01, INTG-02, INTG-03
**Success Criteria** (what must be TRUE):
  1. The current turn (player or AI) is always clearly indicated on screen
  2. During AI turns, a thinking state displays before the AI acts, and the AI shows contextual emoji reactions
  3. The game runs as a complete loop: throw -> select piece -> move -> switch turn, repeating until victory
  4. On victory, the game sends a coupon delivery message to the native app via postMessage bridge
  5. The game loads and functions correctly when embedded as an iframe in a WebView container
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

### Phase 6: Visual Polish & Delight
**Goal**: The game feels delightful and polished -- cute character pieces replace placeholder tokens, victories celebrate with confetti, and defeats offer warm encouragement
**Depends on**: Phase 5
**Requirements**: VIS-01, VIS-05, VIS-06
**Success Criteria** (what must be TRUE):
  1. Pieces on the board are cute, casual character illustrations instead of plain geometric tokens
  2. Winning triggers a confetti explosion and congratulatory celebration animation
  3. Losing shows an encouraging message with a clear restart option
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6
Note: Phase 3 and Phase 4 can run in parallel (different dependency chains).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Board Graph & Movement Logic | 3/3 | Complete | 2026-03-31 |
| 2. Capture, Stacking & AI | 0/2 | Planning complete | - |
| 3. 2D Board Rendering | 0/3 | Not started | - |
| 4. 3D Yut Throwing | 0/3 | Not started | - |
| 5. Game Screens & Integration | 0/3 | Not started | - |
| 6. Visual Polish & Delight | 0/2 | Not started | - |
