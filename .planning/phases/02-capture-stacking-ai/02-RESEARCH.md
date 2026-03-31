# Phase 2: Capture, Stacking & AI - Research

**Researched:** 2026-03-31
**Domain:** Board game piece interaction rules (capture, stacking) and heuristic AI opponent
**Confidence:** HIGH

## Summary

Phase 2 extends the Phase 1 game logic library (`src/lib/yut/`) with three major capabilities: capture (landing on opponent sends them home + extra throw), stacking (landing on own piece with player choice to merge), and an AI opponent that plays full games autonomously. All work is pure logic -- no UI rendering.

The existing codebase provides a solid foundation: `processThrow` already handles extra throw chaining (the same mechanism capture will use), `findValidMoves` enumerates legal moves (AI will consume this directly), and the pure-functional pattern with comprehensive Vitest coverage (100/100 tests) establishes clear implementation patterns. The primary complexity lies in extending `PieceState` to support stacking (group identity), adding capture detection after each move, and building a heuristic scorer that achieves 70-80% player win rate through intentional suboptimality.

The AI requires no minimax, MCTS, or lookahead. A single-ply heuristic evaluation of each legal move, combined with 40% random move selection and 30% capture-ignore rate, is sufficient for the "easy" difficulty target. The key challenge is tuning weights to hit the win rate target, which requires simulation testing.

**Primary recommendation:** Extend types with stacking support (stackedPieceIds on PieceState), add capture.ts and ai.ts modules following existing pure-functional patterns, use weighted linear evaluation for AI scoring, validate win rate with automated simulation of 1000+ games.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Landing on opponent piece sends it HOME and grants an extra throw immediately (same mechanism as yut/mo chaining -- increments throwsRemaining)
- **D-02:** Captured stacked group returns ALL pieces individually to HOME
- **D-03:** Extra throw from capture is processed identically to yut/mo extra throw -- feeds into existing throw queue
- **D-04:** When player's piece lands on own piece, player is ASKED whether to stack (not auto-stack)
- **D-05:** If player refuses stacking, both pieces coexist on same position independently
- **D-06:** Stacked pieces move as one group -- single entity on the board
- **D-07:** Phase 2 implements the logic/function only -- UI for the choice is deferred to Phase 5
- **D-08:** AI always stacks when landing on own piece
- **D-09:** Heuristic scoring + 40% random move selection -- evaluate each legal move with a score, pick best 60% of the time, random 40%
- **D-10:** Heuristic factors: distance_to_finish reduction, capture bonus, stack bonus
- **D-11:** AI ignores capture opportunities ~30% of the time
- **D-12:** AI always takes shortcuts (no deliberate suboptimal path choice)
- **D-13:** Target win rate: player wins ~70-80% of games
- **D-14:** AI turn executes immediately (no delay) -- Phase 5 will add visual delays
- **D-15:** AI auto-throws, auto-selects piece, auto-moves -- full game can run without human input
- **D-16:** AI handles yut/mo chaining and capture extra throws identically to player

