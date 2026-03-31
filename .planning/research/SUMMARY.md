# Project Research Summary

**Project:** Yut Nori (HTML5 Board Game with 3D Physics)
**Domain:** Turn-based board game with mixed 2D/3D rendering, embedded in mobile WebView for event promotion
**Researched:** 2026-03-31
**Confidence:** HIGH

## Executive Summary

Yut Nori is a traditional Korean board game being built as a single-player promotional mini-game (player vs easy AI) with coupon reward delivery via mobile WebView. The project extends an existing Next.js/React/Zustand stack (validated in a prior RPS game) with a 3D physics layer for yut stick throwing. Experts build this type of game as a hybrid: a 2D board rendered in HTML/SVG for the strategic layer, with a lightweight 3D physics overlay (Three.js + cannon-es via React Three Fiber) mounted only during the throwing phase. The board itself is a directed graph with 29 nodes and conditional branching at corners -- this graph model, not a grid, is the foundational data structure that everything else depends on.

The recommended approach is to build the pure game logic layer first (board graph, movement rules, capture/stacking, AI) with exhaustive unit tests, then layer state management (Zustand FSM with throw queue), then build the 2D board and 3D throwing scene in parallel, and finally integrate everything with polish and WebView bridge. The stack is well-established: Next.js 16 + React 19 + R3F v9 + cannon-es, with cannon-es chosen over Rapier for its 30x smaller bundle size (40KB vs 1.5MB WASM) -- the right call for a mobile WebView game with only 5 physics bodies.

The key risks are: (1) the board path graph is the #1 source of bugs in Yut Nori implementations due to shortcut branching complexity -- this must be modeled as a directed graph and tested exhaustively before any UI work; (2) WebGL memory leaks from undisposed Three.js resources will crash iOS WKWebView after repeated throws -- a ResourceTracker must be built from day one; (3) physics results must be predetermined before animation to ensure game logic consistency and AI difficulty calibration. All three risks have well-documented prevention strategies.

## Key Findings

### Recommended Stack

The stack inherits the validated Next.js 16 / React 19 / Zustand 5 / Tailwind v4 / Motion 12 foundation from the RPS project and adds a 3D physics layer. The new dependencies total approximately 175KB gzipped (three.js 155KB + cannon-es 15KB + R3F 5KB), fitting well within mobile WebView budgets.

**Core technologies:**
- **Next.js 16 + React 19**: Validated app framework; App Router with 'use client' for all 3D components, dynamic import with `ssr: false` for the Canvas
- **Three.js via @react-three/fiber v9**: Declarative 3D scene management integrated with React lifecycle and Zustand; confirmed React 19 compatible
- **cannon-es via @react-three/cannon**: Lightweight JS physics engine (40-50KB) with Web Worker offloading; proven for dice/stick simulations; 30x lighter than Rapier's WASM
- **Zustand 5**: FSM state management with selective subscriptions to prevent re-renders during physics; proven pattern from RPS
- **SVG for 2D board**: DOM-native, CSS-animatable, resolution-independent, trivial touch event handling vs raycasting

**Critical version requirements:** R3F v9 requires React 19 and Three.js 0.156+. @react-three/cannon 6.6.0 requires cannon-es 0.20.x as peer dependency.

### Expected Features

**Must have (table stakes):**
- 3D yut throwing with physics simulation and result detection (do/gae/geol/yut/mo)
- Board path graph with 29 positions, 4 routes, shortcut branching at corners
- Piece movement with correct multi-route path logic
- Extra throw chaining on yut/mo results (unlimited, queue-based)
- Capture (send opponent home + extra turn) and stacking (merge own pieces)
- Turn-based flow: player throws, selects piece, piece moves, AI turn
- Win condition: all 2 pieces pass through finish point
- WebView coupon delivery via postMessage on victory

**Should have (differentiators):**
- Cute/casual character pieces instead of plain tokens
- Path preview highlighting destinations on piece selection
- Throw gesture interaction (swipe/flick mapping to physics impulse)
- Victory celebration sequence (confetti, character animation)
- Brief tutorial/onboarding (2-3 screens, skippable, under 15 seconds)
- AI personality reactions (expression changes on key events)

**Defer (v2+):**
- Sound/BGM (WebView audio is inconsistent across devices)
- Difficulty modes, multiplayer, 4-piece mode, baekdo rule
- Rankings/leaderboards, account system, replay/undo

