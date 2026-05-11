# CSK Academy Management System

Bilingual (Arabic/English, RTL-first) web platform for **CSK — Team Cap Saied**, a combat sports academy operating across 5 locations in Benha, Egypt (Boxing • Kickboxing • MMA • Karate • Fitness).

The authoritative spec is [`CSK_Academy_SRS_v1.0.docx.pdf`](./CSK_Academy_SRS_v1.0.docx.pdf) in this folder. All `FR-*` and `NFR-*` IDs in code comments map to that document.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **React 19**
- **PostgreSQL 16** + **Prisma 6** ORM
- **Auth.js (NextAuth v5)** — credentials (email/phone + password), JWT sessions
- **Tailwind CSS** + shadcn-style primitives, RTL-first (logical properties)
- **next-intl** for AR/EN i18n with full RTL direction switching
- **Vitest** for unit tests, Playwright placeholder for E2E
- Pluggable adapters for **email** (Resend), **WhatsApp** (UltraMsg → Business API in v2), **storage** (S3/R2)

## Repo layout

```
app/                      Next.js routes (web + /api)
  [locale]/
    (public)/             Marketing site, login, register
    (app)/                Authenticated app
      admin/              System Admin
      head-coach/         Head Coach
      coach/              Coach
      intern/             Intern
      trainee/            Trainee + Parent-managed
  api/v1/                 REST API (consumed in v2 by native mobile)
  actions/                Server Actions
src/
  domain/                 Pure domain logic (no I/O)
    financial/            Split engine (§10), default rules
  application/            Use-case services (write here next)
  infrastructure/
    db/                   Prisma client singleton
    notifications/        Email + WhatsApp adapters (TODO)
    storage/              S3/R2 adapter (TODO)
  components/             UI components
  i18n/                   Locale config, routing, navigation helpers
  lib/                    cn(), rbac helpers
prisma/
  schema.prisma           ~30 entities — source of truth from SRS §9
  seed.ts                 5 locations, 5 disciplines, 4 sample users
messages/
  ar.json
  en.json
tests/
  domain/                 Worked examples from SRS §10.2 (10 tests, all green)
```

## Getting started

### 1. Prerequisites
- Node.js ≥ 20.11
- PostgreSQL 16 (local Docker is easiest)
- A running PostgreSQL instance

```bash
# One-liner: start a local Postgres in Docker
docker run --name csk-pg -e POSTGRES_PASSWORD=csk -e POSTGRES_DB=csk -p 5432:5432 -d postgres:16
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit DATABASE_URL and AUTH_SECRET (openssl rand -base64 32)
```

### 4. Initialize the database
```bash
npm run db:migrate         # creates tables
npm run db:seed            # 5 locations + 5 disciplines + 4 sample users
```

