---
phase: 01-board-graph-movement-logic
plan: 02
subsystem: game-logic
tags: [typescript, vitest, yut-nori, movement, path-traversal, tdd]

# Dependency graph
requires:
  - phase: 01-board-graph-movement-logic/01
    provides: "Types (PieceState, MoveResult, HOME, FINISH), board graph (ROUTES, ROUTE_IDS, BRANCH_POINTS)"
provides:
  - "resolveMove() -- step-by-step path traversal for all 5 routes"
  - "enterBoard() -- HOME piece entry onto outer route"
  - "applyBranchChoice() -- route switching at branch points S5/S10"
  - "getAvailableMoves() -- legal move validation for HOME/FINISH/on-board pieces"
  - "D-07/D-08 finish semantics (land on = not finished, pass through = finished)"
  - "Branch detection only on landing, not pass-through"
affects: [01-03-PLAN, 02-state-management, 03-board-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [tdd-red-green-refactor, route-based-path-traversal, differential-finish-semantics]

key-files:
  created:
    - src/lib/yut/movement.ts
    - src/lib/yut/__tests__/movement.test.ts
  modified: []

key-decisions:
  - "Diagonal/center routes finish immediately on any step beyond last station (no D-07 exception)"
  - "Outer route D-07: landing at index 20 (route.length) = at finish point, NOT finished; index 21+ = finished"
  - "Branch detection restricted to outer route only -- pieces already on shortcut routes skip branch check"

patterns-established:
  - "Step-by-step traversal loop with early exit for finish detection"
  - "Differential finish semantics: outer route has D-07 exception, diagonals finish immediately"
  - "intermediateStations tracking for animation path data (excludes start and end positions)"

requirements-completed: [GAME-05, GAME-06, GAME-11]

# Metrics
duration: 4min
completed: 2026-03-31
---

# Phase 01 Plan 02: Movement Resolution Summary

**TDD movement engine with path traversal across 5 routes, D-07/D-08 finish semantics, branch point detection (landing only), and 36 exhaustive tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-31T08:48:14Z
- **Completed:** 2026-03-31T08:52:19Z
- **Tasks:** 3 (TDD: RED, GREEN, REFACTOR)
- **Files modified:** 2

## Accomplishments
- Implemented resolveMove() with correct path traversal for all 5 routes (outer, diag_right, diag_left, center_down, center_up)
- D-07 finish semantics: piece at S19 + do(1) lands at finish point but is NOT finished; D-08: S19 + gae(2) IS finished
- Branch point detection only triggers when LANDING on S5 or S10 (not passing through) -- Pitfall 3 avoided
- Diagonal routes finish on any step beyond last station (S24 for diag_right, S28 for diag_left)
- enterBoard() places HOME pieces at S0 and advances correctly, including mo(5) -> S5 branch detection
- applyBranchChoice() switches piece to shortcut route at index 0 while preserving station
- getAvailableMoves() validates move legality for HOME, FINISH, and on-board pieces
- intermediateStations tracking for animation path data (excludes start and landing positions)
- 36 tests covering every behavior case specified in the plan, all passing

## Task Commits

Each task was committed atomically (TDD workflow):

1. **RED: Write failing tests** - `2414638` (test)
2. **GREEN: Implement movement.ts** - `8630e62` (feat)
3. **REFACTOR: Remove unused import** - `17c173f` (refactor)

## Files Created/Modified
- `src/lib/yut/movement.ts` - Movement resolution engine (202 lines): resolveMove, enterBoard, applyBranchChoice, getAvailableMoves
- `src/lib/yut/__tests__/movement.test.ts` - Exhaustive movement tests (351 lines): 36 test cases across 8 describe blocks

## Decisions Made
- Diagonal/center routes finish immediately on any step beyond last station -- no D-07 "landing at finish" exception. Only the outer route has the 참먹이 (S0) finish-line semantics where landing exactly = not finished.
- Branch detection restricted to outer route only. A piece already on diag_right at S5 (index 0) does not trigger branch detection when moving forward.
- Step-by-step loop approach chosen over direct index calculation to correctly track intermediate stations and handle early finish exits.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Diagonal routes incorrectly applied D-07 finish exception**
- **Found during:** GREEN phase (first test run)
- **Issue:** Initial implementation treated all routes with D-07 semantics (landing at route.length = not finished). Diagonal routes S24+do(1) and S28+do(1) should finish immediately.
- **Fix:** Added `isOuterRoute` check: diagonal/center routes return finished=true for any step beyond last station; only outer route applies D-07 exception.
- **Files modified:** src/lib/yut/movement.ts
- **Verification:** 3 previously failing diagonal finish tests now pass
- **Committed in:** 8630e62 (GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for correctness. Diagonal finish semantics differ from outer route.

## Issues Encountered
None -- plan executed smoothly with TDD catching the diagonal finish bug during GREEN phase.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- movement.ts provides all movement resolution needed by plan 01-03 (game state management)
- All 4 exported functions (resolveMove, enterBoard, applyBranchChoice, getAvailableMoves) ready for Zustand store integration
- 70 total tests across 4 test files, all passing with zero TypeScript errors

## Self-Check: PASSED

All 2 key files verified on disk. All 3 commit hashes found in git log. movement.ts: 203 lines (min 80). movement.test.ts: 351 lines (min 150). 36/36 movement tests passing. 70/70 total tests passing. TypeScript compiles with zero errors.

---
*Phase: 01-board-graph-movement-logic*
*Completed: 2026-03-31*
