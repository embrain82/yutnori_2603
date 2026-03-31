# Phase 3: 2D Board Rendering - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 03-2d-board-rendering
**Areas discussed:** 보드 레이아웃 방식, 말 표현 및 상호작용, 이동 애니메이션 스타일, 하이라이트 및 경로 선택 UI

---

## 보드 레이아웃 방식

### 렌더링 기술

| Option | Description | Selected |
|--------|-------------|----------|
| SVG (추천) | 해상도 독립, 클릭/터치 이벤트 처리 용이, motion 애니메이션 가능 | ✓ |
| HTML + Tailwind | div/absolute positioning, 기존 패턴과 일관성 높음, 대각선 경로 그리기 어려움 | |
| Canvas 2D | 성능 최고, 클릭/터치 영역 직접 구현 필요, motion 사용 불가 | |

**User's choice:** SVG (추천)
**Notes:** 없음

### 보드 모양

| Option | Description | Selected |
|--------|-------------|----------|
| 전통 마름모(◇) 형태 (추천) | 전통 윷판 모양 그대로, 정사각형 45도 회전 다이아몬드 레이아웃 | ✓ |
| 정사각형 배치 | 네모 칸이 정사각형 격자 위에 배치, 전통적인 느낌 덜함 | |
| 원형 보드 | 외곽 칸이 원 위에 배치, 모던하지만 전통 윷놀이와 다름 | |

**User's choice:** 전통 마름모(◇) 형태 (추천)
**Notes:** 없음

### 화면 배치

| Option | Description | Selected |
|--------|-------------|----------|
| 화면 상단 고정 (추천) | 보드가 화면 상단 ~60-70% 차지, 하단에 던지기 버튼/정보 영역 | ✓ |
| 화면 중앙 고정 | 보드가 정중앙에 위치, 상하 여백에 정보/버튼 | |
| Claude에게 위임 | 모바일 UX에 맞게 Claude가 최적 배치 결정 | |

**User's choice:** 화면 상단 고정 (추천)
**Notes:** 없음

---

## 말 표현 및 상호작용

### 말 디자인

| Option | Description | Selected |
|--------|-------------|----------|
| 색상 원형 토큰 (추천) | 플레이어=파랑, AI=빨강 등 색상 구분 원형 토큰. Phase 6에서 캐릭터로 교체 용이 | ✓ |
| 색상 사각형 토큰 | 전통 윷놀이 말 모양(wooden peg), 상단이 둥근 원통형 | |
| Claude에게 위임 | Phase 6 캐릭터 교체를 고려해 Claude가 최적 플레이스홀더 결정 | |

**User's choice:** 색상 원형 토큰 (추천)
**Notes:** 없음

### 스택 표시

| Option | Description | Selected |
|--------|-------------|----------|
| 숫자 뱃지 (추천) | 토큰 우측 상단에 작은 숫자(2, 3 등) 뱃지 표시 | ✓ |
| 겹침 표현 | 토큰을 약간 어긋나게 겹쳐서 여러 개임을 시각적으로 표현 | |
| 토큰 크기 증가 | 스택 수에 비례해 토큰 크기가 약간 커짐 | |

**User's choice:** 숫자 뱃지 (추천)
**Notes:** 없음

### 말 선택 피드백

| Option | Description | Selected |
|--------|-------------|----------|
| 토큰 테두리 발광 (추천) | 선택 가능한 말 주위에 맥동하는 발광 테두리(glow ring) | ✓ |
| 토큰 통통 애니메이션 | 선택 가능한 말이 위아래로 미세하게 통통 뜀 | |
| Claude에게 위임 | 모바일 UX에 맞게 Claude가 최적 피드백 결정 | |

**User's choice:** 토큰 테두리 발광 (추천)
**Notes:** 없음

---

## 이동 애니메이션 스타일

### 이동 방식

| Option | Description | Selected |
|--------|-------------|----------|
| 칸별 hop (추천) | 각 칸을 하나씩 뛰어넘는 hop 애니메이션. 칸당 ~200ms | ✓ |
| 슬라이드 이동 | 출발지에서 목적지까지 경로를 따라 부드럽게 슬라이드 | |
| Claude에게 위임 | 모바일 성능과 시각적 재미를 고려해 결정 | |

**User's choice:** 칸별 hop (추천)
**Notes:** 없음

### 잡기 연출

| Option | Description | Selected |
|--------|-------------|----------|
| 간단한 연출 (추천) | 잡힌 말이 홈으로 돌아가는 애니메이션 + 짧은 화면 진동(shake) | ✓ |
| 연출 없음 | 잡힌 말이 즉시 홈으로 이동 | |
| 화려한 연출 | 파티클 효과 + 잡기 사운드(시각만) + 진동 | |

**User's choice:** 간단한 연출 (추천)
**Notes:** 없음

---

## 하이라이트 및 경로 선택 UI

### 하이라이트

| Option | Description | Selected |
|--------|-------------|----------|
| 점 강조 + 맥동 (추천) | 이동 가능한 칸에 밝은 색상 점(dot)이 맥동(pulse) 애니메이션으로 표시 | ✓ |
| 칸 배경색 변경 | 유효 목적지 칸 전체 배경색이 바뀌는 방식 | |
| Claude에게 위임 | 시각적 명확성과 구현 난이도를 고려해 결정 | |

**User's choice:** 점 강조 + 맥동 (추천)
**Notes:** 없음

### 지름길 UI

| Option | Description | Selected |
|--------|-------------|----------|
| 두 경로 동시 하이라이트 (추천) | 외곽 경로 목적지와 지름길 목적지를 다른 색으로 동시에 표시, 탭으로 선택 | ✓ |
| 팝업 매뉴 | 코너에 도착 후 '외곽/지름길' 팝업 선택지 표시 | |
| Claude에게 위임 | 사용성과 구현 난이도를 고려해 결정 | |

**User's choice:** 두 경로 동시 하이라이트 (추천)
**Notes:** 없음

---

## Claude's Discretion

- SVG viewBox 크기, 좌표 시스템
- 29개 위치의 정확한 SVG 좌표 배치
- 색상 팔레트 세부 값
- 애니메이션 easing 함수 선택
- 컴포넌트 분해 구조

## Deferred Ideas

None — discussion stayed within phase scope