### 5. Run dev server
```bash
npm run dev
```
Open [http://localhost:3000/ar](http://localhost:3000/ar) (RTL Arabic) or [http://localhost:3000/en](http://localhost:3000/en).

### Sample login (after seed)
| Email | Role | Password |
|---|---|---|
| captain@csk.local | ADMIN | `Csk!2026` |
| head.coach@csk.local | HEAD_COACH | `Csk!2026` |
| coach@csk.local | COACH | `Csk!2026` |
| trainee@csk.local | TRAINEE | `Csk!2026` |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Sync schema without migration (dev only) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Run `prisma/seed.ts` |
| `npm run worker` | Long-running pg-boss worker (daily medical alerts at 09:00 Africa/Cairo) |
| `npm test` | Run Vitest unit tests (128 tests, ~5s) |
| `npm run test:e2e:install` | Install Playwright browsers (one-time) |
| `npm run test:e2e` | Run Playwright smoke suite — auto-starts dev server on :3100 |
| `npm run test:e2e:ui` | Same, with the Playwright UI for inspection |

## End-to-end tests

The Playwright suite under `tests/e2e/` requires a **running database with the demo seed loaded** — it asserts on real seed content (Fight Club location, "Captain Saied" admin, the 5 disciplines, etc.).

```powershell
# One-time
npm run test:e2e:install

# Each run
npm run db:migrate
npm run db:seed
npm run test:e2e
```

The config (`playwright.config.ts`) auto-starts `next dev --port 3100` and reuses an existing server outside CI. Tests are serial (workers=1) since they share seeded state.

## Implementation status (v1)

| FR area | Status |
|---|---|
| 6.1 Auth / Users | ✅ Self-signup, role-gated dashboards, approve/suspend/promote, welcome notifications |
| 6.2 Locations / Groups / Schedule | ✅ Admin CRUD, weekly schedules, roster + capacity-override |
| 6.3 Training Units library | ✅ HC CRUD with versioning, coach/intern read-only browse |
| 6.4 Session planning + approval | ✅ Builder UI + state-machine workflow |
| 6.5 Attendance + body-map eval | ✅ Mobile roster, quick eval, interactive SVG body-map |
| 6.6 Daily reports | ✅ Compose → submit → approve → notify |
| 6.7 Monthly reports + PDF | ✅ Aggregation + PDF interface (stub generator; react-pdf swap is v2) |
| 6.8 Financial | ✅ Engine + payments + earnings + owner dashboards + CSV export + contracts |
| 6.9 Championships | ✅ With medical-clearance gate + fight record |
| 6.10 Belt exams | ✅ With auto level progression (N→A→B→C) |
| 6.11 Medical | ✅ Records, documents, expiry alert dispatcher |
| 6.12 Merchandise | ✅ Catalog + sales (100% CSK) + low-stock alerts + public catalog |
| 6.13 Notifications | ✅ Adapter + dispatch + inbox + per-user preferences |
| 6.14 Certificates | Schema ✅ — manual issuance UI deferred |
| 6.15 Public website | ✅ Home, About, Locations, Disciplines, Coaches, Schedule, Pricing, Champions, Merchandise, Contact, Blog, Login, Register |

### v2 (deferred per §13.2)
Online payments (Paymob/Vodafone Cash/Fawry), e-commerce checkout, real react-pdf certificate/report generation with Arabic font embedding, BI-grade analytics, native iOS/Android, official WhatsApp Business API migration.

## Public REST API (`/api/v1/public/*`)

The same data the public website uses is exposed as JSON for the v2 mobile app. All endpoints are unauthenticated, rate-unlimited, and return `application/json`.

| Endpoint | Returns |
|---|---|
| `GET /api/v1/public` | Endpoint catalog |
| `GET /api/v1/public/locations` | `{ locations: [...] }` |
| `GET /api/v1/public/disciplines` | `{ disciplines: [...] }` |
| `GET /api/v1/public/coaches` | `{ coaches: [...] }` |
| `GET /api/v1/public/schedule` | `{ locations: [...] }` weekly recurring per venue |
| `GET /api/v1/public/champions?limit=24` | `{ champions: [...] }` with W-L-D records |
| `GET /api/v1/public/pricing` | Pricing snapshot + included disciplines |
| `GET /api/v1/public/merchandise` | Active in-stock items |
| `POST /api/v1/public/contact` | Submit a contact inquiry → notifies HC + Admin |
| `POST /api/v1/public/register-trainee` | Self-register a trainee → creates PENDING account |

Example:
```bash
curl -s http://localhost:3000/api/v1/public/locations | jq
curl -s -X POST http://localhost:3000/api/v1/public/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Ahmed","email":"a@x.eg","message":"Tell me about Boxing classes."}'
```

## Architecture principles

- **Layered (NFR-MNT-01):** `presentation` (`app/`) → `application` (use-case services) → `domain` (pure logic) → `infrastructure` (adapters).
- **Adapters behind interfaces (NFR-MNT-02):** notification, storage, payment — so v2 can swap UltraMsg → Business API and add Paymob without app-code changes.
- **Feature flags (NFR-MNT-03):** v2 features OFF in v1, gated by env vars (see `.env.example`).
- **Permissions (§8 Permissions Matrix):** simple role-min checks live in `src/lib/rbac.ts`; conditional rules ("Coach can view medical records of OWN primary trainees only") live in application services.
- **Financial invariant (§10.3):** every split-amount set must sum to 100% of the post-discount net within ±1 piastre — enforced in `split-engine.ts` and unit-tested against the 6 worked examples.

## SRS traceability

Every functional requirement in the SRS has an `FR-*` ID; non-functional ones use `NFR-*`. When implementing, cite the ID in code comments and commit messages so requirements remain auditable. Example: `// FR-FIN-01: default 12 sessions/month`.

Open items still requiring Captain Saied's input before launch are listed in SRS §14.2 (subscription pricing per location/discipline, family discount policy, private session rates, exam/championship fee schedules, merchandise catalog, gateway/email/host provider choices, domain + brand assets, privacy policy & ToU).
