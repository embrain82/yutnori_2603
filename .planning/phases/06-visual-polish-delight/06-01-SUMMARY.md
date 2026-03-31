---
phase: 06-visual-polish-delight
plan: 01
subsystem: board
tags: [svg, board, tokens, home-zone, vitest]

# Dependency graph
requires:
  - phase: 03-2d-board-rendering
    provides: board geometry, piece footprint, and HOME-zone interaction contract
  - phase: 05-game-screens-integration
    provides: live board state and final playable shell
provides:
  - Cute SVG-native character tokens for player and AI pieces
  - HOME-zone polish that matches the on-board token language
  - Board-surface refresh without touching station coordinates
affects: [06-visual-polish-delight]

# Tech tracking
tech-stack:
  added: []
  patterns: [svg-character-token, frozen-geometry-polish]

key-files:
  created: []
  modified:
    - src/components/board/PieceToken.tsx
    - src/components/board/HomeZone.tsx
    - src/components/board/Board.tsx
    - src/components/board/__tests__/PieceToken.test.tsx
    - src/components/board/__tests__/HomeZone.test.tsx
    - src/components/board/__tests__/Board.test.tsx

key-decisions:
  - "Character details stay inside the existing token footprint so board readability and touch targets do not regress"
  - "Selection rings remain above the new art, while stack badges stay readable above both"
  - "Phase 6 warms HOME and board surfaces without moving station coordinates or changing route geometry"

patterns-established:
  - "Decorative but lightweight SVG tokens: distinct charm for each team without raster assets"
  - "Presentation-only polish: HOME and board visuals can evolve while geometry remains frozen"

requirements-completed: [VIS-01]

# Metrics
duration: 3 min
completed: 2026-04-01
---

# Phase 6 Plan 1: Board Delight Summary

**Character-token piece art, warmer HOME zones, and a subtle board-surface refresh**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T01:12:00+09:00
- **Completed:** 2026-04-01T01:15:00+09:00
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Rebuilt `PieceToken` as a cute SVG-native character token with face details and team-specific ribbon/crest accents
- Preserved the board interaction contract: invisible 44px hit area, glow ring, gold selection ring, and stack badge support
- Updated HOME zones to share the same visual language as the board pieces instead of looking like a separate style
- Added board/home tests that lock the new decorative contract and confirm animating pieces reuse the same token art

## Task Commits

Git commits were not created during this execution. The work remains local in the current workspace.

## Files Created/Modified
- `src/components/board/PieceToken.tsx` - Character-token SVG renderer with team-specific accents and preserved interaction layers
- `src/components/board/HomeZone.tsx` - Warmer HOME-zone card treatment aligned with the new token style
- `src/components/board/Board.tsx` - Presentation-only board surface polish with frozen geometry
- `src/components/board/__tests__/PieceToken.test.tsx` - Decorative-art and selection-layer coverage
- `src/components/board/__tests__/HomeZone.test.tsx` - HOME-zone token language assertions
- `src/components/board/__tests__/Board.test.tsx` - On-board and animating-piece token contract coverage

## Decisions Made
- Team identity is carried by compact decorative accents rather than changing the piece footprint
- Stack and selection overlays remain part of the shared token component so HOME, board, and animation overlays stay consistent
- Board polish stays presentational only in Phase 6; no coordinate or path-layer churn was introduced

## Deviations from Plan

None - plan executed as specified.

## Issues Encountered

- The installed Vitest 4.1.2 CLI does not support `-x`, so equivalent direct `vitest run` commands were used during execution

## User Setup Required

None - no external setup or environment changes required.

## Next Phase Readiness
- The board now has a stronger character identity for the final polish pass
- Result-phase celebration work can build on the warmer visual tone without touching gameplay logic

## Self-Check: PASSED

- `src/components/board/__tests__/PieceToken.test.tsx` passes
- `src/components/board/__tests__/HomeZone.test.tsx` passes
- `src/components/board/__tests__/Board.test.tsx` passes

---
*Phase: 06-visual-polish-delight*
*Completed: 2026-04-01*
