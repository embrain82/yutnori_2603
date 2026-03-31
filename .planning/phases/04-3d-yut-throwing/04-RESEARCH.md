# Phase 4: 3D Yut Throwing - Research

**Researched:** 2026-03-31
**Domain:** Three.js scene lifecycle, cannon-es rigid-body stepping, predetermined-result pose correction, mobile overlay performance
**Confidence:** MEDIUM-HIGH

## Summary

Phase 4 should be implemented as a temporary 3D overlay that mounts above the existing 2D board area, runs a short throw sequence, reveals a large Korean result label, and then tears itself down cleanly. The existing project has no 3D runtime yet, so the safest fit is **raw Three.js + cannon-es behind a client-only React hook/component boundary**, rather than introducing a React-specific 3D abstraction for a single localized feature.

The most important technical choice is to keep **game truth** and **visual truth** separate. `src/lib/yut/throw.ts` already produces the authoritative `ThrowResult`; the 3D layer should accept that result as input, launch four simulated sticks with randomized impulses/torques, then after settle apply a short orientation correction so the final visible faces match the predetermined result. This avoids relying on unstable emergent physics to determine game state while still satisfying the "natural tumble and bounce" requirement.

For mobile WebView performance, the throw scene should be short-lived and aggressively cleaned up. Three.js' cleanup guidance supports explicit disposal of tracked resources, while cannon-es provides fixed-step simulation, body sleep controls, and `world.hasActiveBodies` for settle detection. Combined with a capped internal canvas resolution and an overlay that only exists during a throw, this fits the project's mobile-first constraints well.

**Primary recommendation:** add `three@^0.183.2` and `cannon-es@^0.20.0`, build a `useYutThrowScene` hook over an imperative `createYutThrowScene()` controller, use a pure `throwPose.ts` mapper for predetermined results, and expose a `YutThrowOverlay` + temporary demo/harness that can later plug into Phase 5 turn orchestration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Throw scene appears as an overlay above the existing 2D board
- **D-02:** Throw flow starts and ends inside the same game screen, not as a page transition
- **D-03:** Camera should use a stable 3/4 angle optimized for mobile readability
- **D-04:** Camera motion should stay calm; the sticks provide the drama
- **D-05:** Sticks and floor should use a warm wood, casual visual tone
- **D-06:** Avoid photorealism; keep the scene bright and approachable
- **D-07:** After settle, show a large centered Korean result label for `도/개/걸/윷/모`
- **D-08:** Result reveal happens inside the overlay and then hands back to board flow naturally

### the agent's Discretion
- Exact stick mesh construction and whether visual meshes use separate physics proxies
- World/body tuning values for damping, restitution, friction, and sleep thresholds
- Whether the scene controller lives in `src/lib/throw3d/` with a hook wrapper or directly inside a hook
- Exact overlay/result-card animation timing and typography

### Deferred Ideas (OUT OF SCOPE)
- Swipe/flick throw input (`THROW-V2-01`)
- Camera shake / zoom cinematics (`THROW-V2-02`)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| THROW-01 | Four yut sticks are thrown in a Three.js + Cannon.js scene | Raw Three.js renderer + cannon-es `World` / `Body` integration, one mesh/body pair per stick |
| THROW-02 | Sticks bounce, tumble, and settle naturally | cannon-es fixed-step world, damping, sleep thresholds, ground contact material, post-step mesh sync |
| THROW-03 | Result is predetermined and physics is visual-only | Pure `throwPose.ts` mapper + short final orientation correction after settle |
| THROW-04 | Tapping a button launches the throw scene | Client-only overlay/harness component that mounts the scene on demand |
| THROW-05 | After settle, show a large result label | React overlay state machine around the canvas with centered result card |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `three` | `0.183.2` | WebGL scene, camera, lights, meshes, renderer lifecycle | Official Three.js runtime; required by roadmap and well-suited to a contained overlay |
| `cannon-es` | `0.20.0` | Rigid-body physics, stepping, sleep detection | Roadmap-fixed physics engine with current TypeScript definitions |
| React | `19.2.4` | Overlay state + mount/unmount orchestration | Already installed project standard |
| `motion` | `12.38.0` | Result-card / overlay entrance-exit transitions | Already installed and consistent with prior phases |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | `4.1.2` | Pure utility and mocked hook/component tests | Existing standard test runner |
| `@testing-library/react` | `16.3.2` | Overlay / button / result-card interactions | Existing component-testing stack |

