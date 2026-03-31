# Testing Patterns

**Analysis Date:** 2026-03-31

## Test Framework

**Runner:**
- Vitest v4.1.2
- Config: `vitest.config.ts`
- Environment: jsdom (browser-like DOM for testing)

**Assertion Library:**
- Vitest built-in assertions via `expect()`
- Testing Library matchers extended via `@testing-library/jest-dom` (6.9.1)

**Run Commands:**
```bash
npm test              # Run all tests once (vitest run)
npm run test:watch   # Watch mode (vitest)
```

**Coverage:**
- Provider: v8 (via `@vitest/coverage-v8`)
- Reporters: text and lcov
- No coverage threshold enforced

## Test File Organization

**Location:**
- Co-located: `__tests__/` subdirectory in same folder as source
- Examples:
  - `src/lib/rps/__tests__/gameRules.test.ts` (alongside `gameRules.ts`)
  - `src/components/screens/__tests__/PlayScreen.test.tsx` (alongside `PlayScreen.tsx`)
  - `src/hooks/__tests__/usePostMessage.test.ts` (alongside `usePostMessage.ts`)
  - `src/store/__tests__/gameStore.test.ts` (alongside `gameStore.ts`)

**Naming:**
- Pattern: `[source-filename].test.ts` or `[source-filename].test.tsx`
- Examples: `gameRules.test.ts`, `PlayScreen.test.tsx`, `usePostMessage.test.ts`

**Structure:**
```
src/
├── lib/rps/
│   ├── gameRules.ts
│   └── __tests__/
│       └── gameRules.test.ts
├── components/screens/
│   ├── PlayScreen.tsx
│   └── __tests__/
│       └── PlayScreen.test.tsx
├── hooks/
│   ├── usePostMessage.ts
│   └── __tests__/
│       └── usePostMessage.test.ts
├── store/
│   ├── gameStore.ts
│   └── __tests__/
│       └── gameStore.test.ts
```

## Test Structure

**Suite Organization:**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Feature or Component Name', () => {
  beforeEach(() => {
    // Reset state before each test
    useGameStore.setState(initialState)
  })

  afterEach(() => {
    // Clean up mocks
    vi.restoreAllMocks()
  })

  it('should do something specific', () => {
    // Arrange, Act, Assert
    expect(result).toBe(expected)
  })
})
```

**Patterns:**

**Setup Pattern:**
- `beforeEach()` resets state to known initial state
- `afterEach()` restores all mocks
- Example (from `gameStore.test.ts`):
  ```typescript
  beforeEach(() => {
    useGameStore.setState(initialState)
  })
  ```

**Teardown Pattern:**
- `afterEach()` with `vi.restoreAllMocks()` to clean spies
- Cleanup from Testing Library is automatic (configured in `src/__tests__/setup.ts`)
- Event listeners are cleaned up in hook unmount tests

**Assertion Pattern:**
- One logical assertion per test (may have multiple expect statements)
- Boolean checks: `expect(state).not.toBeNull()`
- Equality: `expect(state.phase).toBe('selecting')`
- Array length: `expect(state.roundResults).toHaveLength(5)`
- Object shape: `expect(config).toEqual({ couponCode: 'TEST-123', ... })`

## Mocking

**Framework:** Vitest built-in `vi` module

**Patterns:**

**Math.random() Mocking:**
```typescript
vi.spyOn(Math, 'random').mockReturnValue(0.01) // below win rate
// ... test logic ...
randomSpy.mockRestore() // cleanup
```

**window.parent.postMessage Mocking:**
```typescript
const postMessageSpy = vi.fn()
Object.defineProperty(window, 'parent', {
  value: { postMessage: postMessageSpy },
  writable: true,
  configurable: true,
})
// ... test logic ...
expect(postMessageSpy).toHaveBeenCalledWith({ ... }, '*')
postMessageSpy.mockClear()
```

**Event Listener Cleanup Test:**
```typescript
const removeSpy = vi.spyOn(window, 'removeEventListener')
const { unmount } = renderHook(() => usePostMessage())
unmount()
expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function))
removeSpy.mockRestore()
```

**What to Mock:**
- Global functions: `Math.random()`, `window.parent.postMessage`
- Browser APIs: event listeners, timers (via `setTimeout`)
- External services (if any): API calls, etc.
- Do NOT mock: Zustand store itself; use `setState()` to configure test state instead

**What NOT to Mock:**
- Zustand store methods: call `useGameStore.getState().action()` directly
- React hooks: use actual implementation, configure state via store
- Business logic functions: test pure functions with real inputs
- Component rendering: use actual component unless testing in isolation

## Fixtures and Factories

**Test Data:**

**Session Payload Fixture** (from `usePostMessage.test.ts`):
```typescript
const finalizedSession: SessionPayload = {
  sessionId: 'test-uuid-123',
  rounds: [],
  startedAt: '2026-03-30T10:00:00.000Z',
  completedAt: '2026-03-30T10:05:00.000Z',
  totalPlayTimeMs: 300000,
}
```

**Store State Reset Pattern:**
```typescript
useGameStore.setState(initialState)  // Reset to initial state
useGameStore.setState({
  phase: 'victory',
  session: finalizedSession
})  // Partially set for specific test
```

**Location:**
- Fixtures defined in test file itself (not in separate fixtures directory)
- Simple constants at top of describe block (e.g., `emptySession`, `finalizedSession`)
- Store reset via `initialState` export from `gameStore.ts`

## Coverage

**Requirements:** No coverage threshold enforced

**View Coverage:**
```bash
npm test -- --coverage
```

Coverage files generated in `.coverage/` (assumed default Vitest location):
- `coverage/` directory contains LCOV reports
- Use `npm test -- --coverage` to generate HTML report

## Test Types

**Unit Tests:**

**Scope:** Single function or component in isolation

**Approach:**
- Pure functions: call with inputs, assert outputs (e.g., `gameRules.test.ts`)
  ```typescript
  it('scissors vs scissors → draw', () => {
    expect(determineOutcome('scissors', 'scissors')).toBe('draw')
  })
  ```
- Store actions: call action via `useGameStore.getState().action()`, assert state changed
  ```typescript
  it('start() transitions phase from idle to selecting', () => {
    useGameStore.getState().start()
    const state = useGameStore.getState()
    expect(state.phase).toBe('selecting')
  })
  ```

**Integration Tests:**

**Scope:** Multiple components/modules working together

**Approach:**
- Hook testing: use `renderHook()` from `@testing-library/react`
  ```typescript
  renderHook(() => usePostMessage())
  // Dispatch events and assert side effects
  ```
- Component testing: use `render()` from `@testing-library/react`
  ```typescript
  const { ... } = render(<PlayScreen />)
  expect(screen.getByText('승리!')).toBeTruthy()
  ```
- Store integration: test FSM transitions across multiple actions
  ```typescript
  useGameStore.getState().start()
  useGameStore.getState().select('rock')
  useGameStore.getState().revealDone()
  // Assert state after sequence
  ```

**E2E Tests:**

**Framework:** Not used

**Rationale:** Game is small enough for thorough integration testing; no E2E suite found

## Common Patterns

**Async Testing:**

**renderHook() with act():**
```typescript
import { renderHook, act } from '@testing-library/react'

