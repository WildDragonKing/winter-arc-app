# GitHub Copilot Instructions - Winter Arc App

⚠️ **IMPORTANT**: This file is synchronized with `claude.md` (root). Both files must stay in sync.

**When updating this file:**
- Critical changes → also update `claude.md`
- Policy changes (Security, Dependencies, Branch Naming) → sync to both files
- Keep this file concise (quick-ref); `claude.md` remains detailed (comprehensive guide)

---

## Project Overview

Winter Arc is a Progressive Web App (PWA) for fitness tracking with push-ups, sports, nutrition, and weight management. Built with Next.js 16 + React 19 + TypeScript + PostgreSQL (Vercel Postgres/Neon).

## Mandatory Branch Naming

Format: `<username>/<type>-<description>` (e.g., `lbuettge/feature-dashboard`)

- Types: `feature`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`
- NEVER push directly to `main` or `develop` (protected branches require PR)

## Architecture Patterns

### State Management

- **Global State**: Zustand store (`app/store/useStore.ts`)
- **API Sync**: Auto-sync via `useAuth` and `useTracking` hooks with 1s debounce
- **Data Flow**: UI → Hooks → Zustand → PostgreSQL API (polling updates store every 30s)

### Component Structure

- **Tiles**: Reusable tracking components (`PushupTile`, `WaterTile`, etc.)
- **Modals**: MANDATORY use `AppModal` component (in `app/components/ui/AppModal.tsx`) for all dialogs
- **Pages**: Route-level components in `app/` directory (Next.js App Router)
- **Lazy Loading**: Next.js automatic code splitting + `React.lazy()` for dynamic imports

### Database Integration

**PostgreSQL Schema (Drizzle ORM):**

```
users → { id, email, nickname, gender, height, weight, maxPushups, groupCode, pushupState }
tracking_entries → { id, userId, date, pushups, sports, water, protein, weight, completed }
groups → { id, code, name, members[], createdAt }
```

**API Routes:**

- `app/api/auth/[...nextauth]/route.ts` - NextAuth authentication handler
- `app/api/users/[id]/route.ts` - User CRUD operations
- `app/api/tracking/[date]/route.ts` - Tracking data by date
- `app/api/groups/[code]/route.ts` - Group management

**Security:**

- NextAuth with JWT sessions
- Server-side session validation
- API routes: users read/write own data only

## Code Quality (Pre-commit/Push Hooks)

**Pre-commit:** TypeScript + ESLint + Secret Scanning (fix every warning before committing)
**Pre-push:** TypeScript + ESLint + Tests + `vercel build` + Branch Name Validation (no skipped steps)

**Coverage Requirements:**

- Unit tests: ≥80% (Vitest with v8 coverage)
- Branch coverage: ≥78%

**Common Fixes:**

- Replace `any` with proper types (import from `src/types/`)
- Remove unused imports or prefix with `_`
- No `console.*` in production (use logger or remove)
- Extract magic numbers to constants

## Dependency Policy

Keep dependencies current and transparent. Never suppress warnings. Treat vulnerabilities as immediate priorities.

**Quick Rules:**

- Prefer latest stable (non-beta) versions
- Never suppress warnings (deprecated, vulnerabilities, peer conflicts)
- Remove unused packages proactively (`depcheck`, `knip`)
- Adapt code to dependencies, not vice versa
- For major infrastructure upgrades (Next.js, React, TypeScript), ask user first

**Upgrade Workflow:** depcheck/knip → upgrade → test:all → fix code → document

**📘 See [CONTRIBUTING.md - Dependency Management](../CONTRIBUTING.md#dependency-management) for:**

- Complete 5-step upgrade workflow
- Security remediation procedures (SLAs, forbidden practices)
- Infrastructure upgrade request template
- Decision tracking format (`docs/DECISIONS.md`)
- Integration with CI/CD

## Security First Policy (PRIO #1)

Every vulnerability is triaged immediately with strict SLAs.

**Response Times:**

- Critical/High: Same day or next business day
- Moderate: Within 7 days
- Low: Within 14 days

**Target: Zero open High/Critical vulnerabilities**

**Forbidden:**

- Disabling `npm audit` or using ignore lists without time limits
- Using `overrides` to force vulnerable versions
- Postponing security patches

**📘 See [CONTRIBUTING.md - Dependency Management](../CONTRIBUTING.md#dependency-management) for:**

- Detailed remediation workflow
- Acceptable temporary exceptions (max 30 days)
- Metrics and transparency requirements
- Decision tracking in `docs/DECISIONS.md`

## Critical Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:3000)

# Database
npm run db:push                # Push schema to database
npm run db:studio              # Open Drizzle Studio (GUI)
npm run db:generate            # Generate migrations
npm run db:migrate             # Run migrations

# Quality Checks (run before committing)
npm run lint                   # ESLint
npm run typecheck              # TypeScript strict mode
npm run vercel:build           # Vercel production build (fails if linking/CLI is broken)
npm test                       # Vitest unit tests
npm run test:all               # All checks (lint + typecheck + test + build)

```