### Installation
```bash
npm install three@^0.183.2 cannon-es@^0.20.0
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw Three.js scene controller | `@react-three/fiber` | More React-native ergonomics, but adds a second rendering abstraction to a repo that currently has no 3D stack and only needs one localized overlay |
| Exact half-cylinder physics shape | Simplified proxy body + final pose correction | Exact geometry is more realistic, but the result is predetermined anyway; a simpler proxy keeps performance/tuning manageable |
| Persistent always-mounted renderer | Mount-per-throw overlay with explicit dispose | Persistent canvas may reduce re-init cost, but makes cleanup correctness harder in a mobile WebView and conflicts with the short-lived overlay UX |

## Architecture Patterns

### Recommended Project Structure
```text
src/
  lib/
    yut/
      throwPose.ts                    # ThrowResult -> four target stick faces / final poses
      __tests__/throwPose.test.ts
    throw3d/
      resourceTracker.ts              # Explicit Three.js disposal helper
      createYutThrowScene.ts          # Imperative scene/controller factory
      __tests__/resourceTracker.test.ts
  hooks/
    useYutThrowScene.ts               # React wrapper around controller lifecycle
    __tests__/useYutThrowScene.test.tsx
  components/
    throw/
      YutThrowOverlay.tsx             # Overlay shell over the board
      ThrowResultCard.tsx             # Large centered result reveal
      ThrowDemo.tsx                   # Temporary Phase 4 harness / playground
      __tests__/
        YutThrowOverlay.test.tsx
        ThrowDemo.test.tsx
```

### Pattern 1: Imperative Scene Controller Behind a Hook

**What:** Keep Three.js and cannon-es inside a non-React controller (scene, renderer, world, RAF, resize handler), then wrap it with a client hook for mount/unmount and UI state transitions.

**Why:** The current repo already uses imperative hooks for animation sequencing (`src/hooks/useHopAnimation.ts`), and the app shell is still minimal. This keeps WebGL and physics lifecycle concerns separate from React rerenders.

**Recommended shape:**
```ts
export interface YutThrowSceneController {
  startThrow(result: ThrowResult): Promise<void>
  resize(): void
  dispose(): void
}
```

### Pattern 2: Predetermined Result Mapping With Final Pose Correction

**What:** Convert `ThrowResult` into four target stick face states before the throw starts, run physics for drama, then after settle tween each stick to a matching final orientation.

**Why:** This preserves Phase 1's authoritative RNG while still letting the sequence look physical. It also avoids needing a perfectly accurate half-cylinder collider to "discover" the right outcome.

**Recommended mapping contract:**
```ts
export type YutStickFace = 'flat' | 'round'

export interface YutStickTargetPose {
  face: YutStickFace
  yaw: number
  offsetX: number
  offsetZ: number
}

