# Codebase Concerns

**Analysis Date:** 2026-03-31

## Tech Debt

**Environment variable validation missing:**
- Issue: No runtime validation that `NEXT_PUBLIC_ALLOWED_ORIGIN` is properly set or has expected format before being used in postMessage origin checks.
- Files: `src/hooks/usePostMessage.ts`
- Impact: If env var is missing or malformed, origin validation could silently fail or pass with `'*'` (overpermissive). Security risk in iframe embedding scenarios.
- Fix approach: Add validation utility in `src/lib/rps/` to check env var format. Warn/error in dev if not configured. Document required env setup.

**Magic timeout values scattered across components:**
- Issue: Animation timing delays and durations are hardcoded in multiple places (500ms, 400ms, 800ms, 1000ms) without centralized constants.
- Files: `src/components/Game.tsx`, `src/components/effects/Confetti.tsx`, `src/components/effects/DefeatEffect.tsx`
- Impact: Changing animation timing requires updates in multiple files. Risk of timing mismatches between auto-advance delays and animation completion times.
- Fix approach: Create `src/lib/constants/animations.ts` with `ENTRY_DELAY`, `RESULT_DELAY`, `CONFETTI_BURST_TIMING` constants. Import in all animation components.

**No input validation on postMessage coupon config:**
- Issue: `usePostMessage.ts` accepts coupon config without schema validation — only checks presence of `type` field.
- Files: `src/hooks/usePostMessage.ts` lines 17-27
- Impact: Malformed coupon data (wrong types, oversized images, XSS-prone text) could cause runtime errors or security issues. Example: `couponImage` could be a data URI containing malicious content.
- Fix approach: Add Zod or similar schema validation for `CouponConfig`. Sanitize `couponText` (HTML-escape). Test with oversized/malicious inputs.

**Exhaustive-deps lint disable without documentation:**
- Issue: `SuspenseReveal.tsx` line 64 disables `react-hooks/exhaustive-deps` with no explanation.
- Files: `src/components/battle/SuspenseReveal.tsx` line 64
- Impact: Future maintainers may re-enable the rule causing unintended side effects. The effect SHOULD run once on mount (during `revealing` phase), but this isn't obvious.
- Fix approach: Add inline comment explaining why: "Effect runs once when component mounts (during 'revealing' phase). Adding dependencies would trigger re-runs on store updates, breaking animation sequence." Consider refactoring to make dependency array correct.

**Console-based logging only:**
- Issue: No structured logging. Error handling relies on implicit browser console. No way to track errors post-deployment.
- Files: Throughout codebase (e.g., `src/store/gameStore.ts`, `src/components/Game.tsx`)
- Impact: Production errors in iframe embedding are invisible. Coupon claims may fail silently. No observability.
- Fix approach: Add minimal logging layer (`src/lib/logging.ts`) wrapping `console` with optional remote logging hook. Post errors to parent frame on critical failures.

---

## Known Bugs

**No known bugs** identified in current implementation. Game logic tests are comprehensive. Store FSM transitions are well-covered.

---

## Security Considerations

**CORS/iframe security depends on environment configuration:**
- Risk: Hardcoded `X-Frame-Options: ALLOWALL` in `next.config.ts` permits embedding from ANY origin. No origin validation in CSP.
- Files: `next.config.ts` lines 16-17
- Current mitigation: `Content-Security-Policy: frame-ancestors` header respects `NEXT_PUBLIC_ALLOWED_ORIGIN` env var. But if env var is `'*'`, CSP becomes `frame-ancestors *` (no protection).
- Recommendations:
  1. Require `NEXT_PUBLIC_ALLOWED_ORIGIN` to be explicitly set in production (fail build if missing).
  2. Validate it's a valid origin format (scheme + domain).
  3. Document iframe embedding security requirements in README.
  4. Consider removing `X-Frame-Options: ALLOWALL` if CSP header alone is sufficient.

**postMessage origin validation bypassed if env var is permissive:**
- Risk: `usePostMessage.ts` allows `allowedOrigin === '*'` as default, disabling origin checks.
- Files: `src/hooks/usePostMessage.ts` lines 15, 44
- Current mitigation: `NEXT_PUBLIC_COUPON_CONFIG` and `RPS_GAME_WIN` messages can only trigger state changes; no direct DOM access or external APIs. Limited blast radius.
- Recommendations: Make `'*'` origin only allowed in development mode. Fail clearly in production if env var not set.

**Session IDs are UUIDs with no server-side validation:**
- Risk: `sessionId` (from `crypto.randomUUID()`) is sent to parent in postMessage win payload. If parent logs/stores it without validation, could be spoofed.
- Files: `src/lib/rps/session.ts` line 13
- Current mitigation: Parent receives session object via postMessage; client-side generation is cryptographically valid. Parent should validate UUID format server-side before issuing coupons.
- Recommendations: Document that parent application MUST validate session payload (UUID format, timestamp ordering) before claiming victory/issuing coupon. Add JSDoc note to `RpsGameWinMessage` interface.

---

## Performance Bottlenecks

