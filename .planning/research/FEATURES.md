# Feature Landscape

**Domain:** HTML5 Digital Board Game (Yut Nori / 윷놀이) - Event Promotion Game
**Researched:** 2026-03-31
**Context:** User vs AI, 2 pieces per team, easy difficulty, 3D yut throwing, coupon reward via WebView

## Table Stakes

Features users expect from a digital yut nori game. Missing any of these = product feels broken or incomplete.

### Core Game Rules

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Yut throwing with result display (do/gae/geol/yut/mo) | Fundamental mechanic; without it there is no game | Medium | 4 sticks, result = count of flat-side-up (do=1, gae=2, geol=3, yut=4). Mo = all back-side-up (5 steps). Must show clear result animation + Korean name display. |
| Piece movement on board | Core gameplay loop | High | 29 positions, 4 possible routes, shortcut branching at corners. This is the single most complex feature -- graph-based path data structure required. |
| Extra throw on yut/mo | Traditional rule everyone knows | Low | When result is yut (4) or mo (5), player throws again. Can chain unlimited times. All results queue up, then player moves pieces one result at a time. |
| Capture (잡기) with extra turn | Traditional rule; core strategy element | Medium | Landing on opponent piece sends it home + grants extra throw. With stacked pieces, ALL stacked pieces in the group return home. |
| Stacking (업기) own pieces | Traditional rule; core strategy element | Medium | When landing on own piece, pieces merge and move together as one unit. If captured, all stacked pieces return to start individually. High risk/high reward mechanic. |
| Shortcut paths (지름길) | Traditional rule; the board is meaningless without shortcuts | High | At corner positions (모/앞밭, 뒷모, etc.) pieces can take diagonal shortcuts through center (방). Player must choose path when landing on a corner. |
| Win condition: all pieces finish | Fundamental end condition | Low | All 2 pieces must PASS THROUGH the finish point (참먹이). Landing exactly on 참먹이 does NOT count as finished -- piece must have remaining movement to pass beyond it. |
| Turn-based flow (player then AI) | Basic game structure | Low | Clear indication of whose turn it is. Player throws -> selects piece -> piece moves -> (capture/win check) -> AI turn. |

### Board and Visual

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Traditional board layout rendering | Players expect recognizable yut nori board | Medium | Cross/plus shaped board with outer ring (20 outer positions) + diagonal shortcuts through center (9 inner positions) = 29 total. 2D rendering recommended; 3D only for yut throwing. |
| Piece position indicators | Players must see where pieces are | Low | Clear visual markers for each team's pieces. Different colors/characters per team. Must handle stacked pieces visually (show stack count or layered tokens). |
| Result indicator (do/gae/geol/yut/mo) | Must display throw result prominently | Low | Large text or icon showing result with Korean name. Yut/mo results should feel more exciting (they grant extra throws). |
| Whose-turn indicator | Players must know when to act | Low | Visual distinction between player turn and AI turn. During AI turn, show "AI is thinking..." state. |
| Piece selection UI | Player must choose which piece to move | Medium | When multiple pieces are on board or player can enter new piece: tap/click to select which one advances. Must show valid destinations. Gray out pieces that cannot legally move the thrown distance. |
| Move animation | Pieces moving from position to position | Medium | Smooth animation of piece moving along path, hopping through intermediate positions. Without this the game feels like a spreadsheet. |

### Interaction

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Tap/click to throw yut | Player initiates their turn | Low | Simple button or tap area to trigger throw. Minimum viable interaction. |
| Tap/click to select piece | Player chooses which piece moves | Medium | Must handle: new piece entry from start, existing piece on board, auto-select when only one piece can move. |
| Path preview on piece selection | Player needs to see where piece will land | Medium | Highlight destination position when selecting a piece. Critical for shortcut decision-making at corners. |

### Event/Promotion Integration

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Victory screen with reward | The entire point of the promotional game | Low | Clear "You Win!" celebration + coupon information display. |
| WebView bridge coupon delivery | Business requirement; native app expects postMessage | Low | Send structured message to native app via postMessage on victory. Protocol already validated from RPS game (260330_rps). |
| Game-over screen (loss) | Must handle both outcomes | Low | "Try Again" / replay option. Keep it encouraging -- this is promotional, player should rarely see this. |

