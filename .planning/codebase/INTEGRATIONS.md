# External Integrations

**Analysis Date:** 2026-03-31

## APIs & External Services

**postMessage (Browser API):**
- Game embedding via iframe - Bidirectional communication with parent window
  - Inbound: `RPS_COUPON_CONFIG` message from parent with coupon details
  - Outbound: `RPS_GAME_WIN` message to parent on victory with session payload
  - Implementation: `src/hooks/usePostMessage.ts`
  - Auth: Origin validation via `NEXT_PUBLIC_ALLOWED_ORIGIN` env var

**Google Fonts API:**
- Geist font family (sans and mono)
- Loaded via Next.js `next/font/google` with automatic subsetting
- No explicit API key required (handled by Next.js)

## Data Storage

**Databases:**
- Not applicable - Game is entirely client-side with no backend data persistence

**File Storage:**
- Local filesystem only - No external file storage service
- Static assets in `public/` directory (SVGs, images)

**Caching:**
- Browser native caching via HTTP headers (configured in `next.config.ts`)
- No explicit caching library

**State Management:**
- Zustand store in memory (`src/store/gameStore.ts`)
- Session data held in browser memory during game play
- Session payload transmitted to parent window on victory via postMessage

## Authentication & Identity

**Auth Provider:**
- None - Game requires no authentication
- Parent window handles coupon code validation and distribution
- Game accepts pre-configured coupon details via postMessage `RPS_COUPON_CONFIG` message

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, Rollbar, or similar integration

**Logs:**
- Console logging only (standard browser console)
- No centralized logging service

**Analytics:**
- Not detected - No Google Analytics, Mixpanel, or custom event tracking

## CI/CD & Deployment

**Hosting:**
- Vercel (detected via `.vercel/` directory and `next.config.ts` structure)
- Vercel handles serverless functions if any were present (currently none)

**CI Pipeline:**
- Vercel automatically deploys on git push to main branch
- ESLint runs via `npm run lint` (pre-deployment check recommended)
- Tests run via `npm run test` (not yet integrated into CI, manual execution)

**Environment Configuration:**
- Vercel env vars UI for managing `NEXT_PUBLIC_ALLOWED_ORIGIN`
- Zero secrets required for base deployment (CSP/framing headers use env var)

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_ALLOWED_ORIGIN` (optional, defaults to `'*'`) - Restricts postMessage iframe embedding to specific parent origin

**Secrets location:**
- No secrets managed in this project
- Coupon codes passed dynamically from parent window via postMessage, not stored in game
- All game logic is client-side with no backend secrets

## Webhooks & Callbacks

**Incoming:**
- `RPS_COUPON_CONFIG` message event - Received from parent window on iframe load
  - Payload: `{ type: 'RPS_COUPON_CONFIG', couponCode: string, couponImage?: string, couponText?: string }`
  - Handler: `src/hooks/usePostMessage.ts` line 17-28
  - Origin validation: Checks against `NEXT_PUBLIC_ALLOWED_ORIGIN`

**Outgoing:**
- `RPS_GAME_WIN` message event - Sent to parent window on victory
  - Payload: `{ type: 'RPS_GAME_WIN', payload: SessionPayload }`
  - SessionPayload includes: sessionId (UUID), rounds array, startedAt, completedAt, totalPlayTimeMs
  - Triggers: Only on victory (all 5 rounds won)
  - Handler (in parent): Parent window must listen for `message` event and validate origin
  - Post-send action: Parent typically shows coupon modal or redirect page

## Cross-Origin Security

**CSP Header:**
- `Content-Security-Policy: frame-ancestors <NEXT_PUBLIC_ALLOWED_ORIGIN>`
- Restricts which origins can frame this game (set in `next.config.ts` lines 12-13)
- Defaults to `frame-ancestors *` if env var not set

**X-Frame-Options Header:**
- `X-Frame-Options: ALLOWALL` (set in `next.config.ts` line 15-16)
- Explicitly permits iframe embedding from any origin (overridden by CSP frame-ancestors if stricter)

## Third-Party Dependencies (Risk Assessment)

**canvas-confetti:**
- Pure canvas library, no network calls
- Utility-only, no data transmission
- Risk: Low - Mature library with minimal API surface

**motion (framer-motion):**
- Pure animation library, no network calls
- Latest version (v12.38.0) recommended in place of legacy `framer-motion` package
- Risk: Low - Core dependency for UI transitions

**Zustand:**
- Client-side state only, no network calls
- Risk: Low - No external dependencies beyond React peer

**Tailwind CSS v4:**
- Build-time only, no runtime network calls
- PostCSS plugin generates CSS bundle
- Risk: Low - No external data loading

---

*Integration audit: 2026-03-31*
