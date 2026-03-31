<!-- GSD:project-start source:PROJECT.md -->
## Project

**Yut Nori Game (윷놀이)**

HTML5 기반 윷놀이 게임. 사용자와 AI가 대결하며, 3D 물리 시뮬레이션으로 윷을 던지고, 전통 윷놀이 규칙에 따라 말을 이동시킨다. 승리 시 네이티브 앱에 WebView 브리지로 쿠폰을 지급한다. 귀여운/캐주얼 비주얼 스타일.

**Core Value:** 사용자가 윷을 던져서 3D 물리 효과로 결과를 보고, 말을 움직이며 AI와 윷놀이 대결을 즐기는 경험.

### Constraints

- **플랫폼**: HTML5 웹 게임, 네이티브 앱 WebView에서 구동 — 모바일 성능 최적화 필수
- **3D 엔진**: Three.js + Cannon.js — 윷 던지기 물리 시뮬레이션 전용, 보드/말은 2D
- **통신**: WebView postMessage 브리지 — 쿠폰 지급은 네이티브 앱이 처리
- **AI 난이도**: 쉬움 고정 — 사용자가 대체로 이기는 수준 (이벤트용)
- **말 개수**: 팀당 2개 — 간소화된 윷놀이
- **규칙**: 전통 윷놀이 (윷/모 추가 던지기, 잡기 시 추가 턴, 지름길 포함, 백도 제외)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.7 - Full codebase type safety, including `next.config.ts` and component types
- JavaScript (JSX/TSX) - React component definitions
- CSS3 - Global styles via Tailwind CSS v4 in `src/app/globals.css`
## Runtime
- Node.js (development and build-time)
- Browser (client-side game execution)
- npm (lockfile: `package-lock.json`)
## Frameworks
- Next.js 16.2.1 - Full-stack app framework with App Router
- React 19.2.4 - UI component library and state management integration
- Tailwind CSS v4 - Utility-first CSS framework via `@tailwindcss/postcss` PostCSS plugin
- Zustand 5.0.12 - Client-side game state store (`src/store/gameStore.ts`), selective subscriptions prevent re-renders during animations
- motion 12.38.0 - React state-driven transitions and card flip animations (imported from `motion/react`, NOT `framer-motion`)
- canvas-confetti 1.9.4 - Victory fireworks effect with `useWorker: true` option for off-main-thread rendering on mobile
## Key Dependencies
- `motion` 12.38.0 - Provides all screen transitions (idle → play → result → victory/gameover), simultaneous choice reveal animations
- `zustand` 5.0.12 - Central FSM game state management, prevents prop drilling across full component tree
- `canvas-confetti` 1.9.4 - Victory celebration effect, uses canvas for performance on mobile
- `@types/canvas-confetti` 1.9.0 - TypeScript definitions for canvas-confetti
- `@types/node` 20.19.37 - Node.js type definitions for build processes
- `@types/react` 19 - React component and hook types
- `@types/react-dom` 19 - React DOM rendering types
- `vitest` 4.1.2 - Unit test runner with jsdom environment
- `@testing-library/react` 16.3.2 - Component testing utilities
- `@testing-library/dom` 10.4.1 - DOM query utilities for tests
- `@testing-library/jest-dom` 6.9.1 - Assertion matchers (toBeInTheDocument, etc.)
- `@testing-library/user-event` 14.6.1 - User interaction simulation (click, type)
- `@vitest/coverage-v8` 4.1.2 - V8 code coverage reporting
- `eslint` 9 - Code linting via flat config
- `eslint-config-next` 16.2.1 - Next.js ESLint rules (Core Web Vitals, TypeScript)
- `@tailwindcss/postcss` 4 - Tailwind v4 PostCSS plugin
- `@vitejs/plugin-react` 6.0.1 - React JSX transform for Vitest
- `jsdom` 29.0.1 - DOM environment simulation for test execution
- `typescript` 5 - TypeScript compiler bundled with Next.js 16
- Geist font family (via `next/font/google`) - System font loaded from Google Fonts API
## Configuration
- Environment variables configured in Next.js via `process.env.NEXT_PUBLIC_*` pattern
- `NEXT_PUBLIC_ALLOWED_ORIGIN` - Restricts postMessage iframe embedding to specific origin (defaults to `'*'`)
- No `.env` file required for base functionality; iframe embedding requires parent window origin configuration
- `next.config.ts` - TypeScript configuration with CSP and X-Frame-Options headers for iframe embedding
- `tsconfig.json` - TypeScript compiler options with path alias `@/*` → `src/*`
- `postcss.config.mjs` - PostCSS configuration for Tailwind CSS v4
- `eslint.config.mjs` - Flat ESLint config with Next.js rules
- `vitest.config.ts` - Vitest setup with jsdom environment, coverage via V8, alias resolution
## Platform Requirements
- Node.js (bundled with Next.js 16)
- npm for package management
- Turbopack dev server (bundled with Next.js 16, invoked via `next dev --turbo`)
- Deployment target: Vercel (detected via `.vercel/` directory)
- Compatible with any Node.js 18+ runtime
- Browser support: All modern browsers (ES2017 target in TypeScript)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase with `.tsx` extension (e.g., `ChoiceButton.tsx`, `PlayScreen.tsx`)
- Utilities/helpers: camelCase with `.ts` extension (e.g., `gameRules.ts`, `usePostMessage.ts`)
- Store files: camelCase (e.g., `gameStore.ts`)
- SVG icon components: PascalCase with descriptive names (e.g., `Rock.tsx`, `Paper.tsx`, `Scissors.tsx`)
- Test files: `__tests__/` directory with `[filename].test.ts` or `[filename].test.tsx` pattern
- Mocks: `__mocks__/[package-name]/` structure (e.g., `__mocks__/motion/react.tsx`)
- React components: PascalCase function names (e.g., `export function ChoiceButton()`)
- Hooks: Prefix with `use` (e.g., `usePostMessage`, `useGameStore`)
- Utility functions: camelCase (e.g., `determineOutcome()`, `pickAiChoice()`)
- Callbacks in props: `on` prefix followed by action (e.g., `onSelect()`)
- State variables: camelCase (e.g., `playerChoice`, `lastOutcome`, `roundResults`)
- Constants (exported): UPPER_SNAKE_CASE (e.g., `BEATS`, `LOSES_TO`, `TOTAL_ROUNDS`)
- Constants (object lookup maps): PascalCase with suffix (e.g., `CHOICE_ICONS`, `CHOICE_LABELS`)
- Refs: `camelCase` with `Ref` suffix (e.g., `timerRef`, `hasFiredRef`, `postMessageSpy`)
- Exported types: PascalCase (e.g., `Choice`, `Outcome`, `Phase`, `GameState`, `GameAction`, `SessionPayload`)
- Union types: lowercase with pipe separators (e.g., `'idle' | 'selecting' | 'revealing'`)
- Interface props: `[ComponentName]Props` (e.g., `ChoiceButtonProps`, `ChoiceCardProps`)
- Record/lookup types: `Record<KeyType, ValueType>` pattern (e.g., `Record<Choice, React.ComponentType<...>>`)
## Code Style
- No Prettier config found; using ESLint for formatting enforcement only
- Line length: No explicit limit enforced; natural wrapping observed around 80-100 chars
- Indentation: 2 spaces (standard JavaScript/TypeScript)
- Trailing commas: Present in multi-line arrays/objects
- String quotes: Single quotes for JS/TS, double quotes in JSX/props
- ESLint config: `eslint.config.mjs` with Next.js presets
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Global ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- No custom rule overrides; uses defaults from Next.js
- All interactive components use `'use client'` at the top
- Examples: `src/components/Game.tsx`, `src/components/ui/ChoiceButton.tsx`, `src/hooks/usePostMessage.ts`
- Reason: Game logic is entirely client-side; no SSR complexity needed
## Import Organization
- `@/` → `./src/` (configured in `tsconfig.json`)
- All local imports use absolute `@/` paths, never relative paths
- Organized by category: `@/lib/`, `@/store/`, `@/hooks/`, `@/components/`, etc.
## Error Handling
- Guard clauses with early returns (e.g., in `usePostMessage.ts`: `if (!event.data || event.data.type !== 'RPS_COUPON_CONFIG') return`)
- Null checks before using potentially null values (e.g., in `gameStore.ts`: `if (!playerChoice || !aiChoice) return`)
- Origin validation for postMessage: `if (allowedOrigin !== '*' && event.origin !== allowedOrigin) return`
- No explicit try-catch blocks found; errors are prevented via defensive checks
- Silent failures for invalid data (no throws; guards prevent bad state transitions)
- Uses `process.env.NEXT_PUBLIC_ALLOWED_ORIGIN` with fallback `'*'`
- Accessed in `next.config.ts` and `usePostMessage.ts`
## Logging
- No console.log statements found in source code
- Logging is minimal/absent; game logic is deterministic and testable
- Debugging relies on React DevTools and browser devtools for state inspection
## Comments
- Explanatory header comments at top of files describing purpose
- Comments explain WHY, not WHAT
- Comments describe pitfalls and non-obvious behavior
- Functions have JSDoc blocks with `@param` and `@returns` tags
- Example (from `gameRules.ts`):
- Type interfaces documented with inline comments on fields
## Function Design
- Destructuring in function parameters when possible (e.g., `{ choice, onSelect, disabled }`)
- Avoid single-use parameters; use object destructuring for clarity
- Type annotations required for all parameters (TypeScript `strict: true`)
- Explicit return types always declared
- Early returns used for guard clauses before main logic
- Functions return `void` for actions, specific types for computations
- No implicit returns; always explicit `return` statement
## Module Design
- Named exports preferred (e.g., `export function ChoiceButton()`, `export const useGameStore = create(...)`)
- Default exports used sparingly (e.g., `export default function Game()` in `src/components/Game.tsx`)
- Type exports use `export type` (e.g., `export type Choice = 'scissors' | 'rock' | 'paper'`)
- Not used; imports reference specific files directly
- Example: `import { determineOutcome } from '@/lib/rps/gameRules'`
- Libraries aggregated: `import { ... } from '@/lib/rps'` re-exports from `index.ts` (assumed pattern)
## Conditional Rendering
- Ternary operators for simple conditions (e.g., `{phase === 'victory' ? '축하합니다!' : '아쉽네요...'}`)
- Short-circuit evaluation for optional display (e.g., `{couponConfig.couponImage && <img ... />}`)
- Multi-line conditionals use explicit ternary chains
- AnimatePresence with conditional rendering for full-screen state transitions
## Props Interface Convention
## Store Design (Zustand v5)
- Single store per feature (`useGameStore`)
- State + Actions co-located in `create()` call
- Selectors used in components: `useGameStore((s) => s.phase)`
- Actions always available via `useGameStore((s) => s.actionName)`
- Separate `initialState` object exported for testing reset
- Flat state object (not deeply nested)
- Null used for optional state: `playerChoice: Choice | null`
- Arrays for collections: `roundResults: RoundResult[]`
- Session payload is single nested object
## Animation Convention
- Always import as: `import { motion } from 'motion/react'`
- Wrap JSX elements with `motion.div`, `motion.button`, etc.
- Use `AnimatePresence` for enter/exit animations
- Spring animations for interactive feedback (e.g., button hover/tap)
- Transition props: `{ type: 'spring', stiffness: 400, damping: 15 }`
- 3D transforms: Use inline `style` with CSS properties (e.g., `transformStyle: 'preserve-3d'`)
## TypeScript
- Union types for discriminated state (e.g., `Phase = 'idle' | 'selecting' | ...`)
- `Outcome | null` instead of `Outcome?` (explicit null)
- Type guards with `if (!value)` before accessing properties
- `Record<K, V>` for lookup maps instead of object literal typing
## Tailwind CSS
- Utility-first approach; no CSS Modules or styled-components
- Responsive prefixes: `min-h-dvh` (device-independent viewport height)
- Mobile-first design with 44px minimum touch targets (e.g., `min-h-[44px]`, `min-w-[80px]`)
- Custom colors: Hardcoded hex values in className (e.g., `text-[#FFD700]`, `bg-[#FF6B6B]`)
- Group utilities: `group-hover:`, `group-active:` not observed; each component is independent
- Conditional styling: Inline ternary for theme switching (e.g., `${phase === 'victory' ? 'text-[#FFD700]' : 'text-white'}`)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Pure functional game logic layer (`@/lib/rps`) decoupled from React
- Centralized state management via Zustand FSM (`@/store/gameStore`)
- Screen-based UI composition with phase-driven rendering
- Iframe-compatible postMessage integration for external embedding
- No server-side rendering — fully client-side game experience
## Layers
- Purpose: Pure, deterministic functions for RPS rules, AI decision-making, and session tracking
- Location: `src/lib/rps/`
- Contains: Functions (`pickAiChoice`, `determineOutcome`, `createSession`, `finalizeSession`), types, constants
- Depends on: TypeScript types only — no React, no DOM
- Used by: Zustand store (`gameStore.ts`)
- Purpose: Centralized FSM-driven game state using Zustand v5
- Location: `src/store/gameStore.ts`
- Contains: Game state shape, action handlers that orchestrate logic layer functions
- Depends on: `@/lib/rps` (pickAiChoice, determineOutcome, createSession, finalizeSession)
- Used by: All React components via hooks (`useGameStore((s) => s.phase)`)
- Purpose: React components organized by game phase (idle, play, result)
- Location: `src/components/screens/` (IdleScreen, PlayScreen, ResultScreen)
- Contains: Phase-specific screen components that read state and call store actions
- Depends on: `@/store/gameStore`, child components, motion library
- Used by: Main Game component via phase-driven rendering
- Purpose: Reusable UI components for game interactions
- Location: `src/components/` (battle/, effects/, ui/, svg/)
- Contains: ChoiceCard (card flip animation), ChoiceButton (input), RoundIndicator (progress), icons
- Depends on: Motion for animations, Zustand for state reads
- Used by: Screen components
- Purpose: Encapsulate side effects and cross-cutting concerns
- Location: `src/hooks/`
- Contains: `usePostMessage` (iframe embedding protocol)
- Depends on: `@/store/gameStore`, browser postMessage API
- Used by: Game component at entry point
- Purpose: Imperative visual effects (confetti, shake)
- Location: `src/components/effects/`
- Contains: VictoryConfetti, DefeatEffect
- Depends on: Canvas-confetti library, Zustand for phase detection
- Used by: Game component conditional rendering
## Data Flow
- Single Zustand store (`useGameStore`) is the single source of truth for all game state
- Components use selective subscriptions: `useGameStore((s) => s.phase)` only re-renders on phase change
- Actions in store are synchronous — no async flows (all computation client-side)
- Store actions perform atomic updates (e.g., `select()` updates playerChoice, aiChoice, AND phase in one `set()` call)
- Session object accumulates round records as rounds complete; finalized on gameover/victory
## Key Abstractions
- Purpose: Models the game state machine; drives which screen renders
- Examples: `idle | selecting | revealing | result | gameover | victory`
- Pattern: Zustand store holds phase as state; Game component uses AnimatePresence with phase as key
- Used by: Every component reads phase via `useGameStore((s) => s.phase)`
- Purpose: Represents RPS choices with deterministic rules
- Pattern: Type `'rock' | 'paper' | 'scissors'` with lookup tables BEATS and LOSES_TO (see `types.ts`)
- Example usage: `pickAiChoice()` takes player choice and returns AI choice deterministically
- Purpose: Result of a single round from player's perspective
- Pattern: Type `'win' | 'lose' | 'draw'`
- Computed by: `determineOutcome(playerChoice, aiChoice)` pure function
- Purpose: Immutable record of a complete game session for postMessage contract
- Pattern: Contains sessionId (UUID), startedAt/completedAt timestamps, rounds array, totalPlayTimeMs
- Lifecycle: Created at `start()`, mutated incrementally as rounds complete, finalized at gameover/victory
- Purpose: Tracks which rounds were won/lost (not all rounds are stored — only decisive ones)
- Pattern: Array `[{ outcome: Outcome, round: number }, ...]`
- Usage: Displayed in RoundIndicator to show completed rounds
- Purpose: Controls AI behavior scaling — harder as rounds progress
- Pattern: `WIN_RATE_TABLE[roundIndex]` = probability player wins (0.85 round 1 → 0.30 round 5)
- Stored: `src/lib/rps/constants.ts`
## Entry Points
- Location: `src/app/page.tsx`
- Triggers: Page load or navigation to `/`
- Responsibilities: Dynamic import of Game component with SSR disabled; wraps in minimal layout
- Location: `src/components/Game.tsx`
- Triggers: Rendered by app/page.tsx
- Responsibilities:
- Location: `src/store/gameStore.ts`
- Triggers: Called by `useGameStore()` hook from any component
- Responsibilities:
## Error Handling
- Null checks on dependent state: `if (!playerChoice || !aiChoice) return` in `revealDone()`
- Fallback defaults: `WIN_RATE_TABLE[roundIndex] ?? 0.50` if round index out of bounds
- Guard conditions: `if (drawCount >= MAX_DRAW_AUTO_WIN)` before randomness in AI engine (prevents off-by-one)
- Finalization guard: `if (!session.completedAt) return` before sending postMessage (ensures session is finalized)
## Cross-Cutting Concerns
- Choice validation: Only `'rock' | 'paper' | 'scissors'` are valid; typed as discriminated union
- Phase validation: Implicit via TypeScript; only valid phase transitions defined in Zustand actions
- Origin validation in postMessage: `allowedOrigin !== '*' && event.origin !== allowedOrigin` guards against XSS
- Tool: motion/react (v12.38.0)
- Screen transitions: AnimatePresence with opacity/scale via motion.div
- Card reveals: ChoiceCard uses rotateY with perspective for 3D flip
- Result flash: ResultFlash overlays with scale bounce animation
- Victory: spring animation with scale + confetti bursts
- Viewport meta via `generateViewport` export in layout.tsx
- Tailwind responsive classes: PlayScreen uses flex column layouts
- Safe areas: ChoiceButton and buttons use `touch-manipulation` class, bottom bar uses `env(safe-area-inset-bottom)`
- Touch targets: All buttons 44px minimum (ChoiceButton min-h-[44px])
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