## Differentiators

Features that set this product apart from generic yut nori apps. Not expected, but create delight and justify the "cute/casual" positioning.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 3D yut throwing physics simulation | THE signature feature. Makes throwing feel physical and satisfying rather than just RNG with animation | High | Three.js + Cannon.js. 4 yut sticks with realistic tumbling, bouncing, settling on a surface. Result read from final resting orientation of each stick. Existing open-source patterns (threejs-dice) prove this is achievable. |
| Cute/casual character pieces | Emotional engagement; differentiation from traditional wooden piece look | Medium | Instead of plain circles/tokens, use character-based pieces. Match the "cute/casual" visual style mandate. Consider idle bobbing animation. |
| Throw gesture interaction (swipe/flick) | Physical involvement; makes throwing feel tactile | Medium | Swipe-up or touch-drag to "flick" the yut sticks. Touch velocity maps to physics impulse magnitude. Must handle mobile WebView touch events carefully. |
| Camera effects on throw | Cinematic feel | Low | Camera shake on impact, slight zoom during throw arc. Adds weight and drama. |
| Capture celebration animation | Emotional payoff for strategic play | Low | Special particle effect or bounce animation when capturing opponent's piece. Makes the moment feel rewarding. |
| AI "personality" reactions | Makes AI feel alive, not robotic | Low | AI avatar shows emoji-style reactions: happy on yut/mo, worried when player captures, smug when AI captures. Simple state-based expression changes. |
| Board shortcut visual hint | Reduces confusion for unfamiliar players | Low | Subtle arrow or glow on shortcut paths when piece lands on a corner. Shows player the shortcut option exists before they choose. |
| Victory celebration sequence | Promotional delight; makes winning feel GREAT since that triggers the reward | Medium | Confetti (canvas-confetti, proven from RPS), character celebration dance, fireworks-style effects. Over-index on making victory feel amazing. |
| Brief tutorial/onboarding | Reduces abandonment from players unfamiliar with rules | Medium | 2-3 screen slideshow or animated overlay showing basic rules. Many younger users may not know yut nori deeply. Keep it under 15 seconds, skippable. |
| Piece hop-along-path animation with trail | Visual polish that communicates movement clearly | Medium | Piece hops through each intermediate position on the way to destination rather than sliding directly. Optional subtle trail effect. |

## Anti-Features

Features to explicitly NOT build. Including them would increase complexity, delay launch, or actively harm the user experience for this promotional use case.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Multiplayer (real-time or async) | Massive complexity (networking, matchmaking, sync, latency). v1 is promotional single-player. | AI opponent only. Design state as extensible but don't build networking. |
| Baekdo (백도/뒷도) rule | Backward movement (-1) complicates movement logic, path resolution, and edge cases (what if no piece on board?). Most casual players don't expect it. PROJECT.md explicitly excludes. | Do not implement. The throw probability distribution already excludes baekdo. |
| Full 3D board rendering | Performance disaster in mobile WebView. Board has complex path logic better expressed in 2D. | 3D only for yut throwing scene. Board is 2D (SVG or Canvas). Hybrid approach: 3D throw overlay + 2D board. |
| 4-piece mode | Doubles game length from ~3-5 min to ~8-15 min. Event/promo games must be SHORT. | 2 pieces per team. Short game, quick reward cycle. |
| Difficulty selection | Adds UI screens, testing burden. Promotional game should be easy-win. | Easy difficulty only. AI makes suboptimal choices ~70-80% player win rate. |
| Sound/BGM | WebView audio handling is inconsistent across mobile devices. Adds asset size and loading time. Can retrofit later. | Design all feedback as visual-first. Animations should be satisfying without sound. Sound is a v2 enhancement. |
| In-game chat/emojis | No multiplayer = no one to chat with. | AI personality reactions provide engagement. |
| Rankings/leaderboard | Requires server-side infrastructure completely outside v1 scope. | Victory + coupon is the reward. No persistent data. |
| Replay/undo system | Complicates state management significantly. Not expected in casual promotional context. | One-way game flow. Player can restart entire game from beginning. |
| Complex throw order resequencing | Some traditional rules allow reordering multiple queued throws. Power-user rule that confuses casual players. | Process queued throws in order received. Player picks which piece to move for each throw sequentially. |
| Detailed statistics/history | Over-engineering for a promotional mini-game with single-session lifecycle. | Simple win/loss result screen. No persistent data storage needed. |
| Account system/login | Game is embedded in native app WebView. Auth handled by native app. | Receive user context from WebView bridge postMessage if needed. No separate auth flow. |
| Customizable themes/skins | Promo game is one-shot; no retention features needed. | Single cute/casual theme shipped with the game. |

