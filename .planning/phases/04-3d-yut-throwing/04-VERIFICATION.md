---
phase: 04-3d-yut-throwing
verified: 2026-03-31T15:19:42Z
status: passed
score: 5/5 must-haves verified
gaps: []
human_verification:
  - test: "3D throw animation feels natural on a real browser/device"
    expected: "Four sticks visibly tumble, bounce, and settle without jank before the result card appears"
    why_human: "Physics feel and perceived realism are subjective and depend on GPU/device behavior"
  - test: "Overlay readability and timing feel right on mobile"
    expected: "The board remains visible below the overlay and the centered Korean result card is immediately legible"
    why_human: "Overlay composition, card scale, and reveal timing need real visual inspection"
  - test: "WKWebView stability with repeated throws"
    expected: "Multiple throws complete without WebGL context crashes or broken canvases in the app container"
    why_human: "This environment cannot simulate iOS WKWebView runtime stability"
---

# Phase 4: 3D Yut Throwing Verification Report

**Phase Goal:** Users tap a throw button and watch four yut sticks tumble through a 3D physics simulation, landing to reveal the predetermined result
**Verified:** 2026-03-31T15:19:42Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Pressing the throw button launches a 3D scene where 4 yut sticks fly, bounce, and settle on a surface | VERIFIED | `ThrowDemo.tsx` renders a visible `던지기` button that calls `generateThrow()` and opens `YutThrowOverlay`. `YutThrowOverlay.tsx` forwards the result once into `throwOnce(result)`. `createYutThrowScene.ts` creates exactly four stick meshes and four dynamic cannon bodies above a floor. `ThrowDemo.test.tsx` and `YutThrowOverlay.test.tsx` cover the open/launch flow. |
| 2 | The physics animation looks natural -- sticks tumble, bounce off the ground, and come to rest | VERIFIED | `createYutThrowScene.ts` uses fixed-step `world.fixedStep(1 / 60, 10)`, gravity `Vec3(0, -9.82, 0)`, damping, sleeping, per-stick impulse/torque seeds, and settle detection with six stable frames or 2200ms fallback. This verifies the intended behavior exists in code, while final feel still needs human device review. |
| 3 | The final stick orientations match the predetermined RNG result (not physics-determined) | VERIFIED | `buildTargetPoses()` deterministically maps each `ThrowResult` to four faces/yaws. After settle, `createYutThrowScene.ts` applies a 180ms correction to the target quaternions derived from `buildTargetPoses()`. `throwPose.test.ts` proves the mapping contract for do/gae/geol/yut/mo. |
| 4 | After sticks settle, the result (do/gae/geol/yut/mo) displays prominently on screen | VERIFIED | `ThrowResultCard.tsx` maps `{ do, gae, geol, yut, mo }` to `{ 도, 개, 걸, 윷, 모 }` and renders large centered gold text. `YutThrowOverlay.tsx` shows the card only when `phase === 'revealing'`. `YutThrowOverlay.test.tsx` verifies reveal-only display and completion timing. |
| 5 | The 3D scene cleans up GPU resources after each throw (no memory leaks across repeated throws) | VERIFIED | `createResourceTracker()` disposes tracked objects and detaches `Object3D` nodes. `createYutThrowScene.ts` cancels RAF, removes resize listeners, removes bodies from the world, disposes tracked resources, calls `renderer.dispose()`, and `renderer.forceContextLoss()`. `resourceTracker.test.ts` verifies the cleanup helper contract. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/yut/throwPose.ts` | Deterministic `ThrowResult` -> pose mapping | VERIFIED | Exports `YutStickFace`, `YutStickTargetPose`, `YUT_THROW_FACE_COUNTS`, and `buildTargetPoses()` |
| `src/lib/throw3d/resourceTracker.ts` | Explicit cleanup helper | VERIFIED | Tracks arrays, `Object3D` nodes, and generic disposables with idempotent disposal |
| `src/lib/throw3d/createYutThrowScene.ts` | Three.js + cannon-es scene controller | VERIFIED | Builds renderer, camera, floor, lights, four sticks, physics loop, settle correction, and teardown |
| `src/hooks/useYutThrowScene.ts` | React lifecycle hook for the scene | VERIFIED | Exposes `canvasRef`, `phase`, `revealedResult`, `throwOnce`, and `resetReveal` |
| `src/components/throw/YutThrowOverlay.tsx` | Overlay shell above the board | VERIFIED | Keeps the board visible underneath, runs one throw per open cycle, and reveals the result card |
| `src/components/throw/ThrowDemo.tsx` | Visible Phase 4 harness | VERIFIED | Renders the board, the overlay, and the `던지기` button in one repeatable loop |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `createYutThrowScene.ts` | `throwPose.ts` | `buildTargetPoses` import | WIRED | Deterministic pose correction is driven from the game-layer mapper |
| `useYutThrowScene.ts` | `createYutThrowScene.ts` | `createYutThrowScene(...)` | WIRED | Hook owns controller creation and disposal |
| `YutThrowOverlay.tsx` | `useYutThrowScene.ts` | hook state + `throwOnce(result)` | WIRED | Overlay launches the scene and reacts to `phase`/`revealedResult` |
| `ThrowDemo.tsx` | `throw.ts` | `generateThrow()` | WIRED | Demo produces predetermined results from the existing throw logic |
| `ThrowDemo.tsx` | `Board.tsx` | overlay-over-board composition | WIRED | The existing static board remains mounted under the throw overlay |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite | `npm test` | 222/222 tests pass | PASS |
| Targeted lint for new Phase 4 files | `npx eslint ...` | 0 errors / 0 warnings on changed Phase 4 files | PASS |
| Local page response | `curl -sSf http://localhost:3001` | HTML includes `윷 던지기 미리보기`, board SVG, hidden canvas overlay, and `던지기` button | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| THROW-01 | 04-02-PLAN | Four yut sticks are thrown in a Three.js + cannon-es scene | SATISFIED | Four dynamic bodies + meshes with renderer/world/controller in `createYutThrowScene.ts` |
| THROW-02 | 04-02-PLAN | Sticks fall, bounce, and settle visually | SATISFIED | Gravity, damping, torque/impulse seeds, and settle detection implemented in the scene controller |
| THROW-03 | 04-01/04-02 | Physics is visual-only; RNG result remains authoritative | SATISFIED | `buildTargetPoses()` + post-settle correction driven by `ThrowResult` |
| THROW-04 | 04-03-PLAN | Throw button launches the scene | SATISFIED | `ThrowDemo.tsx` visible button + overlay open flow; tests cover launch and duplicate-disable |
| THROW-05 | 04-03-PLAN | Large result text appears after settle | SATISFIED | `ThrowResultCard.tsx` and reveal-only overlay rendering |

All 5 THROW requirements are SATISFIED. No gaps found.

### Human Verification Required

### 1. Physics Feel On Device

**Test:** Open the Phase 4 demo in a real browser or mobile device and tap `던지기` repeatedly  
**Expected:** The four sticks tumble and settle naturally before the reveal card appears  
**Why human:** Subjective animation feel and frame pacing need visual confirmation

### 2. Overlay Readability

**Test:** Trigger a throw and inspect the result reveal on a phone-sized viewport  
**Expected:** The board remains readable under the overlay and `도/개/걸/윷/모` dominates the reveal state  
**Why human:** Visual hierarchy and timing cannot be fully verified by DOM or unit tests

### 3. WKWebView Stability

**Test:** Run repeated throws in the native app WebView container  
**Expected:** Repeated throws do not crash WebGL or leave a blank/broken canvas  
**Why human:** iOS WKWebView behavior is outside this local environment

### Gaps Summary

No implementation gaps found. The phase goal is satisfied in code and automated verification. Remaining human checks are about animation feel and target-device stability, not missing functionality.

---

_Verified: 2026-03-31T15:19:42Z_  
_Verifier: Codex (inline execute-phase)_  
