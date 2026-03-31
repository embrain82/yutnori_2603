# Phase 3: 2D Board Rendering - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

2D SVG 기반 윷판 시각화: 전통 마름모 레이아웃으로 29개 위치를 렌더링하고, 말 토큰 표시/선택, 유효 목적지 하이라이트, 지름길 선택 UI, 칸별 hop 이동 애니메이션을 구현한다. Phase 1-2의 game logic을 읽어서 보드 상태를 시각적으로 표현하는 렌더링 레이어.

</domain>

<decisions>
## Implementation Decisions

### 보드 레이아웃
- **D-01:** SVG로 렌더링 — 해상도 독립적이고, 클릭/터치 이벤트 처리 용이, motion 라이브러리로 애니메이션 가능
- **D-02:** 전통 마름모(◇) 형태 레이아웃 — 정사각형을 45도 회전한 다이아몬드 모양, 외곽 20칸 + 대각선 지름길 9칸
- **D-03:** 화면 상단 ~60-70% 보드 영역, 하단에 던지기 버튼/정보 영역 — 세로 모바일 최적화

### 말 토큰
- **D-04:** 색상 원형 토큰 — 플레이어=파랑 계열, AI=빨강 계열 등 색상으로 팀 구분. Phase 6에서 캐릭터 이미지로 교체 가능한 구조
- **D-05:** 스택된 말은 숫자 뱃지로 표시 — 토큰 우측 상단에 작은 숫자(2, 3 등) 뱃지
- **D-06:** 선택 가능한 말은 테두리 발광(glow ring)으로 표시 — 맥동 애니메이션으로 터치 유도

### 이동 애니메이션
- **D-07:** 칸별 hop 애니메이션 — 각 칸을 하나씩 뛰어넘으며 이동. 칸당 ~200ms, 도(1칸)=0.2초, 모(5칸)=1초 정도
- **D-08:** 잡기(capture) 시 간단한 연출 — 잡힌 말이 홈으로 돌아가는 애니메이션 + 짧은 화면 진동(shake). 파티클은 Phase 6에서 추가 가능

### 하이라이트 및 경로 선택
- **D-09:** 유효 목적지에 밝은 색상 점(dot)이 맥동(pulse) 애니메이션으로 표시 — 간결하고 모바일에서 누르기 쉬움
- **D-10:** 코너(S5/S10) 지름길 선택은 두 경로 목적지를 다른 색으로 동시 하이라이트 — 원하는 목적지 탭으로 경로 선택. 별도 팝업 없이 직접 탭

### Claude's Discretion
- SVG 내부 구조 (viewBox 크기, 좌표 시스템)
- 29개 위치의 정확한 SVG 좌표 배치
- 색상 팔레트 세부 값 (파랑/빨강 계열 내에서)
- 애니메이션 easing 함수 선택
- 컴포넌트 분해 구조 (Board, Piece, Station 등)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Game Logic (Phase 1-2 구현)
- `src/lib/yut/types.ts` — PieceState, PiecePosition, GameLogicState, MoveResult 등 핵심 타입 정의
- `src/lib/yut/board.ts` — ROUTES, ROUTE_IDS, BRANCH_POINTS — 29칸 보드 그래프 구조
- `src/lib/yut/movement.ts` — resolveMove, getAvailableMoves — 이동 계산 로직
- `src/lib/yut/game.ts` — findValidMoves, createInitialGameState — 게임 상태 관리
- `src/lib/yut/capture.ts` — 잡기/스택 로직

### Prior Contexts
- `.planning/phases/01-board-graph-movement-logic/01-CONTEXT.md` — 보드 그래프 결정사항 (D-01~D-10)
- `.planning/phases/02-capture-stacking-ai/02-CONTEXT.md` — 잡기/스택/AI 결정사항 (D-01~D-16)

### Architecture & Conventions
- `.planning/codebase/ARCHITECTURE.md` — 레이어 아키텍처 패턴
- `.planning/codebase/CONVENTIONS.md` — 네이밍, 코드 스타일
- `.planning/codebase/TESTING.md` — 테스트 프레임워크 설정

### Requirements
- `.planning/REQUIREMENTS.md` §Board Rendering — BOARD-01~BOARD-06 요구사항

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/yut/board.ts:ROUTES` — 5개 경로별 station 배열, SVG 좌표 매핑의 기준
- `src/lib/yut/board.ts:BRANCH_POINTS` — S5, S10 분기점 정보, 경로 선택 UI의 트리거 조건
- `src/lib/yut/types.ts:PiecePosition` — station, routeId, routeIndex — 말 위치를 SVG 좌표로 변환할 기준
- `src/lib/yut/movement.ts:resolveMove()` — MoveResult.intermediateStations 배열로 hop 애니메이션 경로 제공

### Established Patterns
- Pure functional game logic in `src/lib/yut/` — 렌더링 레이어는 이 로직을 읽기만 함
- motion/react 라이브러리 (v12.38.0) — 기존 프로젝트에서 AnimatePresence, motion.div 사용 중
- Tailwind CSS v4 — 유틸리티 클래스 기반 스타일링
- Zustand v5 — Phase 5에서 게임 상태 스토어 구축 예정, Phase 3에서는 props/state로 충분

### Integration Points
- Phase 5에서 Zustand store가 GameLogicState를 관리하고 Board 컴포넌트에 전달
- Phase 4의 3D 던지기 결과가 보드 위 말 이동을 트리거
- Phase 6에서 원형 토큰을 캐릭터 이미지로 교체

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow existing project conventions and Phase 1-2 architecture patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-2d-board-rendering*
*Context gathered: 2026-03-31*
