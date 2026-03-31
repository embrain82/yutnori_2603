# Technology Stack

**Analysis Date:** 2026-03-31

## Languages

**Primary:**
- TypeScript 5.7 - Full codebase type safety, including `next.config.ts` and component types
- JavaScript (JSX/TSX) - React component definitions

**Secondary:**
- CSS3 - Global styles via Tailwind CSS v4 in `src/app/globals.css`

## Runtime

**Environment:**
- Node.js (development and build-time)
- Browser (client-side game execution)

**Package Manager:**
- npm (lockfile: `package-lock.json`)

## Frameworks

**Core:**
- Next.js 16.2.1 - Full-stack app framework with App Router
- React 19.2.4 - UI component library and state management integration
- Tailwind CSS v4 - Utility-first CSS framework via `@tailwindcss/postcss` PostCSS plugin

**State Management:**
- Zustand 5.0.12 - Client-side game state store (`src/store/gameStore.ts`), selective subscriptions prevent re-renders during animations

**Animation:**
- motion 12.38.0 - React state-driven transitions and card flip animations (imported from `motion/react`, NOT `framer-motion`)

**Effects:**
- canvas-confetti 1.9.4 - Victory fireworks effect with `useWorker: true` option for off-main-thread rendering on mobile

## Key Dependencies

**Critical:**
- `motion` 12.38.0 - Provides all screen transitions (idle → play → result → victory/gameover), simultaneous choice reveal animations
- `zustand` 5.0.12 - Central FSM game state management, prevents prop drilling across full component tree
- `canvas-confetti` 1.9.4 - Victory celebration effect, uses canvas for performance on mobile

**Type Safety:**
- `@types/canvas-confetti` 1.9.0 - TypeScript definitions for canvas-confetti
- `@types/node` 20.19.37 - Node.js type definitions for build processes
- `@types/react` 19 - React component and hook types
- `@types/react-dom` 19 - React DOM rendering types

**Testing:**
- `vitest` 4.1.2 - Unit test runner with jsdom environment
- `@testing-library/react` 16.3.2 - Component testing utilities
- `@testing-library/dom` 10.4.1 - DOM query utilities for tests
- `@testing-library/jest-dom` 6.9.1 - Assertion matchers (toBeInTheDocument, etc.)
- `@testing-library/user-event` 14.6.1 - User interaction simulation (click, type)
- `@vitest/coverage-v8` 4.1.2 - V8 code coverage reporting

**Development:**
- `eslint` 9 - Code linting via flat config
- `eslint-config-next` 16.2.1 - Next.js ESLint rules (Core Web Vitals, TypeScript)
- `@tailwindcss/postcss` 4 - Tailwind v4 PostCSS plugin
- `@vitejs/plugin-react` 6.0.1 - React JSX transform for Vitest
- `jsdom` 29.0.1 - DOM environment simulation for test execution
- `typescript` 5 - TypeScript compiler bundled with Next.js 16

**Fonts:**
- Geist font family (via `next/font/google`) - System font loaded from Google Fonts API

## Configuration

**Environment:**
- Environment variables configured in Next.js via `process.env.NEXT_PUBLIC_*` pattern
- `NEXT_PUBLIC_ALLOWED_ORIGIN` - Restricts postMessage iframe embedding to specific origin (defaults to `'*'`)
- No `.env` file required for base functionality; iframe embedding requires parent window origin configuration

**Build:**
- `next.config.ts` - TypeScript configuration with CSP and X-Frame-Options headers for iframe embedding
- `tsconfig.json` - TypeScript compiler options with path alias `@/*` → `src/*`
- `postcss.config.mjs` - PostCSS configuration for Tailwind CSS v4
- `eslint.config.mjs` - Flat ESLint config with Next.js rules
- `vitest.config.ts` - Vitest setup with jsdom environment, coverage via V8, alias resolution

## Platform Requirements

**Development:**
- Node.js (bundled with Next.js 16)
- npm for package management
- Turbopack dev server (bundled with Next.js 16, invoked via `next dev --turbo`)

**Production:**
- Deployment target: Vercel (detected via `.vercel/` directory)
- Compatible with any Node.js 18+ runtime
- Browser support: All modern browsers (ES2017 target in TypeScript)

---

*Stack analysis: 2026-03-31*