### Architecture Approach

The architecture is a layered system with a pure game logic core: all rules, board traversal, move validation, and AI are pure TypeScript functions with zero DOM/React/Three.js dependencies, making them trivially unit-testable. The rendering is split into two independent layers -- a 2D SVG board (always mounted) and a 3D R3F Canvas (mounted only during throwing phase, ~3-5 seconds per turn). Zustand FSM is the single source of truth with approximately 7 phases. The 3D scene communicates results via callback props, not direct store access, keeping it decoupled.

**Major components:**
1. **Pure Game Logic** (`lib/yut/`) -- Board graph, path resolution, move validation, capture/stacking rules, throw generation, AI strategy. Zero external dependencies.
2. **Zustand FSM Store** (`store/gameStore.ts`) -- Phase state machine (idle -> throwing -> selectingPiece -> selectingPath -> moving -> victory/gameover), throw queue, board state, action handlers with phase guards.
3. **2D Board View** (React/SVG) -- Board rendering, piece tokens with stack indicators, path highlights, movement animation via CSS/Motion.
4. **3D Throw Scene** (R3F + cannon-es) -- Canvas overlay with 4 yut stick meshes + physics bodies, ground plane, settle detection, result readout. Mount/unmount strategy (not visibility toggle) for mobile memory.
5. **Screen Orchestrator** (`Game.tsx`) -- Phase-driven rendering, composes all screens, manages dynamic imports for 3D scene.

### Critical Pitfalls

1. **WebGL memory leaks from undisposed Three.js resources** -- Every texture/geometry/material must be explicitly `dispose()`d after each throw. Build a ResourceTracker pattern before any 3D code. Monitor `renderer.info.memory` in development. iOS WKWebView will crash after 10+ throws without this.

2. **Board path graph modeled incorrectly** -- The 29-station board with shortcut branching is the #1 bug source. Model as directed graph with route arrays, track each piece's current route (not just position), and write exhaustive unit tests for every branch point with every throw result. Must be the FIRST logic implemented.

3. **Physics result vs visual result desynchronization** -- Predetermine the throw result via RNG (with AI difficulty weighting) BEFORE starting physics animation. Use rotation adjustment or hybrid damping in the last 500ms to guide sticks to the target orientation. Never let physics determine the game result.

4. **WebGL context loss on mobile without recovery** -- Listen for `webglcontextlost`/`webglcontextrestored` events, call `preventDefault()`, and design all 3D resources to be recreatable from scratch. Test by backgrounding the app for 60+ seconds.

5. **Throw queue state explosion from yut/mo chaining** -- Model the turn as a `pendingResults: ThrowResult[]` queue. Only transition to move phase when all throws are done. Handle captures during move phase adding new throws to the queue.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Pure Game Logic + Types
**Rationale:** The board graph is the foundational data structure everything depends on. It is the highest-risk, highest-complexity feature. Building and thoroughly testing it first eliminates the #1 bug source (Pitfall 4) and provides the foundation for all subsequent phases.
**Delivers:** Complete, unit-tested game logic library -- board graph with all 5 routes, movement/capture/stacking rules, throw generation with probability tables, AI heuristic engine, win condition detection.
**Addresses:** Board path logic, piece movement rules, shortcut paths, extra throw queuing, stacking/capture, finish line logic, AI strategy (from FEATURES.md table stakes)
**Avoids:** Pitfall 4 (incorrect board graph), Pitfall 6 (throw queue explosion), Pitfall 7 (stacking bugs), Pitfall 11 (finish line bugs)

### Phase 2: State Management (Zustand FSM)
**Rationale:** The store depends on the pure logic layer and must be complete before any UI can function. The FSM design must handle yut/mo chaining and capture extra turns from the start.
**Delivers:** Complete Zustand store with phase state machine, throw queue management, board state tracking, all action handlers with phase guards, integration tests simulating full games.
**Addresses:** Turn-based flow, extra throw on yut/mo, piece selection state (from FEATURES.md)
**Avoids:** Pitfall 6 (state explosion from throw chaining)

### Phase 3: 2D Board Rendering
**Rationale:** The board is the primary visual surface and can be built once the graph node positions are defined (from Phase 1). Independent of the 3D scene. SVG rendering is low-risk with well-known patterns.
**Delivers:** SVG board with 29 station nodes, piece tokens with team colors and stack indicators, path highlights for valid moves, piece movement animation (hop-along-path), shortcut path choice UI at corners.
**Addresses:** Board rendering, piece position indicators, piece selection UI, move animation, path preview (from FEATURES.md)
**Avoids:** Pitfall 13 (viewport sizing) via dvh/svh and resize handling