## Game Rules: Detailed Edge Cases and Decisions

These are rule variations found across different yut nori implementations and regional traditions. Each must be resolved with a single clear implementation decision.

### Board Structure (29 Positions)

The board has 29 positions organized into an outer ring and inner diagonals:

**Outer ring (20 positions, counterclockwise):**
참먹이(start/finish) -> 도 -> 개 -> 걸 -> 윷 -> 모/앞밭(corner 1) -> 뒷도 -> 뒷개 -> 뒷걸 -> 뒷윷 -> 뒷모(corner 2) -> 뒷밭... -> 날밭(corner 4) -> back to 참먹이

**Inner diagonal 1 (corner 1 to corner 3 through center):**
모/앞밭 -> 앞모도 -> 앞모개 -> 방(center) -> ... -> exit path

**Inner diagonal 2 (corner 2 to corner 4 through center):**
뒷모 -> 뒷모도 -> 뒷모개 -> 방(center) -> ... -> exit path

**Key positions:**
- 4 corners (large circles) = shortcut branching points
- 1 center (방) = intersection of both diagonals
- Pieces taking shortcuts pass through center to reach finish faster

### Route Decision Points

| Position | Decision | v1 Recommendation |
|----------|----------|-------------------|
| Corner position (모/앞밭, 뒷모) | Take shortcut diagonal inward or continue outer ring? | Player chooses. Highlight both path options with distinct colors. Default suggestion: shortcut (faster). |
| Center position (방) | Which diagonal exit to take? | Continue on same diagonal toward finish (standard rule). No additional choice needed. |
| Finish area (참먹이) | Piece must pass through, not just land on | Piece finishes when remaining movement after reaching 참먹이 >= 1. Landing with exactly 0 remaining = piece stays AT 참먹이, not finished. |
| Piece already past all corners | Can piece still take shortcut? | No. Shortcuts only available when landing exactly on a corner position. Once past, continue on current path. |

### Throw Result Edge Cases

| Scenario | Resolution for v1 |
|----------|-------------------|
| Multiple yut/mo chained | Unlimited chaining. Each yut or mo grants one more throw. All results queue, then player moves one result at a time. |
| Capture grants extra throw + that throw is yut/mo | Yes, continues chaining. Capture extra throw is identical to normal extra throw. |
| No movable piece for a throw result | That throw result is forfeited/skipped. With 2 pieces this is rare but can happen near end-game when both pieces are very close to finish and throw is too large. |
| All pieces already finished when extra throws remain | Remaining throws are discarded. Game is won. |
| Piece movement ends exactly on finish (참먹이) | Piece is ON the finish position but NOT finished. Needs one more move to exit. This is the standard traditional rule. |
| New piece enters board on first throw | New piece enters at position matching throw result (do=position 1, gae=position 2, etc.) starting from 참먹이. |

### Stacking Edge Cases

| Scenario | Resolution for v1 |
|----------|-------------------|
| Stacked pieces reach a corner | Stacked group can take shortcut. Move as one unit with all route options. |
| Stacked pieces captured | ALL pieces in stack return to start as individual pieces. They un-stack upon capture. |
| Landing on own piece | Auto-stack. No choice offered. When piece lands on friendly piece, they merge automatically. Simpler than offering choice; standard in most digital implementations. |
| Can stacked pieces un-stack voluntarily? | No. Once stacked, pieces move together until captured or game ends. Standard rule. |
| Two separate stacks on different positions | Each stack moves independently. Player chooses which stack (or individual piece) to move for each throw result. |

