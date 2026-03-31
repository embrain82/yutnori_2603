# Phase 1: Board Graph & Movement Logic - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 01-board-graph-movement-logic
**Areas discussed:** 경로 그래프 구조, 던지기 확률 분포, 참먹이 통과 규칙, 테스트 전략

---

## 경로 그래프 구조

### Q1: 윤판 29칸 모델링 방식

| Option | Description | Selected |
|--------|-------------|----------|
| Route-based 그래프 | 각 말이 현재 경로(route)와 경로 내 위치를 추적. 코너에서 경로 분기 명확. 리서치 권장 | ✓ |
| 단순 노드 배열 | 29개 노드에 인접 리스트만. 말은 현재 노드 ID만 추적. 단순하지만 경로 분기점 처리 복잡 | |
| Claude 판단 | 기술적 세부는 맡겨주세요 | |

**User's choice:** Route-based 그래프
**Notes:** 리서치 ARCHITECTURE.md에서도 route-based 접근을 권장

### Q2: 윤판 경로 수

| Option | Description | Selected |
|--------|-------------|----------|
| 4경로 (외곽 + 대각 2개) | 외곽, 좌상→우하 대각, 우상→좌하 대각, 중앙→하단. 리서치 ARCHITECTURE.md 권장 | |
| 5경로 (세분화) | 외곽 + 대각 2개 + 중앙→하단 + 중앙→상단 분리 | ✓ |
| Claude 판단 | 리서치 결과 기반으로 최적 구조 결정 | |

**User's choice:** 5경로 (세분화)
**Notes:** 사용자가 더 세분화된 경로 구분 선호

---

## 던지기 확률 분포

### Q1: 확률 방식

| Option | Description | Selected |
|--------|-------------|----------|
| 전통 확률 (각 패 50/50) | 각 윤패이 앞/뒤 50%씩. 도=25%, 개=37.5%, 걸=25%, 윷=6.25%, 모=6.25% | ✓ |
| 조정된 확률 | 사용자 우세를 위해 유리한 결과가 더 나오도록 조정 | |
| Claude 판단 | 이벤트용 난이도에 맞는 최적 확률 설계 | |

**User's choice:** 전통 확률 (각 패 50/50)

### Q2: AI 확률

| Option | Description | Selected |
|--------|-------------|----------|
| 동일 확률 | 둘 다 전통 확률. AI 난이도는 이동 선택 전략으로만 조정 | ✓ |
| AI 불리하게 | AI에게 나쁜 결과가 더 많이 나오도록 확률 조정 | |

**User's choice:** 동일 확률

---

## 참먹이 통과 규칙

### Q1: 완주 규칙

| Option | Description | Selected |
|--------|-------------|----------|
| 통과해야 완주 (전통) | 참먹이에 정확히 도달하면 그 자리에 머문다. 다음 이동으로 통과해야 완주 | ✓ |
| 도달으면 완주 (간소화) | 참먹이에 도달하거나 넘으면 바로 완주. 게임 시간 단축 | |

**User's choice:** 통과해야 완주 (전통)

### Q2: 초과 이동량

| Option | Description | Selected |
|--------|-------------|----------|
| 버림 (통과만 확인) | 참먹이를 넘으면 남은 이동량 무시하고 완주 처리 | ✓ |
| 정확하게 처리 | 남은 이동량이 있으면 추가 이동 또는 특별 처리 | |

**User's choice:** 버림 (통과만 확인)

---

## 테스트 전략

### Q1: 테스트 범위

| Option | Description | Selected |
|--------|-------------|----------|
| 철저한 커버리지 | 보드 경로 전수 테스트 + 엣지 케이스. 기존 RPS도 Vitest 사용. 로직이 가장 위험한 부분 | ✓ |
| 기본 테스트 | 핵심 경로와 주요 규칙만 테스트. 엣지 케이스는 나중에 | |
| Claude 판단 | 위험도 기반으로 테스트 범위 결정 | |

**User's choice:** 철저한 커버리지

---

## Claude's Discretion

- Node ID 네이밍 컨벤션 및 데이터 구조 형태
- 내부 헬퍼 함수 분해
- 테스트 파일 조직

## Deferred Ideas

None