**confetti.js canvas rendering on main thread (non-critical):**
- Problem: Even with `useWorker: true`, canvas-confetti creates DOM elements on the main thread. On very low-end mobile devices, 4 burst sequences may cause jank.
- Files: `src/components/effects/Confetti.tsx` lines 21-71
- Cause: Canvas-confetti particles are rendered via canvas (efficient) but DOM creation and garbage collection could spike briefly.
- Improvement path:
  1. Monitor performance on target devices (test on actual low-end Android).
  2. If jank occurs, reduce `particleCount` and `ticks` values.
  3. Consider deferring first burst until after victory screen animation completes (add larger ENTRY_DELAY).

**Motion.js animations may trigger layout thrashing:**
- Problem: Multiple `motion.div` components animate `rotateY`, `scale`, `filter` properties. Browser may recalculate layout for each.
- Files: `src/components/battle/SuspenseReveal.tsx`, `src/components/battle/ChoiceCard.tsx`, `src/components/screens/PlayScreen.tsx`
- Cause: Transforms are GPU-accelerated (good), but `filter` property (grayscale) forces full reflow on some browsers.
- Improvement path:
  1. Verify animations use only GPU-safe properties (`transform`, `opacity`).
  2. Avoid `filter` in DefeatEffect; use `mix-blend-mode` or CSS custom property with `@supports` fallback instead.
  3. Test on Chrome DevTools Performance tab on throttled mobile to confirm no layout thrashing.

**No virtualization for roundResults array:**
- Problem: Not immediately critical (max 5 rounds), but if UI ever displays full game history, array grows unbounded per session.
- Files: `src/store/gameStore.ts` line 27, `src/components/screens/ResultScreen.tsx`
- Cause: Round results stored in Zustand store, re-sent in postMessage payload on each game end.
- Improvement path:
  1. Document max session size (5 rounds × payload ~ 200 bytes = 1KB per game, acceptable).
  2. If extended to tournament mode (100s of games), implement session archival/cleanup.

---

## Fragile Areas

**SuspenseReveal animation sequence is timing-dependent:**
- Files: `src/components/battle/SuspenseReveal.tsx` lines 39-62
- Why fragile: Animation sequences are chained awaits with hardcoded durations (0.6s + 0.6s + 0.3s = 1.5s total). If `revealDone()` action has side effects or if parent changes phase before animation completes, state may desync.
- Safe modification:
  1. Never change durations without updating timing tests.
  2. Ensure `revealDone()` is idempotent (safe to call multiple times).
  3. Add guard in `PlayScreen` to prevent phase changes during reveal animation.
  4. Test edge case: user rapidly clicks buttons during reveal sequence.
- Test coverage: `SuspenseReveal.test.tsx` covers animation completion. Add tests for cancelled reveals (phase changes mid-animation).

**Game FSM relies on Zustand's atomic set() calls:**
- Files: `src/store/gameStore.ts`, all action methods
- Why fragile: Store depends on single `set()` call batching multiple state updates. If a future refactor splits updates across multiple `set()` calls, components could read inconsistent state (e.g., `phase === 'revealing'` but `aiChoice === null`).
- Safe modification:
  1. Always batch related state updates in ONE `set()` call (as current code does).
  2. Never fire multiple `set()` calls in sequence within a single action method.
  3. Add comment near each action explaining the atomic update guarantee.
  4. Write tests that verify intermediate state is never exposed (hard to test in current setup, but document the risk).
- Test coverage: Good. All action tests verify state consistency post-action.

**postMessage listener cleanup assumes single instance:**
- Files: `src/hooks/usePostMessage.ts` lines 30-31
- Why fragile: If `Game` component is mounted multiple times (e.g., in tests, or if dynamic import loads twice), multiple listeners could attach to `window.message` event. Each listener calls `setCouponConfig`, potentially causing duplicate updates.
- Safe modification:
  1. Verify Game component is wrapped with `dynamic({ ssr: false })` in `app/page.tsx` (it is — good).
  2. Add test that confirms listener is cleaned up on unmount.
  3. Consider adding a ref-based guard to ensure only one listener is active: `if (listenerRef.current) return;` before `addEventListener`.
- Test coverage: No test for multiple mounts. Add test for listener cleanup.

**Canvas-confetti global state (confetti.reset()):**
- Files: `src/components/effects/Confetti.tsx` line 81
- Why fragile: `confetti.reset()` is a global library call. If multiple games are embedded on the same page, calling reset in one game could affect others.
- Safe modification:
  1. Document: one game per page/iframe. If ever supporting multiple, refactor confetti to be instance-based.
  2. Verify in iframe integration tests that confetti fires independently in separate iframes.
- Test coverage: No test. Assume single-instance use case documented.

---

## Scaling Limits

**Session playload grows linearly with rounds:**
- Current capacity: 5 rounds × ~200 bytes = ~1KB per session. Acceptable for postMessage.
- Limit: If extended to tournament/season mode (1000 games), session array becomes ~1MB. PostMessage still works but approaches browser message size limits.
- Scaling path: Archive old sessions server-side. Send only current session in postMessage. Store history separately.