### AI Strategy Design (Easy / Player-Favored)

Use a simple heuristic scoring system with intentional degradation, NOT rubber-banding. Rubber-banding (dynamically adjusting difficulty based on player performance) feels unpredictable and unfair. Static "easy" difficulty is more honest and consistent.

| Aspect | Approach | Implementation |
|--------|----------|----------------|
| Move evaluation | Score each possible move, then pick suboptimally | Score = distance_to_finish_reduction + capture_bonus + stack_bonus. But select the best move only ~60% of time; pick random legal move ~40%. |
| Capture opportunities | Sometimes ignore captures | When AI could capture, it "misses" the opportunity ~30% of the time by choosing to move a different piece. |
| Stacking behavior | Tend to stack early and aggressively | AI over-values stacking, making itself vulnerable to losing multiple pieces at once when captured. |
| Shortcut usage | Sometimes take the long way | AI ignores shortcut ~20% of the time, taking the outer ring instead. Gives player more time to win. |
| New piece vs existing | Spread movement suboptimally | AI sometimes enters a new piece when advancing an existing one would be smarter. Distributes movement inefficiently. |
| Target win rate | Player wins ~70-80% of games | Tune the suboptimality percentages during testing to hit this target. |

## Feature Dependencies

```
[3D Yut Throwing Physics] (Three.js + Cannon.js)
  |
  v
[Throw Result Detection] (read stick orientations after settling)
  |
  v
[Extra Throw on Yut/Mo] (queue management)
  |
  +---> [Turn Flow Manager] (Zustand FSM)
  |       |
  |       +---> [AI Turn Automation] (auto-throw + auto-select piece)
  |
  v
[Board Path Graph] (29 positions, 4 routes, shortcuts)
  |
  v
[Piece Position Tracking] (which piece is where, stack state)
  |
  +---> [Piece Selection UI] (player chooses which piece to move)
  |       |
  |       +---> [Path Preview] (highlight destination before confirm)
  |
  +---> [Piece Movement Animation] (hop along path positions)
  |       |
  |       +---> [Shortcut Path Choice] (corner branching UI)
  |
  +---> [Capture Logic] (opponent collision -> send home + extra turn)
  |
  +---> [Stacking Logic] (friendly collision -> merge pieces)
  |
  v
[Win Condition Check] (all pieces past finish)
  |
  v
[Victory / Defeat Screen]
  |
  v
[Coupon Delivery] (WebView postMessage bridge)
```

## MVP Recommendation

### Must ship (Phase 1 - Core Foundation):
1. **Board path graph + 2D rendering** with 29 positions and visual shortcut paths
2. **3D yut throwing** with physics simulation (Three.js + Cannon.js) -- THE differentiator
3. **Throw result detection** from physics rest state
4. **Piece movement** with correct multi-route path logic including shortcuts
5. **Stacking and capture** rules with basic animation
6. **Turn flow** with extra throw queue (yut/mo and capture extra turns)
7. **Basic AI opponent** (heuristic scoring with intentional degradation)
8. **Win/loss detection** + result screen
9. **WebView coupon bridge** on victory (postMessage)

### Should ship (Phase 2 - Polish & Delight):
1. **Cute character pieces** instead of plain tokens
2. **Path preview** on piece selection (highlight destination)
3. **Capture/stacking animations** with celebration particle effects
4. **AI personality reactions** (emoji/expression changes on avatar)
5. **Brief tutorial overlay** (2-3 screens, skippable, under 15 seconds)
6. **Victory celebration** sequence (confetti, character animation)
7. **Throw gesture** (swipe-up to throw instead of just tap)

### Defer to future versions:
- **Sound/BGM**: Add after core game is stable and WebView audio quirks are tested
- **Difficulty modes**: Only if analytics show demand for harder AI
- **Multiplayer**: Only if product strategy shifts beyond promotional
- **4-piece mode**: Only if game length target changes
- **Baekdo rule**: Only if traditional purist audience is identified

## Complexity Assessment Summary

