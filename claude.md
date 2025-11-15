# Winter Arc App - Development Guide

⚠️ **IMPORTANT**: This file is synchronized with `.github/copilot-instructions.md`. Both files must stay in sync.

**When updating this file:**

- Critical policy changes (Security, Dependencies, Branch Naming, Documentation) → also update `copilot-instructions.md`
- Keep this file detailed (comprehensive guide); `copilot-instructions.md` remains concise (quick-ref)

---

A German-language Progressive Web App (PWA) for fitness tracking during winter. **Philosophy**: "Jeder Tag zählt: Tracken, sehen, dranbleiben" (Every day counts: Track, see, stick with it).

---

## 1. Project Overview

**Winter Arc** tracks daily fitness metrics (push-ups, weight, hydration, nutrition) with community motivation via groups and leaderboards. Built with modern standards: offline-first architecture, service worker caching, minimal UI focused on streaks and progress.

- **Current Version**: v0.1.3
- **Stack**: Next.js 16 + React 19 + TypeScript + Vercel Postgres (Neon) + NextAuth
- **Architecture**: Next.js App Router (server components default), type-safe with Drizzle ORM
- **Language**: German-first (i18n ready)

---

## 2. Technology Stack

### Frontend

- **Next.js 16.0.1** - App Router (server components by default)
- **React 19.2.0** - Server & client components
- **TypeScript 5.9.3** - Strict mode with `noUncheckedIndexedAccess: true`
- **Tailwind CSS 3.4.17** - Custom winter/primary color palette, dark mode
- **Zustand 5.0.8** - Client-side state management

### Backend & Database

- **Vercel Postgres / Neon** - PostgreSQL database via `@neondatabase/serverless`
- **Drizzle ORM 0.44.7** - Type-safe queries, schema-first
- **NextAuth 4.24.13** - Authentication (Google OAuth provider)

### Storage & Caching

- **Dexie.js 4.2.1** - IndexedDB for offline tracking
- **Service Worker** - App shell caching, background sync
- **localStorage** - Dark mode, filter preferences

### Utilities & Libraries

- **date-fns 4.1.0** - Date manipulation (YYYY-MM-DD format)
- **recharts 3.2.1** - Training load graphs
- **lucide-react 0.545.0** - Icons
- **uuid 13.0.0** - UUID generation

### Monitoring & Analytics

- **@vercel/analytics** - Web analytics
- **@vercel/speed-insights** - Performance monitoring
- **@sentry/react** - Error tracking (optional)

### Testing

- **Vitest 3.2.4** - Unit tests with v8 coverage
- **Playwright 1.56.0** - E2E tests
- **Testing Library** - React component testing

---

## 3. Architecture & Patterns

### Directory Structure

```
winter-arc-app/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages
│   ├── (dashboard)/         # Protected user pages
│   ├── api/                 # API routes
│   ├── components/          # Page components
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand stores
│   ├── services/            # Business logic
│   ├── types/               # App-level types
│   ├── constants/           # Constants & config
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # Shared root components
├── lib/
│   ├── auth.ts              # NextAuth config
│   ├── db/
│   │   ├── index.ts         # Database client
│   │   └── schema.ts        # Drizzle schema
│   └── utils/               # Helpers
├── public/
│   └── sw.js                # Service worker
├── types/
│   └── next-auth.d.ts       # NextAuth extensions
└── docs/
```

### Component Patterns

#### Server Components (Default)

```typescript
// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  if (!db) throw new Error("Database unavailable");
  const userData = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return <div>{userData[0]?.nickname}</div>;
}
```

#### Client Components

```typescript
"use client";

import { useStore } from "@/app/store/useStore";
import { useAuth } from "@/app/hooks/useAuth";

export function InteractiveComponent() {
  const user = useStore((state) => state.user);
  const { session, loading } = useAuth();

  if (loading) return <Skeleton />;
  if (!user) return <LoginPage />;

  return <div>{user.nickname}</div>;
}
```

### API Route Pattern

