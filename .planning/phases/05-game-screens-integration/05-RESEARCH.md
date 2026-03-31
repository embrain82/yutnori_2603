# Phase 5: Game Screens & Integration - Research

**Researched:** 2026-04-01
**Domain:** Zustand game orchestration, screen composition, throw-queue UI flow, AI pacing, and WebView postMessage integration
**Confidence:** HIGH

## Summary

Phase 5 should turn the completed logic, board, and throw overlay work into the actual playable application shell. The safest fit is to follow the already-proven `260330_rps/` architecture: a single Zustand store in `src/store/gameStore.ts`, a phase-driven `src/components/Game.tsx`, dedicated screen components, and a client-only `usePostMessage()` hook for the WebView bridge.

The biggest planning nuance is the **throw queue**. Phase 1 and the upstream research are explicit: when `yut` or `mo` grants an extra throw, results queue first and are then consumed FIFO as moves. Phase 5 therefore should not model the flow as "throw -> immediately move" for every result. Instead, the store needs two separate concepts: the currently animating visual throw (`activeThrow`) and the currently consumable move result (`activeMove`). The UI should only enter piece-selection once `throwsRemaining === 0`, then consume queued results one at a time.

The second critical choice is to **avoid using `executeAiTurn()` directly in the UI layer**. That pure helper is valuable as a rules reference, but it collapses the entire AI turn into one synchronous operation, which would skip the required thinking state, turn indicator, emoji reaction, and Phase 4 throw overlay. Phase 5 should instead keep AI execution incremental: `aiThinking` delay -> visual throw overlay -> queue drain -> AI move selection -> animation -> repeat.

Because Phase 5 currently has **no `05-CONTEXT.md` and no `05-UI-SPEC.md`**, this plan should intentionally inherit the visual language already locked in earlier phases: warm board colors from Phase 3, overlay-above-board throw behavior from Phase 4, and the screen orchestration pattern from the RPS reference app.

**Primary recommendation:** create UI-ready move-candidate and session utilities in `src/lib/yut/`, build `src/store/gameStore.ts` around the existing pure logic modules, add `IdleScreen` / `PlayScreen` / `ResultScreen` plus `src/components/Game.tsx`, and finish with a typed WebView bridge that emits `YUT_GAME_START`, `YUT_GAME_END`, and `YUT_GAME_WIN`.

<planning_assumptions>
## Planning Assumptions

- No Phase 5 context document exists, so design direction is inherited from Phases 3-4 and the roadmap text.
- No Phase 5 UI-SPEC exists, so the screen plan keeps the board-centered mobile layout already established in `src/components/throw/ThrowDemo.tsx`.
- The native app bridge contract is not yet formally specified beyond the roadmap requirements, so Phase 5 should reuse the RPS-style object `postMessage` pattern with strict once-only guards and origin validation.
- AI personality for this phase should stay lightweight and readable: a small emoji reaction plus short Korean status text, not a full dialogue system.
</planning_assumptions>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-02 | 현재 턴(플레이어/AI)이 명확히 표시된다 | Dedicated turn banner, active-team state in Zustand, and phase-driven screen rendering |
| VIS-03 | AI 턴 시 "생각 중..." 상태가 표시된다 | Explicit `aiThinking` phase with delayed AI throw start instead of synchronous AI execution |
| VIS-04 | AI가 상황에 따라 이모지 표정 반응을 보여준다 | Store-managed `aiReaction` state rendered through a small reaction bubble in the play screen |
| INTG-01 | 승리 시 WebView postMessage 브리지로 쿠폰 지급 메시지가 전달된다 | Typed `YUT_GAME_WIN` payload with finalized session object and once-only send guards |
| INTG-02 | 게임이 네이티브 앱 WebView에 iframe으로 임베딩된다 | Existing `next.config.ts` headers plus client-only app entry and no-op bridge behavior in regular browsers |
| INTG-03 | 게임 시작/종료 상태가 네이티브 앱에 전달된다 | `YUT_GAME_START` / `YUT_GAME_END` lifecycle messages sourced from store phase + finalized session state |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | `5.0.12` | Central turn/state orchestration | Already installed, proven in `260330_rps/`, and a good fit for queue-driven game state |
| React | `19.2.4` | Screen rendering, timers, and bridge hook lifecycle | Existing project runtime |
| `motion` | `12.38.0` | Screen transitions and light status/reaction animation | Already used across prior phases |
| Next.js | `16.2.1` | Client-only app entry and iframe-safe app shell | Existing project framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | `4.1.2` | Store, hook, and screen tests | Existing standard test runner |
| `@testing-library/react` | `16.3.2` | UI and hook interaction testing | Existing component-testing stack |

