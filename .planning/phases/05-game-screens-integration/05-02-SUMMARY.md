---
phase: 05-game-screens-integration
plan: 02
subsystem: ui
tags: [react, motion, screens, board, ai-persona, yut-nori]

# Dependency graph
requires:
  - phase: 05-01
    provides: state selectors and actions for game flow
  - phase: 03-2d-board-rendering
    provides: Board, HomeZone, hop animation, and selection visuals
  - phase: 04-3d-yut-throwing
    provides: YutThrowOverlay and board-backed throw composition
provides:
  - Turn banner and AI reaction capsule
  - Idle, play, and result screens
  - Phase-driven Game shell that keeps the board mounted during active play
affects: [05-game-screens-integration, 06-visual-polish-delight]

# Tech tracking
tech-stack:
  added: []
  patterns: [board-backed-play-shell, phase-driven-screen-router, lightweight-ai-persona-ui]

key-files:
  created:
    - src/components/game/TurnBanner.tsx
    - src/components/game/AiReactionBubble.tsx
    - src/components/screens/IdleScreen.tsx
    - src/components/screens/PlayScreen.tsx
    - src/components/screens/ResultScreen.tsx
    - src/components/screens/__tests__/PlayScreen.test.tsx
    - src/components/screens/__tests__/ResultScreen.test.tsx
    - src/components/Game.tsx
    - src/components/__tests__/Game.test.tsx
  modified: []

key-decisions:
  - "The board stays visible through all active gameplay phases so throw, selection, and move animation feel like one surface"
  - "AI emotion stays a lightweight overlay bubble instead of becoming a separate character panel"
  - "Idle and result screens stay in the same root shell so phase transitions remain motion-driven and easy to reason about"

patterns-established:
  - "Board-backed play shell: HOME zones, board, queue, throw overlay, and stack prompt share one screen"
  - "Phase-driven orchestration: one root Game component routes the app between idle, play, and result"

requirements-completed: [VIS-02, VIS-04]

# Metrics
duration: 4 min
completed: 2026-04-01
---

# Phase 5 Plan 2: Screen Shell Summary

**Board-backed game screens with persistent turn context, AI reaction UI, and a reusable phase router**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-31T15:44:00Z
- **Completed:** 2026-03-31T15:48:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Added `TurnBanner` for persistent `내 차례` / `AI 차례` context and remaining-throw visibility
- Added `AiReactionBubble` so the AI can show neutral, excited, worried, and smug reactions without crowding the board
- Built `IdleScreen`, `PlayScreen`, and `ResultScreen` around the real store instead of the temporary throw demo
- Added a root `Game` component that keeps the play shell mounted across active phases to avoid board remounts mid-turn

## Task Commits

Git commits were not created during this execution. The work remains local in the current workspace.

## Files Created/Modified
- `src/components/game/TurnBanner.tsx` - Current-turn badge with remaining throw count
- `src/components/game/AiReactionBubble.tsx` - Emoji reaction capsule and thinking label
- `src/components/screens/IdleScreen.tsx` - Game start entry screen
- `src/components/screens/PlayScreen.tsx` - Main play shell with board, queue, overlay, and stack prompt
- `src/components/screens/ResultScreen.tsx` - Victory/defeat screen with coupon area and replay CTA
- `src/components/screens/__tests__/PlayScreen.test.tsx` - Play shell coverage for banner, throw button, AI bubble, and stack prompt
- `src/components/screens/__tests__/ResultScreen.test.tsx` - Victory/defeat and coupon rendering coverage
- `src/components/Game.tsx` - Phase-driven screen orchestrator
- `src/components/__tests__/Game.test.tsx` - Idle/play/result routing coverage

## Decisions Made
- The queue remains visible on the play screen so extra throws and pending moves are always legible
- The throw overlay continues to sit above the board from Phase 4 instead of introducing a separate full-screen throw page
- Result handling stayed lightweight and replay-focused because celebration polish belongs to Phase 6

## Deviations from Plan

None - plan executed as specified.

## Issues Encountered

- None beyond normal test-mocking work. The Phase 3 and Phase 4 contracts reused cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The app now has a full screen shell for idle, active play, and results
- AI pacing and bridge logic can be layered into the existing `Game` shell without replacing the UI structure

## Self-Check: PASSED

- `src/components/screens/__tests__/PlayScreen.test.tsx` passes
- `src/components/screens/__tests__/ResultScreen.test.tsx` passes
- `src/components/__tests__/Game.test.tsx` passes

---
*Phase: 05-game-screens-integration*
*Completed: 2026-04-01*