### Claude's Discretion
- Heuristic weight values for scoring (tuned to achieve ~70-80% player win rate)
- Internal function decomposition for capture/stack logic
- Test structure and edge case prioritization

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-07 | Landing on opponent piece triggers capture + extra turn | Capture detection after move resolution; reuse processThrow extra-throw mechanism (D-01, D-03) |
| GAME-08 | Landing on own piece offers stack choice | Stack detection after move resolution; function returns "stack pending" state for player decision (D-04, D-05) |
| GAME-09 | Stacked pieces move as one group | PieceState extended with stackedPieceIds; resolveMove operates on group leader (D-06) |
| GAME-10 | Captured stacked group returns all pieces individually to start | Capture handler iterates stackedPieceIds, resets each to HOME (D-02) |
| AI-01 | AI auto-throws and selects moves to complete full games | AI turn loop: throw -> evaluate moves -> select -> apply -> repeat (D-14, D-15, D-16) |
| AI-02 | Player wins ~70-80% against AI | Heuristic scoring with intentional suboptimality; validated by simulation (D-13) |
| AI-03 | AI uses heuristic scoring with ~40% random moves | Linear weighted evaluation + random selection probability (D-09, D-10) |
| AI-04 | AI ignores capture opportunities ~30% of time | Before scoring, 30% chance to filter out capture moves from consideration (D-11) |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Import paths:** All local imports use absolute `@/` paths, never relative
- **Naming:** Utility/helper files use camelCase `.ts` extension; exported constants UPPER_SNAKE_CASE; types PascalCase
- **Test files:** `__tests__/` directory with `[filename].test.ts` pattern
- **Module design:** Named exports preferred; barrel export via `index.ts`
- **Function design:** JSDoc with `@param`/`@returns`; explicit return types; early return guard clauses; type annotations on all params
- **Code style:** 2-space indent; single quotes for TS; trailing commas in multi-line; comments explain WHY not WHAT
- **Error handling:** Guard clauses with early returns; defensive checks; no explicit try-catch
- **TypeScript:** `strict: true`; union types for discriminated state; `Record<K, V>` for lookup maps; `| null` (not `?`) for optional state
- **Architecture:** Pure functional game logic in `src/lib/yut/` with zero rendering dependencies
- **Store:** Zustand v5 single store per feature; flat state; selectors in components
- **Testing:** Vitest 4.1.2 with jsdom environment; coverage via V8

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5 | Type safety for game logic | Already in project |
| Vitest | 4.1.2 | Unit testing for all new modules | Already in project, 100 tests passing |

### Supporting (no new dependencies needed)
This phase requires NO new npm packages. All capture, stacking, and AI logic is pure TypeScript operating on existing types. The AI is a simple heuristic scorer, not a search algorithm requiring external libraries.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled heuristic | Minimax/MCTS | Massive overkill for "easy" AI with 2 pieces; adds complexity, computation cost, and makes suboptimality harder to control |
| Weighted linear scorer | Neural network | Way overkill; training data doesn't exist; deterministic weights are tunable and debuggable |

**Installation:**
```bash
# No new packages required
```

## Architecture Patterns

### Recommended Module Structure
```
src/lib/yut/
  types.ts          # Extended with StackInfo, CaptureResult, MoveOutcome, AiConfig
  board.ts          # Unchanged
  throw.ts          # Unchanged
  movement.ts       # Unchanged
  game.ts           # Extended: applyMove (orchestrates capture/stack detection)
  capture.ts        # NEW: detectCapture, executeCapture, detectStack
  ai.ts             # NEW: evaluateMove, selectAiMove, executeAiTurn
  index.ts          # Updated barrel: export capture.ts and ai.ts
  __tests__/
    capture.test.ts # NEW: capture + stacking tests
    ai.test.ts      # NEW: AI scoring + selection tests
    game.test.ts    # Extended: integration tests with capture/stack
```

### Pattern 1: Move Outcome Resolution (post-move detection)

**What:** After resolving a piece's movement (via `resolveMove`/`enterBoard`), check the destination for interactions with other pieces -- capture (opponent) or stack opportunity (own).

**When to use:** Every time a move is applied to the game state.

**Example:**
```typescript
// Source: project architecture pattern from Phase 1
interface MoveOutcome {
  pieces: PieceState[]
  captured: boolean          // Did we capture an opponent?
  capturedPieceIds: string[] // Which opponent pieces were sent home?
  stackPending: boolean      // Is there a stacking choice to make?
  stackTargetIds: string[]   // Which own pieces are at destination?
}

/**
 * Apply a move and detect capture/stack interactions.
 *
 * This is the central orchestration function. After resolving movement,
 * it checks the destination station for opponent pieces (capture) and
 * friendly pieces (stack opportunity).
 *
 * @param pieces - Current piece array
 * @param pieceId - The piece being moved
 * @param moveResult - Result from resolveMove/enterBoard
 * @returns MoveOutcome with updated pieces and interaction flags
 */
function applyMove(
  pieces: PieceState[],
  pieceId: string,
  moveResult: MoveResult
): MoveOutcome {
  // 1. Update moving piece position
  // 2. Check destination for opponents -> capture
  // 3. Check destination for friendlies -> stack pending
  // 4. Return outcome with flags
}
```

### Pattern 2: Stacking as Optional Group Formation