```typescript
// app/api/tracking/[date]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tracking_entries, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  // Step 1: Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2: Database check
  if (!db) {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 }
    );
  }
  const database = db; // Type narrowing

  // Step 3: Validate input
  const body = await request.json();
  if (!params.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Step 4: Database operation
  try {
    const result = await database
      .update(tracking_entries)
      .set(body)
      .where(
        and(
          eq(tracking_entries.userId, session.user.id),
          eq(tracking_entries.date, params.date)
        )
      )
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Tracking update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### State Management (Zustand)

```typescript
// app/store/useStore.ts
import { create } from "zustand";

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // Tracking data (organized by date: YYYY-MM-DD)
  tracking: Record<string, DailyTracking>;
  updateDayTracking: (date: string, data: Partial<DailyTracking>) => void;

  // UI state
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  tracking: {},
  updateDayTracking: (date, data) =>
    set((state) => ({
      tracking: {
        ...state.tracking,
        [date]: { ...state.tracking[date], ...data },
      },
    })),

  darkMode: getInitialDarkMode(),
  toggleDarkMode: () =>
    set((state) => {
      const newDarkMode = !state.darkMode;
      localStorage.setItem("darkMode", JSON.stringify(newDarkMode));
      return { darkMode: newDarkMode };
    }),
}));
```

---

## 4. Database Schema

### Users Table

```typescript
users: {
  id: UUID (PK)
  email: TEXT UNIQUE
  nickname: TEXT                // Display name (required for onboarding)
  gender: TEXT                  // 'm' | 'f' | 'o'
  height: INTEGER               // cm
  weight: DECIMAL               // kg
  maxPushups: INTEGER          // Personal record
  groupCode: TEXT | NULL       // Group membership
  pushupState: JSONB           // Base & Bump algorithm state
  language: TEXT               // 'de' | 'en' (default: 'de')
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

### Tracking Entries Table

```typescript
tracking_entries: {
  id: UUID (PK)
  userId: UUID (FK → users.id)
  date: TEXT                    // YYYY-MM-DD format
  pushups: JSONB | NULL        // { total, workout }
  sports: JSONB | NULL         // Duration, intensity
  water: INTEGER               // ml
  protein: INTEGER             // grams
  weight: DECIMAL | NULL       // kg
  completed: BOOLEAN
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

### Groups Table

```typescript
groups: {
  id: UUID (PK)
  code: TEXT UNIQUE            // Join code (e.g., 'WINTER24')
  name: TEXT
  members: JSONB               // Array of user IDs
}
```

**CRITICAL**: All dates use `YYYY-MM-DD` string format for consistency.

---

## 5. Authentication Flow

### NextAuth Configuration

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-orm";
import { db } from "./db";

export const { auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db!),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: { signIn: "/auth/signin" },
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.nickname = token.nickname;
        session.user.groupCode = token.groupCode;
      }
      return session;
    },
  },
});
```

### Session Type Extension

```typescript
// types/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      nickname: string | null;
      groupCode: string | null;
      image: string | null;
    };
  }
}
```

### Using Auth

**Server Component:**

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Protected() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  return <div>Welcome {session.user.nickname}</div>;
}
```

**Client Component:**

```typescript
"use client";
import { useAuth } from "@/app/hooks/useAuth";

export function Profile() {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <Unauthorized />;
  return <div>{session.user.nickname}</div>;
}
```

---

## 6. Key Features & Components

### Daily Tracking Tiles

#### Push-ups

- Tracks repetitions with Base & Bump algorithm
- Adaptive progression based on workout outcomes
- Shows current target and daily progress

#### Weight

- Daily logging (kg) with optional body fat %
- Automatic BMI calculation: `weight / (height/100)²`
- Trend indicators

#### Hydration

- Water intake tracking (ml)
- Customizable drink presets
- Daily goal progress (default 2L)

#### Nutrition

- Protein tracking (grams)
- Optional calories, carbs, fats
- Goal-based indicators

### Training Load Calculation

```typescript
// app/services/trainingLoad.ts
export function computeDailyTrainingLoadV1(params: {
  workouts: Workout[]; // { durationMinutes, intensity }
  pushupsReps: number;
  sleepScore: number; // 0-10
  recoveryScore: number; // 0-10
  sick: boolean;
}): TrainingLoadResult;

