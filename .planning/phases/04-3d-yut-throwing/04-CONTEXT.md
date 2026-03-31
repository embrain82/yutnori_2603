# Phase 4: 3D Yut Throwing - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

사용자가 던지기 버튼을 누르면 4개의 윷패가 3D 물리 씬에서 날아가고, 튀고, 멈춘 뒤 미리 결정된 결과를 보여주는 연출 레이어를 구현한다. 이 단계는 던지기 연출과 결과 표시만 다루며, 전체 게임 턴 오케스트레이션과 WebView 연동은 Phase 5에서 연결한다.

</domain>

<decisions>
## Implementation Decisions

### Throw Layout
- **D-01:** 3D 던지기 장면은 기존 2D 보드 위에 잠깐 올라오는 오버레이 형태로 구현한다.
- **D-02:** 던지기 연출은 별도 페이지나 풀스크린 전환이 아니라, 같은 게임 화면 안에서 시작되고 끝나야 한다.

### Camera Feel
- **D-03:** 카메라는 모바일에서 읽기 쉬운 안정적인 3/4 시점을 기본으로 한다.
- **D-04:** 윷패의 물리 움직임은 자연스럽게 보이되, 카메라 연출은 과장하지 않고 안정감을 우선한다.

### Stick Look
- **D-05:** 윷패와 바닥은 따뜻한 나무 재질 기반의 캐주얼 톤으로 표현한다.
- **D-06:** 과도한 실사풍보다는 현재 프로젝트의 밝고 친근한 분위기에 맞는 단순화된 스타일을 유지한다.

### Result Reveal
- **D-07:** 윷패가 멈춘 직후 화면 중앙에 큰 한글 결과 카드/텍스트로 `도/개/걸/윷/모`를 표시한다.
- **D-08:** 결과 표시는 같은 오버레이 안에서 즉시 확인 가능해야 하며, 이후 턴 흐름이 자연스럽게 보드 단계로 이어지도록 설계한다.

### the agent's Discretion
- 윷패 메쉬를 어떤 primitive 조합으로 만들지, 또는 간단한 커스텀 geometry를 만들지
- 물리 파라미터(질량, 반발력, 감쇠)와 settle 판정 임계값
- renderer/scene/world 생명주기를 컴포넌트 단위로 둘지 hook 단위로 둘지
- 결과 카드의 세부 타이포그래피, 애니메이션 easing, 등장/퇴장 타이밍

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope And Product Constraints
- `.planning/ROADMAP.md` §Phase 4: 3D Yut Throwing — phase goal, success criteria, and dependency boundary
- `.planning/REQUIREMENTS.md` §3D Yut Throwing — `THROW-01` through `THROW-05`
- `.planning/PROJECT.md` §Constraints — mobile WebView target, 3D throw only, easy/casual event game constraints
- `.planning/PROJECT.md` §Key Decisions — Three.js + Cannon.js direction and existing architecture reuse intent
- `.planning/STATE.md` §Accumulated Context — locked note that throw results are predetermined and physics is visual-only, plus WKWebView/WebGL caution

### Prior Phase Context
- `.planning/phases/01-board-graph-movement-logic/01-CONTEXT.md` — throw probability and existing decision that throw results feed Phase 4 animation
- `.planning/phases/03-2d-board-rendering/03-CONTEXT.md` — current board presentation, mobile layout expectations, and Phase 4/5 integration assumptions

### Existing Contracts And Patterns
- `src/lib/yut/types.ts` — `ThrowName` and `ThrowResult` contracts that the 3D layer must consume without redefining
- `src/lib/yut/throw.ts` — current RNG throw generation contract for predetermined results
- `.planning/codebase/CONVENTIONS.md` — client component, motion import, TypeScript, and styling conventions
- `.planning/codebase/STACK.md` — current dependency baseline and platform expectations
- `.planning/codebase/TESTING.md` — Vitest and Testing Library patterns for hook/component coverage

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/yut/throw.ts`: already generates authoritative throw outcomes, so the 3D scene should animate an input `ThrowResult` rather than invent its own result logic
- `src/lib/yut/types.ts`: provides the stable `ThrowName`/`ThrowResult` types that can flow into the overlay API
- `src/components/board/Board.tsx`: existing 2D board can stay mounted underneath the throw overlay, matching the chosen layout direction
- `src/hooks/useHopAnimation.ts`: establishes an existing pattern for imperative, phase-local animation hooks with an `isAnimating` guard
- `src/app/globals.css`: current bright background and accent variables provide the baseline palette the throw scene should harmonize with

### Established Patterns
- Interactive UI is built as `'use client'` React components with TypeScript-first props and named exports
- Animation work already mixes declarative `motion/react` usage with small imperative hooks when sequencing matters
- The current repo does not yet have Three.js or cannon-es installed, so Phase 4 will introduce new rendering/physics dependencies rather than plugging into an existing 3D stack
- The current `src/app/page.tsx` is still a placeholder shell, so Phase 4 should produce reusable scene components/hooks, not assume the final game container already exists

### Integration Points
- Phase 4 should expose a reusable throw scene/overlay that accepts a predetermined `ThrowResult` and reports when the settle/reveal sequence is finished
- Phase 5 will be responsible for orchestrating when the player or AI triggers the throw overlay and how control returns to move selection
- The chosen overlay layout means the 3D scene should compose cleanly with the existing board area instead of replacing the entire app shell

</code_context>

<specifics>
## Specific Ideas

- The throw scene should feel like a short, focused mini-stage that rises above the board and then gets out of the way.
- The result needs to be readable instantly on mobile, so the Korean label should dominate more than subtle iconography.

</specifics>

<deferred>
## Deferred Ideas

- Swipe/flick throwing input — tracked in `.planning/REQUIREMENTS.md` as `THROW-V2-01`, outside Phase 4
- Camera shake or zoom-heavy throw cinematics — tracked in `.planning/REQUIREMENTS.md` as `THROW-V2-02`, outside Phase 4

</deferred>

---

*Phase: 04-3d-yut-throwing*
*Context gathered: 2026-03-31*
