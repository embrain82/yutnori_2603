---
phase: 03-2d-board-rendering
plan: 01
subsystem: ui
tags: [svg, board, coordinates, react, yut-nori]

# Dependency graph
requires:
  - phase: 01-core-game-logic
    provides: Board graph (ROUTES, station IDs 0-28) and type definitions
provides:
  - STATION_COORDS mapping all 29 station IDs to SVG (x,y) coordinates
  - BOARD_VIEWBOX constant for SVG sizing
  - Board root SVG component with layered rendering
  - BoardBackground diamond outline and diagonal shortcut lines
  - Station dot component with type-based sizing (normal/corner/center)
  - Motion mock for component testing (Proxy-based tag passthrough)
affects: [03-02-PLAN, 03-03-PLAN, piece-rendering, board-interaction]

# Tech tracking
tech-stack:
  added: []
  patterns: [SVG coordinate system with lerp interpolation, data-attribute test targeting, Proxy-based motion mock]

key-files:
  created:
    - src/lib/yut/boardCoords.ts
    - src/lib/yut/__tests__/boardCoords.test.ts
    - src/components/board/Board.tsx
    - src/components/board/BoardBackground.tsx
    - src/components/board/Station.tsx
    - src/components/board/__tests__/Board.test.tsx
    - src/__mocks__/motion/react.tsx
  modified:
    - src/lib/yut/index.ts

key-decisions:
  - "Diamond layout with lerp interpolation for uniform station spacing"
  - "Station type classification (corner/center/normal) via Set lookup"
  - "data-station-id attribute on SVG circles for test targeting and future interaction"

patterns-established:
  - "SVG board layering: background -> stations -> highlights -> pieces -> animation"
  - "Proxy-based motion mock for testing components without animation library"
  - "StationCoord interface as shared contract between data layer and rendering"

requirements-completed: [BOARD-01]

# Metrics
duration: 3min
completed: 2026-03-31
---

# Phase 3 Plan 1: Board Coordinates & Static SVG Board Summary

**29-station diamond board with coordinate data layer, SVG background/stations, and full TDD coverage (19 tests)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-31T13:55:02Z
- **Completed:** 2026-03-31T13:58:41Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created boardCoords.ts data layer mapping all 29 stations to SVG coordinates in a diamond layout (500x500 viewBox)
- Built 3 board components (Board, BoardBackground, Station) rendering a complete static Yut Nori board
- Established motion mock pattern enabling component tests without animation library overhead
- All 164 tests pass (9 test files) with zero regressions against Phase 1/2

## Task Commits

Each task was committed atomically:

1. **Task 1: Create board coordinate mapping with TDD** - `8439a63` (feat)
2. **Task 2: Create static SVG board components with 29 stations** - `14632ac` (feat)

## Files Created/Modified
- `src/lib/yut/boardCoords.ts` - 29 station coordinates with diamond geometry, lerp interpolation, BOARD_VIEWBOX
- `src/lib/yut/__tests__/boardCoords.test.ts` - 12 unit tests for coordinates, bounds, overlap, and geometry
- `src/components/board/Board.tsx` - Root SVG container with layered rendering, accessibility attributes
- `src/components/board/BoardBackground.tsx` - Diamond polygon outline and diagonal shortcut lines
- `src/components/board/Station.tsx` - Individual station dot with type-based sizing (r=6 normal, r=10 corner/center)
- `src/components/board/__tests__/Board.test.tsx` - 7 integration tests for station count, sizing, accessibility
- `src/__mocks__/motion/react.tsx` - Proxy-based motion mock for component testing
- `src/lib/yut/index.ts` - Added boardCoords barrel export

## Decisions Made
- Diamond layout uses lerp interpolation for perfectly uniform station spacing along edges and diagonals
- Station type classification uses Set.has() for O(1) corner lookup
- data-station-id attribute enables both test targeting and future click/tap interaction
- SVG layer ordering established: background -> stations -> highlights (future) -> pieces (future) -> animating piece (future)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Vitest `-x` flag not supported in v4.1.2 (plan referenced it); used `vitest run` without bail flag instead. No impact on test execution.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all components render real data from STATION_COORDS.

## Next Phase Readiness
- STATION_COORDS and Board component ready for Plan 03-02 (piece tokens, highlights, interaction)
- Motion mock established for all future component tests
- SVG layer placeholders in Board.tsx ready for highlights (Layer 3), pieces (Layer 4), animation (Layer 5)

## Self-Check: PASSED

- All 8 files verified on disk
- Both task commits verified: 8439a63, 14632ac
- Full test suite: 164 tests passing across 9 files

---
*Phase: 03-2d-board-rendering*
*Completed: 2026-03-31*
