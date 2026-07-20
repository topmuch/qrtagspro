# QRBag Feature Implementation Worklog

---
Task ID: 0
Agent: Main Orchestrator
Task: Install dependencies, update schema, modify suivi API

Work Log:
- Installed leaflet, @types/leaflet, socket.io, socket.io-client
- Added Review and LossAlert models to prisma/schema.prisma
- Ran db:push to sync DB
- Modified /api/suivi/[reference]/route.ts to include latitude/longitude in scan entries for map trajectory

Stage Summary:
- DB schema updated with Review (social proof) and LossAlert (proactive loss detection) models
- Suivi API now returns lat/lng per scan for interactive map
- Dependencies ready for all 6 features

---
Task ID: 3
Agent: tracking-ws
Task: Create Socket.IO WebSocket mini-service for real-time scan event broadcasting

Work Log:
- Created `mini-services/tracking-ws/package.json` with socket.io dependency and `bun --hot` dev script
- Created `mini-services/tracking-ws/index.ts` — Socket.IO server on port 3005
  - Uses Caddy-compatible path `/` and wildcard CORS
  - Rooms named `bag:<reference>` (e.g. `bag:Hajj26-MLQGY7`)
  - Listens for `join` events with `{ reference }` payload; client joins corresponding room
  - Exposes `broadcast` event for demo/testing: accepts `{ reference, data }`, emits `scan-event` to the room
  - Graceful shutdown on SIGTERM/SIGINT
- Created `src/hooks/useTrackingSocket.ts` — React hook
  - Connects via `io("/?XTransformPort=3005")` (Caddy gateway pattern, no direct port in URL)
  - On connect, emits `join` with the reference string
  - Returns `{ isConnected, lastEvent }` (latest scan-event payload)
  - Auto-reconnects with exponential backoff (Infinity attempts)
  - Properly disconnects and cleans up on unmount / reference change

Stage Summary:
- Tracking WebSocket mini-service ready at port 3005
- `useTrackingSocket(reference)` hook ready for consumption by the tracking page
- Demo broadcast endpoint allows simulating scan events without backend integration

---
Task ID: 2
Agent: pwa-enhance
Task: Enhance PWA setup — manifest, service worker, registration component, layout meta tags

Work Log:
- **manifest.json** — Updated `categories` from `["travel", "utilities", "lifestyle"]` to `["travel", "utilities"]`; replaced single broken screenshot (`/screenshots/home.png`) with two entries pointing to existing landing-v2 images (`hero.jpg` and `step-activate.jpg`); all other required fields (name, short_name, start_url, display, background_color, theme_color, orientation, scope, icons, lang) were already correct and left as-is.
- **sw.js** — Rewrote service worker with cache name `qrbag-v1`; pre-cache list set to `/`, `/manifest.json`, `/logo.png`, `/favicon.png`; implemented three-route strategy: (1) API calls → network-first with cache fallback, (2) images/icons/items → cache-first with network fallback, (3) navigation/other → network-first; install and activate handlers with `skipWaiting` and `clients.claim`; non-GET and cross-origin requests skipped; old caches cleaned on activate.
- **PWARegister.tsx** — Created new `'use client'` component at `src/components/PWARegister.tsx` that registers `/sw.js` on mount via `navigator.serviceWorker.register`; errors handled silently; renders `null`.
- **layout.tsx** — Added explicit `<link rel="manifest" href="/manifest.json" />` and `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` inside the `<head>` section; all other PWA meta tags (theme-color, apple-mobile-web-app-capable, application-name, msapplication-TileColor) were already present.

Stage Summary:
- PWA manifest fully compliant with requirements (8 icon sizes, 2 screenshots, correct categories)
- Service worker uses `qrbag-v1` cache with appropriate strategies per resource type
- `PWARegister` component ready for import
- Layout head includes all necessary PWA link and meta tags
- ESLint passes cleanly

---
Task ID: 5-api
Agent: api-routes
Task: Create API routes for Reviews and LossAlerts

Work Log:
- **POST /api/reviews** (`src/app/api/reviews/route.ts`)
  - Validates name (required), rating (1-5 integer), content (min 10 chars), optional title/location/baggageRef/language
  - Rate-limited to 5 submissions per hour per IP via in-memory `rateLimit()`
  - Creates review with `isApproved: false`; response omits approval status
  - Returns 201 on success

