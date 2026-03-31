# Phase 6: Visual Polish & Delight - Research

**Researched:** 2026-04-01
**Domain:** character-token rendering, lightweight celebration effects, result-screen delight, and mobile-safe visual polish
**Confidence:** HIGH

## Summary

Phase 6 should polish the already-playable Phase 5 game without disturbing its stable turn/store/integration architecture. The cleanest fit is to keep the current board, throw overlay, and result flow exactly as they are structurally, then layer delight on top through three focused upgrades:

1. Replace the plain circle tokens in `PieceToken.tsx` with cute SVG-native character pieces that still respect stack badges, touch targets, and board density.
2. Add victory celebration effects using the already-installed `canvas-confetti` dependency and the proven `260330_rps` once-only burst pattern.
3. Upgrade the result experience so defeat feels warm and encouraging instead of merely functional, while keeping replay fast and obvious.

The most important technical choice is to **avoid introducing external image assets as the first step**. The current board is SVG-native, the tokens are rendered many times, and mobile WebView safety matters. SVG-native character tokens can deliver the requirement with better crispness, lower coordination cost, and simpler testing. If the team later wants hand-drawn illustrations, Phase 6 can still expose a renderer boundary that makes that swap easy.

The second major choice is to keep celebration effects **outside the game logic store**. Phase 5 already made the store deterministic and testable. Confetti bursts, entry shakes, and result-card flourish should be UI-driven effects that react to `phase === 'victory'` or `phase === 'defeat'`, not new store transitions.

Because Phase 6 has **no `06-CONTEXT.md` and no dedicated `06-UI-SPEC.md`**, planning should inherit the warm palette and board-centered mobile composition already established in Phase 3 and Phase 5. The contract from `03-UI-SPEC.md` still matters: preserve touch targets, board readability, and warm earthy tones while making the pieces and result states feel more characterful.

**Primary recommendation:** split Phase 6 into two waves:
- `06-01` for SVG-native character piece rendering and board/home-zone visual refresh
- `06-02` for victory confetti, defeat encouragement treatment, and result-screen polish

<planning_assumptions>
## Planning Assumptions

- No Phase 6 context document exists, so visual decisions inherit the warm board language from Phase 3 and the screen structure from Phase 5.
- No Phase 6 UI-SPEC exists, so planning continues without a new design contract rather than blocking on `$gsd-ui-phase 6`.
- The project should stay asset-light in v1; SVG-native character tokens are preferred over introducing a new raster or sprite pipeline.
- Result polish should not slow replay flow or interfere with the existing WebView bridge behavior from Phase 5.
</planning_assumptions>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | 귀여운/캐주얼 스타일의 캐릭터 말이 사용된다 | Replace plain token circles with expressive SVG character pieces while preserving stack, selection, and touch affordances |
| VIS-05 | 승리 시 컨페티 + 축하 애니메이션이 재생된다 | Add once-only confetti bursts plus entry/result flourish triggered from the UI layer on `victory` |
| VIS-06 | 패배 시 격려 메시지와 재시작 옵션이 제공된다 | Upgrade defeat copy, motion, and emotional framing while preserving the replay CTA |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | `19.2.4` | Component composition, hooks, and result-state effect ownership | Existing runtime |
| `motion` | `12.38.0` | Entry flourishes, bobbing, celebratory emphasis, and defeat-state motion | Already used throughout the app |
| Next.js | `16.2.1` | Existing app shell and build target | No new platform work needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `canvas-confetti` | `1.9.4` | Victory celebration bursts | Use for fire-and-forget confetti bursts with reduced-motion safety |
| Vitest | `4.1.2` | Component and effect verification | Existing standard test runner |
| `@testing-library/react` | `16.3.2` | DOM/effect testing | Existing UI testing stack |

## Architecture Patterns

### Pattern 1: SVG-Native Character Tokens Replace Plain Circles

**What:** Evolve `PieceToken` from a flat colored circle into a small character illustration built from SVG primitives.

**Why:** The board is already SVG-native, so this keeps visual crispness, avoids asset-pipeline overhead, and lets stack badges/selection rings remain aligned with current geometry.

**Recommended structure:**
```ts
// example direction, not locked exact naming
src/components/board/PieceToken.tsx
src/components/board/pieceArt.ts
```

Use:
- distinct silhouettes or face details per team
- stable outer token bounds so board spacing does not need rework
- preserved invisible hit target and stack badge positioning

### Pattern 2: Keep Celebration Effects UI-Owned

**What:** Fire victory and defeat effects from client components that react to `phase`, not from the store.

**Why:** Phase 5 intentionally kept state transitions deterministic. Confetti and flourish timing should remain side-effect components attached to the screen shell.

**Recommended effect boundary:**
- `VictoryConfetti` reacts to `phase === 'victory'`
- `DefeatEffect` wraps or enhances the defeat result presentation
- `Game.tsx` renders effect components conditionally near `ResultScreen`

### Pattern 3: ResultScreen Becomes The Delight Surface

**What:** Treat `ResultScreen` as the main presentation layer for encouragement and celebration polish.