**What:** Stacking creates a logical group. The "leader" piece carries a `stackedPieceIds` array. Stacked pieces are marked with a `stackedWith` reference. Movement operates on the leader; all stacked pieces follow.

**When to use:** When a player (or AI) confirms stacking after landing on own piece.

**Example:**
```typescript
// Extend PieceState for stacking support
interface PieceState {
  id: string
  team: Team
  position: PiecePosition
  stackedPieceIds: string[]  // IDs of pieces stacked onto this one (leader)
  stackedWith: string | null // ID of the leader piece (follower)
}

/**
 * Confirm stacking: merge two pieces (or groups) at the same position.
 * The piece that was already there becomes the leader.
 */
function confirmStack(
  pieces: PieceState[],
  arrivingPieceId: string,
  existingPieceId: string
): PieceState[] {
  // existingPiece.stackedPieceIds.push(arrivingPieceId)
  // arrivingPiece.stackedWith = existingPieceId
  // If arriving piece had its own stack, merge all into existing
}
```

### Pattern 3: AI Heuristic Evaluation with Intentional Suboptimality

**What:** Score each legal move with a weighted linear function, then apply randomization (40% random, 30% capture-ignore) to achieve easy difficulty.

**When to use:** Every AI turn when selecting which piece to move.

**Example:**
```typescript
interface ScoredMove {
  pieceId: string
  throwResult: ThrowResult
  score: number
  wouldCapture: boolean
  wouldStack: boolean
}

/**
 * Evaluate a single move for AI scoring.
 * Score = w1 * distanceReduction + w2 * captureBonus + w3 * stackBonus
 */
function evaluateMove(
  pieces: PieceState[],
  pieceId: string,
  throwResult: ThrowResult,
  weights: AiWeights
): ScoredMove { /* ... */ }

/**
 * Select a move for AI with intentional suboptimality.
 * 1. Enumerate all legal moves via findValidMoves
 * 2. Score each move
 * 3. With 30% probability, filter out capture moves (D-11)
 * 4. With 40% probability, pick random move instead of best (D-09)
 * 5. With 60% probability, pick highest-scored move
 */
function selectAiMove(
  state: GameLogicState,
  weights: AiWeights
): { pieceId: string; stackChoice?: boolean } { /* ... */ }
```

### Pattern 4: AI Turn Loop (full autonomous execution)

**What:** AI executes its entire turn synchronously: throw -> evaluate -> select piece -> apply move -> handle extra throws -> repeat until turn ends.

**When to use:** When activeTeam is 'ai' and the game is not over.

**Example:**
```typescript
/**
 * Execute one complete AI turn.
 * Handles all throws (including yut/mo chaining and capture extra throws),
 * piece selection, movement, and stacking decisions.
 *
 * @returns New GameLogicState after AI's entire turn
 */
function executeAiTurn(state: GameLogicState): GameLogicState {
  let current = { ...state }

  // Phase 1: Throw until no throws remaining
  while (current.turnState.throwsRemaining > 0) {
    const throwResult = generateThrow()
    current.turnState = processThrow(current.turnState, throwResult)
  }

  // Phase 2: Consume and apply each pending move
  while (current.turnState.pendingMoves.length > 0) {
    const { consumed, newTurnState } = consumeMove(current.turnState)
    current.turnState = newTurnState

    const move = selectAiMove(current, consumed!)
    const outcome = applyMove(current.pieces, move.pieceId, ...)

    if (outcome.captured) {
      // Capture grants extra throw -> back to throwing phase
      current.turnState.throwsRemaining += 1
      // Process extra throws
      while (current.turnState.throwsRemaining > 0) { ... }
    }

    if (outcome.stackPending) {
      // AI always stacks (D-08)
      current.pieces = confirmStack(current.pieces, ...)
    }
  }

  return current
}
```

### Anti-Patterns to Avoid