- **GET /api/reviews** (same file)
  - Query params: `featured=true`, `limit` (default 20, max 50), `lang` (fr/en/ar)
  - Only returns `isApproved: true` reviews, ordered by `createdAt desc`
  - Parallel query for aggregate stats (`_avg.rating`, `_count.id`)
  - Returns `{ reviews: [...], stats: { averageRating, totalReviews } }`

- **GET /api/loss-alerts/[reference]** (`src/app/api/loss-alerts/[reference]/route.ts`)
  - Returns non-dismissed alerts for the given reference
  - Uses `await params` pattern for Next.js 16 App Router
  - Ordered by `createdAt desc`

- **POST /api/loss-alerts/[reference]/dismiss** (`src/app/api/loss-alerts/[reference]/dismiss/route.ts`)
  - Body: `{ alertId }` — verifies alert belongs to the reference and is not already dismissed
  - Sets `dismissed: true` and `dismissedAt: now()`
  - Returns 404 if alert not found or already dismissed

- **GET /api/loss-detection/check** (`src/app/api/loss-detection/check/route.ts`)
  - Cron-callable; protected by `CRON_SECRET` Bearer token (if set) + rate limit (1 per 5 min)
  - Finds active/scanned baggages with `departureDate` set
  - For each: checks if departure + 3h has passed, no scans after arrival window, no existing non-dismissed alert
  - Creates `LossAlert` records with descriptive message including hours since arrival
  - Returns `{ alertsCreated, candidatesChecked, timestamp }`

Stage Summary:
- 5 API routes created across 4 files
- All routes use `import { db } from '@/lib/db'`
- Lint passes cleanly
- Routes follow existing project patterns (NextRequest/NextResponse, rate-limit.ts, CRON_SECRET auth)
---
Task ID: qrtagspro-v1
Agent: fullstack-refactor
Task: QRTagsPro V1 — refonte B2B (hôtel) — cleanup particulier + landing + dashboard hôtel

Work Log:

**Phase 1 — Cleanup (suppression du workflow particulier)**

App pages deleted (`rm -rf`):
- /inscrire, /inscription, /mes-bagages, /success, /suivi, /checklist, /share,
  /etapes, /fonctionnalites, /features, /metiers, /agency, /a-propos, /assistance,
  /contact, /devenir-partenaire, /cgu, /confidentialite, /mentions-legales,
  /demo, /expired, /offline, /voyageurs-standard, /workflow, /dashboard, /track

