---
phase: 03-2d-board-rendering
plan: 02
subsystem: ui
tags: [svg, react, motion, game-pieces, yut-nori]

# Dependency graph
requires:
  - phase: 01-game-logic-foundation
    provides: Team type, PieceState interface, HOME sentinel
provides:
  - PieceToken component with team colors, stack badge, glow/selection rings
  - HomeZone component for off-board piece staging areas
  - TEAM_COLORS constant and TOKEN_RADIUS constant
  - motion/react test mock for SVG component testing
affects: [03-2d-board-rendering, 04-3d-yut-throwing, 05-game-flow-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [SVG token rendering with motion.g positioning, team-colored visual identity, invisible hit area pattern for touch targets]

key-files:
  created:
    - src/components/board/PieceToken.tsx
    - src/components/board/HomeZone.tsx
    - src/components/board/__tests__/PieceToken.test.tsx
    - src/components/board/__tests__/HomeZone.test.tsx
    - src/__mocks__/motion/react.tsx
  modified: []

key-decisions:
  - "motion.g wrapper with x/y animate for grouped SVG positioning (token + badge + rings move together)"
  - "Invisible circle r=22 for 44px+ touch target instead of enlarging visible token"
  - "TeamZone helper function inside HomeZone for DRY left/right zone rendering"

patterns-established:
  - "SVG token pattern: motion.g groups child elements at local (0,0), animated to (cx,cy) via spring"
  - "Team color lookup: TEAM_COLORS Record<Team, {fill, stroke}> constant for consistent styling"
  - "Touch target pattern: transparent circle overlay with pointerEvents='all' for mobile tap"

requirements-completed: [BOARD-02, BOARD-03]

# Metrics
duration: 4min
completed: 2026-03-31
---

# Phase 3 Plan 02: Piece Token & HOME Zone Summary

**Team-colored SVG piece tokens with stack badge, glow/selection rings, and HOME staging zones using motion.g positioning**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-31T13:55:01Z
- **Completed:** 2026-03-31T13:59:49Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- PieceToken renders player (blue #42A5F5) and AI (red #EF5350) SVG circles with correct fills and strokes
- Stack badge (count > 1), pulsing glow ring (selectable), gold selection ring (selected), and 44px+ invisible hit area
- HomeZone renders two team-colored zones with Korean labels ("내 말" / "상대 말") displaying HOME pieces as PieceTokens
- motion/react mock created for SVG component testing (blocking dependency resolved)
- Full test suite: 162 tests pass across 9 files with 0 regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PieceToken component with team colors, stack badge, and selection states** - `4e4b8d3` (feat)
2. **Task 2: Create HomeZone component for off-board pieces** - `b21f9b1` (feat)

_Both tasks followed TDD: RED (tests fail) -> GREEN (implementation passes) flow._

## Files Created/Modified
- `src/components/board/PieceToken.tsx` - Team-colored SVG circle token with stack badge, glow ring, selection ring, hit area
- `src/components/board/HomeZone.tsx` - Off-board piece staging area with two team zones and Korean labels
- `src/components/board/__tests__/PieceToken.test.tsx` - 10 tests: team colors, stack badge, glow ring, selection ring, hit area, click handler
- `src/components/board/__tests__/HomeZone.test.tsx` - 7 tests: labels, backgrounds, piece counts, selection, interaction
- `src/__mocks__/motion/react.tsx` - Motion library mock for test environment (renders plain SVG/HTML elements)

## Decisions Made
- Used `motion.g` with `animate={{ x, y }}` for grouped positioning (token + badge + rings move as unit) per Research Pitfall 6 guidance
- Invisible circle `r=22` for 44px+ touch target instead of scaling visible token -- maintains visual size while meeting mobile accessibility
- TeamZone internal helper function avoids code duplication for left/right HOME zones

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created motion/react mock**
- **Found during:** Task 1 (PieceToken test setup)
- **Issue:** `src/__mocks__/motion/react.tsx` referenced in plan as "created by Plan 01 Task 2" but does not exist in this worktree (parallel execution)
- **Fix:** Created motion mock that renders motion.* components as plain HTML/SVG elements, stripping animation props
- **Files modified:** src/__mocks__/motion/react.tsx
- **Verification:** All motion-dependent tests pass without animation side effects
- **Committed in:** 4e4b8d3 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Motion mock was a prerequisite for all component tests. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PieceToken and HomeZone are ready for consumption by the Board component (Plan 03)
- TEAM_COLORS and TOKEN_RADIUS exported for reuse by other board components
- motion/react mock available for all future SVG component tests

## Self-Check: PASSED

- All 5 created files exist on disk
- Commit 4e4b8d3 (Task 1) verified in git log
- Commit b21f9b1 (Task 2) verified in git log
- Full test suite: 162 tests pass, 0 failures

---
*Phase: 03-2d-board-rendering*
*Completed: 2026-03-31*