### Phase 4: 3D Yut Throwing Scene
**Rationale:** The 3D throwing scene is the signature differentiator but is independent of board rendering. Can be developed in parallel with Phase 3. Must implement the "predetermine result, then animate" architecture from day one.
**Delivers:** R3F Canvas with 4 yut stick meshes and physics bodies, throw gesture input, settle detection, result readout, predetermined result matching, ResourceTracker for GPU cleanup, context loss recovery, on-demand rendering.
**Addresses:** 3D yut throwing physics, throw result detection, tap/swipe to throw (from FEATURES.md)
**Avoids:** Pitfall 1 (memory leaks), Pitfall 2 (context loss), Pitfall 3 (result desync), Pitfall 5 (battery drain), Pitfall 9 (React/Three.js lifecycle), Pitfall 10 (timestep jitter), Pitfall 14 (wrong cannon package)

### Phase 5: Game Integration + Screens
**Rationale:** With logic, state, board, and throwing all built, this phase wires everything together into the complete game flow. Depends on all previous phases.
**Delivers:** Game orchestrator component, idle/play/result screens, phase-driven rendering, AI turn automation with delays, WebView postMessage bridge (reuse from RPS), dynamic import of 3D scene with loading skeleton.
**Addresses:** Turn-based flow, win/loss screens, WebView coupon delivery, whose-turn indicator (from FEATURES.md)
**Avoids:** Pitfall 8 (postMessage bridge failures) via handshake + timeout + retry

### Phase 6: Polish + Differentiators
**Rationale:** Visual polish and delight features ship after core gameplay is stable. These are the features that elevate the experience from functional to delightful.
**Delivers:** Cute character pieces, capture/stacking celebration animations, AI personality reactions, victory celebration sequence (confetti), camera effects on throw, brief tutorial/onboarding overlay, mobile optimization (touch targets, safe areas).
**Addresses:** All "should have" differentiators from FEATURES.md
**Avoids:** Pitfall 12 (AI feeling broken) via playtesting and tuning suboptimality percentages

### Phase Ordering Rationale

- **Logic-first approach** (Phases 1-2 before 3-4): The board graph and rules are the highest-risk components with the most edge cases. Building and testing them before any visual work ensures correctness is locked in early. Multiple sources confirm path logic is the #1 bug source in Yut Nori implementations.
- **Parallel visual tracks** (Phases 3 and 4 can overlap): The 2D board and 3D throwing scene are architecturally independent -- different rendering technologies, different DOM layers, no shared state beyond the Zustand store. This is the key parallelization opportunity.
- **Integration after components** (Phase 5 after 3+4): Wiring together pre-built, pre-tested components is lower risk than building everything together. The Game orchestrator is thin -- it just switches screens based on FSM phase.
- **Polish last** (Phase 6): Differentiators and visual delight are valuable but depend on stable core gameplay. Shipping a polished broken game is worse than a functional plain game.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Game Logic):** The board graph branching at corners and center has subtle edge cases. Consider researching competitive programming solutions (BOJ 15778) for validation patterns. The finish-line overshoot rule needs careful attention.
- **Phase 4 (3D Throwing):** The "predetermine result, then guide physics" technique has multiple implementation strategies (pre-recorded simulation, rotation adjustment, hybrid damping). Needs prototyping to pick the best approach. Yut stick geometry (flat on one side, rounded on other) is asymmetric, which affects physics modeling.

Phases with standard patterns (skip research-phase):
- **Phase 2 (State Management):** Zustand FSM is a proven pattern from RPS. The throw queue adds complexity but the pattern is straightforward.
- **Phase 3 (2D Board):** SVG rendering with React is well-documented. No novel technical challenges.
- **Phase 5 (Integration):** Composing screens and wiring to the store follows the same pattern as the RPS project. WebView bridge is a direct reuse.
- **Phase 6 (Polish):** Canvas-confetti, Motion animations, and CSS effects are all standard patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified on npm with version compatibility confirmed. R3F v9 + React 19 compatibility explicitly documented. cannon-es vs Rapier tradeoff well-supported by bundle size data. |
| Features | HIGH | Yut Nori rules sourced from Korean encyclopedias, Wikipedia, namu wiki, and competitive programming references. Feature scope aligned with promotional mini-game constraints. |
| Architecture | HIGH | Layered architecture with pure logic core is a proven pattern. Mixed 2D/3D approach well-supported by R3F documentation. FSM pattern validated in prior RPS project. |
| Pitfalls | HIGH | All critical pitfalls sourced from official documentation (Three.js cleanup guide, Apple Developer Forums) or confirmed community patterns. Physics result predetermination pattern validated across Unity, Castle Engine, and multiple game dev resources. |