export function buildTargetPoses(result: ThrowResult): YutStickTargetPose[]
```

Use canonical counts:
- `do` -> 1 flat, 3 round
- `gae` -> 2 flat, 2 round
- `geol` -> 3 flat, 1 round
- `yut` -> 4 flat
- `mo` -> 0 flat, 4 round

### Pattern 3: Fixed-Step Physics + Sleep-Based Settle Detection

**What:** Advance cannon-es using `world.fixedStep(1 / 60)` inside the animation loop, sync each body's transform into its mesh every frame, and treat the throw as settled when bodies are sleeping or a timeout is reached.

**Why:** cannon-es' getting-started docs explicitly recommend `world.fixedStep()` for frame-rate-independent stepping. `World.hasActiveBodies` and per-body sleep options make settle detection straightforward and observable.

**Recommended world/body defaults:**
- `new World({ gravity: new Vec3(0, -9.82, 0), allowSleep: true })`
- stick bodies: `allowSleep: true`, `sleepSpeedLimit: 0.15`, `sleepTimeLimit: 0.6`
- renderer loop: mark settled when `world.hasActiveBodies === false` for several consecutive frames, with a hard timeout around `2200ms`

### Pattern 4: Responsive Canvas Sizing Without `setPixelRatio`

**What:** Follow Three.js' responsive manual pattern: compute canvas buffer dimensions from `clientWidth * devicePixelRatio`, cap the maximum pixel count, and call `renderer.setSize(width, height, false)`.

**Why:** The manual notes this keeps sizing explicit and allows capping internal resolution to avoid excessive GPU load on high-DPI devices. This matters for mobile WebView performance.

**Recommended cap:** keep internal buffer at or below roughly `1280 * 720` pixels for this overlay-sized scene.

### Pattern 5: Explicit GPU/Physics Cleanup

**What:** Track all disposable Three.js resources, cancel RAF, remove resize listeners, remove physics bodies, dispose materials/geometries/textures, call `renderer.dispose()`, and finally `renderer.forceContextLoss()` when unmounting the overlay.

**Why:** Phase success criteria explicitly call out repeated-throw cleanup. Three.js' cleanup guidance supports tracked disposal, and renderer docs expose both `dispose()` and `forceContextLoss()`.

## Recommended Technical Decisions

### 1. Use Raw Three.js, Not React-Three-Fiber

**Recommendation:** Use raw Three.js in `src/lib/throw3d/` and wrap it with a React hook.

**Why:**
- The repo currently has no 3D React abstraction, but does have imperative animation-hook precedent
- Phase 4 is a small self-contained overlay, not a full 3D app shell
- Cleanup and repeated mount/unmount are easier to reason about with a dedicated controller

### 2. Use Separate Visual Meshes And Simple Physics Bodies

**Recommendation:** Give each stick a stylized visual mesh, but use a simpler physics proxy body (box or simplified compound) and correct the final orientation after settle.

**Why:**
- Visual-only physics means correctness comes from the post-settle pose, not exact collision geometry
- Simpler bodies are easier to tune and less risky for mobile performance
- The user chose a casual stylized look, not a simulation-authentic artifact

### 3. Provide A Temporary Harness On `src/app/page.tsx`

**Recommendation:** Replace the current placeholder page with a minimal Phase 4 playground that renders the static 2D board, a `던지기` button, and the overlay.

**Why:**
- The current page is only a placeholder
- Phase 4 still needs a real user-triggerable path to satisfy `THROW-04`
- The chosen overlay-on-board direction can be validated immediately before Phase 5 adds full turn logic

## Pitfalls And Guardrails

### Pitfall 1: Sleep-Based Settle Can Stall Forever
If damping is too low or bodies jitter, some sticks may never reach sleep.

**Guardrail:** use `allowSleep`, tuned sleep thresholds, and a hard timeout fallback that still runs final pose correction.

### Pitfall 2: jsdom Cannot Validate Real WebGL Behavior
Automated tests cannot prove the physical motion "looks natural."

**Guardrail:** keep pure logic in testable utilities, mock the scene hook in component tests, and reserve actual bounce/readability/cleanup feel for manual browser verification.

### Pitfall 3: High-DPI Mobile Can Oversize The Drawing Buffer
Using raw device pixel ratio without a cap can burn GPU time in WebView.

**Guardrail:** follow Three.js' manual resize pattern and cap the internal pixel count.

### Pitfall 4: Cleanup Must Cover Both Three.js And cannon-es
Disposing the renderer alone is not enough if bodies, listeners, and RAF loops survive unmount.

**Guardrail:** centralize teardown in one controller `dispose()` method and test that it removes all bodies and listeners.

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
| THROW-03 | `ThrowResult` maps to four target faces/poses deterministically | unit | `npx vitest run src/lib/yut/__tests__/throwPose.test.ts -x` | Wave 0 |
| THROW-01 | Scene controller builds four sticks, floor, camera, and renderer lifecycle | unit (mocked) | `npx vitest run src/hooks/__tests__/useYutThrowScene.test.tsx -x` | Wave 0 |
| THROW-02 | Scene loop enters launching -> settling -> settled state and triggers final correction | integration (mocked controller timing) | `npx vitest run src/components/throw/__tests__/YutThrowOverlay.test.tsx -x` | Wave 0 |
| THROW-04 | Tapping throw button mounts overlay and starts a throw with `generateThrow()` | integration | `npx vitest run src/components/throw/__tests__/ThrowDemo.test.tsx -x` | Wave 0 |
| THROW-05 | Settled overlay renders centered result label text | integration | `npx vitest run src/components/throw/__tests__/YutThrowOverlay.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `$gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/yut/__tests__/throwPose.test.ts` — covers `THROW-03`
- [ ] `src/lib/throw3d/__tests__/resourceTracker.test.ts` — covers explicit disposal behavior
- [ ] `src/hooks/__tests__/useYutThrowScene.test.tsx` — covers scene mount/dispose orchestration
- [ ] `src/components/throw/__tests__/YutThrowOverlay.test.tsx` — covers overlay phase changes and result reveal
- [ ] `src/components/throw/__tests__/ThrowDemo.test.tsx` — covers throw button and repeated launch flow