| Feature Area | Complexity | Risk | Rationale |
|-------------|------------|------|-----------|
| 3D Yut Physics | HIGH | Medium | Three.js + Cannon.js integration. Yut sticks are asymmetric (flat on one side, curved on other). Must model custom geometry. Result detection from physics rest state requires settling detection. Proven patterns exist (threejs-dice). |
| Board Path Logic | HIGH | **High** | 29 positions with 4 routes and branching at corners/center. This is the #1 source of bugs in yut nori implementations per competitive programming references. Graph data structure with explicit next-position maps per route is recommended. |
| Piece Movement + Animation | MEDIUM | Medium | Animation itself is straightforward (tween between positions). Correctness of position tracking through shortcuts is the hard part (coupled to Board Path Logic). |
| Stacking/Capture | MEDIUM | Medium | Logic is simple but must integrate correctly with movement, animation, turn flow, and win checking. Edge cases around stacked captures need careful testing. |
| Turn/Throw Queue | MEDIUM | Low | Yut/mo chains and capture extra turns create a queue. Zustand FSM handles this well. Must prevent race conditions between animation completion and next throw trigger. |
| Piece Selection UI | MEDIUM | Low | Showing valid moves, handling single-piece auto-select, corner shortcut choice. Standard interaction patterns but several states to handle. |
| AI Opponent | LOW-MEDIUM | Low | Easy difficulty = intentionally suboptimal play. Heuristic scoring with random degradation. No minimax or MCTS needed. Tune percentages to hit ~70-80% player win rate. |
| WebView Bridge | LOW | Low | Pattern already proven in RPS game (260330_rps). Simple postMessage with structured payload. |
| Visual Theme / Polish | MEDIUM | Low | Cute character design, color palette, animations. Creative effort more than technical risk. Can iterate after core gameplay works. |

## Sources

- [Yunnori - Wikipedia (EN)](https://en.wikipedia.org/wiki/Yunnori) -- Board structure (29 stations), movement rules, capture/stacking rules
- [윷놀이 - 위키백과 (KO)](https://ko.wikipedia.org/wiki/%EC%9C%B7%EB%86%80%EC%9D%B4) -- Position names, route details, finish rules
- [윷놀이 - 한국민족문화대백과사전](https://encykorea.aks.ac.kr/Article/E0042794) -- Detailed 29-position names, 4 route descriptions, traditional rules
- [BOJ 15778 - Yut Nori](https://www.acmicpc.net/problem/15778) -- Board position naming convention for programming implementation
- [다같이 윷놀이 - Google Play](https://play.google.com/store/apps/details?id=com.devsquare.yuttogether&hl=en_US) -- Digital yut nori feature reference
- [모두의 윷놀이 - App Store](https://apps.apple.com/kr/app/%EB%AA%A8%EB%91%90%EC%9D%98-%EC%9C%B7%EB%86%80%EC%9D%B4/id1529169271) -- Digital yut nori feature reference
- [넷마블 윷놀이](https://game2.netmarble.net/yutgame/) -- Commercial digital yut nori with shop/ranking features
- [Yutnori.app](https://www.yutnori.app/) -- Free online 3D yut nori reference
- [threejs-dice library](https://github.com/byWulf/threejs-dice) -- Three.js + Cannon.js dice physics pattern
- [Crafting a Dice Roller with Three.js and Cannon-es](https://tympanus.net/codrops/2023/01/25/crafting-a-dice-roller-with-three-js-and-cannon-es/) -- 3D physics throw implementation guide
- [Simple Board Game AI - GameDev.net](https://www.gamedev.net/tutorials/programming/artificial-intelligence/simple-board-game-ai-r4686/) -- Heuristic scoring for simple board game AI
- [Rubber-Banding AI in Game Design](https://game-wisdom.com/critical/rubber-banding-ai-game-design) -- Why NOT to use rubber-banding for this use case
- [Hypercasual Games UI/UX Design Guide](https://pixune.com/blog/hypercasual-games-ui-ux-design-guide/) -- Minimalist mobile game UX patterns
- [Gamification with Coupon Voucher - MarketJS](https://www.marketjs.com/gamification-with-coupon-voucher-qr-code/) -- WebView game coupon integration patterns
