# Requirements: Yut Nori Game (윷놀이)

**Defined:** 2026-03-31
**Core Value:** 사용자가 윷을 던져서 3D 물리 효과로 결과를 보고, 말을 움직이며 AI와 윷놀이 대결을 즐기는 경험

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Game Logic

- [ ] **GAME-01**: 윷 던지기 시 도/개/걸/윷/모 결과가 정확히 판정된다
- [ ] **GAME-02**: 윷/모 결과 시 추가 던지기가 부여되며 무제한 체이닝이 가능하다
- [ ] **GAME-03**: 던지기 결과가 큐에 쌓이고 순서대로 말 이동에 사용된다
- [ ] **GAME-04**: 29칸 윷판 경로 그래프가 외곽 20칸 + 지름길 9칸으로 구성된다
- [ ] **GAME-05**: 코너 위치(모/앞밭, 뒷모 등)에서 지름길 진입 여부를 선택할 수 있다
- [ ] **GAME-06**: 말이 윷 결과 수만큼 경로를 따라 정확히 이동한다
- [ ] **GAME-07**: 상대 말 위치에 도착하면 잡기가 실행되고 추가 턴이 부여된다
- [ ] **GAME-08**: 내 말 위치에 도착 시 엎을지(스택) 선택할 수 있다
- [ ] **GAME-09**: 엎힌 말은 하나의 그룹으로 함께 이동한다
- [ ] **GAME-10**: 엎힌 그룹이 잡히면 모든 말이 개별적으로 출발점으로 돌아간다
- [ ] **GAME-11**: 2개 말이 모두 참먹이를 통과하면 승리한다 (정확히 도착은 통과 아님)
- [ ] **GAME-12**: 이동 불가능한 던지기 결과는 자동으로 건너뛴다

### AI

- [ ] **AI-01**: AI가 자동으로 윷을 던지고 말을 선택하여 이동한다
- [ ] **AI-02**: AI 난이도가 쉬움으로 설정되어 사용자가 ~70-80% 승률을 가진다
- [ ] **AI-03**: AI가 휴리스틱 점수 기반으로 이동을 평가하되 ~40% 확률로 랜덤 이동한다
- [ ] **AI-04**: AI가 잡기 기회를 ~30% 확률로 무시한다

### Board Rendering

- [ ] **BOARD-01**: 전통 윷판 레이아웃이 2D(SVG/HTML)로 렌더링된다
- [ ] **BOARD-02**: 각 팀의 말 위치가 시각적으로 구분되어 표시된다
- [ ] **BOARD-03**: 엎힌(스택) 말이 시각적으로 표현된다 (겹침 또는 카운트)
- [ ] **BOARD-04**: 말 선택 시 이동 가능한 목적지가 하이라이트된다
- [ ] **BOARD-05**: 코너에서 지름길/외곽 경로 선택지가 시각적으로 구분된다
- [ ] **BOARD-06**: 말 이동 시 경로를 따라 hop 애니메이션이 재생된다

### 3D Yut Throwing

- [ ] **THROW-01**: Three.js + Cannon.js로 윷패 4개가 3D 물리 시뮬레이션으로 던져진다
- [ ] **THROW-02**: 윷패가 공중에서 떨어져 바닥에 통통 굴러가며 정지하는 효과가 구현된다
- [ ] **THROW-03**: 결과는 사전에 RNG로 결정되고 물리 애니메이션은 시각적 연출이다
- [ ] **THROW-04**: 던지기 버튼을 누르면 3D 던지기 씬이 실행된다
- [ ] **THROW-05**: 물리 시뮬레이션 완료 후 결과(도/개/걸/윷/모)가 큰 텍스트로 표시된다

### Visual & UX

- [ ] **VIS-01**: 귀여운/캐주얼 스타일의 캐릭터 말이 사용된다
- [ ] **VIS-02**: 현재 턴(플레이어/AI)이 명확히 표시된다
- [ ] **VIS-03**: AI 턴 시 "생각 중..." 상태가 표시된다
- [ ] **VIS-04**: AI가 상황에 따라 이모지 표정 반응을 보여준다 (기쁨/걱정/의기양양)
- [ ] **VIS-05**: 승리 시 컨페티 + 축하 애니메이션이 재생된다
- [ ] **VIS-06**: 패배 시 격려 메시지와 재시작 옵션이 제공된다

### Integration

- [ ] **INTG-01**: 승리 시 WebView postMessage 브리지로 쿠폰 지급 메시지가 전달된다
- [ ] **INTG-02**: 게임이 네이티브 앱 WebView에 iframe으로 임베딩된다
- [ ] **INTG-03**: 게임 시작/종료 상태가 네이티브 앱에 전달된다

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Interaction

- **THROW-V2-01**: 스와이프/플릭 제스처로 윷 던지기 (터치 속도 → 물리 임펄스)
- **THROW-V2-02**: 던지기 시 카메라 흔들림/줌 효과
- **VIS-V2-01**: 잡기 시 특별 파티클 이펙트
- **VIS-V2-02**: 말 이동 시 트레일 효과

### Polish

- **POLISH-01**: 사운드/BGM 지원
- **POLISH-02**: 간단한 튜토리얼/온보딩 (2-3 화면)
- **POLISH-03**: AI 캐릭터 승리/패배 댄스 애니메이션

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| 멀티플레이어 (실시간 대전) | 네트워킹/매칭/동기화 복잡도, v1은 프로모션용 싱글플레이어 |
| 백도(뒷도) 규칙 | 이동 로직 복잡도 대비 캐주얼 게임에서 기대하지 않음 |
| 전체 3D 보드 렌더링 | 모바일 WebView 성능 문제, 2D 보드 + 3D 던지기 하이브리드 |
| 4개 말 모드 | 게임 시간 증가 (8-15분), 이벤트용은 짧아야 함 |
| 난이도 선택 | UI 추가, 테스트 부담, 프로모션은 쉬운 승리 |
| 온라인 랭킹/리더보드 | 서버 인프라 필요, v1 범위 밖 |
| 계정 시스템/로그인 | 네이티브 앱이 인증 처리, 게임은 WebView 브리지만 사용 |
| 되돌리기/리플레이 | 상태 관리 복잡도, 캐주얼 프로모션에서 불필요 |
| 커스터마이즈 테마/스킨 | 프로모션 일회성, 리텐션 기능 불필요 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| GAME-01 ~ GAME-12 | TBD | Pending |
| AI-01 ~ AI-04 | TBD | Pending |
| BOARD-01 ~ BOARD-06 | TBD | Pending |
| THROW-01 ~ THROW-05 | TBD | Pending |
| VIS-01 ~ VIS-06 | TBD | Pending |
| INTG-01 ~ INTG-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 0
- Unmapped: 36

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after initial definition*