API routes deleted:
- /api/activate, /api/suivi, /api/share, /api/checklist,
  /api/baggage/[ref]/{verify-pin,regenerate-pin,transit-mode,share,export-pdf,
  connection-alert,damage}, /api/landing, /api/ai/*, /api/loss-detection,
  /api/loss-alerts, /api/feedback, /api/emergency-contacts, /api/voyageurs,
  /api/reviews, /api/notify, /api/push, /api/scan/{notify,chat,[reference]},
  /api/advertisements, /api/reports

Components deleted:
- TrackingWidget, SocialShareButtons, LossAlertBanner, LeafletMap, suivi/*,
  inscrire/*, PreDepartureAlert, finder/*, pwa-registration, PWARegister,
  ReviewModal, TestimonialsSection, LatestNewsWidget, public/*,
  AdvertisementBanner

Hooks deleted:
- useTrackingSocket, useAudioAlert, usePWAInstallPrompt, usePushNotification

Libs deleted:
- transport, groq, ai-services, aviationstack, wakit, whatsapp-message,
  web-push, emergency-contacts, checklist, checklist-catalog, i18n (stubbed),
  scan-context, country-utils, country-data, qr-server (kept — see notes),
  error-monitor, logger-metrics (inlined into logger.ts),
  rate-limit (kept — see notes), landing-data

Other directories deleted:
- public/locales/, messages/, mini-services/, examples/, __tests__/
- scripts/ cleaned (kept only migrate-qrtags-columns.cjs)
- src/types/ai.ts removed (unused)

**Phase 1 — Stubbed files (kept for backward compatibility)**

- `src/lib/i18n.ts` — simplified to a stub: keeps `Language` type, `LANGUAGE_NAMES`,
  `LANGUAGE_DIRECTION`, and FR-only no-op helpers (loadTranslations → {} etc.).
  Required by `src/components/ui/LanguageSelector.tsx` (kept).
- `src/hooks/useTranslation.ts` — stub: returns identity `t()` and fixed lang='fr'.
  Required by `src/app/admin/monitoring/page.tsx` (don't touch admin).
- `src/lib/logger.ts` — inlined `logMetric()` (previously imported from
  `logger-metrics.ts`). Same signature, logs a single line to stdout.
- `src/lib/rate-limit.ts` — KEPT as-is (used by /api/baggage-status/[reference]
  which is in the keep list). Documented exception in worklog.
- `src/lib/qr-server.ts` — KEPT as-is (used by /api/admin/baggages/export-zip
  for superadmin QR ZIP export). Documented exception in worklog.
- `src/components/admin/ExtendValidityModal.tsx` — KEPT as-is (used by
  /admin/baggage/[id] page — admin pages must NOT be touched).

**Phase 2 — Landing page (`src/app/page.tsx`)**

Complete rewrite. New QRTagsPro landing page (FR only, black/yellow design):
- Header: QRTagsLogo + nav (Comment ça marche / Métiers / Avantages / Démo) +
  Espace agence + Superadmin buttons
- Hero: black bg with subtle yellow radial pattern, big title, subtitle,
  CTA "Demander une démo" (yellow) + "Espace agence" (outline)
- "Comment ça marche" — 4 cards (Superadmin génère QR / staff check-in /
  trouveur scanne / vous gérez la restitution) with numbered icons
- "Métiers" — 6 cards (Hôtels ✓Disponible / Écoles / Cliniques / Loueurs auto /
  Consignes / Autres métiers) with badges (Disponible / Bientôt / Sur devis)
- "Avantages" — 3 columns (Contrôle total / Dashboard temps réel /
  Notifications WhatsApp)
- "Demande de démo" — form (company / metier / email / phone / message) with
  stub submit (alert "Merci, nous vous contacterons sous 24h." + form clear)
- Footer: QRTagsPro logo + tagline + links (Espace agence / Superadmin / Contact)

Design tokens respected:
- Background black `#111111` for hero/header/footer
- Accent mustard yellow `#E3B23C`
- Cards: white with 2px black border + shadow-xl
- Inputs: `bg-gray-50` + 2px black border + focus yellow + ring yellow
- Primary button: black bg + yellow text + hover -translate-y-0.5
- Secondary button: white bg + 2px black border + hover -translate-y-0.5

**Phase 3 — Dashboard hôtel (`src/app/agence/tableau-de-bord/page.tsx`)**

Complete rewrite. New hotel dashboard with:
- 4 stat cards: QR en stock (yellow), QR actifs (green), Check-out aujourd'hui
  (orange), Perdus cette semaine (red) — computed client-side from
  `/api/agency/baggages?agencyId=X` response (filters on status +
  parseCustomData(b) for departure_date)
- "Demander plus de QR" — yellow card with current stock + alert "Stock bas !"
  if <50 + button POST /api/messages (type='qr_request', agencyId, content
  with agency name + stock count)
- "Check-out aujourd'hui" — list of active baggages whose customData.departure_date
  (or Baggage.departureDate) matches today's ISO date, with "Check-out" button
  (PATCH /api/baggage/[reference] to status=expired, fallback DELETE)
- "Clients actuels" — table (Client / Chambre / Arrivée / Départ / Statut /
  Actions). StatusBadge shows "Expire bientôt" if departure within 24h,
  otherwise "Actif". Capped to 20 rows + "+ N autres" hint.
- "Objets perdus récents" — 5 most recent isLost=true baggages with reference,
  client name (from customData), reported date, last scan location.
- Empty states for each section (e.g. "Aucun client actif. Faites un check-in
  pour commencer." with link to /agence/check-in)

Helper `parseCustomData(b)` safely JSON.parses `b.customData` string.
`HotelCustomData` interface: { client_name, room_number, arrival_date,
departure_date, phone }.

**Sidebar update (`src/app/agence/layout.tsx`)**

- Replaced menu items with: Tableau de bord, Check-in (new), QR actifs
  (=/agence/baggages), Objets perdus, Trouvailles, Assistance, Profil
- Removed: Traçabilité QR, Bagages (renamed to QR actifs), Rapports, Blog QRTags,
  Page publique link, "Commander des QR" button (replaced by "Demander plus de
  QR" card inside dashboard)
- Removed `AdvertisementBanner` import + usage (component was deleted in Phase 1)
- Sidebar now uses #E3B23C as active background (black text) and #E3B23C as
  hover accent text on white/40 backgrounds
- Header simplified: removed search "Commander des QR" / "Page publique" widgets
  (kept search bar, theme toggle, notifications bell, user avatar)
- Footer of sidebar: kept "Contacter" shortcut + Déconnexion

**Check-in page (`src/app/agence/check-in/page.tsx`) — NEW**

V1 stub: simple form (reference QR / client_name / room_number / arrival_date /
departure_date / phone) → PATCH /api/baggage/[reference] with status=activated,
customData JSON, departureDate (schema column), expiresAt.
Real QR-scanning flow will be added in a later iteration.

**Schema changes (`prisma/schema.prisma`)**

- `Agency.contactPhone String?` — WhatsApp réception phone (finder scan →
  wa.me click-to-chat)
- `Baggage.departureDate DateTime?` — hotel check-out date (for cron auto-expire)
- Ran `npx prisma generate` (client updated)
- Ran `npx prisma db push --skip-generate --accept-data-loss` (DB synced)

**Migration script (`scripts/migrate-qrtags-columns.cjs`)**

- Added `Baggage.departureDate` to BAGGAGE_COLUMNS list
- Added new AGENCY_COLUMNS list with `contactPhone`
- Migration loop now also iterates Agency table (with tableExists guard)
- Added new index `idx_baggage_departureDate` for cron auto-expire queries
- Tested locally against `prisma/qrbag.db` — all columns OK, indexes OK,
  superadmin created

**init-db.sh**

- Updated final verification step to count 6 columns on Baggage (added
  `departureDate`) and to check Agency.contactPhone column presence
- Migration script reference unchanged (`scripts/migrate-qrtags-columns.cjs`)

**TypeScript verification**

- `./node_modules/.bin/tsc --noEmit -p tsconfig.json`:
  - Pre-existing errors: 69 lines (schema mismatches in API routes I did NOT
    touch — flightNumber/destination on Baggage type, tagLot model missing,
    baggageIndex null vs number, validityExtendedAt column missing, etc.)
  - After my changes: 48 lines (all pre-existing; my new files page.tsx,
    agence/layout.tsx, agence/tableau-de-bord/page.tsx, agence/check-in/page.tsx
    have ZERO TypeScript errors)
- `bun run lint` (eslint) on the 4 new files: 0 errors

Stage Summary:
- Particulier workflow fully removed (≈140 files deleted)
- Landing QRTagsPro live at `/` (FR only, black/yellow design)
- Dashboard hôtel live at `/agence/tableau-de-bord` (4 stats + clients actuels
  + check-out aujourd'hui + demander plus de QR + perdus récents)
- Sidebar updated (Check-in / QR actifs / Perdus / Trouvailles / Assistance / Profil)
- New stub page `/agence/check-in` (manual QR activation form)
- Schema V1: Agency.contactPhone + Baggage.departureDate
- Migration script idempotent, tested locally
- Pre-existing TS errors unchanged (48 lines in untouched API routes)
- New code: 0 TS errors, 0 ESLint errors

Notes / deviations from initial instructions:
- Kept `src/lib/rate-limit.ts` (used by `/api/baggage-status/[reference]` — kept API)
- Kept `src/lib/qr-server.ts` (used by `/api/admin/baggages/export-zip` — kept API for superadmin QR ZIP export)
- Kept `src/components/admin/ExtendValidityModal.tsx` (used by `/admin/baggage/[id]` — admin pages must NOT be touched)
- Kept `prisma/seed.ts` as-is (broken pre-existing — flightNumber schema mismatch — but unused, no build impact)
- Did not modify `src/lib/agency-types.ts` per final instruction ("keep them all but mark school/medical/etc as 'coming soon' in the UI. The schema stays the same.").