- **Mutating PieceState arrays directly:** Always create new arrays/objects. The existing codebase is pure-functional. Mutations will break test isolation and make state tracking impossible.
- **Tracking stacks as separate data structure:** Don't maintain a separate `stacks: Map<string, string[]>` alongside pieces. Embed stack info IN PieceState to keep a single source of truth.
- **Making AI async or using setTimeout:** AI turn is synchronous logic. Delays are a Phase 5 UI concern. The logic must be testable without timers.
- **Re-implementing throw queue for capture extra throws:** Capture extra throw uses the EXACT same `processThrow` mechanism as yut/mo (D-03). Do not create a separate code path.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Random number generation | Custom RNG | `Math.random()` | Already used in throw.ts; AI difficulty is controlled via move selection, not throw weighting |
| Move enumeration | Custom piece scanning | `findValidMoves()` from game.ts | Already tested and working; AI consumes this directly |
| Extra throw processing | Separate capture-throw handler | `processThrow()` from game.ts | D-03 explicitly states capture extra throw is identical to yut/mo extra throw |
| Board path resolution | Custom path calculation | `resolveMove()` / `enterBoard()` from movement.ts | Already handles all 5 routes, branching, and finish detection |

**Key insight:** Phase 2 is an extension layer, not a rewrite. The capture/stack/AI modules orchestrate existing Phase 1 functions. The only new "engine" work is the heuristic scorer and the post-move interaction detection.

## Common Pitfalls

### Pitfall 1: Stacked Piece Position Desynchronization
**What goes wrong:** When a stacked group moves, only the leader piece's position gets updated. The follower pieces retain their old positions because the movement code doesn't know about stacking.
**Why it happens:** `resolveMove` operates on a single `PieceState`. It doesn't know about stacks. If the caller forgets to update follower positions after moving the leader, the game state becomes inconsistent.
**How to avoid:** After every `resolveMove` call on a leader piece, iterate `stackedPieceIds` and set each follower's position to match the leader's new position. Implement this as a single function (`moveStack`) that handles both leader and followers atomically.
**Warning signs:** A follower piece appears at the old position while the leader is at the new position. Tests that check piece positions after a stack move find stale positions.

### Pitfall 2: Capture-then-Stack Ordering Bug
**What goes wrong:** A piece moves to a station with both an opponent piece AND a friendly piece. If capture is checked first, the opponent is sent home and the station now has only a friendly piece. If stacking is checked first, the piece stacks with the friendly, then the stack captures the opponent. The outcomes differ: in the second case, the newly-formed stack captures, meaning 3 pieces are at risk if later captured back.
**Why it happens:** The order of capture vs. stack detection matters. Traditional yut nori rules: capture happens FIRST (opponent is sent home), then stacking is offered with any remaining friendly pieces at that station.
**How to avoid:** Always process interactions in order: (1) Check for opponents at destination -> capture, (2) Check for friendlies at destination -> offer stack. Never reverse this order.
**Warning signs:** Tests where a piece lands on a station with both opponent and friendly pieces produce unexpected stacking behavior.

### Pitfall 3: Capture Extra Throw During Move Phase Creates Nested Loop
**What goes wrong:** During the move phase (consuming pending moves), a capture grants an extra throw. That extra throw produces a new result that gets added to the pending queue. If the implementation isn't careful, it can either: (a) skip the extra throw entirely, (b) process the new pending move out of order, or (c) enter an infinite loop if the extra throw also results in a capture.
**Why it happens:** The throw phase and move phase are interleaved when captures occur. The simple "throw all, then move all" model breaks down.
**How to avoid:** After each move that causes a capture, immediately: (1) increment `throwsRemaining`, (2) process all new throws until `throwsRemaining === 0`, (3) resume consuming pending moves (including the newly added ones). This is the same "drain throws, then continue moves" pattern. For AI, this is a nested while-loop. For player, it transitions back to the throw UI state.
**Warning signs:** After a capture, the extra throw never fires, or the game gets stuck in an infinite loop.

### Pitfall 4: AI Win Rate Off Target Due to Bad Weight Tuning
**What goes wrong:** The AI wins too often (>30%) or too rarely (<20%), making the game feel broken or trivially easy.
**Why it happens:** Heuristic weights interact non-linearly with the randomization percentages. A capture bonus that's too high can make the AI play nearly optimally despite 40% random selection. Or the 30% capture-ignore rate stacks with 40% random to make AI effectively braindead.
**How to avoid:** Build an automated simulation that plays 1000+ games (AI vs AI with one side having player-optimal strategy and the other using the easy AI). Tune weights and percentages until the easy AI loses 70-80% of the time. Start with simple weights (e.g., distance_reduction=1, capture=5, stack=2) and adjust.
**Warning signs:** Player wins <60% or >90% of games in simulation. The number to test against is 70-80% player wins.

