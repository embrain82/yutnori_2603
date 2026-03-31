# Coding Conventions

**Analysis Date:** 2026-03-31

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `ChoiceButton.tsx`, `PlayScreen.tsx`)
- Utilities/helpers: camelCase with `.ts` extension (e.g., `gameRules.ts`, `usePostMessage.ts`)
- Store files: camelCase (e.g., `gameStore.ts`)
- SVG icon components: PascalCase with descriptive names (e.g., `Rock.tsx`, `Paper.tsx`, `Scissors.tsx`)
- Test files: `__tests__/` directory with `[filename].test.ts` or `[filename].test.tsx` pattern
- Mocks: `__mocks__/[package-name]/` structure (e.g., `__mocks__/motion/react.tsx`)

**Functions:**
- React components: PascalCase function names (e.g., `export function ChoiceButton()`)
- Hooks: Prefix with `use` (e.g., `usePostMessage`, `useGameStore`)
- Utility functions: camelCase (e.g., `determineOutcome()`, `pickAiChoice()`)
- Callbacks in props: `on` prefix followed by action (e.g., `onSelect()`)

**Variables:**
- State variables: camelCase (e.g., `playerChoice`, `lastOutcome`, `roundResults`)
- Constants (exported): UPPER_SNAKE_CASE (e.g., `BEATS`, `LOSES_TO`, `TOTAL_ROUNDS`)
- Constants (object lookup maps): PascalCase with suffix (e.g., `CHOICE_ICONS`, `CHOICE_LABELS`)
- Refs: `camelCase` with `Ref` suffix (e.g., `timerRef`, `hasFiredRef`, `postMessageSpy`)

**Types:**
- Exported types: PascalCase (e.g., `Choice`, `Outcome`, `Phase`, `GameState`, `GameAction`, `SessionPayload`)
- Union types: lowercase with pipe separators (e.g., `'idle' | 'selecting' | 'revealing'`)
- Interface props: `[ComponentName]Props` (e.g., `ChoiceButtonProps`, `ChoiceCardProps`)
- Record/lookup types: `Record<KeyType, ValueType>` pattern (e.g., `Record<Choice, React.ComponentType<...>>`)

## Code Style

**Formatting:**
- No Prettier config found; using ESLint for formatting enforcement only
- Line length: No explicit limit enforced; natural wrapping observed around 80-100 chars
- Indentation: 2 spaces (standard JavaScript/TypeScript)
- Trailing commas: Present in multi-line arrays/objects
- String quotes: Single quotes for JS/TS, double quotes in JSX/props

**Linting:**
- ESLint config: `eslint.config.mjs` with Next.js presets
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Global ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- No custom rule overrides; uses defaults from Next.js

**'use client' Directive:**
- All interactive components use `'use client'` at the top
- Examples: `src/components/Game.tsx`, `src/components/ui/ChoiceButton.tsx`, `src/hooks/usePostMessage.ts`
- Reason: Game logic is entirely client-side; no SSR complexity needed

## Import Organization

**Order:**
1. React and Next.js imports (`import { useEffect } from 'react'`)
2. Third-party libraries (`import { motion } from 'motion/react'`, `import { create } from 'zustand'`)
3. Type imports (`import type { Choice, Outcome } from '@/lib/rps'`)
4. Local imports (absolute with `@/` alias) (`import { useGameStore } from '@/store/gameStore'`)

**Path Aliases:**
- `@/` → `./src/` (configured in `tsconfig.json`)
- All local imports use absolute `@/` paths, never relative paths
- Organized by category: `@/lib/`, `@/store/`, `@/hooks/`, `@/components/`, etc.

## Error Handling

**Patterns:**
- Guard clauses with early returns (e.g., in `usePostMessage.ts`: `if (!event.data || event.data.type !== 'RPS_COUPON_CONFIG') return`)
- Null checks before using potentially null values (e.g., in `gameStore.ts`: `if (!playerChoice || !aiChoice) return`)
- Origin validation for postMessage: `if (allowedOrigin !== '*' && event.origin !== allowedOrigin) return`
- No explicit try-catch blocks found; errors are prevented via defensive checks
- Silent failures for invalid data (no throws; guards prevent bad state transitions)

**Environment Validation:**
- Uses `process.env.NEXT_PUBLIC_ALLOWED_ORIGIN` with fallback `'*'`
- Accessed in `next.config.ts` and `usePostMessage.ts`

## Logging

**Framework:** `console` (no structured logging library detected)

**Patterns:**
- No console.log statements found in source code
- Logging is minimal/absent; game logic is deterministic and testable
- Debugging relies on React DevTools and browser devtools for state inspection

## Comments

**When to Comment:**
- Explanatory header comments at top of files describing purpose
  - Example: `// src/lib/rps/gameRules.ts` with one-line description
  - Example: `// Pure function: determines the outcome of a round from two choices.`
