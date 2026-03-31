---
phase: 04
slug: 3d-yut-throwing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 04 — Validation Strategy

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
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | THROW-03 | unit | `npx vitest run src/lib/yut/__tests__/throwPose.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | THROW-01 | unit | `npx vitest run src/lib/throw3d/__tests__/resourceTracker.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | THROW-01 | unit (mocked scene lifecycle) | `npx vitest run src/hooks/__tests__/useYutThrowScene.test.tsx -x` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | THROW-02, THROW-03 | integration (mocked timing) | `npx vitest run src/components/throw/__tests__/YutThrowOverlay.test.tsx -x` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | THROW-04 | integration | `npx vitest run src/components/throw/__tests__/ThrowDemo.test.tsx -x` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 3 | THROW-05 | integration | `npx vitest run src/components/throw/__tests__/YutThrowOverlay.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/yut/__tests__/throwPose.test.ts` — covers `THROW-03` target-face mapping
- [ ] `src/lib/throw3d/__tests__/resourceTracker.test.ts` — proves tracked disposables are removed/disposed
- [ ] `src/hooks/__tests__/useYutThrowScene.test.tsx` — proves scene controller mount/dispose flow
- [ ] `src/components/throw/__tests__/YutThrowOverlay.test.tsx` — covers overlay state transitions and centered result reveal
- [ ] `src/components/throw/__tests__/ThrowDemo.test.tsx` — covers throw button launch flow and repeat throws

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stick motion feels naturally bouncy and readable | THROW-02 | Physical "feel" is subjective and cannot be trusted from jsdom mocks | Run the dev server, trigger 10 throws, and visually confirm each sequence tumbles and settles without awkward clipping or frozen frames |
| Result card is large and instantly readable on a phone-sized viewport | THROW-05 | Typography readability and visual dominance need human judgment | Open the app in a mobile-width browser or device emulator, throw once for each result type, and confirm the centered Korean label is legible at a glance |
| Repeated throws do not leak WebGL/canvas resources | THROW-01, THROW-04 | Real resource leaks often appear only in browser/WebView runtime | Trigger 20 consecutive throws, watch browser performance tools for growing WebGL contexts/canvas nodes, and confirm no mounting errors or stale overlays remain |
| WKWebView stability on iOS | THROW-01, THROW-02 | Project state flags iOS WebGL risk specifically | Test on at least one iPhone or WKWebView host, complete 10 throws, and confirm no blank canvas, crash, or context-loss behavior |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