### Pitfall 5: Stacking on HOME Pieces (Invalid State)
**What goes wrong:** HOME pieces don't have board positions. If the code checks for "friendly pieces at the same station" without filtering out HOME pieces, it might detect HOME pieces as being at station -1 together and try to stack them.
**Why it happens:** HOME is represented as `station: -1`. If two HOME pieces are compared, they share the same station value.
**How to avoid:** Only check for capture/stacking at valid board positions (station >= 0). HOME pieces and FINISH pieces are excluded from interaction detection.
**Warning signs:** Tests where two HOME pieces get stacked before either enters the board.

### Pitfall 6: Stack-on-Stack Merge Not Handling Transitive Followers
**What goes wrong:** Piece A has piece B stacked (A is leader, B is follower). Piece C lands on A+B. C should stack into the existing group, making A the leader of B and C. But if the code only handles single-piece stacking, it might create C->A->B chains or lose B in the merge.
**Why it happens:** The stacking function handles "single piece joins single piece" but not "single piece joins existing group" or "group joins group."
**How to avoid:** The stacking function must handle all cases: (1) single onto single, (2) single onto group (append to leader's stackedPieceIds), (3) group leader onto single (single becomes new leader? or leader absorbs?). Decision: the piece already at the position is always the leader. All arriving pieces (including their followers) are absorbed into the leader's stackedPieceIds.
**Warning signs:** Stack size tracking shows incorrect counts after multi-piece merges.

## Code Examples

Verified patterns from the existing codebase that Phase 2 must follow.

### Existing: processThrow Extra Throw Mechanism (reuse for capture)
```typescript
// Source: src/lib/yut/game.ts lines 51-61
// Capture extra throw uses this EXACT same mechanism (D-03)
export function processThrow(turnState: TurnState, result: ThrowResult): TurnState {
  const newPending = [...turnState.pendingMoves, result]
  const base = turnState.throwsRemaining - 1
  const extra = result.grantsExtra ? 1 : 0
  return {
    ...turnState,
    pendingMoves: newPending,
    throwsRemaining: base + extra,
  }
}

// For capture: instead of processThrow, directly increment throwsRemaining:
// turnState.throwsRemaining += 1
// This is because capture doesn't produce a throw result yet -- it grants
// the RIGHT to throw again. The throw result comes later.
```

### Existing: findValidMoves (AI consumes directly)
```typescript
// Source: src/lib/yut/game.ts lines 133-149
// AI calls this to enumerate all legal moves for a throw result
export function findValidMoves(
  pieces: PieceState[],
  team: Team,
  throwResult: ThrowResult
): MoveOption[] {
  const teamPieces = pieces.filter((p) => p.team === team)
  return teamPieces.map((piece) => {
    const { canMove } = getAvailableMoves(piece, throwResult.steps)
    return {
      pieceId: piece.id,
      result: throwResult,
      isPossible: canMove,
    }
  })
}
```

### Existing: Pure Functional Test Pattern
```typescript
// Source: src/lib/yut/__tests__/game.test.ts
// All tests create isolated state, call pure functions, assert results
// Phase 2 tests MUST follow this pattern

/** Create a piece on the board at a specific route position */
function makeBoardPiece(
  id: string,
  team: Team,
  routeId: string,
  routeIndex: number,
  station: number
): PieceState {
  return {
    id,
    team,
    position: { station, routeId, routeIndex },
  }
}
```

### New: Recommended Type Extensions
```typescript
// Extend PieceState (non-breaking -- add optional fields with defaults)
export interface PieceState {
  id: string
  team: Team
  position: PiecePosition
  stackedPieceIds: string[]   // Empty array = not a leader / solo piece
  stackedWith: string | null  // null = not stacked onto another piece
}

// Capture detection result
export interface CaptureResult {
  captured: boolean
  capturedPieceIds: string[]  // Opponent piece IDs sent home (includes stack followers)
  grantExtraThrow: boolean
}

// Stack opportunity result
export interface StackOpportunity {
  canStack: boolean
  targetPieceId: string | null  // The existing friendly piece at destination
}

// Complete move outcome (returned by applyMove)
export interface MoveOutcome {
  pieces: PieceState[]
  capture: CaptureResult
  stackOpportunity: StackOpportunity
}

// AI configuration
export interface AiWeights {
  distanceReduction: number  // Weight for progress toward finish
  captureBonus: number       // Weight for capturing opponent
  stackBonus: number         // Weight for stacking with friendly
}

export const DEFAULT_AI_WEIGHTS: AiWeights = {
  distanceReduction: 1.0,
  captureBonus: 5.0,
  stackBonus: 2.0,
}

export const AI_CONFIG = {
  randomMoveRate: 0.4,       // 40% of the time, pick random (D-09)
  captureIgnoreRate: 0.3,    // 30% of the time, ignore captures (D-11)
  alwaysStack: true,         // AI always stacks (D-08)
  alwaysShortcut: true,      // AI always takes shortcuts (D-12)
} as const
```

### New: Recommended AI Scoring Function
```typescript
/**
 * Score a candidate move for AI evaluation.
 *
 * Uses a weighted linear function:
 *   score = w1 * distanceReduction + w2 * captureBonus + w3 * stackBonus
 *
 * Distance reduction is measured as the difference in remaining steps
 * to finish before and after the move. Shortcuts are factored in since
 * the AI always takes them (D-12).
 */
function evaluateMove(
  pieces: PieceState[],
  pieceId: string,
  moveResult: MoveResult,
  weights: AiWeights
): number {
  let score = 0

  // Factor 1: Distance to finish reduction
  // Higher score for moves that get the piece closer to finish
  if (moveResult.finished) {
    score += weights.distanceReduction * 20 // Finishing is very valuable
  } else {
    // Approximate: steps moved = progress
    score += weights.distanceReduction * moveResult.intermediateStations.length + 1
  }

  // Factor 2: Capture bonus
  // Check if destination has opponent pieces
  const destination = moveResult.newPosition.station
  const opponentAtDest = pieces.filter(
    (p) => p.team !== 'ai' && p.position.station === destination && destination >= 0
  )
  if (opponentAtDest.length > 0) {
    score += weights.captureBonus
  }

  // Factor 3: Stack bonus
  const friendlyAtDest = pieces.filter(
    (p) => p.team === 'ai' && p.id !== pieceId && p.position.station === destination && destination >= 0
  )
  if (friendlyAtDest.length > 0) {
    score += weights.stackBonus
  }

  return score
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Auto-stack on landing | Player choice to stack (D-04) | This project | Adds strategic depth; requires "stack pending" game state |
| Rubber-banding AI difficulty | Static heuristic + randomization | Industry standard | More predictable, honest difficulty; won't frustrate players |
| AI as separate turn processor | AI reuses exact same game functions as player | This project | Ensures rule consistency; AI cannot cheat or skip rules |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/yut/__tests__/capture.test.ts src/lib/yut/__tests__/ai.test.ts --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAME-07 | Capture sends opponent home + grants extra throw | unit | `npx vitest run src/lib/yut/__tests__/capture.test.ts -t "capture" -x` | Wave 0 |
| GAME-08 | Landing on own piece offers stack choice | unit | `npx vitest run src/lib/yut/__tests__/capture.test.ts -t "stack" -x` | Wave 0 |
| GAME-09 | Stacked pieces move as group | unit | `npx vitest run src/lib/yut/__tests__/capture.test.ts -t "group move" -x` | Wave 0 |
| GAME-10 | Captured stack returns all pieces to home | unit | `npx vitest run src/lib/yut/__tests__/capture.test.ts -t "captured stack" -x` | Wave 0 |
| AI-01 | AI auto-throws and selects moves for full games | unit | `npx vitest run src/lib/yut/__tests__/ai.test.ts -t "executeAiTurn" -x` | Wave 0 |
| AI-02 | Player wins ~70-80% of games | unit (simulation) | `npx vitest run src/lib/yut/__tests__/ai.test.ts -t "win rate" -x` | Wave 0 |
| AI-03 | Heuristic scoring + 40% random | unit | `npx vitest run src/lib/yut/__tests__/ai.test.ts -t "selectAiMove" -x` | Wave 0 |
| AI-04 | AI ignores capture ~30% of time | unit | `npx vitest run src/lib/yut/__tests__/ai.test.ts -t "capture ignore" -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/yut/__tests__/capture.test.ts src/lib/yut/__tests__/ai.test.ts --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose` (all 100+ tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/yut/__tests__/capture.test.ts` -- covers GAME-07, GAME-08, GAME-09, GAME-10
- [ ] `src/lib/yut/__tests__/ai.test.ts` -- covers AI-01, AI-02, AI-03, AI-04
- [ ] Test helpers for creating stacked pieces (extend existing `makeBoardPiece` with stack fields)

## Open Questions

1. **Exact heuristic weight values**
   - What we know: Factors are distance_reduction, capture_bonus, stack_bonus (D-10). Starting values: 1.0, 5.0, 2.0.
   - What's unclear: Whether these specific values produce 70-80% player win rate.
   - Recommendation: Start with proposed defaults. Build a simulation test that plays 1000 games. Adjust weights if win rate is outside 70-80% band. Export weights as constants so they're easy to tune.

2. **Stack leadership when group lands on another group**
   - What we know: The piece at the destination becomes/remains the leader. Arriving pieces are absorbed.
   - What's unclear: If Group A (leader=a1, follower=a2) lands on Group B (leader=b1, follower=b2), does b1 become leader of all 4? Or does a1 stay leader?
   - Recommendation: The piece already at the position (b1) stays as leader. All arriving pieces (a1, a2) become followers of b1 along with b2. This is simpler and matches "the piece that was there first leads."

3. **findValidMoves for stacked pieces**
   - What we know: Stacked followers cannot move independently (D-06). Only the leader piece should appear as a valid move option.
   - What's unclear: Does `findValidMoves` need modification or should the caller filter?
   - Recommendation: Modify `findValidMoves` to exclude pieces where `stackedWith !== null` (followers). This keeps the filtering centralized and prevents AI and player from seeing invalid options.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified). Phase 2 is purely TypeScript game logic with no external tools, services, or runtimes beyond what Phase 1 already uses (Node.js, Vitest).

