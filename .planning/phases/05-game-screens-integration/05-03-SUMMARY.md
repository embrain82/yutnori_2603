---
phase: 05-game-screens-integration
plan: 03
subsystem: integration
tags: [nextjs, postmessage, ai-pacing, webview, game-shell, yut-nori]

# Dependency graph
requires:
  - phase: 05-01
    provides: store, session helpers, and candidate model
  - phase: 05-02
    provides: Game shell and active play screen
provides:
  - Visible incremental AI turn pacing
  - Once-only WebView lifecycle and victory bridge messages
  - Final page entry for the real game instead of the throw-only demo
affects: [05-game-screens-integration, 06-visual-polish-delight]

# Tech tracking
tech-stack:
  added: []
  patterns: [ui-owned-ai-delay, once-only-bridge-refs, client-wrapper-dynamic-entry]

key-files:
  created:
    - src/hooks/usePostMessage.ts
    - src/hooks/__tests__/usePostMessage.test.tsx
    - src/components/GameEntry.tsx
  modified:
    - src/lib/yut/ai.ts
    - src/lib/yut/__tests__/ai.test.ts
    - src/store/gameStore.ts
    - src/store/__tests__/gameStore.test.ts
    - src/components/Game.tsx
    - src/components/__tests__/Game.test.tsx
    - src/components/throw/__tests__/ThrowDemo.test.tsx
    - src/app/page.tsx

key-decisions:
  - "AI consumes the same queued move-candidate model as the player, but skips the tap step and resolves into animation directly"
  - "Bridge sends use once-only refs keyed off store phase/session state so duplicate messages are impossible across rerenders"
  - "Next.js 16's `ssr: false` restriction in Server Components is handled with a tiny client-side `GameEntry` wrapper instead of falling back to the old demo page"

patterns-established:
  - "UI-owned AI pacing: `Game` schedules the 900ms delay while the store stays deterministic"
  - "Client wrapper dynamic entry: server `page.tsx` stays simple while the client wrapper owns the no-SSR loading boundary"

requirements-completed: [VIS-03, INTG-01, INTG-02, INTG-03]

# Metrics
duration: 8 min
completed: 2026-04-01
---

# Phase 5 Plan 3: Integration Summary

**AI pacing, typed WebView bridge messaging, and the final game entry replacing the Phase 4 preview harness**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-31T15:48:00Z
- **Completed:** 2026-03-31T15:56:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Added `selectAiCandidate()` and rewired the store so AI throws, auto-selects, animates, reacts, and finalizes wins without a hidden synchronous jump
- Added turn/session recording and exact-once finalization so `YUT_GAME_END` / `YUT_GAME_WIN` only fire after a finalized payload exists
- Added `usePostMessage()` for inbound coupon config and outbound `YUT_GAME_START`, `YUT_GAME_END`, `YUT_GAME_WIN`
- Swapped the app entry from the temporary throw demo to the real game flow, with a client wrapper to satisfy Next.js 16 build constraints

## Task Commits

Git commits were not created during this execution. The work remains local in the current workspace.

## Files Created/Modified
- `src/lib/yut/ai.ts` - Added AI candidate selection over UI-ready move candidates
- `src/lib/yut/__tests__/ai.test.ts` - Added candidate-selection coverage and cleaned stale warnings
- `src/store/gameStore.ts` - Added AI pacing, session finalization, turn recording, and bridge-ready end-state handling
- `src/store/__tests__/gameStore.test.ts` - Added AI and finalization regression coverage
- `src/hooks/usePostMessage.ts` - Added inbound coupon config and once-only outbound bridge sends
- `src/hooks/__tests__/usePostMessage.test.tsx` - Added bridge start/end/win and inbound config coverage
- `src/components/Game.tsx` - Added `usePostMessage()` and the 900ms AI timer
- `src/components/__tests__/Game.test.tsx` - Added AI timer coverage
- `src/components/GameEntry.tsx` - Client-side dynamic wrapper for the real game entry
- `src/app/page.tsx` - Server page now renders the real game entry instead of the throw preview
- `src/components/throw/__tests__/ThrowDemo.test.tsx` - Updated the page-level regression to match the new entrypoint

## Decisions Made
- AI reaction is derived from the resolved move outcome, with capture/finish overriding worry or smug fallback
- Outbound `postMessage` no-ops when the game runs top-level without a parent frame, so local browsing does not emit false integration noise
- The final page entry uses a tiny client wrapper because `next/dynamic(..., { ssr: false })` cannot be declared directly in a Next.js 16 server `page.tsx`

## Deviations from Plan

### Auto-fixed Issues

**1. [Next.js 16 Build Constraint] Moved the no-SSR dynamic boundary into `GameEntry`**
- **Found during:** final production build verification
- **Issue:** Next.js 16 rejects `ssr: false` inside a Server Component `page.tsx`
- **Fix:** Created `src/components/GameEntry.tsx` as a client wrapper that owns the dynamic import, and kept `src/app/page.tsx` as a simple server component
- **Files modified:** `src/components/GameEntry.tsx`, `src/app/page.tsx`
- **Verification:** `npm run build` passes

## Issues Encountered

- The original plan's direct `page.tsx` dynamic import shape is no longer valid under Next.js 16 Server Component rules

## User Setup Required

None for local development. A real parent iframe/WebView harness is still needed for human end-to-end bridge verification.

## Next Phase Readiness
- The app now runs as the real playable game instead of a throw-only preview
- Phase 6 can focus on visual delight and polish without reworking turn flow or integration seams

## Self-Check: PASSED

- `src/hooks/__tests__/usePostMessage.test.tsx` passes
- `src/components/__tests__/Game.test.tsx` passes
- `src/store/__tests__/gameStore.test.ts` passes
- `npm run build` passes

---
*Phase: 05-game-screens-integration*
*Completed: 2026-04-01*