**Overall confidence:** HIGH

### Gaps to Address

- **Yut stick 3D geometry**: The asymmetric shape (flat on one side, rounded on other) needs custom modeling. No off-the-shelf yut stick 3D model was identified. Consider whether to model programmatically (ExtrudeGeometry) or create in Blender and load via useGLTF. Decision needed during Phase 4 planning.
- **Predetermined result matching technique**: Three approaches identified (pre-recorded simulation, rotation adjustment, hybrid damping) but no clear winner without prototyping. Allocate spike time at the start of Phase 4.
- **AI win rate calibration**: The 70-80% player win rate target requires playtesting with tuned suboptimality percentages. No analytical formula exists -- this is empirical. Build configurable parameters and plan a tuning session after Phase 5 integration.
- **iOS WKWebView WebGL stability**: iOS 18 has known WebGL crashes in WKWebView on release builds (Apple Developer Forums). Test on real devices early in Phase 4, not just simulators. May need to reduce texture quality or geometry complexity if crashes persist.
- **cannon-es maintenance status**: Last npm publish was approximately 3 years ago. The API is stable and sufficient for this use case, but monitor for any breaking changes in Three.js 0.183+ that might affect @react-three/cannon interop.

## Sources

### Primary (HIGH confidence)
- [Three.js Official Documentation](https://threejs.org/manual/) -- cleanup, disposal, rendering on demand
- [React Three Fiber v9 Documentation](https://r3f.docs.pmnd.rs/) -- Canvas props, performance, pitfalls, migration guide
- [@react-three/cannon GitHub](https://github.com/pmndrs/use-cannon) -- Web Worker physics, API
- [cannon-es GitHub](https://github.com/pmndrs/cannon-es) -- physics engine API, version compatibility
- [Apple Developer Forums](https://developer.apple.com/forums/) -- WKWebView memory budget, WebGL context loss on iOS
- [Yunnori - Wikipedia](https://en.wikipedia.org/wiki/Yunnori) -- board structure, movement rules
- [Korean Encyclopedia of National Culture](https://encykorea.aks.ac.kr/Article/E0042794) -- 29-position board, route descriptions
- [Namu Wiki: Yut Nori Rules](https://namu.wiki/w/%EC%9C%B7%EB%86%80%EC%9D%B4) -- detailed rules, edge cases

### Secondary (MEDIUM confidence)
- [Codrops Dice Roller Tutorial](https://tympanus.net/codrops/2023/01/25/crafting-a-dice-roller-with-three-js-and-cannon-es/) -- Three.js + cannon-es throw physics pattern
- [Cornell ECE Yutnori Implementation](https://people.ece.cornell.edu/land/courses/ece4760/FinalProjects/s2011/dl462_ghl27/dl462_ghl27/MainFrame.htm) -- route-based data structure
- [Unity Discussions: Predetermined Dice Physics](https://discussions.unity.com/t/unity-3d-how-to-roll-a-dice-to-get-a-predetermined-result/693593) -- result predetermination pattern
- [BOJ Problem 15778](https://www.acmicpc.net/problem/15778) -- board position naming, programming implementation reference
- [Game Programming Patterns: State](https://gameprogrammingpatterns.com/state.html) -- FSM pattern
- [NRK nativebridge](https://github.com/nrkno/nativebridge) -- WebView bridge patterns

### Tertiary (LOW confidence)
- [WebGL in Mobile Development](https://blog.pixelfreestudio.com/webgl-in-mobile-development-challenges-and-solutions/) -- general mobile WebGL challenges
- [Amazon WebView WebGL Best Practices](https://developer.amazon.com/docs/vega/0.21/webview-webgl-best-practices.html) -- draw call optimization

---
*Research completed: 2026-03-31*
*Ready for roadmap: yes*