// Returns: { load: 0-1000, components: {...} }
```

### Groups & Leaderboard

- Join via 4-6 character group code
- View member aggregated stats
- Leaderboard filters: week / month / all-time
- Public rankings, private tracking data
- API: `GET /api/groups/[code]`

### PWA & Offline Support

- Service Worker caches app shell + assets
- IndexedDB (Dexie) for offline tracking
- Background sync on reconnection
- Install prompt via `BeforeInstallPromptEvent`
- Manifest: `app/manifest.ts`

---

## 7. Critical Guidelines

### Database Safety (🔴 CRITICAL)

**ALWAYS check database availability before queries:**

```typescript
if (!db) {
  // For API routes: return 503
  return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  // For server components: throw error
  throw new Error("Database unavailable");
}
const database = db; // Type narrowing after null check
```

**Why?** Database may be null during build time or when connection is unavailable.

### Date Format Convention

- **Always use `YYYY-MM-DD` string format** for dates in tracking
- Use `date-fns` for parsing: `format(new Date(), 'yyyy-MM-dd')`
- Database stores as TEXT in this format

### Environment Variables

**Required:**

```bash
DATABASE_URL="postgresql://..."              # Vercel Postgres / Neon
NEXTAUTH_SECRET="..."                        # Random key for JWT
NEXTAUTH_URL="http://localhost:3000"         # App URL
GOOGLE_CLIENT_ID="..."                       # OAuth client ID
GOOGLE_CLIENT_SECRET="..."                   # OAuth secret
```

**Optional:**

```bash
GEMINI_API_KEY="..."                         # Smart notes AI (server-side)
NEXT_PUBLIC_SENTRY_DSN="..."                 # Error tracking
```

### Type Safety

- **`noUncheckedIndexedAccess: true`** in tsconfig
- Array access returns `T | undefined`, not just `T`
- **Always check array bounds:**

```typescript
const first = array[0];
if (first) {
  // Type is narrowed to T here
}
```

### Dependency Policy

Keep the dependency tree healthy and transparent. Always prefer latest stable versions, never suppress warnings, and treat security vulnerabilities as immediate priorities.

**Core principles:**

- Prefer latest stable (non-beta) versions
- Never suppress or hide dependency warnings
- Remove unused packages proactively (`depcheck`, `knip`)
- Adapt code to dependencies, not vice versa

**For major infrastructure upgrades** (Next.js, React, TypeScript major versions), always ask user before proceeding.

**Quick reference commands:**

```bash
# Check for unused dependencies
npx depcheck && npx knip

# Upgrade package
npm install <package>@latest

# Run all checks
npm run test:all

# Security audit
npm audit
```

**See [CONTRIBUTING.md - Dependency Management](CONTRIBUTING.md#dependency-management) for complete policies including upgrade workflow, security remediation, and infrastructure upgrade templates.**

### Security First Policy (PRIO #1)

Security is paramount—every vulnerability is triaged immediately with strict SLAs.

**Response times:**

- Critical/High: Same day or next business day
- Moderate: Within 7 days
- Low: Within 14 days

Target: **Zero open High/Critical vulnerabilities**

**Remediation workflow:** See [CONTRIBUTING.md - Dependency Management](CONTRIBUTING.md#dependency-management) for detailed procedures, forbidden practices, and acceptable exceptions.

### Documentation Policy

**Principle:** Documentation is not optional—it is a first-class maintenance artifact. Documentation must be consolidated, not duplicated.

**When to Create `.md` Files:**

- **Only when necessary:** Create `.md` files for:
  - Architectural decisions affecting multiple systems (e.g., `docs/training-load.md`)
  - Setup instructions for complex integrations (e.g., `docs/1PASSWORD.md`)
  - Runbooks or troubleshooting guides for common issues
  - DO NOT create ad-hoc docs for single features; inline code comments and tests are sufficient

- **Avoid documentation bloat:**
  - No `.md` file needed for single-file features or minor bug fixes
  - Prefer JSDoc comments in code over standalone guides for simple APIs
  - Keep prose documentation concise; let tests and examples be your primary spec

**Knowledge Consolidation Principles:**

- **Single source of truth:** Each topic should have ONE comprehensive document, not multiple overlapping files
- **No duplication:** Quick-refs must link to comprehensive docs, not duplicate content
- **File size limit:** Maximum 800 lines per document (split into logical sub-documents if exceeded)
- **Consolidation reviews:** Quarterly reviews to identify and merge redundant documentation
- **Cross-reference audit:** Before merging docs PRs, verify no duplicate files exist in other directories

**When Features Change, Update Related Documentation:**

Critical: If a feature changes, ALL related `.md` documentation MUST be updated in the same PR. This includes:

- Architecture decisions in `docs/` (if affected)
- Synchronization notes at the top of this file (for policy changes)
- This file's relevant section if patterns change
- Inline code examples that no longer reflect reality

**Why?** Stale documentation is worse than no documentation—it misleads developers and breaks trust. Treat docs as tests: if code changes and docs don't, that's a failure.

**Workflow:**

1. Identify all `.md` files that reference the changed feature (use Grep)
2. Update them in the same commit as the feature change
3. Add a note in your PR: "Updated docs: [file1], [file2], …"
4. For policy changes (Section 7 items): also update `.github/copilot-instructions.md` per line 3-7

**Archival Rules:**

When to archive documentation to `docs/archive/`:

- **Migration guides** - Archive when migration is complete (add "HISTORICAL" header with completion date)
- **Generated reports** - Archive after 3 months (hygiene reports, bundle analysis, code reviews)
- **Outdated runbooks** - Archive when process changes (keep for historical reference)
- **Deprecated features** - Archive feature docs when feature is removed from codebase
- **Age-based** - `.md` files older than 6 months without updates are candidates for archival

**Archive Location & Naming:**

```
docs/archive/<category>/<filename>-<YYYY-MM-DD>.md
```

Examples:

- `docs/archive/migrations/backend-quickstart-vite-2024-10.md`
- `docs/archive/reports/hygiene-report-2025-10-03.md`
- `docs/archive/features/firebase-integration-2024-09.md`

**Archive Header Format:**

```markdown
# [HISTORICAL - <Completion Date>] <Original Title>