**Zustand store keeps all games in memory until page reload:**
- Current capacity: One game at a time, ~2KB state. Multiple retries accumulate session history in `roundResults`.
- Limit: If game runs in low-power environment (8MB RAM devices), repeated plays without page reload could accumulate state.
- Scaling path: Implement explicit cleanup on retry (`retry()` already resets, but doesn't clear old session objects). Consider WeakMap for old sessions if memory becomes an issue.

---

## Dependencies at Risk

**canvas-confetti v1.x is stable but unmaintained:**
- Risk: Package has no updates since 2021. If browser canvas APIs change, no updates will be provided.
- Impact: Low risk for RPS game (canvas is stable). High risk if features expand to custom particle effects.
- Migration plan: If confetti stops working post-update, switch to `react-confetti-explosion` (4KB CSS-only alternative) or implement custom canvas-based effect.

**motion v12.x requires explicit React 19 compatibility:**
- Risk: motion package closely tracks React releases. If React 20 arrives and motion doesn't update quickly, incompatibility.
- Impact: Medium risk. motion maintainers are responsive. Update within weeks.
- Migration plan: Monitor motion releases. Update to latest minor version monthly. If stuck on old motion, implement fallback CSS animations for key transitions.

**No package lock file checks in CI:**
- Risk: `package-lock.json` exists but no CI pipeline enforces lock file consistency (no `npm ci` command in scripts).
- Impact: Team members might run `npm install` (upgrades) instead of `npm ci` (locks to exact versions). Drift in environments.
- Migration plan: Add CI job (`npm ci`) to build/test pipeline. Document: developers must use `npm ci` not `npm install`.

---

## Missing Critical Features

**No error boundary for React components:**
- Problem: If Game, PlayScreen, or any component throws, entire game crashes silently. No fallback UI or error reporting.
- Blocks: Graceful degradation. Post-deployment debugging of component crashes.
- Fix approach: Add `ErrorBoundary` wrapper in `app/page.tsx`. Log errors to parent via postMessage `RPS_GAME_ERROR` message. Display fallback UI with "Game crashed. Please refresh."

**No analytics/telemetry:**
- Problem: Can't track game engagement (play rate, win rate, session duration) post-deployment.
- Blocks: Understanding user behavior. Tuning difficulty (win rate curve).
- Fix approach: Add optional analytics hook. Send anonymous events (session duration, outcome) to parent via postMessage on game end.

**No accessibility (a11y) audit:**
- Problem: Color contrast, button sizing (44px minimum is good), keyboard navigation, screen reader support not verified.
- Blocks: Players with disabilities. Compliance with WCAG 2.1 AA.
- Fix approach: Run axe or Lighthouse a11y audit. Add `aria-label` to buttons. Test with keyboard navigation. Verify audio alternatives if confetti sound ever added.

---

## Test Coverage Gaps

**Component integration tests missing:**
- Untested area: Game component FSM: idle → selecting → revealing → result → (victory | gameover)
- Files: `src/components/Game.tsx`, `src/components/screens/*.tsx`, `src/store/gameStore.ts`
- Risk: Phase transitions could break without being caught. Auto-advance timer logic untested (lines 24-43).
- Priority: **High** — Auto-advance is critical to UX. If timer doesn't fire, result screen hangs.

**UI component rendering with different game states:**
- Untested area: PlayScreen, ResultScreen, IdleScreen with all phase values. Example: PlayScreen should disable buttons when `phase !== 'selecting'`, but this isn't tested.
- Files: `src/components/screens/__tests__/PlayScreen.test.tsx`, `src/components/screens/__tests__/ResultScreen.test.tsx`
- Risk: UI could render stale buttons or incorrect content in edge cases.
- Priority: **Medium** — Catches UI bugs but not game logic bugs.

**postMessage integration with parent window:**
- Untested area: Full integration: send coupon config in, receive game win out. Origin validation. Multiple postMessage events.
- Files: `src/hooks/usePostMessage.ts`
- Risk: Embedding in real parent application might fail due to timing issues or mismatched message formats.
- Priority: **High** — Can only be tested in integration/E2E environment, not unit tests. Requires mock parent window setup.

**Error scenarios in aiEngine and gameStore:**
- Untested area: Edge cases: invalid round index (> 4), invalid choice, null state during transitions.
- Files: `src/lib/rps/aiEngine.ts`, `src/store/gameStore.ts`
- Risk: Unlikely given current constraints, but if API changes or refactoring occurs, defensive checks could be removed accidentally.
- Priority: **Low** — Current tests cover happy path thoroughly. Only needed if adding new features.

**Canvas confetti behavior under low memory:**
- Untested area: Confetti rendering on low-end devices. Mobile Safari with reduced motion. Accessibility testing.
- Files: `src/components/effects/Confetti.tsx`
- Risk: Confetti could fail silently or cause jank on target devices.
- Priority: **Medium** — Should test on actual low-end Android (Galaxy A10 or similar) before launch.

---

*Concerns audit: 2026-03-31*