## Environment Variables

**Required:**

- `DATABASE_URL` - PostgreSQL connection string (Vercel Postgres/Neon)
- `NEXTAUTH_SECRET` - NextAuth session encryption key
- `NEXTAUTH_URL` - Application URL (http://localhost:3000 for dev)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

**Optional:**

- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking
- `GEMINI_API_KEY` - AI-powered smart notes (server-side)

**1Password Integration:** Use `op run --env-file=.env.1password.production -- npm run dev` for secrets management.

## Testing Strategy

**Unit Tests:** Vitest (`app/**/__tests__/`)

- Drizzle / Datenbank-Layer mocken mit `vi.mock('@/lib/db')` oder spezifische Query-Funktionen isolieren
- Optional: In-Memory SQLite Schema über Drizzle für realistischere Query-Tests (schnell, kein Netzwerk)
- `src/test/test-utils.tsx` für React-Komponententests (Provider / Zustand / i18n)
- Keine Firebase-Emulatoren mehr – Fokus auf Postgres API & Hooks

**E2E Tests:** Playwright (`tests/e2e/`)

- Follow Given-When-Then pattern
- Use `data-testid` attributes for selectors
- Auth: NextAuth Session Flows mocken (z.B. vor Login Page Snapshot, nach Login Zustand prüfen)

## Performance

**Bundle Budget:** <600KB main chunk
**Lighthouse Target:** ≥95 (alle Kernmetriken)
**Optimierung:**

- Lazy Loading großer Komponenten mit `React.lazy()` / Dynamic Imports
- Automatisches Code-Splitting durch Next.js + manuelle Splits bei schweren Charts
- Service Worker Caching: Network-first für `/api/` JSON; Cache-first für statische Assets; Stale-While-Revalidate für Icons / Manifest
- Reduziertes Netzvolumen durch differenziertes Speichern geänderter Tracking-Tage (Diff-Strategie in Hooks)
- Zustandshydration minimieren (nur notwendige Slices laden)

## PWA Features

- Offline-first via eigenem Service Worker (`public/sw.js`)
- Install Prompts für iOS/Android
- Background Sync für Tracking-/Statistik-Endpunkte (~24h Retention, Retry + Backoff geplant)
- Konfigurierbare Basis-URL für API Requests im SW statt Hardcode

## Deployment

**Three environments:** Production (`main` → `app.winterarc.newrealm.de`), Staging (`develop` → `staging.winterarc.newrealm.de`), PR Previews (`staging.winterarc.newrealm.de/pr-<num>/`)

Workflows in `.github/workflows/`: `deploy-prod.yml`, `deploy-staging.yml`, `pr-preview.yml`

## Common Patterns

**Import aliases:** Use `@/` prefix (e.g., `import { useAuth } from '@/hooks/useAuth'`)

**Modal usage:**

```tsx
<AppModal
  open={isOpen}
  onClose={handleClose}
  title="Title"
  icon={<span>🔥</span>}
>
  <div>Modal content</div>
</AppModal>
```

**Tracking data save:**

```tsx
const { tracking, setTracking } = useStore();
setTracking({ ...tracking, water: 2000 }); // Auto-saves (debounced ~1s) via PostgreSQL API PATCH/PUT nur für geänderte Tage
```

**Authentication check:**

```tsx
const { user, loading } = useAuth();
if (loading) return <Skeleton />;
if (!user) return <LoginPage />;
```

## Agent System

Specialized agents in `.agent/` for quality gates:

- **UI-Refactor** - Glass design, mobile-first
- **PWA/Performance** - Lighthouse ≥90, Bundle <600KB
- **Test/Guard** - Coverage ≥70%
- **Docs/Changelog** - Documentation updates

See `.agent/policies.md` for triggers and workflows.
