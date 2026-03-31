---
phase: 06-visual-polish-delight
plan: 02
subsystem: result-flow
tags: [motion, canvas-confetti, result-screen, polish, vitest]

# Dependency graph
requires:
  - phase: 05-game-screens-integration
    provides: verified result-phase routing, replay flow, and bridge timing
  - phase: 06-01
    provides: final visual tone for board and token polish
provides:
  - Replay-safe victory confetti side effect
  - Warm defeat treatment that keeps replay obvious
  - Polished result-screen hierarchy for win and loss states
affects: [06-visual-polish-delight]

# Tech tracking
tech-stack:
  added: []
  patterns: [replay-safe-effects, decorative-result-phase]

key-files:
  created:
    - src/components/effects/VictoryConfetti.tsx
    - src/components/effects/DefeatEffect.tsx
    - src/components/effects/__tests__/VictoryConfetti.test.tsx
    - src/components/effects/__tests__/DefeatEffect.test.tsx
  modified:
    - src/components/screens/ResultScreen.tsx
    - src/components/screens/__tests__/ResultScreen.test.tsx
    - src/components/Game.tsx
    - src/components/__tests__/Game.test.tsx

key-decisions:
  - "Victory confetti remains a UI-owned side effect that resets whenever the app leaves the victory phase"
  - "Defeat polish stays declarative and wraps the result UI without introducing new store transitions"
  - "ResultScreen copy and hierarchy are upgraded while replay and coupon behavior stay intact"

patterns-established:
  - "Result decoration without flow mutation: Game adds visual effects around the verified Phase 5 phase router"
  - "Effect safety tests: UI side effects are locked with cleanup and replay-oriented coverage"

requirements-completed: [VIS-05, VIS-06]

# Metrics
duration: 3 min
completed: 2026-04-01
---

# Phase 6 Plan 2: Celebration Summary

**Replay-safe victory confetti, encouraging defeat polish, and a richer result screen**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T01:15:00+09:00
- **Completed:** 2026-04-01T01:18:27+09:00
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added `VictoryConfetti` with once-only fire logic, multi-burst timing, reduced-motion support, and cleanup/reset handling
- Added `DefeatEffect` as a lightweight motion wrapper that softens loss presentation without touching store semantics
- Polished `ResultScreen` copy and hierarchy so victory feels gift-like and defeat stays warm and replay-forward
- Wired both effect components into `Game` as decorative layers around the existing verified result route

## Task Commits

Git commits were not created during this execution. The work remains local in the current workspace.

## Files Created/Modified
- `src/components/effects/VictoryConfetti.tsx` - Replay-safe confetti bursts for victory
- `src/components/effects/DefeatEffect.tsx` - Declarative defeat wrapper with gentle motion styling
- `src/components/effects/__tests__/VictoryConfetti.test.tsx` - Coverage for once-only firing, reset, and cleanup
- `src/components/effects/__tests__/DefeatEffect.test.tsx` - Coverage for defeat-only activation and clean unmount
- `src/components/screens/ResultScreen.tsx` - Richer celebration/encouragement copy and result-card hierarchy
- `src/components/screens/__tests__/ResultScreen.test.tsx` - Coverage for the new victory/defeat copy contract
- `src/components/Game.tsx` - Result-phase effect integration that preserves Phase 5 routing
- `src/components/__tests__/Game.test.tsx` - Coverage for victory and defeat effect wiring

## Decisions Made
- Confetti uses `canvas-confetti` directly instead of store state so victory remains replay-safe and side-effect owned
- Defeat polish stays declarative with `motion/react`, which avoids extra timers and keeps React lint happy
- Coupon rendering remains in `ResultScreen` so existing host integration behavior stays untouched

## Deviations from Plan

None - plan executed as specified.

## Issues Encountered

- `canvas-confetti` mocking in Vitest required `vi.hoisted(...)` because the module mock is hoisted before regular top-level declarations

## User Setup Required

None - the new polish uses only existing dependencies.

## Next Phase Readiness
- The milestone now has its final emotional finish for both wins and losses
- Remaining validation is human-only device feel and WebView sanity checks, not missing functionality

## Self-Check: PASSED

- `src/components/effects/__tests__/VictoryConfetti.test.tsx` passes
- `src/components/effects/__tests__/DefeatEffect.test.tsx` passes
- `src/components/screens/__tests__/ResultScreen.test.tsx` passes
- `src/components/__tests__/Game.test.tsx` passes

---
*Phase: 06-visual-polish-delight*
*Completed: 2026-04-01*