## Architecture Patterns

### Pattern 1: UI-Ready Move Candidates Sit Between Pure Rules And The Store

**What:** Add a small helper in `src/lib/yut/` that converts a `ThrowResult` plus current board state into UI-ready move candidates, including both `continue` and `shortcut` candidates when a piece currently stands on `S5` or `S10`.

**Why:** The pure movement rules already know how to resolve routes, but the Phase 3 board expects clickable destination highlights. The store should not manually recompute route math inline.

**Recommended contract:**
```ts
export type RouteChoice = 'continue' | 'shortcut'

export interface MoveCandidate {
  pieceId: string
  result: ThrowResult
  routeChoice: RouteChoice
  moveResult: MoveResult
}

export function buildMoveCandidates(
  pieces: PieceState[],
  team: Team,
  throwResult: ThrowResult
): MoveCandidate[]
```

### Pattern 2: Keep `activeThrow` And `activeMove` Separate

**What:** Track the current visual throw animation separately from the currently consumable queued move.

**Why:** Traditional yut/mo chaining means the player can accumulate multiple results before moving. If the store collapses those states, the queue logic becomes tangled and the UI cannot safely show the Phase 4 overlay while preserving FIFO move consumption.

**Recommended store fields:**
```ts
phase: GamePhase
activeThrow: ThrowResult | null
activeMove: ThrowResult | null
turnState: TurnState
moveCandidates: MoveCandidate[]
```

### Pattern 3: Board-Centered Play Screen Reuses Phase 3 And 4 Components

**What:** Compose `HomeZone`, `Board`, `useHopAnimation()`, and `YutThrowOverlay` inside one `PlayScreen`.

**Why:** The project already invested in interactive SVG board rendering and a temporary throw demo. Phase 5 should wire them together instead of replacing them.

**Recommended play-screen responsibilities:**
- Show current turn banner at all times
- Show HOME pieces above the board for both teams
- Launch `YutThrowOverlay` only while `phase === 'throwing'`
- Render direct-tap destination highlights via the existing `Board` props
- Run hop animation and capture shake from `useHopAnimation()`

### Pattern 4: AI Turn Execution Must Be Incremental, Not Monolithic

**What:** Keep AI actions visible to the player by staging them across explicit store phases.

**Why:** `executeAiTurn()` is correct as pure-logic reference code, but it skips the required UX.

**Recommended sequence:**
1. `phase = 'aiThinking'`
2. Wait about `900ms`
3. Generate one throw result and show the Phase 4 overlay
4. If more throws remain, return to `aiThinking`
5. When queued moves are ready, pick one candidate and animate it
6. Repeat until the turn ends or the game finishes

### Pattern 5: Typed WebView Messages Reuse The RPS Pattern

**What:** Follow the RPS hook structure, but rename contracts for Yut Nori and add lifecycle start/end messages.

**Why:** The native bridge pattern is already validated in the older app, and the current `next.config.ts` already sets iframe-friendly headers.

**Recommended message contracts:**
```ts
type YUT_COUPON_CONFIG = { type: 'YUT_COUPON_CONFIG'; couponCode: string; couponImage?: string; couponText?: string }
type YUT_GAME_START = { type: 'YUT_GAME_START'; payload: { sessionId: string; startedAt: string } }
type YUT_GAME_END = { type: 'YUT_GAME_END'; payload: { sessionId: string; completedAt: string; winner: Team | null } }
type YUT_GAME_WIN = { type: 'YUT_GAME_WIN'; payload: GameSessionPayload }
```

## Recommended Technical Decisions

### 1. Create `src/lib/yut/session.ts`

**Recommendation:** Store the bridge payload and coupon-config types alongside other Yut logic types instead of scattering them in React files.

**Why:** The session object is used by both the store and the bridge hook, and the RPS project already proved this split works well.

### 2. Keep The Main Orchestrator In `src/components/Game.tsx`

**Recommendation:** Reuse the RPS composition pattern: `IdleScreen`, `PlayScreen`, `ResultScreen`, wrapped by `AnimatePresence`.