> **Archived:** <YYYY-MM-DD>
> **Reason:** <Migration complete | Process changed | Feature removed | Report outdated>
> **See current docs:** [link to current documentation if applicable]

---

<original content>
```

**Governance & Hygiene:**

- **Monthly hygiene check:** `git log --since="6 months ago" -- docs/` to spot stale files
- **Quarterly consolidation review:** Identify redundant files and merge into single sources of truth
- **Automated checks:** Run `npm run docs:check` to detect:
  - Duplicate content across files
  - Broken internal links
  - References to archived/deleted files
  - Files exceeding 800 lines
  - Files unchanged for >6 months

---

## 8. Development Workflow

### Branch Naming (Enforced by Husky)

Format: `<username>/<type>-<description>`

Valid types: `feature`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`

Examples:

- ✅ `lars/feature-dashboard-redesign`
- ✅ `niklas/fix-login-race-condition`
- ❌ `feature/new-dashboard` (missing username)

### Commit Message Convention

```
<type>(<scope>): <subject>

<body - optional>

Examples:
feat(tracking): add bulk import API endpoint
fix(auth): resolve session expiration race condition
chore(deps): upgrade Next.js to 16.0.1
```

### PR Workflow

1. Create feature branch from `develop`
2. Run checks before pushing:
   ```bash
   npm run lint        # ESLint validation
   npm run typecheck   # TypeScript strict checks
   npm run vercel:build # Vercel build verification
   npm run test:all    # Full test suite
   ```
3. Push to remote and create PR
4. Husky pre-push validates branch naming
5. Await code review before merge

### Key Scripts

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Run production build
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix lint issues
npm run typecheck        # TypeScript strict check
npm run vercel:build     # Vercel build verification
npm run test:all         # All checks (lint + typecheck + test + build)
npm run test:unit        # Unit tests only
npm run db:studio        # Drizzle Studio GUI
npm run db:push          # Push schema to database
```

---

## 9. File Organization & Path Aliases

All imports use `@/` prefix:

```typescript
import { db } from "@/lib/db";
import { useStore } from "@/app/store/useStore";
import { PushupTile } from "@/components/PushupTile";
import { auth } from "@/lib/auth";
```

### Key Files

| File                           | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| `lib/auth.ts`                  | NextAuth setup and session handling        |
| `lib/db/schema.ts`             | Drizzle table definitions and type exports |
| `lib/db/index.ts`              | Database client export (null-checked)      |
| `app/store/useStore.ts`        | Zustand store (user, tracking, UI state)   |
| `app/hooks/useAuth.ts`         | Session/auth hook for client components    |
| `app/services/trainingLoad.ts` | Training load calculation logic            |
| `app/types/index.ts`           | App-level TypeScript interfaces            |

---

## 10. Testing Guidelines

### Unit Tests (Vitest)

```typescript
// Format: filename.test.ts or filename.spec.ts
// Location: Same directory as source file

import { describe, it, expect } from "vitest";
import { computeDailyTrainingLoadV1 } from "./trainingLoad";

describe("Training Load", () => {
  it("computes load from workouts and pushups", () => {
    const result = computeDailyTrainingLoadV1({
      workouts: [{ durationMinutes: 30, intensity: 7 }],
      pushupsReps: 50,
      sleepScore: 7,
      recoveryScore: 8,
      sick: false,
    });

    expect(result.load).toBeGreaterThan(0);
    expect(result.load).toBeLessThanOrEqual(1000);
  });
});
```

### E2E Tests (Playwright)

Follow Given-When-Then pattern with `data-testid` attributes:

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test("user can sign in with Google", async ({ page }) => {
  // Given: user is on login page
  await page.goto("/auth/signin");

  // When: user clicks Google OAuth button
  await page.click('[data-testid="google-signin-button"]');

  // Then: redirected to dashboard
  await expect(page).toHaveURL("/dashboard");
});
```

