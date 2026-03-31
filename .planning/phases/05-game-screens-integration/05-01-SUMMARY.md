---
phase: 05-game-screens-integration
plan: 01
subsystem: state
tags: [zustand, session, move-candidates, yut-nori, vitest]

# Dependency graph
requires:
  - phase: 01-board-graph-movement-logic
    provides: turn queue and movement resolution primitives
  - phase: 02-capture-stacking-ai
    provides: capture, stacking, and win-condition rules
  - phase: 03-2d-board-rendering
    provides: board destination-highlight contract
provides:
  - Branch-aware UI move candidate helper
  - Yut-specific session and bridge payload contracts
  - Zustand game store foundation for throw, queue, selection, and animation handoff
affects: [05-game-screens-integration, 06-visual-polish-delight]

# Tech tracking
tech-stack:
  added: []
  patterns: [queue-first-turn-state, branch-aware-candidates, typed-session-contracts]

key-files:
  created:
    - src/lib/yut/moveCandidates.ts
    - src/lib/yut/__tests__/moveCandidates.test.ts
    - src/lib/yut/session.ts
    - src/lib/yut/__tests__/session.test.ts
    - src/store/gameStore.ts
    - src/store/__tests__/gameStore.test.ts
  modified:
    - src/lib/yut/index.ts

key-decisions:
  - "Throw animation state and queued move consumption stay separate so yut/mo chaining never collapses into one opaque step"
  - "Shortcut and continue destinations are precomputed together so Phase 3's direct-tap board UI can stay unchanged"
  - "The session payload is typed before the bridge hook lands so game state and integration code share one contract"

patterns-established:
  - "Queue-first FSM: throws accumulate before move selection starts"
  - "Pending-animation handoff: state prepares the exact board animation payload before the UI moves pieces"

requirements-completed: [VIS-02, INTG-03]

# Metrics
duration: 4 min
completed: 2026-04-01
---

# Phase 5 Plan 1: Store Foundation Summary

**Branch-aware move candidates, typed session contracts, and a real game-state store for the playable Yut Nori loop**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-31T15:40:00Z
- **Completed:** 2026-03-31T15:44:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Added `buildMoveCandidates()` so the board UI can highlight continue/shortcut destinations from one reusable helper
- Added `session.ts` for `YUT_GAME_START`, `YUT_GAME_END`, `YUT_GAME_WIN`, coupon config, and immutable session helpers
- Created the first real `useGameStore` FSM with throw queue handling, piece selection, animation payloads, turn switching, and restart flow
- Locked the foundation behind focused unit/integration tests before screen work began

## Task Commits

Git commits were not created during this execution. The work remains local in the current workspace.

## Files Created/Modified
- `src/lib/yut/moveCandidates.ts` - Branch-aware UI move candidate generator
- `src/lib/yut/__tests__/moveCandidates.test.ts` - Candidate generation coverage for HOME, branch, follower, and FINISH cases
- `src/lib/yut/session.ts` - Session lifecycle helpers and typed bridge message contracts
- `src/lib/yut/__tests__/session.test.ts` - Session immutability and export coverage
- `src/lib/yut/index.ts` - Re-exported move candidate and session utilities
- `src/store/gameStore.ts` - Zustand FSM for throw, select, animate, stack, and turn switching
- `src/store/__tests__/gameStore.test.ts` - Store transition coverage for start/throw/select/animate/restart flow

## Decisions Made
- The store owns queue drain timing so UI components stay dumb and only render the current phase
- Session payloads were defined in `src/lib/yut` instead of the hook layer so both store and bridge can share them
- The board highlight contract was preserved exactly instead of inventing a second destination format

## Deviations from Plan

None - plan executed as specified.

## Issues Encountered

- The installed Vitest 4.1.2 CLI does not support `-x`, so equivalent single-file runs were used during execution

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The app now has one authoritative game FSM instead of temporary demo-only state
- Screen components can bind directly to the store without re-implementing turn or queue rules
- Bridge work can rely on typed session payloads instead of ad-hoc message shapes

## Self-Check: PASSED

- `src/lib/yut/__tests__/moveCandidates.test.ts` passes
- `src/lib/yut/__tests__/session.test.ts` passes
- `src/store/__tests__/gameStore.test.ts` passes

---
*Phase: 05-game-screens-integration*
*Completed: 2026-04-01*
