---
phase: 03
slug: 2d-board-rendering
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 with jsdom environment |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | BOARD-01 | unit | `npx vitest run src/lib/yut/__tests__/boardCoords.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | BOARD-01 | integration | `npx vitest run src/components/board/__tests__/Board.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | BOARD-02 | integration | `npx vitest run src/components/board/__tests__/PieceToken.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | BOARD-03 | unit | `npx vitest run src/components/board/__tests__/PieceToken.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | BOARD-04 | integration | `npx vitest run src/components/board/__tests__/Board.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 2 | BOARD-05 | integration | `npx vitest run src/components/board/__tests__/Board.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-03-03 | 03 | 2 | BOARD-06 | unit (mock) | `npx vitest run src/components/board/__tests__/HopAnimation.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/yut/__tests__/boardCoords.test.ts` — covers BOARD-01 (29 coords, no overlaps, correct diamond geometry)
- [ ] `src/components/board/__tests__/Board.test.tsx` — covers BOARD-01, BOARD-04, BOARD-05 (SVG renders, highlights, branch choice)
- [ ] `src/components/board/__tests__/PieceToken.test.tsx` — covers BOARD-02, BOARD-03 (team colors, stack badge)
- [ ] `src/components/board/__tests__/HopAnimation.test.tsx` — covers BOARD-06 (hop animation sequence)
- [ ] `src/__mocks__/motion/react.tsx` — motion library mock for component tests (update existing if present)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Diamond layout looks visually correct | BOARD-01 | Coordinate math produces valid positions, but visual aesthetic (spacing, proportions) requires human eye | Open dev server, verify board shape matches traditional Yut Nori diamond |
| Hop animation feels smooth and natural | BOARD-06 | Timing and easing quality is subjective | Watch 5+ hop animations, verify each station is visited visually |
| Touch targets are easy to tap on mobile | BOARD-02, BOARD-04 | 44px minimum verifiable, but actual mobile UX requires device testing | Test on iPhone Safari and Android Chrome |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
