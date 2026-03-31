# Codebase Structure

**Analysis Date:** 2026-03-31

## Directory Layout

```
260330_rps/
├── public/                    # Static assets (icons, images)
├── src/
│   ├── __mocks__/             # Jest mocks for testing
│   │   └── motion/react.tsx   # Mock for motion library in tests
│   ├── __tests__/             # Global test setup
│   │   └── setup.ts           # Vitest config (testing-library, jsdom)
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout, metadata, viewport config
│   │   ├── page.tsx           # Entry point — dynamically imports Game component
│   │   └── globals.css        # Tailwind imports + custom animations
│   ├── components/            # React components
│   │   ├── Game.tsx           # Main container — orchestrates screens, effects, postMessage
│   │   ├── battle/            # Round-specific components
│   │   │   ├── ChoiceCard.tsx         # Card flip animation (3D rotate)
│   │   │   ├── RoundIndicator.tsx     # Shows current/completed rounds
│   │   │   ├── SuspenseReveal.tsx     # AI card reveal animation
│   │   │   └── __tests__/
│   │   │       └── SuspenseReveal.test.tsx
│   │   ├── effects/           # Visual effects
│   │   │   ├── Confetti.tsx           # Canvas-confetti victory bursts
│   │   │   └── DefeatEffect.tsx       # Shake/defeat animation
│   │   ├── screens/           # Phase-specific full-screen layouts
│   │   │   ├── IdleScreen.tsx         # Start button, title
│   │   │   ├── PlayScreen.tsx         # Round UI, choice buttons, battle area
│   │   │   ├── ResultScreen.tsx       # Win/lose/victory coupon display
│   │   │   └── __tests__/
│   │   │       ├── PlayScreen.test.tsx
│   │   │       └── ResultScreen.test.tsx
│   │   ├── svg/               # SVG icon components
│   │   │   ├── Rock.tsx
│   │   │   ├── Paper.tsx
│   │   │   └── Scissors.tsx
│   │   └── ui/                # Atomic UI components
│   │       └── ChoiceButton.tsx       # Selection button with disabled state
│   ├── hooks/                 # Custom React hooks
│   │   ├── usePostMessage.ts          # Iframe embedding protocol
│   │   └── __tests__/
│   │       └── usePostMessage.test.ts
│   ├── lib/                   # Shared utilities and pure functions
│   │   └── rps/               # Game logic library (Phase 1)
│   │       ├── types.ts               # Choice, Outcome, Phase, SessionPayload
│   │       ├── constants.ts           # WIN_RATE_TABLE, DRAW_BONUS_PCT, MAX_DRAW_AUTO_WIN
│   │       ├── gameRules.ts           # determineOutcome()
│   │       ├── aiEngine.ts            # pickAiChoice()
│   │       ├── session.ts             # createSession(), finalizeSession()
│   │       ├── index.ts               # Barrel export for all lib/rps
│   │       └── __tests__/
│   │           ├── types.test.ts
│   │           ├── gameRules.test.ts
│   │           ├── aiEngine.test.ts
│   │           └── session.test.ts
│   └── store/                 # State management
│       ├── gameStore.ts               # Zustand store (FSM)
│       └── __tests__/
│           └── gameStore.test.ts
├── .vercel/                   # Vercel deployment config
├── package.json               # Dependencies: next, react, zustand, motion, canvas-confetti, tailwind
├── tsconfig.json              # TypeScript config
├── vitest.config.ts           # Test runner config
├── next.config.ts             # Next.js config (headers for iframe, redirects)
├── tailwind.config.ts         # Tailwind v4 config
└── .eslintrc.json             # ESLint config (next)
```

## Directory Purposes

**src/app:**
- Purpose: Next.js App Router entry point and root layout
- Contains: page.tsx (dynamic Game import), layout.tsx (metadata/viewport), globals.css
- Key files: `page.tsx` (ensures SSR disabled for game), `layout.tsx` (sets viewport for mobile)

