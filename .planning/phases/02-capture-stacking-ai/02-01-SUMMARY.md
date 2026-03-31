---
phase: 02-capture-stacking-ai
plan: 01
subsystem: game-logic
tags: [capture, stacking, yut-nori, pure-functional, tdd]

# Dependency graph
requires:
  - phase: 01-board-graph-movement-logic
    provides: PieceState, MoveResult, board routes, movement resolution, game state operations
provides:
  - detectCapture and executeCapture for opponent interaction
  - detectStack, confirmStack, declineStack for friendly stacking
  - moveStackGroup for stacked group movement
  - applyMove orchestration with capture-before-stack ordering
  - Extended PieceState with stackedPieceIds and stackedWith fields
  - CaptureResult, StackOpportunity, MoveOutcome type interfaces
affects: [02-02-ai-engine, 03-board-rendering, 05-game-ui-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-functional capture/stack logic, TDD RED-GREEN workflow, immutable state transformations]

key-files:
  created:
    - src/lib/yut/capture.ts
    - src/lib/yut/__tests__/capture.test.ts
  modified:
    - src/lib/yut/types.ts
    - src/lib/yut/game.ts
    - src/lib/yut/movement.ts
    - src/lib/yut/index.ts
    - src/lib/yut/__tests__/game.test.ts
    - src/lib/yut/__tests__/movement.test.ts

key-decisions:
  - "PieceState extended in-place with stackedPieceIds/stackedWith rather than separate StackState type -- backward-compatible, existing tests unchanged"
  - "applyMove orchestrates capture-before-stack ordering (Pitfall 2) as single entry point for all move interactions"
  - "declineStack is a true no-op -- no state change needed when player declines (D-05)"

patterns-established:
  - "Capture-before-stack ordering: always check and execute capture before detecting stacking at same station"
  - "Stack leadership model: existing piece at destination becomes leader, arriving piece becomes follower"
  - "Group transfer: when a group merges into another piece, all followers transfer to the new leader"

requirements-completed: [GAME-07, GAME-08, GAME-09, GAME-10]

# Metrics
duration: 5min
completed: 2026-03-31
---

# Phase 2 Plan 1: Capture & Stacking Summary

**Pure-functional capture (opponent HOME + extra throw) and stacking (player-choice merge with leader/follower model) mechanics with 24 TDD tests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-31T10:06:09Z
- **Completed:** 2026-03-31T10:11:47Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Capture mechanics: landing on opponent sends them HOME and grants extra throw (GAME-07)
- Stacking mechanics: landing on own piece returns stack opportunity for player choice (GAME-08)
- Group movement: stacked leader + followers move atomically to new position (GAME-09)
- Captured stacked groups disband entirely -- all pieces return individually to HOME (GAME-10)
- applyMove orchestration handles capture-before-stack ordering correctly (Pitfall 2)
- PieceState extended backward-compatibly -- all 100 existing tests unbroken

## Task Commits

Each task was committed atomically:

1. **Task 1: RED -- Extend types and write failing capture/stacking tests** - `deb50d3` (test)
2. **Task 2: GREEN -- Implement capture.ts to pass all tests** - `98a4349` (feat)

## Files Created/Modified
- `src/lib/yut/capture.ts` - 7 exported functions: detectCapture, executeCapture, detectStack, confirmStack, declineStack, moveStackGroup, applyMove
- `src/lib/yut/__tests__/capture.test.ts` - 24 tests across 6 describe blocks covering all capture/stacking behaviors
- `src/lib/yut/types.ts` - Extended PieceState with stackedPieceIds/stackedWith; added CaptureResult, StackOpportunity, MoveOutcome interfaces
- `src/lib/yut/game.ts` - Updated createInitialGameState with stacking field defaults
- `src/lib/yut/movement.ts` - Updated enterBoard virtual piece with stacking fields
- `src/lib/yut/index.ts` - Added capture.ts barrel export
- `src/lib/yut/__tests__/game.test.ts` - Updated test helpers with stacking fields
- `src/lib/yut/__tests__/movement.test.ts` - Updated test helpers with stacking fields

## Decisions Made
- Extended PieceState in-place rather than creating a separate StackState type -- keeps the data model flat and backward-compatible
- applyMove is the single orchestration entry point that handles position update, group movement, capture execution, and stack detection in correct order
- declineStack is implemented as a true no-op (empty function body) per D-05 -- declining stack requires no state mutation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated test helpers in movement.test.ts**
- **Found during:** Task 1 (type extension)
- **Issue:** movement.test.ts helpers constructing PieceState without new required fields would cause TypeScript errors
- **Fix:** Added stackedPieceIds: [] and stackedWith: null to all 3 test helpers in movement.test.ts
- **Files modified:** src/lib/yut/__tests__/movement.test.ts
- **Verification:** All 100 existing tests still pass
- **Committed in:** deb50d3 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for backward compatibility. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all functions fully implemented, all data flows wired.

## Next Phase Readiness
- capture.ts provides all piece interaction logic needed by the AI engine (Plan 02-02)
- applyMove returns MoveOutcome with capture result and stack opportunity for UI integration (Phase 5)
- All exports available via barrel import from '@/lib/yut'

## Self-Check: PASSED

- All created files exist on disk
- All commit hashes found in git log
- 124 tests pass, 0 failures
- TypeScript compiles without errors

---
*Phase: 02-capture-stacking-ai*
*Completed: 2026-03-31*
