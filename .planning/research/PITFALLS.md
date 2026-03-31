# Domain Pitfalls

**Domain:** HTML5 Board Game with 3D Physics (Yut Nori / WebView Embedded)
**Researched:** 2026-03-31

---

## Critical Pitfalls

Mistakes that cause rewrites, crashes, or fundamental architecture problems.

---

### Pitfall 1: WebGL Memory Leak Accumulation from Undisposed Three.js Resources

**What goes wrong:** Every Three.js texture, geometry, and material allocates GPU memory through WebGL. Unlike regular JavaScript objects, these are NOT garbage collected automatically. Removing a mesh from a scene with `scene.remove(mesh)` does NOT free GPU memory -- it just detaches the object from the scene graph. Over repeated yut throws (create scene, animate, destroy), GPU memory grows until the WebView process is terminated by the OS.

**Why it happens:** Developers assume JavaScript GC handles cleanup. Three.js documentation explicitly states: "The browser only cleans up resources when you switch pages." A single 1024x1024 texture consumes 4-6MB of uncompressed GPU memory. After 20-30 yut throws without disposal, that alone could consume 100+ MB.

**Consequences:** On iOS WKWebView, memory budget is device-dependent and not configurable. When exceeded, `webViewWebContentProcessDidTerminate` fires and the entire WebView crashes. iOS 18 has known crashes when loading WebGL into WKWebView on release builds. The user sees a blank screen or the app restarts mid-game.

**Prevention:**
1. Implement a `ResourceTracker` pattern (from Three.js official docs) that tracks every geometry, material, and texture created during yut-throw animation.
2. Call `dispose()` on geometry, material, AND textures individually after each throw animation completes.
3. Call `renderer.dispose()` if the entire 3D canvas is being destroyed.
4. Monitor `renderer.info` (reports texture count, geometry count, shader program count) during development -- add a debug overlay.
5. Use on-demand rendering: stop the render loop when the yut throw is not active. Do NOT run `requestAnimationFrame` continuously for a board game that is mostly static 2D.

**Detection:**
- `renderer.info.memory.textures` and `renderer.info.memory.geometries` grow after each throw without decreasing.
- Chrome DevTools > Performance > Memory shows staircase pattern.
- iOS WebView crashes after 10+ throws.

**Phase relevance:** Must be addressed in the 3D physics implementation phase. Build the ResourceTracker BEFORE building the yut throw animation, not as an afterthought.

**Confidence:** HIGH -- sourced from Three.js official cleanup documentation and multiple forum reports.

---

### Pitfall 2: WebGL Context Loss on Mobile Without Recovery

**What goes wrong:** Mobile browsers and WebViews aggressively reclaim WebGL contexts when the app is backgrounded, when the device is under memory pressure, or when the user switches tabs. When this happens, Three.js fires a "context lost" event and simply stops rendering. The 3D canvas goes black. Three.js does NOT automatically recover from context loss.

**Why it happens:** Mobile OS power management and memory management kill WebGL contexts proactively. Common triggers: user switches to another app for 30+ seconds, incoming phone call, notification interaction that opens another app, or simply OS memory pressure from other apps.

**Consequences:** The 3D yut-throwing area goes permanently black. The user must reload the entire page. In a WebView-embedded game, this is catastrophic because there is no browser refresh button -- the native app must handle the reload.

**Prevention:**
1. Listen for `webglcontextlost` event and call `event.preventDefault()` (tells browser you will handle recovery).
2. Listen for `webglcontextrestored` event and re-initialize all WebGL resources (textures, geometries, materials, shaders).
3. Design the 3D module so all resources can be recreated from scratch quickly -- avoid complex scene graphs.
4. Consider a "tap to reload 3D" fallback if automatic recovery fails.
5. Keep the 3D scene minimal (yut sticks only) so recovery is fast.

**Detection:**
- Test by backgrounding the app for 60+ seconds on iOS and Android, then returning.
- Test under memory pressure (open many other apps first).
- Console error: `THREE.WebGLRenderer: Context Lost`.

**Phase relevance:** Must be architected in the 3D setup phase. Retrofitting context recovery into an existing Three.js setup is painful because every resource needs a recreation path.

**Confidence:** HIGH -- extensively documented in Three.js forums, Apple Developer Forums, and confirmed on iOS 17/18.

