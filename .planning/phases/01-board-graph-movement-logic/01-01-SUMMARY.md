---
phase: 01-board-graph-movement-logic
plan: 01
subsystem: game-logic
tags: [typescript, vitest, yut-nori, board-graph, probability]

# Dependency graph
requires: []
provides:
  - "ThrowName, THROW_STEPS, GRANTS_EXTRA_THROW type contracts for all game logic"
  - "Board graph with 29 stations, 5 routes, 2 branch points"
  - "generateThrow() with traditional probability distribution"
  - "PiecePosition, PieceState, ThrowResult, MoveResult, MoveOption, TurnState, GameLogicState interfaces"
  - "Vitest test infrastructure with jsdom environment"
affects: [01-02-PLAN, 01-03-PLAN, 02-state-management, 03-board-ui]

# Tech tracking
tech-stack:
  added: [next@16.2.1, react@19.2.4, vitest@4.1.2, zustand@5.0.12, motion@12.38.0, tailwindcss@4]
  patterns: [pure-functional-game-logic, route-based-board-graph, tdd-red-green-refactor]

key-files:
  created:
    - src/lib/yut/types.ts
    - src/lib/yut/board.ts
    - src/lib/yut/throw.ts
    - src/lib/yut/__tests__/types.test.ts
    - src/lib/yut/__tests__/board.test.ts
    - src/lib/yut/__tests__/throw.test.ts
    - vitest.config.ts
    - package.json
  modified: []

key-decisions:
  - "Board modeled as 5 hardcoded route arrays with piece position tracked as (routeId, indexInRoute)"
  - "Station IDs are plain numbers (0-28), not enums, for array indexing simplicity"
  - "Throw uses 4 independent Math.random() calls matching real yut stick physics"

patterns-established:
  - "Pure functional game logic in src/lib/yut/ with zero rendering dependencies"
  - "Route-based directed graph: each piece tracks current route and position within that route"
  - "TDD workflow: tests written before implementation, verified via vitest"

requirements-completed: [GAME-01, GAME-04, GAME-05]

# Metrics
duration: 4min
completed: 2026-03-31
---

# Phase 01 Plan 01: Foundation Summary

**Next.js project scaffold with Yut Nori type system, 29-station board graph, and throw generation with traditional probability distribution (do=25%, gae=37.5%, geol=25%, yut=6.25%, mo=6.25%)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-31T08:40:25Z
- **Completed:** 2026-03-31T08:44:50Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments
- Scaffolded complete Next.js 16 project mirroring RPS reference patterns (package.json, vitest, tsconfig, eslint, postcss, tailwind)
- Created types.ts with 13+ exported type/interface/constant definitions (ThrowName, THROW_STEPS, GRANTS_EXTRA_THROW, HOME, FINISH, Team, PiecePosition, PieceState, ThrowResult, MoveResult, MoveOption, TurnState, GameLogicState)
- Created board.ts with 5 routes (outer 20 stations, diag_right 6, diag_left 6, center_down 3, center_up 3) totaling 29 unique stations and 2 branch points at S5 and S10
- Created generateThrow() with traditional 4-stick probability simulation, verified via deterministic mocked tests and statistical distribution test (10000 throws)
- All 34 tests passing across 3 test files with zero TypeScript compilation errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold project and create types + board graph with tests** - `5a076b0` (feat)
2. **Task 2: Implement throw generation with traditional probability and tests** - `abc7aa2` (feat)
3. **Chore: Add reference project to gitignore** - `94ec956` (chore)

## Files Created/Modified
- `package.json` - Yut Nori project with Next.js 16, React 19, Vitest 4, Zustand 5
- `vitest.config.ts` - Test runner with jsdom, path alias, setup file
- `tsconfig.json` - Strict TypeScript with @/* path alias, excludes reference project
- `next.config.ts` - CSP and X-Frame-Options headers for WebView embedding
- `postcss.config.mjs` - Tailwind CSS v4 PostCSS plugin
- `eslint.config.mjs` - Next.js ESLint flat config
- `src/app/layout.tsx` - Root layout with Geist fonts and Korean lang
- `src/app/page.tsx` - Minimal placeholder page
- `src/app/globals.css` - Tailwind v4 import with CSS custom properties
- `src/__tests__/setup.ts` - Testing Library matchers for vitest
- `src/lib/yut/types.ts` - All type definitions and constants for Yut Nori game logic
- `src/lib/yut/board.ts` - Board graph route arrays and branch point definitions
- `src/lib/yut/throw.ts` - Throw result generation with traditional probability
- `src/lib/yut/__tests__/types.test.ts` - 14 tests validating type constants
- `src/lib/yut/__tests__/board.test.ts` - 12 tests validating board graph topology
- `src/lib/yut/__tests__/throw.test.ts` - 8 tests validating throw generation and probability
- `.gitignore` - Standard Next.js ignores plus reference project exclusion

## Decisions Made
- Board modeled as 5 hardcoded route arrays with piece position tracked as (routeId, indexInRoute) -- chosen over adjacency list for predictable linear traversal
- Station IDs are plain numbers (0-28), not enums, for array indexing simplicity
- Throw uses 4 independent Math.random() calls, each with 0.5 threshold, matching real yut stick physics
- Excluded 260330_rps/ from tsconfig and gitignore since it is reference material only

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Excluded 260330_rps/ from TypeScript compilation**
- **Found during:** Task 2 (tsc --noEmit verification)
- **Issue:** `npx tsc --noEmit` picked up the 260330_rps/ reference directory and reported 65+ errors from that project's unresolved imports
- **Fix:** Added `260330_rps` to tsconfig.json `exclude` array and `.gitignore`
- **Files modified:** tsconfig.json, .gitignore
- **Verification:** `npx tsc --noEmit` succeeds with zero errors
- **Committed in:** abc7aa2 (tsconfig change), 94ec956 (.gitignore)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for clean TypeScript compilation. No scope creep.

## Issues Encountered
None -- plan executed smoothly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- types.ts provides all type contracts needed by plans 01-02 (movement resolution) and 01-03 (game state management)
- board.ts provides route/station data for movement resolution in plan 01-02
- throw.ts provides generateThrow() for turn flow in plan 01-03
- All foundation modules have zero rendering dependencies, ready for Zustand store integration (Phase 2)

## Self-Check: PASSED

All 9 key files verified on disk. All 3 commit hashes found in git log. 34/34 tests passing. TypeScript compiles with zero errors.

---
*Phase: 01-board-graph-movement-logic*
*Completed: 2026-03-31*