**Why:** This keeps page entry minimal, makes PlayScreen focused on active gameplay only, and gives a natural home for AI timer effects and bridge hookup.

### 3. Reuse Existing Throw Overlay Instead Of Rebuilding It

**Recommendation:** Keep `src/components/throw/YutThrowOverlay.tsx` as the only 3D entry point.

**Why:** Phase 4 already finished and verified that integration seam. Phase 5 should treat it as a stable dependency.

### 4. Preserve Regular-Browser Safety

**Recommendation:** `usePostMessage()` should early-return harmlessly when the game is opened directly in a browser tab.

**Why:** Developers will test locally outside WebView, and the game should remain usable there.

## Pitfalls And Guardrails

### Pitfall 1: Forgetting The Throw Queue Produces Wrong Turn Flow

If the UI enters piece-selection immediately after every `yut` or `mo`, the game will violate the project's own rules research.

**Guardrail:** Only enter move selection after `throwsRemaining === 0`; consume queued results FIFO afterward.

### Pitfall 2: Using `executeAiTurn()` Hides Required UX

The AI would appear to "teleport" through its turn, skipping `생각 중...`, reaction emoji, and the 3D throw overlay.

**Guardrail:** Use `evaluateMove()` / AI heuristics as reference, but orchestrate AI turn state through explicit store phases.

### Pitfall 3: Branch Choice Can Be Lost If Candidates Are Computed Too Late

Branch choice is a UI concern at the moment of piece selection, not a post-animation correction.

**Guardrail:** Build explicit move candidates up front and feed them into the Phase 3 highlight system.

### Pitfall 4: Bridge Sends Can Duplicate On Rerender

React rerenders or store updates can fire the same message multiple times.

**Guardrail:** Mirror the RPS `hasSentRef` pattern for start/end/win messages.

### Pitfall 5: Browser And WebView Need Different Expectations

Direct browser testing should not require a parent bridge, but production still needs strict origin filtering.

**Guardrail:** no-op safely when `window.parent === window`, while still validating origin for inbound config messages.

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
| VIS-02 | Turn state is visible and driven from store state | integration | `npx vitest run src/components/screens/__tests__/PlayScreen.test.tsx -x` | Wave 0 |
| VIS-03 | AI thinking phase appears before AI acts | integration | `npx vitest run src/components/__tests__/Game.test.tsx -x` | Wave 0 |
| VIS-04 | AI reaction emoji changes with store mood state | integration | `npx vitest run src/components/screens/__tests__/PlayScreen.test.tsx -x` | Wave 0 |
| INTG-01 | Victory sends one `YUT_GAME_WIN` message with finalized payload | hook | `npx vitest run src/hooks/__tests__/usePostMessage.test.tsx -x` | Wave 0 |
| INTG-02 | Client-only app entry renders the game safely inside iframe/WebView | integration | `npx vitest run src/components/__tests__/Game.test.tsx -x` | Wave 0 |
| INTG-03 | Start/end lifecycle messages fire exactly once | hook | `npx vitest run src/hooks/__tests__/usePostMessage.test.tsx -x` | Wave 0 |

## Sources

### Primary (HIGH confidence)
- `src/lib/yut/game.ts` — authoritative throw queue, FIFO consumption, and turn-state semantics
- `src/lib/yut/movement.ts` — route and branch behavior
- `src/lib/yut/ai.ts` — heuristic AI scorer and easy-difficulty behavior
- `src/components/board/Board.tsx` — destination-highlight contract the store must feed
- `src/components/board/HomeZone.tsx` — HOME-piece presentation already implemented in Phase 3
- `src/components/throw/ThrowDemo.tsx` — current Phase 4 board + overlay composition baseline
- `260330_rps/src/store/gameStore.ts` — proven Zustand orchestration pattern
- `260330_rps/src/hooks/usePostMessage.ts` — proven bridge lifecycle and origin-guard pattern
- `.planning/ROADMAP.md` — Phase 5 goal, requirements, and success criteria

### Supporting (HIGH confidence)
- `.planning/research/SUMMARY.md` — throw-queue and integration-phase guidance
- `.planning/research/PITFALLS.md` — queue and postMessage failure modes
- `.planning/codebase/INTEGRATIONS.md` — current iframe/origin assumptions

---
*Research completed: 2026-04-01*
*Ready for planning: yes*
