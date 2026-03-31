# Phase 1: Board Graph & Movement Logic - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure game logic library for the 29-node Yut Nori board: board graph data structure, path resolution with 5 routes, throw result generation, piece movement rules, throw queue management, and win condition detection. No UI, no rendering — TypeScript functions only.

</domain>

<decisions>
## Implementation Decisions

### Board Graph Structure
- **D-01:** Route-based directed graph — each piece tracks its current route and position within that route
- **D-02:** 5 routes (외곽, 좌상→우하 대각, 우상→좌하 대각, 중앙→하단, 중앙→상단) for path resolution at branching points
- **D-03:** Follow existing RPS pattern: pure logic in `src/lib/yut/` with zero rendering dependencies

### Throw Probability
- **D-04:** Traditional probability — each of 4 yut sticks has independent 50/50 flat/round chance
- **D-05:** Resulting distribution: 도=25%, 개=37.5%, 걸=25%, 윷=6.25%, 모=6.25%
- **D-06:** AI and player use identical probability distribution — AI difficulty controlled only via move selection strategy (Phase 2)

### Finish (참먹이) Rule
- **D-07:** Landing exactly on 참먹이 does NOT complete — piece must have movement remaining to pass through
- **D-08:** Excess movement after passing 참먹이 is discarded — piece is simply marked as finished

### Testing Strategy
- **D-09:** Thorough test coverage using Vitest (matching existing RPS project setup)
- **D-10:** Full path traversal tests for all 5 routes, edge cases at branching points, throw queue management, and win condition

### Claude's Discretion
- Exact node ID naming convention and data structure shape
- Internal helper function decomposition
- Test file organization within `__tests__/`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Architecture (reference patterns)
- `260330_rps/src/lib/rps/` — Pure game logic layer pattern (types, rules, AI, session)
- `260330_rps/src/store/gameStore.ts` — Zustand FSM pattern (to be built in Phase 5)
- `.planning/codebase/ARCHITECTURE.md` — Layered architecture pattern documentation
- `.planning/codebase/CONVENTIONS.md` — Naming and code style conventions
- `.planning/codebase/TESTING.md` — Test framework setup and patterns

### Domain Research
- `.planning/research/FEATURES.md` §Game Rules: Detailed Edge Cases — Board structure (29 positions), route decision points, throw edge cases, stacking edge cases
- `.planning/research/ARCHITECTURE.md` — Board graph data structure design, Zustand FSM phases, component boundaries
- `.planning/research/PITFALLS.md` — Board path graph complexity (#1 bug risk), throw queue state explosion

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `260330_rps/src/lib/rps/types.ts` — Type definition pattern (Choice, Outcome, Phase union types)
- `260330_rps/src/lib/rps/gameRules.ts` — Pure function game logic pattern (determineOutcome, pickAiChoice)
- `260330_rps/vitest.config.ts` — Vitest configuration with jsdom, coverage, alias resolution

### Established Patterns
- Pure functional game logic: no classes, no side effects, no DOM
- Exported constants in UPPER_SNAKE_CASE
- Union types for game states ('idle' | 'playing' | 'finished')
- Comprehensive test coverage with Vitest + Testing Library

### Integration Points
- Game logic will be consumed by Zustand store in Phase 5
- Throw results feed into 3D physics animation in Phase 4 (predetermined results)
- Board positions feed into 2D SVG rendering in Phase 3

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following existing RPS architecture patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-board-graph-movement-logic*
*Context gathered: 2026-03-31*