### Coverage Goals

- Business logic: ≥80%
- Hooks/Services: ≥70%
- Components: ≥50%
- Branch coverage: ≥78%

---

## 11. Performance & Best Practices

### Server vs Client Components

- Default to server components for data fetching
- Use client components only when needed (hooks, interactivity)
- Avoids unnecessary JavaScript shipped to client

### Image Optimization

- Use Next.js `next/image` component
- Specify `width` and `height` for static images
- Use `priority` prop for above-the-fold images

### Dynamic Imports

- Use for heavy libraries (Recharts, visualizations)
- Example: `const Chart = dynamic(() => import('@/components/Chart'))`

### Caching Strategy

- **HTTP headers**: Set in `next.config.js`
- **Service Worker**: Caches app shell + critical assets
- **IndexedDB**: Tracking data persistence
- **localStorage**: UI state (dark mode, filters)

### Bundle Budget

- **Main chunk**: <600KB
- **Lighthouse target**: ≥95 on all metrics

---

## 12. Deployment

### Three Environments

| Environment | Branch           | URL                           | Purpose          |
| ----------- | ---------------- | ----------------------------- | ---------------- |
| Production  | `main`           | app.winterarc.newrealm.de     | Live users       |
| Staging     | `develop`        | staging.winterarc.newrealm.de | QA + previews    |
| PR Previews | Feature branches | pr-<num> subdomain            | Review + testing |

### Vercel Workflows

- `.github/workflows/deploy-prod.yml` - Deploys `main`
- `.github/workflows/deploy-staging.yml` - Deploys `develop`
- `.github/workflows/pr-preview.yml` - Auto-deploys PRs

---

## 13. Common Patterns

### Modal Usage (AppModal)

```tsx
import { AppModal } from "@/components/ui/AppModal";

<AppModal
  open={isOpen}
  onClose={handleClose}
  title="Title"
  icon={<span>🔥</span>}
>
  <div>Modal content</div>
</AppModal>;
```

### Tracking Data Updates

```tsx
const { tracking, updateDayTracking } = useStore((state) => ({
  tracking: state.tracking,
  updateDayTracking: state.updateDayTracking,
}));

// Auto-saves via debounced PostgreSQL PATCH
updateDayTracking("2025-11-15", { water: 2000 });
```

### Authentication Check in Client Component

```tsx
"use client";
import { useAuth } from "@/app/hooks/useAuth";

export function Protected() {
  const { user, loading } = useAuth();

  if (loading) return <Skeleton />;
  if (!user) return <LoginPage />;

  return <div>Welcome {user.nickname}</div>;
}
```

---

## 14. Resources & Quick Reference

### Adding a New Tracking Metric

1. Add field to `tracking_entries` schema in `lib/db/schema.ts`
2. Create Tile component in `app/components/`
3. Add to Zustand store in `app/store/useStore.ts`
4. Create API endpoint in `app/api/tracking/[date]/route.ts`
5. Add to `DailyTracking` interface in `app/types/index.ts`

### Creating a New Page

1. Create file in `app/` or `app/(dashboard)/` (App Router pattern)
2. For protected pages: `await auth()` server-side check
3. Use `<Suspense>` for async data boundaries
4. Add to navigation component

### Adding a New API Endpoint

1. Create `app/api/resource/route.ts`
2. Check auth: `await auth()`
3. Check database: `if (!db) return 503`
4. Use Drizzle for queries
5. Return `NextResponse.json(data)`

### Updating Database Schema

1. Modify `lib/db/schema.ts`
2. Create migration in Neon/Vercel dashboard
3. Test locally with updated `DATABASE_URL`
4. Verify API routes still work

---

## 15. Known Issues & Limitations

- **Build-time**: Database is null during `next build`. All API routes and server components must check `if (!db)`.
- **Date format**: Always `YYYY-MM-DD`. Inconsistent formats cause filtering bugs.
- **Session hydration**: Client components need `useAuth()` hook, not direct NextAuth import.
- **TypeScript strict**: `noUncheckedIndexedAccess` requires bounds checking on all array access.

---

## Next Steps

- See [CONTRIBUTING.md](CONTRIBUTING.md) for contributor guidelines, branch naming, PR workflow, and Next.js patterns
- See [docs/training-load.md](docs/training-load.md) for training load algorithm details
- See [docs/1PASSWORD.md](docs/1PASSWORD.md) for secrets management with 1Password
- See [docs/SECURITY_INCIDENT_RESPONSE.md](docs/SECURITY_INCIDENT_RESPONSE.md) for security incident procedures
