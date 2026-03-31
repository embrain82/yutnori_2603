# Phase 2: Capture, Stacking & AI - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Piece interaction rules (capture, stacking with user choice, group movement/capture) and an easy-difficulty AI opponent that plays full games autonomously. Builds directly on Phase 1's game logic library (`src/lib/yut/`). Pure logic — no UI rendering.

</domain>

<decisions>
## Implementation Decisions

### Capture (잡기)
- **D-01:** Landing on opponent piece sends it HOME and grants an extra throw immediately (same mechanism as yut/mo chaining — increments throwsRemaining)
- **D-02:** Captured stacked group returns ALL pieces individually to HOME
- **D-03:** Extra throw from capture is processed identically to yut/mo extra throw — feeds into existing throw queue

### Stacking (엎기)
- **D-04:** When player's piece lands on own piece, player is ASKED whether to stack (not auto-stack)
- **D-05:** If player refuses stacking, both pieces coexist on same position independently
- **D-06:** Stacked pieces move as one group — single entity on the board
- **D-07:** Phase 2 implements the logic/function only — UI for the choice is deferred to Phase 5
- **D-08:** AI always stacks when landing on own piece (항상 엎기)

### AI Strategy
- **D-09:** Heuristic scoring + 40% random move selection — evaluate each legal move with a score, pick best 60% of the time, random 40%
- **D-10:** Heuristic factors: distance_to_finish reduction, capture bonus, stack bonus
- **D-11:** AI ignores capture opportunities ~30% of the time
- **D-12:** AI always takes shortcuts (no deliberate suboptimal path choice)
- **D-13:** Target win rate: player wins ~70-80% of games

### AI Turn Automation
- **D-14:** AI turn executes immediately (no delay) — Phase 5 will add visual delays
- **D-15:** AI auto-throws, auto-selects piece, auto-moves — full game can run without human input
- **D-16:** AI handles yut/mo chaining and capture extra throws identically to player

### Claude's Discretion
- Heuristic weight values for scoring (tuned to achieve ~70-80% player win rate)
- Internal function decomposition for capture/stack logic
- Test structure and edge case prioritization

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Implementation (foundation)
- `src/lib/yut/types.ts` — Type definitions, constants (HOME, FINISH, ThrowName, PieceState, etc.)
- `src/lib/yut/board.ts` — Board graph (ROUTES, ROUTE_IDS, BRANCH_POINTS)
- `src/lib/yut/movement.ts` — resolveMove, enterBoard, applyBranchChoice, getAvailableMoves
- `src/lib/yut/game.ts` — processThrow, consumeMove, checkWinCondition, findValidMoves, createInitialGameState
- `src/lib/yut/index.ts` — Barrel export

### Phase 1 Context & Decisions
- `.planning/phases/01-board-graph-movement-logic/01-CONTEXT.md` — Board graph decisions (D-01~D-10)
- `.planning/STATE.md` §Accumulated Context — Phase 1 implementation decisions

### Domain Research
- `.planning/research/FEATURES.md` §AI Strategy Design — Heuristic scoring, suboptimality percentages
- `.planning/research/FEATURES.md` §Stacking Edge Cases — Group behavior rules
- `.planning/research/PITFALLS.md` — Turn state explosion with yut/mo chaining

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `game.ts:processThrow()` — Already handles throwsRemaining increment for yut/mo. Capture extra throw uses same mechanism.
- `game.ts:findValidMoves()` — Returns valid moves for a team. AI can use this directly to enumerate legal moves.
- `game.ts:createInitialGameState()` — Creates 4 pieces (2 player, 2 AI) at HOME.
- `movement.ts:getAvailableMoves()` — Returns destinations for each piece given a throw result.

### Established Patterns
- Pure functional logic in `src/lib/yut/` with zero rendering dependencies
- Types exported from `types.ts`, functions from domain modules
- Comprehensive test coverage with Vitest (100/100 tests in Phase 1)

### Integration Points
- Capture/stack logic extends `game.ts` or new `capture.ts`/`ai.ts` modules
- AI module imports from `game.ts` (findValidMoves) and `movement.ts` (getAvailableMoves)
- All new exports added to `index.ts` barrel

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow Phase 1 architecture patterns and research recommendations.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-capture-stacking-ai*
*Context gathered: 2026-03-31*
