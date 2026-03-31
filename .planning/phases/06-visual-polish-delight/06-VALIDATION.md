---
phase: 06
slug: visual-polish-delight
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-01
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 with jsdom environment |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 8 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | VIS-01 | integration | `npx vitest run src/components/board/__tests__/PieceToken.test.tsx` | ✅ | ✅ green |
| 06-01-02 | 01 | 1 | VIS-01 | integration | `npx vitest run src/components/board/__tests__/HomeZone.test.tsx src/components/board/__tests__/Board.test.tsx` | ✅ | ✅ green |
| 06-02-01 | 02 | 2 | VIS-05 | unit + integration | `npx vitest run src/components/effects/__tests__/VictoryConfetti.test.tsx src/components/__tests__/Game.test.tsx` | ✅ | ✅ green |
| 06-02-02 | 02 | 2 | VIS-05, VIS-06 | integration | `npx vitest run src/components/effects/__tests__/DefeatEffect.test.tsx src/components/screens/__tests__/ResultScreen.test.tsx` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/components/effects/__tests__/VictoryConfetti.test.tsx` — covers once-only confetti fire, reset, and cleanup
- [x] `src/components/effects/__tests__/DefeatEffect.test.tsx` — covers defeat-state activation and clean unmount behavior
- [x] Existing board/result tests extended for character token visuals and encouraging defeat copy

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Character pieces remain readable on a real phone-size viewport | VIS-01 | SVG snapshots and DOM tests cannot fully judge readability, charm, or silhouette clarity at device scale | Open the play screen on a real phone or emulator, inspect both board and HOME zones, and confirm pieces remain legible without obscuring highlights |
| Victory celebration feels joyful without jank on mobile | VIS-05 | Confetti smoothness, pacing, and perceived delight depend on device performance | Win a game on a real device, confirm confetti bursts feel celebratory, do not freeze the UI, and do not block replay |
| Defeat treatment feels warm instead of punishing | VIS-06 | Emotional tone and pacing are subjective UX judgments | Lose a game, confirm the motion is brief and the copy feels encouraging while the replay CTA stays immediately obvious |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 8s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** passed