**Why:** The result shell already owns the heading, coupon area, and replay CTA. Phase 6 can enrich it without changing routing, store flow, or bridge timing.

**Recommended upgrades:**
- stronger victory headline hierarchy and celebratory accent treatment
- supportive defeat copy and softer visual framing
- one obvious replay CTA that stays immediately tappable

### Pattern 4: Reduced Motion And Cleanup Matter

**What:** Any repeating or timed visual effect must respect reduced-motion behavior and clean itself up on phase change/unmount.

**Why:** The app targets mobile WebViews and already has performance/stability concerns tracked for WKWebView.

**Guardrails:**
- confetti uses `disableForReducedMotion: true`
- timers must clear on unmount
- effects must reset when phase leaves victory/defeat so replay works correctly

## Recommended Technical Decisions

### 1. Keep Character Art In Code, Not Assets

**Recommendation:** Build the first pass of cute pieces as layered SVG primitives inside the existing board token system.

**Why:** This avoids file-asset churn, preserves sharpness at multiple scales, and remains straightforward to test in Vitest.

### 2. Reuse The RPS Confetti Pattern

**Recommendation:** Port the proven once-only confetti burst structure from `260330_rps/src/components/effects/Confetti.tsx`.

**Why:** It already handles repeat-play safety, staggered bursts, cleanup, and reduced-motion compatibility.

### 3. Keep Defeat Polish Subtle And Fast

**Recommendation:** Use a short shake / soft desaturation / encouraging copy treatment, but do not block replay behind a long sequence.

**Why:** The game is promotional and short-session. Delight matters, but friction on replay would hurt the product more than it helps.

### 4. Preserve Existing Board Geometry

**Recommendation:** Do not re-layout stations, token hit targets, or board spacing in Phase 6.

**Why:** Phase 3 and Phase 5 already verified touchability and destination clarity. Phase 6 should change appearance, not geometry.

## Pitfalls And Guardrails

### Pitfall 1: Overly Detailed Character Art Can Hurt Board Readability

Small board tokens can become muddy if too many features are packed in.

**Guardrail:** Keep a strong silhouette, 2-3 readable face/body accents, and the current token footprint.

### Pitfall 2: Confetti Can Fire More Than Once Across Rerenders

Victory screens often rerender when coupon config or bridge state changes.

**Guardrail:** Mirror the once-only ref + cleanup pattern from the RPS confetti component.

### Pitfall 3: Defeat Motion Can Feel Punitive Instead Of Warm

An aggressive shake or dark overlay would conflict with the casual promotional tone.

**Guardrail:** Keep defeat feedback brief, soft, and paired with encouraging copy plus a visible retry path.

### Pitfall 4: Result Polish Can Accidentally Delay Bridge Behavior

If celebration logic becomes coupled to game completion, it can interfere with the already-correct lifecycle messaging.

**Guardrail:** The Phase 5 bridge remains unchanged; Phase 6 only reacts to already-finalized phases.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 with jsdom environment |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01 | Character pieces replace flat tokens without losing stack/selection affordances | integration | `npx vitest run src/components/board/__tests__/PieceToken.test.tsx src/components/board/__tests__/HomeZone.test.tsx -x` | Existing files |
| VIS-05 | Victory confetti and celebratory entry fire exactly once and reset on replay | unit + integration | `npx vitest run src/components/effects/__tests__/VictoryConfetti.test.tsx src/components/screens/__tests__/ResultScreen.test.tsx src/components/__tests__/Game.test.tsx -x` | Wave 0 |
| VIS-06 | Defeat screen shows warm encouragement and keeps replay obvious | integration | `npx vitest run src/components/effects/__tests__/DefeatEffect.test.tsx src/components/screens/__tests__/ResultScreen.test.tsx -x` | Wave 0 |

## Sources

### Primary (HIGH confidence)
- `src/components/board/PieceToken.tsx` — current token footprint, stack badge, and touch target rules
- `src/components/board/HomeZone.tsx` — HOME-zone token presentation
- `src/components/board/Board.tsx` — static board geometry and current token placement model
- `src/components/screens/ResultScreen.tsx` — current result shell and replay/coupon structure
- `src/components/Game.tsx` — current routing boundary where result-state effects can attach
- `.planning/phases/03-2d-board-rendering/03-UI-SPEC.md` — established warm board tone, sizing, and touch-target constraints
- `.planning/phases/05-game-screens-integration/05-VERIFICATION.md` — current verified gameplay/result baseline

### Supporting (HIGH confidence)
- `/Users/nonsleeper/Documents/Coding/260330_rps/src/components/effects/Confetti.tsx` — once-only confetti pattern with cleanup
- `/Users/nonsleeper/Documents/Coding/260330_rps/src/components/effects/DefeatEffect.tsx` — short defeat feedback pattern
- `/Users/nonsleeper/Documents/Coding/260330_rps/src/components/screens/ResultScreen.tsx` — result polish baseline from the earlier project
- `.planning/research/FEATURES.md` — original product direction for cute character pieces and celebration value
- `.planning/codebase/CONCERNS.md` — confetti/mobile performance cautions

---
*Research completed: 2026-04-01*
*Ready for planning: yes*
