---
phase: 04-3d-yut-throwing
plan: 01
subsystem: ui
tags: [three, cannon-es, react, cleanup, throw-result, yut-nori]

# Dependency graph
requires:
  - phase: 01-board-graph-movement-logic
    provides: ThrowResult and ThrowName contracts
provides:
  - Deterministic ThrowResult -> four-stick target pose mapping
  - Reusable Three.js resource tracker for meshes, materials, and scene nodes
  - Phase 4 runtime dependencies in package manifests
affects: [04-3d-yut-throwing, 05-game-integration]

# Tech tracking
tech-stack:
  added: [three, cannon-es, @types/three]
  patterns: [deterministic-result-mapping, explicit-webgl-cleanup, tdd-utility-contracts]

key-files:
  created:
    - src/lib/yut/throwPose.ts
    - src/lib/yut/__tests__/throwPose.test.ts
    - src/lib/throw3d/resourceTracker.ts
    - src/lib/throw3d/__tests__/resourceTracker.test.ts
  modified:
    - package.json
    - package-lock.json
    - src/lib/yut/index.ts

key-decisions:
  - "ThrowResult stays authoritative and maps to four target stick poses before any physics work starts"
  - "Three.js resources are cleaned up through an explicit tracker instead of ad-hoc dispose calls across the scene controller"
  - "Added @types/three as a dev dependency to keep the new 3D layer typed under the repo's TypeScript conventions"

patterns-established:
  - "Pure throw pose mapper: visual end-state derived from existing game logic types"
  - "Resource tracker: collect Object3D nodes and disposables once, tear them down from one place"

requirements-completed: [THROW-03]

# Metrics
duration: 4 min
completed: 2026-03-31
---

# Phase 4 Plan 1: Throw Pose and Cleanup Foundation Summary

**Deterministic stick pose mapping and reusable Three.js cleanup helpers for the 3D throw overlay**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-31T15:06:18Z
- **Completed:** 2026-03-31T15:10:18Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added `three` and `cannon-es` to the runtime dependencies and `@types/three` for TypeScript support
- Created `buildTargetPoses()` so every `ThrowResult` deterministically maps to four stick faces, yaw values, and slots
- Introduced `createResourceTracker()` to dispose tracked arrays, detachable `Object3D` nodes, and generic disposables safely
- Locked both utilities behind focused unit tests before scene work began

## Task Commits

Git commits were not created during this execution. The work remains local in the current workspace.

## Files Created/Modified
- `package.json` - Added `three`, `cannon-es`, and `@types/three`
- `package-lock.json` - Locked the new dependency graph for Phase 4
- `src/lib/yut/throwPose.ts` - Pure visual end-state mapper for four yut sticks
- `src/lib/yut/__tests__/throwPose.test.ts` - Covers face counts, slot ordering, and barrel export availability
- `src/lib/yut/index.ts` - Re-exported the new throw pose utility from `@/lib/yut`
- `src/lib/throw3d/resourceTracker.ts` - Centralized disposal helper for WebGL scene resources
- `src/lib/throw3d/__tests__/resourceTracker.test.ts` - Verifies disposal, array handling, detachment, and idempotence

## Decisions Made
- Throw pose mapping lives in `src/lib/yut` because it is still derived from game-domain truth, not renderer state
- Resource tracking was introduced before scene creation to keep repeated overlay mounts from leaking WebGL objects
- `@types/three` was added instead of falling back to `any` declarations so the scene layer stays type-safe

## Deviations from Plan

### Auto-fixed Issues

**1. [Tooling Compatibility] Added `@types/three` for strict TypeScript**
- **Found during:** Plan 04-01 utility implementation
- **Issue:** `three@0.183.2` does not ship declaration files, so the new 3D utilities failed TypeScript checks
- **Fix:** Added `@types/three@^0.183.1` as a dev dependency
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** Utility tests pass and the new modules lint cleanly

---

**Total deviations:** 1 auto-fixed (tooling compatibility)
**Impact on plan:** No scope creep. The deviation was required to keep the new Phase 4 code typed and maintainable.

## Issues Encountered

- The plan's `vitest -x` command is not supported by the installed Vitest 4.1.2 CLI, so equivalent single-file runs were used instead

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Deterministic pose and cleanup contracts are now available for the scene controller
- Phase 4 scene work can build directly on `buildTargetPoses()` and `createResourceTracker()`

## Self-Check: PASSED

- `src/lib/yut/__tests__/throwPose.test.ts` passes
- `src/lib/throw3d/__tests__/resourceTracker.test.ts` passes
- `three`, `cannon-es`, and `@types/three` are present in the package manifests

---
*Phase: 04-3d-yut-throwing*
*Completed: 2026-03-31*
