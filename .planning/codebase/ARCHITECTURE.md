# Architecture

**Analysis Date:** 2026-03-31

## Pattern Overview

**Overall:** Layered architecture with separation between pure game logic, state management, and React UI components.

**Key Characteristics:**
- Pure functional game logic layer (`@/lib/rps`) decoupled from React
- Centralized state management via Zustand FSM (`@/store/gameStore`)
- Screen-based UI composition with phase-driven rendering
- Iframe-compatible postMessage integration for external embedding
- No server-side rendering — fully client-side game experience

## Layers

**Game Logic Layer:**
- Purpose: Pure, deterministic functions for RPS rules, AI decision-making, and session tracking
- Location: `src/lib/rps/`
- Contains: Functions (`pickAiChoice`, `determineOutcome`, `createSession`, `finalizeSession`), types, constants
- Depends on: TypeScript types only — no React, no DOM
- Used by: Zustand store (`gameStore.ts`)

**State Management Layer:**
- Purpose: Centralized FSM-driven game state using Zustand v5
- Location: `src/store/gameStore.ts`
- Contains: Game state shape, action handlers that orchestrate logic layer functions
- Depends on: `@/lib/rps` (pickAiChoice, determineOutcome, createSession, finalizeSession)
- Used by: All React components via hooks (`useGameStore((s) => s.phase)`)

**UI/Screen Layer:**
- Purpose: React components organized by game phase (idle, play, result)
- Location: `src/components/screens/` (IdleScreen, PlayScreen, ResultScreen)
- Contains: Phase-specific screen components that read state and call store actions
- Depends on: `@/store/gameStore`, child components, motion library
- Used by: Main Game component via phase-driven rendering

**Component Layer:**
- Purpose: Reusable UI components for game interactions
- Location: `src/components/` (battle/, effects/, ui/, svg/)
- Contains: ChoiceCard (card flip animation), ChoiceButton (input), RoundIndicator (progress), icons
- Depends on: Motion for animations, Zustand for state reads
- Used by: Screen components

**Hook Layer:**
- Purpose: Encapsulate side effects and cross-cutting concerns
- Location: `src/hooks/`
- Contains: `usePostMessage` (iframe embedding protocol)
- Depends on: `@/store/gameStore`, browser postMessage API
- Used by: Game component at entry point

**Effects Layer:**
- Purpose: Imperative visual effects (confetti, shake)
- Location: `src/components/effects/`
- Contains: VictoryConfetti, DefeatEffect
- Depends on: Canvas-confetti library, Zustand for phase detection
- Used by: Game component conditional rendering

## Data Flow

**Game Initialization Flow:**

1. User lands on `app/page.tsx` → dynamically imports Game component (SSR disabled)
2. Game component mounts → registers `usePostMessage` hook for iframe communication
3. Game component renders IdleScreen → shows start button
4. User taps "시작하기" → calls `start()` action in gameStore
5. `start()` creates new session, sets phase to 'selecting', resets round state

**Round Execution Flow:**

1. User sees PlayScreen with 3 choice buttons
2. User taps choice → `select(choice)` called in gameStore
3. `select()` calls `pickAiChoice(round, choice, drawCount)` from lib/rps
4. Both playerChoice and aiChoice set atomically → phase becomes 'revealing'
5. PlayScreen shows SuspenseReveal component (AI card animates)
6. SuspenseReveal calls `revealDone()` after animation completes
7. `revealDone()` calls `determineOutcome(playerChoice, aiChoice)` → phase becomes 'result'
8. ResultFlash overlay shows win/lose/draw text via motion animation
9. Auto-timer in Game component (800ms draw / 1000ms other) calls `advance()`
10. `advance()` transitions to next round, victory, or gameover based on outcome

**Victory/Gameover Flow:**

1. On victory (5 wins): phase becomes 'victory' → ResultScreen + VictoryConfetti render
2. VictoryConfetti detects phase === 'victory' → fires 4 canvas-confetti bursts (staggered)
3. `usePostMessage` detects phase === 'victory' → sends RPS_GAME_WIN postMessage to parent
4. On defeat: phase becomes 'gameover' → ResultScreen + DefeatEffect render
5. User taps "다시 하기" → calls `retry()` → resets state to initial, phase 'idle'

**Iframe Embedding Flow:**

1. Parent window (e.g., e-commerce site) embeds game in iframe
2. (Optional) Parent sends RPS_COUPON_CONFIG postMessage with coupon details
3. `usePostMessage` receives message → calls `setCouponConfig()` in store
4. ResultScreen reads couponConfig and displays coupon code/image on victory
5. On victory, game sends RPS_GAME_WIN postMessage with session payload to parent
6. Parent receives RPS_GAME_WIN, processes coupon issuance, and closes/redirects iframe

**State Management:**