const { result } = renderHook(() => usePostMessage())

act(() => {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { type: 'RPS_COUPON_CONFIG', couponCode: 'TEST' },
      origin: 'http://localhost:3000',
    })
  )
})

expect(useGameStore.getState().couponConfig).not.toBeNull()
```

**Timer Testing:**
- Mock `Math.random()` to control outcomes
- No explicit timer testing found (timers are implementation detail of animation library)

**Event Testing:**

**MessageEvent Dispatch:**
```typescript
act(() => {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { type: 'RPS_COUPON_CONFIG', ... },
      origin: 'origin-string',
    })
  )
})
```

**Error Testing:**

**Guard Clause Testing:**
```typescript
it('ignores messages with wrong type', () => {
  renderHook(() => usePostMessage())

  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'OTHER_MSG', couponCode: 'NOPE' },
        origin: 'http://localhost:3000',
      })
    )
  })

  expect(useGameStore.getState().couponConfig).toBeNull()
})
```

**Origin Validation Testing:**
```typescript
it('rejects messages from wrong origin when NEXT_PUBLIC_ALLOWED_ORIGIN is set', () => {
  process.env.NEXT_PUBLIC_ALLOWED_ORIGIN = 'https://allowed.com'

  renderHook(() => usePostMessage())

  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'RPS_COUPON_CONFIG', couponCode: 'EVIL-COUPON' },
        origin: 'https://evil.com',
      })
    )
  })

  expect(useGameStore.getState().couponConfig).toBeNull()
})
```

**Test Isolation:**
```typescript
afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.NEXT_PUBLIC_ALLOWED_ORIGIN // Clean up env vars
})
```

## Setup Files

**Location:** `src/__tests__/setup.ts`

**Contents:**
```typescript
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
```

**Purpose:**
- Extends Vitest's expect with Testing Library matchers (`.toBeInTheDocument()`, etc.)
- Auto-cleans up DOM after each test
- Configured in `vitest.config.ts`: `setupFiles: ['src/__tests__/setup.ts']`

## Mocking Motion Library

**Location:** `src/__mocks__/motion/react.tsx`

**Pattern:** Manual mock for animation library to avoid DOM computation during tests

**Usage:** Automatically used by Vitest when tests import from `motion/react`

## Testing Best Practices Observed

1. **State Reset:** Every test file resets store state in `beforeEach()` to ensure isolation
2. **Spy Cleanup:** `afterEach()` restores all spies to prevent cross-test pollution
3. **Arrange-Act-Assert:** Tests follow AAA pattern implicitly
4. **One Assertion Per Test:** Each test focuses on single behavior
5. **Descriptive Names:** Test names describe the scenario and expected outcome
6. **FSM Testing:** Store tests exercise full state machine transitions with mocked randomness
7. **No Magic Numbers:** Random values mocked explicitly (e.g., `0.01` below win rate, `0.99` above)
8. **Environment Isolation:** Process env vars cleaned up per test
9. **Mock Specificity:** Only necessary functions/objects are mocked; real implementations used otherwise

---

*Testing analysis: 2026-03-31*