**src/components:**
- Purpose: Entire React UI layer — organized by functional domain, not feature
- Contains: Screen components (idle/play/result phases), battle components (choice reveal), effects, SVG icons, UI atoms
- Key files: `Game.tsx` (orchestrator), screens/* (phase-driven renders), battle/* (animations)

**src/components/battle:**
- Purpose: Components specific to active round gameplay
- Contains: ChoiceCard (card flip), SuspenseReveal (AI reveal animation), RoundIndicator (progress bar)
- Used by: PlayScreen

**src/components/effects:**
- Purpose: Visual effects triggered by phase changes
- Contains: VictoryConfetti (canvas bursts on victory), DefeatEffect (shake/overlay on loss)
- Rendered: Conditionally by Game component based on phase

**src/components/screens:**
- Purpose: Full-screen layouts corresponding to each game phase
- Contains: IdleScreen (phase='idle'), PlayScreen (selecting/revealing/result), ResultScreen (victory/gameover)
- Pattern: Each screen reads phase and renders appropriate UI; no phase-checking inside screens

**src/components/svg:**
- Purpose: SVG icon components for rock/paper/scissors choices
- Contains: Rock, Paper, Scissors — imported by ChoiceCard
- Pattern: Accept className prop for Tailwind sizing

**src/components/ui:**
- Purpose: Atomic UI components (buttons, controls)
- Contains: ChoiceButton (choice selection, handles disabled state)
- Pattern: Receive callbacks (onSelect) and render based on game state

**src/hooks:**
- Purpose: Custom hooks encapsulating side effects and logic
- Contains: usePostMessage (iframe communication protocol)
- Pattern: Initialize in Game component at root; called once per mount

**src/lib/rps:**
- Purpose: Pure game logic library — zero React dependencies
- Contains:
  - `types.ts`: Choice, Outcome, Phase, SessionPayload, RoundRecord (data contracts)
  - `constants.ts`: WIN_RATE_TABLE (difficulty curve), DRAW_BONUS_PCT, MAX_DRAW_AUTO_WIN
  - `gameRules.ts`: determineOutcome() — rules of rock-paper-scissors
  - `aiEngine.ts`: pickAiChoice() — AI difficulty scaled by round and draw count
  - `session.ts`: createSession(), finalizeSession() — session lifecycle
  - `index.ts`: Barrel export
- Pattern: Consumed exclusively by gameStore and tested in isolation

**src/store:**
- Purpose: Zustand v5 state management — single source of truth
- Contains: useGameStore hook with game state shape and FSM actions
- Key methods:
  - `start()`: Create session, reset round, set phase='selecting'
  - `select(choice)`: Call pickAiChoice, set both choices atomically, phase='revealing'
  - `revealDone()`: Call determineOutcome, set outcome, phase='result'
  - `advance()`: Handle win/lose/draw outcomes, increment round, update session, transition phase
  - `retry()`: Reset state to initial
  - `setCouponConfig()`: Store coupon data from postMessage

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Next.js page route — imports Game dynamically with SSR disabled
- `src/components/Game.tsx`: Main orchestrator — sets up postMessage, manages timers, renders screens

**Configuration:**
- `src/app/layout.tsx`: Root metadata and viewport configuration
- `src/app/globals.css`: Tailwind @import and custom animations
- `tailwind.config.ts`: Tailwind v4 config with custom colors/animations
- `next.config.ts`: Next.js config (headers for iframe, if needed)
- `vitest.config.ts`: Vitest + testing-library setup

**Core Logic:**
- `src/lib/rps/types.ts`: Type definitions for Choice, Outcome, Phase, SessionPayload
- `src/lib/rps/constants.ts`: Difficulty curve and game parameters
- `src/lib/rps/gameRules.ts`: determineOutcome() pure function
- `src/lib/rps/aiEngine.ts`: pickAiChoice() with probability logic
- `src/lib/rps/session.ts`: Session creation and finalization

**State Management:**
- `src/store/gameStore.ts`: Zustand FSM store — all game state and actions

**Testing:**
- `src/__tests__/setup.ts`: Vitest configuration
- `src/__mocks__/motion/react.tsx`: Motion library mock for tests
- `src/lib/rps/__tests__/*`: Unit tests for game logic
- `src/store/__tests__/gameStore.test.ts`: Store action tests
- `src/components/**/__tests__/*`: Component integration tests

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `ChoiceCard.tsx`, `PlayScreen.tsx`)
- Hooks: `useXxx.ts` (e.g., `usePostMessage.ts`)
- Pure functions: `camelCase.ts` (e.g., `gameRules.ts`, `aiEngine.ts`)
- Tests: `*.test.ts` or `*.test.tsx` (e.g., `gameStore.test.ts`)
- SVG icons: `PascalCase.tsx` (e.g., `Rock.tsx`, `Paper.tsx`)

**Directories:**
- Feature domains: `plural` (e.g., `components`, `hooks`, `screens`, `effects`)
- Functional groupings: `plural` (e.g., `__tests__`, `__mocks__`)

**Variables and Functions:**
- Functions: `camelCase` (e.g., `determineOutcome`, `pickAiChoice`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `WIN_RATE_TABLE`, `TOTAL_ROUNDS`)
- React components: `PascalCase` (e.g., `PlayScreen`, `ChoiceCard`)
- Types/Interfaces: `PascalCase` (e.g., `SessionPayload`, `RoundRecord`)

## Where to Add New Code

**New Feature (e.g., leaderboard, sound effects):**
- Implementation: Create new directory in `src/` if cross-cutting (e.g., `src/services/leaderboard/`), or within existing domain (e.g., `src/components/leaderboard/`)
- Tests: `__tests__` subdirectory or `*.test.tsx` co-located with implementation
- State: Add new store slices if needed, or extend `gameStore.ts` with new fields/actions
- Hooks: If the feature needs lifecycle/effects, create `src/hooks/useXxx.ts`

**New Component/Module:**
- Atomic UI: `src/components/ui/ComponentName.tsx`
- Screen/Full-page: `src/components/screens/ComponentName.tsx`
- Game-phase specific: `src/components/screens/` or `src/components/battle/` as appropriate
- Pure utility: `src/lib/` subdirectory (e.g., `src/lib/leaderboard/`)
- Custom hook: `src/hooks/useXxx.ts`
- Store extension: Add to `src/store/gameStore.ts` or create new `src/store/xxxStore.ts`

**Utilities/Shared Helpers:**
- Game logic: `src/lib/` with subdirectory by domain (e.g., `src/lib/rps/`, `src/lib/analytics/`)
- React-specific utilities: `src/hooks/` (custom hooks) or `src/components/ui/` (reusable components)
- Type definitions: `src/lib/[domain]/types.ts`

## Special Directories

**src/__tests__:**
- Purpose: Global test setup and fixtures
- Generated: No (developer-maintained)
- Committed: Yes
- Contains: `setup.ts` for Vitest + testing-library configuration

**src/__mocks__:**
- Purpose: Jest/Vitest mock implementations
- Generated: No (developer-maintained)
- Committed: Yes
- Contains: `motion/react.tsx` mock for testing components that use motion animations

**.next:**
- Purpose: Next.js build output and cache
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**.vercel:**
- Purpose: Vercel deployment metadata
- Generated: Yes (by Vercel CLI)
- Committed: Yes (contains project.json for CI/CD reference)

## Path Aliases

**Configured in tsconfig.json:**
- `@/*`: Maps to `src/` directory
- Usage: `import { useGameStore } from '@/store/gameStore'` instead of `import { useGameStore } from '../../../store/gameStore'`
- Convention: All imports use `@/` prefix for readability

---

*Structure analysis: 2026-03-31*