---

### Pitfall 3: Physics Result vs Visual Result Desynchronization (The Predetermined Result Problem)

**What goes wrong:** Yut Nori requires specific outcomes (do/gae/geol/yut/mo) that map to game logic. If you let the physics engine determine the result freely, you face two problems: (1) the physics result might be ambiguous (yut stick landing on edge, bouncing forever), and (2) you cannot control game fairness/AI difficulty. But if you predetermine the result and try to make the physics match, the visual can look fake or the physics can fail to produce the target orientation.

**Why it happens:** Physics simulation is inherently chaotic -- tiny floating-point differences in initial conditions produce wildly different outcomes. Cannon.js/cannon-es uses a Gauss-Seidel solver that is not perfectly deterministic across different frame rates. On mobile devices with variable frame rates, the same initial conditions can produce different results.

**Consequences:** The game shows "yut" (4 sticks same side) visually but the logic says "geol" (3 sticks), or the sticks never stop bouncing, or the AI difficulty calibration is impossible.

**Prevention:** Use the "determine first, animate second" approach:
1. Determine the yut result using RNG (with AI difficulty weighting) BEFORE starting the physics animation.
2. Use one of these visual strategies:
   - **Pre-recorded simulation:** Run physics silently at high speed to find initial conditions that produce the target result, then replay visually.
   - **Rotation adjustment:** Run physics freely, then apply a local rotation correction at the end (when sticks are nearly at rest) to match the target. Since yut sticks are symmetric in shape, 180-degree rotation looks natural.
   - **Hybrid approach:** Simulate the throw physics freely for the dramatic arc, then guide the sticks toward the predetermined resting orientation during the last 500ms using lerp/damping.
3. Use `cannon-es` `fixedStep()` with a consistent dt (e.g., 1/60) regardless of render frame rate to ensure stable simulation.

**Detection:**
- Physics result doesn't match logical result during testing.
- Sticks bounce infinitely or settle in ambiguous orientations.
- AI difficulty feels random despite calibration.

**Phase relevance:** This is THE core architectural decision for the 3D throw system. Must be decided before ANY physics code is written.

**Confidence:** HIGH -- well-established pattern in game dev for dice/physics-based randomness (Unity forums, Castle Engine docs, multiple game dev resources).

---

### Pitfall 4: Yut Board Path Graph Incorrectly Modeled (Shortcut/Branch Point Logic)

