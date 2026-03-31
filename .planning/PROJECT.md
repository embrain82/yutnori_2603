# Yut Nori Game (윷놀이)

## What This Is

HTML5 기반 윷놀이 게임. 사용자와 AI가 대결하며, 3D 물리 시뮬레이션으로 윷을 던지고, 전통 윷놀이 규칙에 따라 말을 이동시킨다. 승리 시 네이티브 앱에 WebView 브리지로 쿠폰을 지급한다. 귀여운/캐주얼 비주얼 스타일.

## Core Value

사용자가 윷을 던져서 3D 물리 효과로 결과를 보고, 말을 움직이며 AI와 윷놀이 대결을 즐기는 경험.

## Requirements

### Validated

- ✓ Next.js App Router 기반 클라이언트 사이드 게임 렌더링 — existing (260330_rps)
- ✓ Zustand FSM 기반 게임 상태 관리 패턴 — existing (260330_rps)
- ✓ Motion 기반 화면 전환 애니메이션 — existing (260330_rps)
- ✓ WebView/iframe postMessage 임베딩 프로토콜 — existing (260330_rps)
- ✓ Phase 기반 화면 구성 (idle → play → result) — existing (260330_rps)

### Active

- [x] 윷판(보드) 렌더링 — 전통 윷놀이 경로 + 지름길(대각선) 포함 (Phase 3 완료)
- [ ] 3D 윷 던지기 물리 시뮬레이션 — Three.js + Cannon.js로 윷패가 떨어지는 효과
- [ ] 윷 결과 판정 — 도/개/걸/윷/모 결과 표시 및 이동 칸 수 계산
- [ ] 말 이동 로직 — 윷 결과에 따른 경로 이동, 지름길 분기점 처리
- [ ] 말 엎기(스택) — 내 말 위치에 도착 시 엎을지 선택
- [ ] 말 잡기(캡처) — 상대 말 위치에 도착 시 자동 잡기 + 추가 턴
- [ ] 윷/모 추가 던지기 — 윷 또는 모 나오면 한 번 더 던지기
- [ ] AI 대전 (쉬움) — 사용자 우세 난이도, 기본적인 전략 AI
- [ ] 승리/패배 판정 — 모든 말(2개)이 도착하면 승리
- [ ] 쿠폰 지급 — 승리 시 WebView 브리지(postMessage)로 네이티브 앱에 알림
- [ ] 귀여운/캐주얼 비주얼 — 캐릭터 말, 밝은 색감, 친근한 UI

### Out of Scope

- 멀티플레이어 (실시간 대전) — v1은 AI 대전만
- 서버 사이드 렌더링 — 완전 클라이언트 사이드 게임
- 사운드/BGM — v1에서 제외, 추후 추가 가능
- 난이도 선택 — v1은 쉬움 고정
- 4개 말 모드 — v1은 2개 말로 간소화
- 온라인 랭킹/리더보드 — v1 범위 밖
- 백도(뒷도) 규칙 — 복잡도 증가, v1에서 제외

## Context

- **기존 코드**: `260330_rps/` 디렉토리에 가위바위보 게임이 구현되어 있음. Next.js 16 + Zustand FSM + Motion + WebView postMessage 패턴을 참고 가능
- **기술 스택 기반**: Next.js 16.2, React 19, TypeScript 5.7, Tailwind CSS v4, Zustand 5 (기존 RPS 프로젝트와 동일)
- **추가 기술**: Three.js (3D 렌더링) + Cannon.js (물리 엔진)을 새로 도입
- **배포 환경**: Vercel, 네이티브 앱 WebView에서 임베딩
- **대상 사용자**: 모바일 앱 사용자, 이벤트/프로모션 참여 목적

## Constraints

- **플랫폼**: HTML5 웹 게임, 네이티브 앱 WebView에서 구동 — 모바일 성능 최적화 필수
- **3D 엔진**: Three.js + Cannon.js — 윷 던지기 물리 시뮬레이션 전용, 보드/말은 2D
- **통신**: WebView postMessage 브리지 — 쿠폰 지급은 네이티브 앱이 처리
- **AI 난이도**: 쉬움 고정 — 사용자가 대체로 이기는 수준 (이벤트용)
- **말 개수**: 팀당 2개 — 간소화된 윷놀이
- **규칙**: 전통 윷놀이 (윷/모 추가 던지기, 잡기 시 추가 턴, 지름길 포함, 백도 제외)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Three.js + Cannon.js for 3D yut throwing | 윷 던지기만 3D, 나머지는 2D — 성능과 품질의 균형 | — Pending |
| 팀당 2개 말 | 게임 시간 단축, 이벤트용으로 적합 | — Pending |
| 백도 규칙 제외 | 구현 복잡도 대비 게임 경험 향상 미미 | — Pending |
| AI 난이도 쉬움 고정 | 이벤트/프로모션 용도, 사용자가 승리 경험을 느끼도록 | — Pending |
| RPS 아키텍처 패턴 재활용 | Zustand FSM, phase-based screens, postMessage 패턴 검증됨 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-31 after initialization*