## Sources

### Primary (HIGH confidence)
- [three.js cleanup manual](https://threejs.org/manual/en/cleanup.html) — explicit disposal tracking pattern for geometries, materials, textures, and scene objects
- [three.js responsive manual](https://threejs.org/manual/en/responsive.html) — manual resize strategy and advice to cap internal resolution
- [three.js WebGLRenderer docs](https://threejs.org/docs/pages/WebGLRenderer.html) — constructor options (`alpha`, `antialias`, `powerPreference`), `setSize`, `compileAsync`, `dispose`, `forceContextLoss`
- [cannon-es getting started](https://pmndrs.github.io/cannon-es/docs/) — `World`, gravity, `world.fixedStep()`, mesh/body syncing
- [cannon-es World docs](https://pmndrs.github.io/cannon-es/docs/classes/World.html) — `allowSleep`, `hasActiveBodies`, `fixedStep`, `removeBody`
- [cannon-es Body docs](https://pmndrs.github.io/cannon-es/docs/classes/Body.html) — `allowSleep`, `sleepSpeedLimit`, `sleepTimeLimit`, damping and body options
- `src/lib/yut/throw.ts` — authoritative result generation contract
- `src/lib/yut/types.ts` — `ThrowResult` / `ThrowName` types
- `src/components/board/Board.tsx` — current board layer to compose under the overlay
- `src/hooks/useHopAnimation.ts` — existing imperative animation hook pattern

### Secondary (MEDIUM confidence)
- `.planning/phases/04-3d-yut-throwing/04-CONTEXT.md` — locked visual and flow decisions
- `.planning/phases/03-2d-board-rendering/03-UI-SPEC.md` — board-area sizing and mobile layout baseline the overlay should align with
- `.planning/STATE.md` — project-level note that iOS WKWebView WebGL stability should be tested early

### Tertiary (LOW confidence)
- Simplified physics proxy + post-settle pose correction strategy — derived from combining project constraints with the official Three.js / cannon-es lifecycle APIs

## Project Constraints (from AGENTS.md / codebase)

- Use `'use client'` for all interactive 3D React components
- Prefer absolute `@/` imports
- Keep UI mobile-first and avoid oversized GPU buffers in WebView
- Keep comments sparse and focused on non-obvious behavior
- Use Vitest / Testing Library for automated checks and mock expensive browser APIs when needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — official libraries and versions are current and directly compatible with the repo
- Lifecycle / cleanup approach: HIGH — strongly supported by official docs
- Predetermined-result correction pattern: MEDIUM — architecture inference, but aligned with locked project decisions
- Automated verification depth: MEDIUM — core logic is testable, but physical feel and WebView stability still require manual QA

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (dependency guidance may shift; product constraints likely stable)