- Single Zustand store (`useGameStore`) is the single source of truth for all game state
- Components use selective subscriptions: `useGameStore((s) => s.phase)` only re-renders on phase change
- Actions in store are synchronous — no async flows (all computation client-side)
- Store actions perform atomic updates (e.g., `select()` updates playerChoice, aiChoice, AND phase in one `set()` call)
- Session object accumulates round records as rounds complete; finalized on gameover/victory

## Key Abstractions

**Phase (FSM State):**
- Purpose: Models the game state machine; drives which screen renders
- Examples: `idle | selecting | revealing | result | gameover | victory`
- Pattern: Zustand store holds phase as state; Game component uses AnimatePresence with phase as key
- Used by: Every component reads phase via `useGameStore((s) => s.phase)`

**Choice:**
- Purpose: Represents RPS choices with deterministic rules
- Pattern: Type `'rock' | 'paper' | 'scissors'` with lookup tables BEATS and LOSES_TO (see `types.ts`)
- Example usage: `pickAiChoice()` takes player choice and returns AI choice deterministically

**Outcome:**
- Purpose: Result of a single round from player's perspective
- Pattern: Type `'win' | 'lose' | 'draw'`
- Computed by: `determineOutcome(playerChoice, aiChoice)` pure function

**SessionPayload:**
- Purpose: Immutable record of a complete game session for postMessage contract
- Pattern: Contains sessionId (UUID), startedAt/completedAt timestamps, rounds array, totalPlayTimeMs
- Lifecycle: Created at `start()`, mutated incrementally as rounds complete, finalized at gameover/victory

**RoundResult (internal store):**
- Purpose: Tracks which rounds were won/lost (not all rounds are stored — only decisive ones)
- Pattern: Array `[{ outcome: Outcome, round: number }, ...]`
- Usage: Displayed in RoundIndicator to show completed rounds

**Win Rate (AI difficulty curve):**
- Purpose: Controls AI behavior scaling — harder as rounds progress
- Pattern: `WIN_RATE_TABLE[roundIndex]` = probability player wins (0.85 round 1 → 0.30 round 5)
- Stored: `src/lib/rps/constants.ts`

## Entry Points

**App Entry:**
- Location: `src/app/page.tsx`
- Triggers: Page load or navigation to `/`
- Responsibilities: Dynamic import of Game component with SSR disabled; wraps in minimal layout

**Game Component:**
- Location: `src/components/Game.tsx`
- Triggers: Rendered by app/page.tsx
- Responsibilities:
  - Registers postMessage hook for iframe communication
  - Manages auto-advance timer (setTimeout between phases)
  - Orchestrates screen rendering via AnimatePresence based on phase
  - Conditionally renders VictoryConfetti and DefeatEffect

**Store (Zustand):**
- Location: `src/store/gameStore.ts`
- Triggers: Called by `useGameStore()` hook from any component
- Responsibilities:
  - Holds all game state (phase, round, choices, outcome, session)
  - Implements FSM actions (start, select, revealDone, advance, retry)
  - Bridges game logic layer (lib/rps) with React layer

## Error Handling

**Strategy:** Defensive checks and early returns; no try/catch in game flow

**Patterns:**
- Null checks on dependent state: `if (!playerChoice || !aiChoice) return` in `revealDone()`
- Fallback defaults: `WIN_RATE_TABLE[roundIndex] ?? 0.50` if round index out of bounds
- Guard conditions: `if (drawCount >= MAX_DRAW_AUTO_WIN)` before randomness in AI engine (prevents off-by-one)
- Finalization guard: `if (!session.completedAt) return` before sending postMessage (ensures session is finalized)

## Cross-Cutting Concerns

**Logging:** Not implemented — debug via store state inspection in React DevTools

**Validation:**
- Choice validation: Only `'rock' | 'paper' | 'scissors'` are valid; typed as discriminated union
- Phase validation: Implicit via TypeScript; only valid phase transitions defined in Zustand actions
- Origin validation in postMessage: `allowedOrigin !== '*' && event.origin !== allowedOrigin` guards against XSS

**Authentication:** Not applicable — no server/auth layer

**Animations:**
- Tool: motion/react (v12.38.0)
- Screen transitions: AnimatePresence with opacity/scale via motion.div
- Card reveals: ChoiceCard uses rotateY with perspective for 3D flip
- Result flash: ResultFlash overlays with scale bounce animation
- Victory: spring animation with scale + confetti bursts

**Mobile/Responsive:**
- Viewport meta via `generateViewport` export in layout.tsx
- Tailwind responsive classes: PlayScreen uses flex column layouts
- Safe areas: ChoiceButton and buttons use `touch-manipulation` class, bottom bar uses `env(safe-area-inset-bottom)`
- Touch targets: All buttons 44px minimum (ChoiceButton min-h-[44px])

---

*Architecture analysis: 2026-03-31*
