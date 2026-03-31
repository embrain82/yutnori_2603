# Phase 2: Capture, Stacking & AI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 02-capture-stacking-ai
**Areas discussed:** 잡기 동작, 엎기 UX, AI 전략, AI 턴 자동화

---

## 잡기 동작

### Q1: 잡기 후 추가 턴 타이밍

| Option | Description | Selected |
|--------|-------------|----------|
| 즉시 추가 던지기 | 잡기 실행 직후 현재 턴에 던지기 1회 추가 (윷/모 체이닝과 동일) | ✓ |
| 남은 이동 후 추가 | 현재 큐의 모든 이동을 마친 후에 추가 던지기 | |
| Claude 판단 | 기술적 세부 맡겨주세요 | |

**User's choice:** 즉시 추가 던지기

---

## 엎기 UX

### Q1: 엎기 선택 UI 범위

| Option | Description | Selected |
|--------|-------------|----------|
| 로직만 (Phase 2) | 선택 함수만 구현. UI는 Phase 5에서 처리 | ✓ |
| Claude 판단 | 기술적 세부 맡겨주세요 | |

### Q2: 엎기 거부 시 동작

| Option | Description | Selected |
|--------|-------------|----------|
| 그냥 도착 | 엎지 않고 같은 칸에 별도로 존재 | ✓ |
| 통과 불가 | 같은 칸에 두 말이 개별로 있을 수 없음, 반드시 엎어야 함 | |

**User's choice:** 로직만, 거부 시 같은 칸에 개별 존재

---

## AI 전략

### Q1: 이동 평가 방식

| Option | Description | Selected |
|--------|-------------|----------|
| 휴리스틱 + 랜덤 40% | 각 이동을 점수로 평가하되 40% 확률로 랜덤 선택. 리서치 권장 | ✓ |
| 완전 랜덤 | AI가 항상 랜덤 이동. 가장 쉽지만 비현실적 | |
| Claude 판단 | 승률 목표에 맞는 최적 전략 설계 | |

### Q2: AI 엎기 처리

| Option | Description | Selected |
|--------|-------------|----------|
| 항상 엎기 | AI는 내 말을 만나면 항상 엎음. 그룹 잡히면 둘 다 돌아와서 불리 | ✓ |
| 절대 엎지 않음 | AI는 엎지 않아 말이 흩어지지 않음 | |
| 확률적 선택 | AI가 70% 확률로 엎고 30%는 거부 | |

---

## AI 턴 자동화

### Q1: AI 턴 실행 방식

| Option | Description | Selected |
|--------|-------------|----------|
| 즉시 실행 | AI 턴이 되면 던지기/이동을 즉시 처리. Phase 5에서 딜레이 추가 | ✓ |
| 딜레이 포함 | AI가 던지기/이동 사이에 짧은 딜레이 (생각중... 효과) | |
| Claude 판단 | 기술적 세부 맡겨주세요 | |

---

## Claude's Discretion

- 휴리스틱 가중치 값 (승률 목표에 맞게 조정)
- capture/stack 로직 함수 분해
- 테스트 구조 및 엣지 케이스 우선순위

## Deferred Ideas

None