## Sources

### Primary (HIGH confidence)
- `src/lib/yut/types.ts` -- Current type definitions, constants (HOME, FINISH, ThrowName)
- `src/lib/yut/game.ts` -- processThrow (extra throw mechanism), findValidMoves, checkWinCondition
- `src/lib/yut/movement.ts` -- resolveMove, enterBoard, getAvailableMoves (movement resolution)
- `src/lib/yut/board.ts` -- ROUTES, ROUTE_IDS, BRANCH_POINTS (board graph)
- `src/lib/yut/__tests__/game.test.ts` -- Existing test patterns and helpers
- `.planning/phases/02-capture-stacking-ai/02-CONTEXT.md` -- All locked decisions D-01 through D-16
- `.planning/research/PITFALLS.md` -- Pitfall 7 (stacking bugs), Pitfall 6 (turn state explosion)
- `.planning/research/FEATURES.md` -- Stacking edge cases, AI strategy design, capture rules

### Secondary (MEDIUM confidence)
- [Simple Board Game AI - GameDev.net](https://www.gamedev.net/tutorials/programming/artificial-intelligence/simple-board-game-ai-r4686/) -- Heuristic scoring patterns for simple board games
- [Heuristic function for a strategic board game AI - BGG](https://boardgamegeek.com/thread/2419449/heuristic-function-for-a-strategic-board-game-ai) -- Weight tuning approaches
- `.planning/research/FEATURES.md` AI Strategy Design section -- Static suboptimality vs rubber-banding rationale

### Tertiary (LOW confidence)
- AI weight values (1.0, 5.0, 2.0) -- educated guess, needs simulation validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, pure TypeScript
- Architecture: HIGH -- follows established Phase 1 patterns exactly, clear extension points
- Capture/Stack logic: HIGH -- rules are well-defined in CONTEXT.md decisions D-01 through D-08
- AI logic: HIGH for structure, MEDIUM for weight values -- structure follows decisions D-09 through D-16; weights need simulation tuning
- Pitfalls: HIGH -- based on analysis of existing codebase and Yut Nori domain research

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable domain, no external dependency changes)
