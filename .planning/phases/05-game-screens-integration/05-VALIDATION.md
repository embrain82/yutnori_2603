---
phase: 05
slug: game-screens-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 with jsdom environment |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~12 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 12 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | VIS-02 | unit | `npx vitest run src/lib/yut/__tests__/moveCandidates.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | INTG-03 | unit | `npx vitest run src/lib/yut/__tests__/session.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | VIS-02 | integration | `npx vitest run src/store/__tests__/gameStore.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | VIS-02, VIS-04 | integration | `npx vitest run src/components/screens/__tests__/PlayScreen.test.tsx -x` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | VIS-02 | integration | `npx vitest run src/components/__tests__/Game.test.tsx src/components/screens/__tests__/ResultScreen.test.tsx -x` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 3 | VIS-03, VIS-04 | integration | `npx vitest run src/store/__tests__/gameStore.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 3 | INTG-01, INTG-02, INTG-03 | hook + integration | `npx vitest run src/hooks/__tests__/usePostMessage.test.tsx src/components/__tests__/Game.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/yut/__tests__/moveCandidates.test.ts` — covers branch-aware move candidate generation for the UI
- [ ] `src/lib/yut/__tests__/session.test.ts` — covers session immutability and lifecycle payload creation
- [ ] `src/store/__tests__/gameStore.test.ts` — covers throw queue drain, turn switching, and player/AI phase transitions
- [ ] `src/components/screens/__tests__/PlayScreen.test.tsx` — covers turn banner, AI thinking state, emoji reaction, and direct-tap board controls
- [ ] `src/components/screens/__tests__/ResultScreen.test.tsx` — covers victory/defeat rendering and coupon fallback copy
- [ ] `src/components/__tests__/Game.test.tsx` — covers phase-driven screen orchestration and AI timer wiring
- [ ] `src/hooks/__tests__/usePostMessage.test.tsx` — covers inbound config, start/end messages, and victory message delivery

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Game fits correctly inside the native app iframe/WebView shell | INTG-02 | jsdom cannot validate real iframe sizing, safe areas, or native container chrome | Open the built page inside the target WebView container, confirm no clipped board, off-screen CTA, or broken safe-area spacing |
| Native app receives lifecycle and victory messages end-to-end | INTG-01, INTG-03 | Local tests can spy on `postMessage`, but not verify the native listener or downstream coupon flow | Use a parent test harness or native debug shell, start one game, finish both a loss and a win, and confirm all three message types arrive exactly once |
| AI thinking delay feels readable but not sluggish | VIS-03 | UX pacing is subjective and needs a human timing check | Play at least 5 full turns and confirm `생각 중...` is noticeable without making the game feel stalled |
| AI emoji reactions feel contextually believable | VIS-04 | Emotional tone is qualitative, not just structural | Observe AI reactions during neutral turns, captures, and near-finish pressure; confirm the reaction changes make intuitive sense |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 12s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