**What goes wrong:** The Yut Nori board is NOT a simple circular track. It has 29 stations arranged in a cross pattern with diagonal shortcuts through the center. There are 5 possible routes. The branching logic at corner positions and the center is the single most bug-prone part of Yut Nori implementations. Developers either model it as a flat array (wrong -- can't represent branches) or as a complex graph but get the branching conditions wrong.

**Why it happens:** The branching rules are deceptively complex:
- A piece landing ON a corner station (5th, 10th, 15th positions, or center) MAY take the shortcut. This is a CHOICE, not automatic.
- A piece that PASSES THROUGH a corner (doesn't land on it) does NOT get the shortcut option.
- The center station is shared by multiple diagonal paths -- a piece entering from one diagonal can exit on a different one.
- The "finish" line requires passing THROUGH the start position, not landing on it.
- Movement from the center has ambiguous exit directions depending on entry direction.

**Consequences:** Pieces take wrong paths, shortcut options appear when they shouldn't (or don't appear when they should), pieces get "stuck" at branch points, or the game allows illegal moves that break state consistency.

**Prevention:**
1. Model the board as a directed graph, NOT an array. Each node has a `next` pointer and optionally a `shortcutNext` pointer.
2. Track each piece's current PATH (not just position), because the same physical station can be on multiple paths.
3. Make shortcut decisions EXPLICIT in the UI -- when a piece lands on a branch point, prompt the player to choose.
4. Define exactly 5 routes and hardcode the station sequences for each.
5. Write exhaustive unit tests for movement at every branch point with every possible yut result.

**Detection:**
- Piece moves to wrong station after a shortcut.
- No shortcut prompt appears when landing on corner.
- Piece at center moves in unexpected direction.
- Piece "disappears" from the board (invalid position).

**Phase relevance:** Must be the FIRST game logic implemented and thoroughly unit tested before any UI work.

**Confidence:** HIGH -- based on analysis of Yut Nori rules from multiple Korean sources (namu wiki, gooddaddy.kr, Wikipedia) and competitive programming problems (BOJ 15778).

---

## Moderate Pitfalls

---

### Pitfall 5: Continuous Render Loop Draining Mobile Battery

**What goes wrong:** The standard Three.js setup uses a continuous `requestAnimationFrame` loop that renders 60fps even when nothing is animating. In a turn-based board game, the 3D scene is active maybe 5% of the time (during yut throws). The other 95% is static 2D board interaction. But the render loop keeps churning, draining battery and heating the device.

**Prevention:**
1. Use on-demand rendering. Only start the render loop when a yut throw begins, stop it when the throw animation completes.
2. In React Three Fiber, set `frameloop="demand"` on the Canvas component.
3. In vanilla Three.js, call `renderer.render()` explicitly only when the scene changes.
4. Never leave `requestAnimationFrame` running during the 2D board interaction phase.

**Detection:**
- Battery drain is noticeable during gameplay even when not throwing yut.
- CPU/GPU usage remains high during idle phases.
- Device heats up during the board interaction phase.

**Phase relevance:** 3D integration phase. Configure from the start; harder to retrofit.

**Confidence:** HIGH -- Three.js official docs explicitly recommend on-demand rendering for non-continuously-animated scenes.

---

### Pitfall 6: Multiple Yut Throw Queuing and Turn State Explosion

**What goes wrong:** When a player rolls "yut" (4 sticks same side) or "mo" (all face down), they get an additional throw. If they roll yut/mo again, they get yet another throw. This creates a QUEUE of pending throws, each producing a result that must be applied as a separate move. The turn state machine becomes complex: throw -> result -> (if yut/mo: queue another throw) -> apply all results as moves (potentially in any order the player chooses). Developers typically model this as a simple "current turn" state and break when multiple throws accumulate.

**Why it happens:** The naive state machine has states like `THROWING -> RESULT -> MOVING -> END_TURN`. But with yut/mo chaining: `THROWING -> RESULT(yut) -> THROWING -> RESULT(mo) -> THROWING -> RESULT(gae) -> MOVING(apply yut result) -> MOVING(apply mo result) -> MOVING(apply gae result) -> END_TURN`. The player can also choose WHICH piece to move for EACH result, and whether to stack. This is a combinatorial explosion of choices.

**Prevention:**
1. Model the turn as a queue of `pendingResults: YutResult[]`. Each throw appends to the queue.
2. Only transition to the MOVE phase when no more throws are pending.
3. For each result in the queue, let the player choose which piece to move and whether to take shortcuts.
4. Handle the edge case where a move captures an opponent's piece -- this adds ANOTHER throw to the queue even during the move phase.
5. Use a strict FSM with explicit states: `IDLE -> THROWING -> ANIMATING_THROW -> AWAITING_THROW_OR_MOVE -> SELECTING_PIECE -> SELECTING_PATH -> ANIMATING_MOVE -> CHECK_CAPTURE -> [loop or END_TURN]`.

**Detection:**
- Game gets stuck after rolling yut twice in a row.
- Player can't apply all their accumulated results.
- Capture during move phase doesn't grant extra throw.
- Turn never ends when yut/mo keeps appearing.

**Phase relevance:** Game state management phase. The FSM design must account for this from the start.

**Confidence:** HIGH -- inherent to Yut Nori rules, confirmed across multiple rule sources.

---

### Pitfall 7: Stacked Pieces (Eopgi) State Management Bugs

**What goes wrong:** When a player's piece lands on their own piece, they can "stack" (eop-gi). Stacked pieces move as one unit. If stacked pieces are captured, ALL stacked pieces return to start and the stack breaks. Developers forget to: (a) track which pieces are in a stack, (b) move all stacked pieces together, (c) break the stack on capture and return ALL to start, (d) handle the case where a stack lands on another stack (should merge), or (e) display stacked pieces visually.

**Prevention:**
1. Each board position tracks a SET of pieces, not a single piece.
2. When moving, move the entire set at a position.
3. On capture, return all pieces in the opponent's set to start.
4. The capture grants ONE additional throw regardless of how many pieces were in the stack.
5. On stacking, merge the sets. Do not limit stack size.
6. Visual: show piece count indicators on stacked positions.

**Detection:**
- Only one piece in a stack moves, leaving the other behind.
- Capturing a stack only returns one piece to start.
- Stack + stack merge fails.

**Phase relevance:** Core game logic phase, tightly coupled with board graph implementation.

**Confidence:** HIGH -- well-documented Yut Nori rule, confirmed in multiple sources.

---

### Pitfall 8: WebView postMessage Bridge Timing and Reliability Failures

**What goes wrong:** The game communicates with the native app via `window.postMessage()` for coupon delivery on win. Common failures: (1) message sent before native listener is registered (race condition on page load), (2) message silently lost with no acknowledgment, (3) data serialization mismatch (native expects string, game sends object), (4) origin mismatch rejection on iOS/Android, (5) no timeout handling means game hangs waiting for coupon confirmation that never comes.

**Why it happens:** postMessage is fire-and-forget by design. There is no built-in acknowledgment, timeout, or retry mechanism. The native app and web game load independently, so the bridge may not be ready when messages are sent.

**Prevention:**
1. Implement a handshake protocol: game sends `READY` ping on load, native responds with `ACK`. Only enable game start after handshake.
2. Wrap postMessage in a Promise with a timeout (e.g., 5 seconds). If no response, show user-facing error with retry option.
3. Always `JSON.stringify()` outgoing messages and `JSON.parse()` incoming messages. Define a typed message schema.
4. Use a message ID / correlation ID system so responses can be matched to requests.
5. Never call postMessage in the `<head>` or before `DOMContentLoaded` -- the native bridge may not be injected yet.
6. Handle the case where the game is opened in a regular browser (not WebView) -- detect missing bridge and show appropriate messaging.
7. Pattern from existing RPS project: reuse the proven postMessage protocol from `260330_rps/`.

**Detection:**
- Coupon not delivered despite winning.
- Game freezes on result screen waiting for native response.
- Works on one platform but not the other (iOS vs Android have different postMessage behaviors).

**Phase relevance:** WebView integration phase. Should reuse existing patterns from the RPS project.

**Confidence:** HIGH -- documented across React Native WebView issues, NRK nativebridge library, and multiple developer blog posts.

---

### Pitfall 9: React Component Lifecycle vs Three.js Lifecycle Mismatch

**What goes wrong:** React's reconciliation can unmount and remount components at any time (Strict Mode double-mounts in dev, route transitions, conditional rendering). Each mount creates a new WebGLRenderer, canvas, and scene. Each unmount must clean up everything. If cleanup is incomplete, you leak GPU memory and WebGL contexts (browsers limit to ~8-16 active contexts). If the Three.js render loop references stale React state, you get state sync bugs.

**Why it happens:** Three.js operates outside React's rendering model. The animation loop (`requestAnimationFrame`) runs independently of React's render cycle. React refs become stale if the component re-renders. React 19's strict mode double-mounting exposes cleanup bugs that appear to work in production but leak in development.

**Prevention:**
1. Use `useEffect` with a comprehensive cleanup function that disposes renderer, scene, camera, and all resources.
2. Use `useRef` for the Three.js renderer and scene -- NOT `useState` (state causes re-renders that conflict with the animation loop).
3. In cleanup, cancel the `requestAnimationFrame` handle AND dispose all WebGL resources.
4. Consider isolating the Three.js canvas in a separate component that is conditionally rendered only during the throw phase -- this makes mount/unmount boundaries clean.
5. Test with React Strict Mode enabled to catch cleanup bugs.
6. Alternatively, use `react-three-fiber` (@react-three/fiber) which handles lifecycle management, but adds bundle size and learning curve.

**Detection:**
- Console warning: `WARNING: Too many active WebGL contexts. Oldest context will be lost.`
- Memory staircase pattern when navigating between game phases.
- Stale state in animation callbacks (piece positions don't update).

**Phase relevance:** 3D integration setup phase. The mounting strategy must be decided early.

**Confidence:** HIGH -- documented in react-three-fiber issues (#514, #802) and Three.js forum posts.

---

## Minor Pitfalls

---

### Pitfall 10: Cannon-es Fixed Timestep vs Variable Frame Rate Jitter

**What goes wrong:** Cannon-es physics simulation uses `fixedStep()` which runs at a fixed dt (e.g., 1/60). If the render frame rate is lower (e.g., 30fps on a slow mobile device), the physics steps faster than rendering, causing visual jitter. If the frame rate is higher (120Hz displays), physics appears to slow down or skip frames.

**Prevention:**
1. Always use `world.fixedStep(1/60, deltaTime)` where `deltaTime` is actual elapsed time. The engine will internally accumulate time and step multiple times if needed.
2. Set a `maxSubSteps` limit (e.g., 3) to prevent physics from running too many steps on a single slow frame (which would cause a freeze).
3. Interpolate visual positions between physics steps for smooth rendering at any frame rate.

**Phase relevance:** 3D physics implementation phase.

**Confidence:** MEDIUM -- based on cannon-es documentation and general physics engine best practices.

---

### Pitfall 11: Finish Line Determination Bugs

**What goes wrong:** In Yut Nori, a piece finishes (exits the board) by passing THROUGH the starting position, not landing exactly on it. Developers often implement this as "if position equals start, piece is done" which means a piece that overshoots by one space is NOT marked as finished. Or they implement it as "if remaining steps would pass start" but get the calculation wrong for pieces on different paths (shortcut paths have different lengths).

**Prevention:**
1. Calculate remaining distance on the current path to the finish point.
2. If the yut result >= remaining distance, the piece finishes. Do not require exact landing.
3. Test all 5 route paths with all 5 yut results at every position near the end.
4. Handle the edge case: a stacked group finishes together (both pieces exit the board simultaneously).

**Phase relevance:** Game logic phase, after board graph is validated.

**Confidence:** HIGH -- confirmed in rule sources: "도착지점을 지나가도 도착으로 인정됩니다."

---

### Pitfall 12: AI Difficulty "Too Easy" Feels Broken, Not Fun

**What goes wrong:** The spec says "easy AI -- player usually wins." Developers implement this by making the AI choose randomly or always making bad moves. This feels obviously broken rather than fun. The player doesn't feel like they won through skill; they feel like the game is mocking them.

**Prevention:**
1. AI should play "reasonably" most of the time but make suboptimal choices at key decision points (e.g., not taking the best shortcut, not capturing when it should).
2. Weight the RNG for AI throws slightly toward worse results (more do/gae, fewer yut/mo), but not obviously so.
3. AI should always capture player pieces when possible (it looks broken if it doesn't) -- instead, make it less likely to land on players through throw weighting.
4. Playtesting is mandatory. The "fun" difficulty is harder to tune than it seems.

**Phase relevance:** AI implementation phase, after all game mechanics work.

**Confidence:** MEDIUM -- based on game design principles, no specific Yut Nori AI research found.

---

### Pitfall 13: Canvas/3D Element Sizing in WebView with Dynamic Viewport

**What goes wrong:** Mobile WebViews have dynamic viewports (address bar shows/hides, safe area insets, keyboard appearance). The Three.js canvas and 2D board layout break when the viewport resizes unexpectedly. The canvas either overflows, gets clipped, or the aspect ratio distorts.

**Prevention:**
1. Use CSS `dvh` (dynamic viewport height) or `svh` (small viewport height) instead of `vh`.
2. Listen for `resize` events and update both the Three.js renderer size AND camera aspect ratio.
3. Use `renderer.setSize(container.clientWidth, container.clientHeight)` rather than `window.innerWidth/Height`.
4. Test with both iOS safe area (notch) and Android navigation bar.
5. Set `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">` to prevent accidental zoom.

**Phase relevance:** Layout/UI phase.

**Confidence:** MEDIUM -- common mobile web development issue.

---

### Pitfall 14: Using cannon.js Instead of cannon-es

**What goes wrong:** The original `cannon.js` library has not been maintained since 2017. Developers find old tutorials referencing `cannon.js` and use it instead of the maintained fork `cannon-es`. The old library has unpatched bugs, no TypeScript types, no ES module support, and no tree-shaking.

**Prevention:**
1. Use `cannon-es` (npm: `cannon-es`), the actively maintained fork by pmndrs.
2. Import as ES modules: `import { World, Body, ... } from 'cannon-es'`.
3. If following old tutorials, mentally replace `CANNON.` with the ES module import equivalent.
4. Consider `@react-three/cannon` if using React Three Fiber.

**Phase relevance:** Initial project setup.

**Confidence:** HIGH -- cannon-es npm page and GitHub confirm it's the maintained fork.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Project Setup** | Using cannon.js instead of cannon-es (#14) | Use cannon-es from the start |
| **Board Graph Implementation** | Path/shortcut logic wrong (#4) | Model as directed graph, exhaustive unit tests |
| **Game State (FSM)** | Turn state explosion from yut/mo chaining (#6) | Queue-based pending results, explicit state machine |
| **Game State (FSM)** | Stacking bugs (#7) | Position tracks SET of pieces, merge/split logic |
| **3D Physics** | Predetermined result desync (#3) | Determine-first-animate-second architecture |
| **3D Physics** | Fixed timestep jitter (#10) | Use fixedStep with maxSubSteps, interpolate visuals |
| **3D Integration** | Memory leaks from undisposed resources (#1) | ResourceTracker from day one |
| **3D Integration** | WebGL context loss on mobile (#2) | Event listeners + resource recreation path |
| **3D Integration** | React lifecycle mismatch (#9) | Isolate Three.js component, comprehensive cleanup |
| **3D Integration** | Continuous render loop draining battery (#5) | On-demand rendering, stop loop when not animating |
| **Finish Logic** | Overshooting the finish line (#11) | ">= remaining distance" check, test all paths |
| **AI Implementation** | "Easy" feeling broken, not fun (#12) | Subtle weighting, not obviously bad play |
| **UI/Layout** | Canvas sizing in dynamic viewport (#13) | dvh/svh, resize listeners, safe area handling |
| **WebView Bridge** | Timing/reliability failures (#8) | Handshake + timeout + retry + typed messages |

---

## Sources

- [Three.js Official Cleanup Guide](https://threejs.org/manual/en/cleanup.html) -- HIGH confidence
- [Three.js Disposal Documentation](https://threejs.org/manual/en/how-to-dispose-of-objects.html) -- HIGH confidence
- [Three.js Context Lost Forum Discussion](https://discourse.threejs.org/t/how-to-fix-context-lost-android-iphone-ios/56829) -- HIGH confidence
- [Three.js Rendering on Demand](https://threejs.org/manual/examples/render-on-demand.html) -- HIGH confidence
- [React Three Fiber Issue #514: Leaking WebGLRenderer](https://github.com/pmndrs/react-three-fiber/issues/514) -- HIGH confidence
- [Apple Developer Forums: WKWebView Memory Budget](https://developer.apple.com/forums/thread/133449) -- HIGH confidence
- [Apple Developer Forums: iOS Safari WebGL Context Lost](https://developer.apple.com/forums/thread/737042) -- HIGH confidence
- [cannon-es GitHub](https://github.com/pmndrs/cannon-es) -- HIGH confidence
- [Unity Discussions: Predetermined Dice Physics](https://discussions.unity.com/t/unity-3d-how-to-roll-a-dice-to-get-a-predetermined-result/693593) -- MEDIUM confidence
- [Castle Engine: Dice Physics Recording](https://castle-engine.io/wp/2025/04/11/dice-throwing-demo-recording-physics-simulation/) -- MEDIUM confidence
- [Namu Wiki: Yut Nori Rules](https://namu.wiki/w/%EC%9C%B7%EB%86%80%EC%9D%B4) -- HIGH confidence
- [Yut Nori Detailed Rule Guide (gooddaddy.kr)](https://gooddaddy.kr/blog/0193-yut-play-rules-guide/) -- HIGH confidence
- [Gambiter: Yut Rules in English](https://gambiter.com/tabletop/Yut.html) -- MEDIUM confidence
- [NRK nativebridge: WebView Bridge Library](https://github.com/nrkno/nativebridge) -- MEDIUM confidence
- [WebGL in Mobile Development: Challenges and Solutions](https://blog.pixelfreestudio.com/webgl-in-mobile-development-challenges-and-solutions/) -- MEDIUM confidence
- [BOJ Problem 15778: Yut Nori Implementation](https://www.acmicpc.net/problem/15778) -- Reference only