- Comments explain WHY, not WHAT
  - Example: `// Origin validation per D-08` (references spec)
  - Example: `// Atomic update: set both choices and phase in ONE set() call`
- Comments describe pitfalls and non-obvious behavior
  - Example: `// Guard: session must be finalized (Pitfall 1 from RESEARCH.md)`
  - Example: `// Per D-11 timing` (references design doc)

**JSDoc/TSDoc:**
- Functions have JSDoc blocks with `@param` and `@returns` tags
- Example (from `gameRules.ts`):
  ```typescript
  /**
   * Determines the outcome of a round from the player's perspective.
   * @param playerChoice - The choice made by the human player
   * @param aiChoice - The choice made by the AI
   * @returns 'win' | 'lose' | 'draw' from the player's perspective
   */
  export function determineOutcome(playerChoice: Choice, aiChoice: Choice): Outcome
  ```
- Type interfaces documented with inline comments on fields

## Function Design

**Size:** Most functions are 5-25 lines; some utilities are 1-3 lines

**Parameters:**
- Destructuring in function parameters when possible (e.g., `{ choice, onSelect, disabled }`)
- Avoid single-use parameters; use object destructuring for clarity
- Type annotations required for all parameters (TypeScript `strict: true`)

**Return Values:**
- Explicit return types always declared
- Early returns used for guard clauses before main logic
- Functions return `void` for actions, specific types for computations
- No implicit returns; always explicit `return` statement

## Module Design

**Exports:**
- Named exports preferred (e.g., `export function ChoiceButton()`, `export const useGameStore = create(...)`)
- Default exports used sparingly (e.g., `export default function Game()` in `src/components/Game.tsx`)
- Type exports use `export type` (e.g., `export type Choice = 'scissors' | 'rock' | 'paper'`)

**Barrel Files:**
- Not used; imports reference specific files directly
- Example: `import { determineOutcome } from '@/lib/rps/gameRules'`
- Libraries aggregated: `import { ... } from '@/lib/rps'` re-exports from `index.ts` (assumed pattern)

## Conditional Rendering

**Pattern:**
- Ternary operators for simple conditions (e.g., `{phase === 'victory' ? '축하합니다!' : '아쉽네요...'}`)
- Short-circuit evaluation for optional display (e.g., `{couponConfig.couponImage && <img ... />}`)
- Multi-line conditionals use explicit ternary chains
- AnimatePresence with conditional rendering for full-screen state transitions

## Props Interface Convention

**Structure:**
```typescript
interface ComponentNameProps {
  requiredProp: Type
  optionalProp?: Type
  // Callbacks last
  onAction: (arg: Type) => void
}
```

Example (from `ChoiceButtonProps`):
```typescript
interface ChoiceButtonProps {
  choice: Choice
  onSelect: (choice: Choice) => void
  disabled?: boolean
}
```

## Store Design (Zustand v5)

**Pattern:**
- Single store per feature (`useGameStore`)
- State + Actions co-located in `create()` call
- Selectors used in components: `useGameStore((s) => s.phase)`
- Actions always available via `useGameStore((s) => s.actionName)`
- Separate `initialState` object exported for testing reset

**State Shape:**
- Flat state object (not deeply nested)
- Null used for optional state: `playerChoice: Choice | null`
- Arrays for collections: `roundResults: RoundResult[]`
- Session payload is single nested object

## Animation Convention

**Library:** motion (v12.38.0) from `motion/react`

**Pattern:**
- Always import as: `import { motion } from 'motion/react'`
- Wrap JSX elements with `motion.div`, `motion.button`, etc.
- Use `AnimatePresence` for enter/exit animations
- Spring animations for interactive feedback (e.g., button hover/tap)
- Transition props: `{ type: 'spring', stiffness: 400, damping: 15 }`
- 3D transforms: Use inline `style` with CSS properties (e.g., `transformStyle: 'preserve-3d'`)

## TypeScript

**Strict Mode:** Enabled (`strict: true`)

**Type Patterns:**
- Union types for discriminated state (e.g., `Phase = 'idle' | 'selecting' | ...`)
- `Outcome | null` instead of `Outcome?` (explicit null)
- Type guards with `if (!value)` before accessing properties
- `Record<K, V>` for lookup maps instead of object literal typing

## Tailwind CSS

**Classes:**
- Utility-first approach; no CSS Modules or styled-components
- Responsive prefixes: `min-h-dvh` (device-independent viewport height)
- Mobile-first design with 44px minimum touch targets (e.g., `min-h-[44px]`, `min-w-[80px]`)
- Custom colors: Hardcoded hex values in className (e.g., `text-[#FFD700]`, `bg-[#FF6B6B]`)
- Group utilities: `group-hover:`, `group-active:` not observed; each component is independent
- Conditional styling: Inline ternary for theme switching (e.g., `${phase === 'victory' ? 'text-[#FFD700]' : 'text-white'}`)

---

*Convention analysis: 2026-03-31*
