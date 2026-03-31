# Technology Stack

**Project:** Yut Nori (HTML5 Board Game with 3D Physics)
**Researched:** 2026-03-31

## Recommended Stack

### Core Framework (Inherited from RPS Project)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16.2.x | App framework with App Router | Validated in RPS project; App Router for routing, build tooling, Vercel deployment |
| React | 19.x | UI component library | Required by R3F v9; concurrent features improve 3D scene scheduling |
| TypeScript | 5.7+ | Type safety | Full codebase type safety including 3D scene definitions |
| Tailwind CSS | v4 | Utility CSS for 2D UI | Board UI, HUD, overlays -- not for 3D canvas content |
| Zustand | 5.x | Game state (FSM) | Validated FSM pattern from RPS; selective subscriptions prevent re-renders during physics |
| Motion | 12.x | Screen transitions | Phase transitions (idle/play/result); NOT for 3D animations |

### 3D Rendering + Physics (New for Yut Nori)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| three | 0.183.2 | 3D rendering engine | Industry standard; WebGL renderer for yut stick throwing scene |
| @react-three/fiber | 9.5.0 | React renderer for Three.js | Declarative 3D scene management; React 19 compatible; integrates with Zustand |
| @react-three/drei | 10.7.7 | R3F utility helpers | OrbitControls, Environment, useGLTF, adaptive DPR, PerformanceMonitor |
| @react-three/cannon | 6.6.0 | Physics hooks (cannon-es) | Web Worker physics offloading; declarative physics bodies; ~40-50KB bundle |
| cannon-es | 0.20.0 | Physics engine (peer dep) | Lightweight JS physics; proven for dice/stick throwing simulations |
| @types/three | 0.183.1 | TypeScript definitions | Type safety for Three.js objects, geometries, materials |

### Supporting Libraries (Inherited)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| canvas-confetti | 1.9.4 | Victory celebration | On game win, off-main-thread via useWorker |

### Testing (Inherited)

| Library | Version | Purpose |
|---------|---------|---------|
| vitest | 4.x | Unit test runner |
| @testing-library/react | 16.x | Component testing |
| @vitest/coverage-v8 | 4.x | Coverage reporting |

## Key Decision: cannon-es over Rapier

**Chosen:** cannon-es (via @react-three/cannon)
**Rejected:** Rapier (via @react-three/rapier)

| Criterion | cannon-es | Rapier |
|-----------|-----------|--------|
| Bundle size | ~40-50 KB (JS, tree-shakeable) | ~1.5 MB (WASM) |
| Mobile WebView impact | Minimal load time | Significant WASM parse/compile overhead |
| Complexity needed | Simple rigid body (4 sticks falling) | Overkill -- designed for complex simulations |
| Determinism | Not deterministic (fine -- we predetermine results) | Deterministic (unnecessary for our use case) |
| R3F integration | @react-three/cannon with Web Worker | @react-three/rapier with WASM |
| Maintenance | Last npm publish ~3 years ago, but stable API | Actively maintained |
| Maturity for dice/stick sims | Proven -- multiple dice roller tutorials/examples exist | Less community content for simple sims |

**Rationale:** The yut throwing simulation is a simple physics scene (4 flat sticks, a ground plane, gravity, impulse forces). cannon-es handles this trivially at 1/30th the bundle size of Rapier. The WASM overhead of Rapier is unjustifiable for a mobile WebView promotional game. cannon-es's "unmaintained" status is irrelevant -- the API is stable and the physics are correct for our needs.

**Confidence:** HIGH -- cannon-es dice roller implementations are well-documented (Codrops tutorial, CodePen examples, multiple GitHub repos). The yut stick physics are simpler than dice (flat sticks vs. cubes).

## Key Decision: react-three-fiber over Vanilla Three.js

**Chosen:** @react-three/fiber (R3F)
**Rejected:** Vanilla Three.js directly

| Criterion | R3F | Vanilla Three.js |
|-----------|-----|-------------------|
| Integration with React app | Native -- JSX components in React tree | Manual -- imperative setup, lifecycle management |
| Zustand integration | Direct -- useStore in 3D components | Manual -- subscribe/unsubscribe |
| Next.js App Router | Works with 'use client' directive | Same, but more boilerplate |
| Performance overhead | Negligible for small scenes | None |
| Bundle addition | ~15-20 KB on top of three.js | None |
| Code maintainability | Declarative, component-based | Imperative, harder to maintain |
| Web Worker physics | Built into @react-three/cannon | Must implement manually |

**Rationale:** Since the project already uses React 19 and needs tight integration with Zustand game state, R3F eliminates boilerplate for connecting 3D scene to game logic. The physics scene is a single component mounted during the "throw" phase and unmounted after. R3F's `frameloop="demand"` saves battery when physics are idle. The overhead is negligible for a scene with 4 sticks + ground plane.

**Confidence:** HIGH -- R3F v9 is confirmed compatible with React 19. The pmndrs ecosystem (R3F + drei + cannon) is the standard stack for React + Three.js projects.

## Architecture Pattern: Next.js + R3F

The 3D physics scene runs entirely client-side. Key integration pattern:

```
src/
  components/
    yut-throwing/
      YutScene.tsx        -- 'use client'; <Canvas> wrapper
      YutStick.tsx        -- Physics body + 3D mesh for each stick
      Ground.tsx          -- Physics ground plane
      ThrowingControls.tsx -- Touch/click handlers for throw impulse
  app/
    page.tsx              -- Server Component, renders game shell
```

**Critical:** All R3F components MUST be in 'use client' files. The `<Canvas>` component uses hooks internally and cannot be server-rendered. Use dynamic import with `ssr: false` if needed:

```typescript
const YutScene = dynamic(() => import('@/components/yut-throwing/YutScene'), {
  ssr: false,
  loading: () => <YutSceneSkeleton />
})
```

## Mobile WebView Performance Configuration

### Renderer Settings (via R3F Canvas props)

```typescript
<Canvas
  frameloop="demand"          // Only render when physics active or interaction
  dpr={[1, 2]}               // Cap device pixel ratio at 2 (critical for mobile)
  gl={{
    antialias: false,         // Save GPU cycles on mobile
    powerPreference: "high-performance",
    alpha: true,              // Transparent background to blend with 2D board
  }}
  performance={{
    min: 0.5,                 // Allow DPR to drop to 0.5x on slow devices
    max: 1,                   // Max quality scale
    debounce: 200,            // Debounce performance changes
  }}
>
```

### Physics Configuration

```typescript
<Physics
  gravity={[0, -9.81, 0]}
  allowSleep={true}           // Bodies sleep after settling -- stops physics loop
  broadphase="SAPBroadphase"  // Faster for small body counts
  iterations={5}              // Reduce from default 10 for mobile
  tolerance={0.001}
>
```

### Performance Budget for Mobile WebView

| Metric | Target | Strategy |
|--------|--------|----------|
| Bundle size (3D) | < 200 KB gzipped | three.js (~155KB gz) + cannon-es (~15KB gz) + R3F (~5KB gz) |
| Draw calls | < 20 per frame | 4 sticks + ground + lighting = ~10 draw calls |
| Triangles | < 5,000 | Low-poly stick models, simple ground plane |
| Textures | < 512 KB total | Small textures, prefer vertex colors or MeshToonMaterial |
| Frame rate | 30-60 fps | frameloop="demand", physics sleep, DPR capping |
| Physics bodies | 5 (4 sticks + ground) | Minimal cannon-es overhead |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Physics engine | cannon-es | Rapier | 1.5MB WASM bundle, overkill for 4 rigid bodies |
| Physics engine | cannon-es | ammo.js | Heavier (Bullet port), harder API, overkill |
| 3D framework | Three.js (via R3F) | Babylon.js | Larger bundle, no React integration equivalent to R3F |
| 3D framework | Three.js (via R3F) | PlayCanvas | Engine-oriented, not library-oriented; wrong paradigm |
| React integration | R3F | Vanilla Three.js | More boilerplate, no Zustand/React lifecycle integration |
| R3F physics | @react-three/cannon | @react-three/rapier | Bundle size, see above |
| R3F physics | @react-three/cannon | Manual cannon-es | Lose Web Worker offloading, more boilerplate |
| 3D approach | 3D physics only for throwing | Full 3D board game | Performance risk in WebView, unnecessary complexity |

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| Rapier / @react-three/rapier | 1.5MB WASM is too heavy for a mobile WebView promo game |
| Babylon.js | Overkill, no R3F equivalent, larger bundle |
| PixiJS | 2D only -- cannot do 3D physics simulation |
| WebGPU renderer | Not supported in most mobile WebViews yet (only Safari 26+) |
| ammo.js | Bullet physics port, heavy, complex API |
| Lottie for physics | Pre-baked animations lack the real-time physics feel |
| react-spring for 3D | Use R3F's useFrame for 3D animation, not react-spring |
| framer-motion for 3D | Use Motion (motion/react) only for 2D UI transitions |

## Installation

```bash
# 3D + Physics (new dependencies)
npm install three @react-three/fiber @react-three/drei @react-three/cannon cannon-es

# Type definitions
npm install -D @types/three

# Already installed (from RPS project pattern)
# npm install next@16 react@19 react-dom@19 zustand@5 motion tailwindcss@4
```

## Version Compatibility Matrix

| Package | Version | Requires |
|---------|---------|----------|
| @react-three/fiber | 9.x | React 19.x, Three.js 0.156+ |
| @react-three/drei | 10.x | @react-three/fiber 9.x |
| @react-three/cannon | 6.6.0 | @react-three/fiber 9.x, cannon-es 0.20.x |
| three | 0.183.x | WebGL-capable browser |
| cannon-es | 0.20.0 | No external dependencies |

## Sources

- [Three.js npm registry](https://www.npmjs.com/package/three) -- version 0.183.2 confirmed
- [cannon-es GitHub (pmndrs)](https://github.com/pmndrs/cannon-es) -- lightweight 3D physics, ~40-50KB
- [@react-three/fiber npm](https://www.npmjs.com/package/@react-three/fiber) -- v9.5.0, React 19 compatible
- [@react-three/cannon npm](https://www.npmjs.com/package/@react-three/cannon) -- v6.6.0, Web Worker physics
- [R3F v9 Migration Guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide) -- React 19 compatibility confirmed
- [Codrops Dice Roller Tutorial](https://tympanus.net/codrops/2023/01/25/crafting-a-dice-roller-with-three-js-and-cannon-es/) -- Three.js + cannon-es pattern for throwing physics
- [R3F Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) -- frameloop, DPR, adaptive performance
- [Rapier 2025 Review](https://dimforge.com/blog/2026/01/09/the-year-2025-in-dimforge/) -- WASM bundle ~1.5MB
- [Three.js Mobile Performance](https://discourse.threejs.org/t/how-to-achieve-three-js-55-60-fps-on-mobile-with-great-smooth-experience/78206) -- DPR capping, draw call budgets
- [WebGL WebView Best Practices (Amazon)](https://developer.amazon.com/docs/vega/0.21/webview-webgl-best-practices.html) -- draw call optimization, texture management
