# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### � Planned
- Noch keine neuen Änderungen nach `0.1.3` geplant.

---

## [0.1.3] - 2025-11-09

### 📚 Documentation / DX
- README Transformation: Umgestaltung von rein technischen Entwickler-Dokumenten hin zu einer nutzerorientierten, einsteigerfreundlichen Präsentation (Ziel: klarer Nutzen & schneller Einstieg).
  - Vereinfachte Einstiegsschritte (Setup + erste Tracking-Aktion)
  - Prominente Feature-Übersicht (Pushups, Hydration, Protein, Gewicht, Gruppen)
  - Klarer Abschnitt zu Sicherheit & Datenschutz basierend auf Neon/Vercel Postgres + NextAuth
  - Konsolidierung verteilter Architekturhinweise in kompakte Übersicht
  - Visuelle Strukturierung: Abschnitte für Kernfeatures, Erweiterte Funktionen (Smart Notes, Training Load), Performance & PWA
- Changelog Hygiene: Einträge strukturiert, zukünftige Platzhalter für Security-Sektion vorbereitet

### 🧩 Code Health
- Start weiterer TypeScript Strict-Härtung: Defensive Guards (Matrix-Initialisierung in `foodSearch.ts`), Vorbereitung für Eliminierung verbleibender `noUncheckedIndexedAccess` Fehler.
- SemVer Patch Bump zur sauberen Abgrenzung gegenüber vorheriger produktiver Dokumentationsbasis.

### 🔐 Security
- Keine neuen sicherheitsrelevanten Änderungen; weiterhin Einhaltung Policy (siehe `SECURITY.md`).

### ♻️ Maintenance
- Version erhöht (`package.json` 0.1.2 → 0.1.3) + Tag-Vorbereitung.
- Release-Vorbereitung für GitHub (Tag + Release Notes generierbar aus diesem Abschnitt).

### ✅ Verification
- Lint/Typecheck laufen (ausstehende bekannte Strict-Fehler werden in Folgerelease adressiert – siehe offene TODOs).

---

### �🐛 Fixed
- **Training Load Stability Issues**: Major refactor to fix race conditions, improve responsiveness, and reduce latency
  - **Eliminated Race Conditions**: Removed optimistic UI updates in favor of single source of truth (Firestore subscription)
  - **Week-Wide Subscription**: Training load graph now subscribes to all 7 days of the week for real-time updates (was previously only 1 day)
  - **Fixed Pushup Calculation**: Corrected pushup load formula to include pushups in base calculation (not as capped adjustment)
  - **Reduced Check-in Latency**: Removed heavy weekly aggregation from check-in save path, reducing save time from 2-3s to <1s
  - **Added Retry Logic**: Check-in saves now retry up to 3 times with exponential backoff (1s, 2s, 4s) for better reliability
  - **Performance Improvements**: Firestore read operations reduced by ~60% (fewer weekly aggregation queries)
  - New files:
    - `src/utils/retry.ts` - Exponential backoff retry utility with Sentry logging
    - `src/utils/retry.test.ts` - Comprehensive unit tests for retry logic
    - `src/hooks/useWeeklyTrainingLoadSubscription.ts` - Week-wide Firestore subscription hook
  - Modified files:
    - `src/services/trainingLoad.ts` - Fixed pushup calculation in `computeDailyTrainingLoadV1`
    - `src/services/checkin.ts` - Removed weekly aggregation, simplified to 2 writes only
    - `src/components/checkin/CheckInModal.tsx` - Removed optimistic updates, added retry logic
    - `src/components/UnifiedTrainingCard.tsx` - Integrated week-wide subscription hook

---

## [0.1.2] - 2025-10-10

### 🔥 Critical Fixes
- **CI/CD Deployment Triggers**: Fixed staging and production deployment workflows to trigger correctly on branch pushes
  - Updated `deploy-staging.yml` to explicitly checkout `develop` branch
  - Updated `deploy-production.yml` to explicitly checkout `main` branch
  - Fixed `workflow_run` trigger dependency to use workflow files from default branch
- **Firestore Rules**: Fixed subcollection access for `users/{uid}/checkins/{date}`, `users/{uid}/trainingLoad/{date}`, and `tracking/{userId}/entries/{date}` with wildcard rules
- **Auth Race Conditions**: Added `waitForAuth()` guard in `App.tsx` to prevent Firestore reads before auth is ready

### ✨ Added
- **Branch Naming Convention Enforcement**: Automated validation system for consistent branch naming
  - **Pattern**: `<username>/<type>-<description>` (e.g., `lars/feature-dashboard`, `niklas/fix-login-bug`)
  - **Valid types**: `feature`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`
  - **GitHub Actions Workflow** (`.github/workflows/validate-branch.yml`):
    - Validates branch names on push and pull requests
    - Detects and warns about legacy branches not following convention
    - Enforces PRs to target `develop` (not `main`)
  - **Husky Pre-Push Hook** (`.husky/pre-push`): Local validation with helpful error messages and rename instructions
  - **Branch Protection Script** (`scripts/apply-branch-protection.sh`): Updated documentation with naming convention guidelines
- **Firestore Consistency Check**: Comprehensive validation script (`scripts/consistency-check.mjs`) for data integrity
  - Migration status validation (days → entries)
  - Streak calculation with new weighted logic (70% threshold)
  - Triple-storage synchronization check (entries/checkins/trainingLoad)
  - Schema validation against TypeScript types
  - Week aggregation accuracy verification
  - Group membership integrity validation
  - JSON + log file export for detailed reports
  - npm scripts: `npm run check:consistency`, `npm run check:consistency:fix`
  - Documentation: `docs/consistency-check.md`, `scripts/README.md`
- Profile picture management: Google avatars are uploaded to Firebase Storage during onboarding, users can replace them with custom uploads, and sharing preferences are configurable in-app. Updated Firebase Storage rules restrict access to shared photos.
- `/clean` slash command for repository cleanup with confidence-based deletion and dry-run support
- `/maintenance` slash command for orchestrating comprehensive repository maintenance tasks
- Claude Code slash commands for agent workflows (UI-Refactor, PWA/Performance, Test/Guard, Docs/Changelog)
- **Training Load Revamp**: Activity tracking with check-in presets and live preview
- **Git-Flow Enforcement**: GitHub Actions workflow for branch protection
- **Auth-Flow Improvements**: New `src/firebase/auth.ts` with automatic popup (dev) / redirect (prod) selection to avoid COOP window.close() errors
- **E2E Tests**: Comprehensive check-in flow tests (`tests/e2e/checkin.spec.ts`)
- **Unified Modal System**: New `AppModal` component (`src/components/ui/AppModal.tsx`) with consistent design, accessibility (A11y), and theme support

### 🎨 Changed
- **UI/UX Modernization (2025-10-10)**:
  - Removed all glassmorphism effects (backdrop-blur) from components - replaced with solid opaque backgrounds
  - Updated BottomNav (Layout.tsx) to use solid `bg-white dark:bg-gray-900` backgrounds
  - Migrated all toast notifications to opaque backgrounds (ToastProvider.tsx)
  - Fixed LeaderboardPage stat cards with theme-aware solid backgrounds
  - Updated OnboardingPage language selection to remove backdrop-blur
  - All modal overlays now use consistent z-index system (`var(--z-overlay)`, `var(--z-modal)`)
- **Layout & Spacing (2025-10-10)**:
  - Removed double padding from Layout.tsx main element (was causing bottom content clipping)
  - Increased bottom padding on all pages from `pb-20` (80px) to `pb-32` (128px) for better BottomNav clearance
  - Updated DashboardPage, LeaderboardPage, NotesPage, SettingsPage, OnboardingPage, PushupTrainingPage
- Reduce the streak completion threshold to 50% daily fulfillment to make progress streaks more attainable.
- Upgrade the web client to React 19, Vite 7, and the latest Firebase/Sentry stack while adopting `useActionState`/`useOptimistic` on the Notes page for immediate feedback during smart note submissions.
- Refactor Sentry integration with centralized service for improved error tracking
- Migrate ESLint configuration from `.eslintignore` to `eslint.config.js` (ESLint 9 compatibility)
- **Training Load Formula (v1)**: Updated to use combined wellness modifier: `wellnessMod = clamp(0.6 + 0.04*recovery + 0.02*sleep - (sick? 0.3 : 0), 0.4, 1.4)` with pushup adjustment capped at 20% of session load
- **Sentry Telemetry**: Added breadcrumbs for auth events, check-in saves, and training load calculations; increased `tracesSampleRate` to 0.2; added `allowUrls` filtering; improved 403 error handling

### 🐛 Fixed
- **WeeklyTile Accessibility**: Fixed test by waiting for day data to load
- **WeeklyTile Layout**: Fixed layout issues on mobile devices
- **Husky Hooks**: Security improvements and enhanced hook logic

### 🧹 Maintenance
- Remove temporary files (`nul`, `tmp_pwa_prompt.tsx`)
- Archive old setup/report files (CLEANUP_REPORT.md, FIREBASE_AUTH_SETUP.md)
- Add cleanup configuration (`cleanup.config.json`)
- Improve ESLint configuration to suppress warnings in build artifacts
- **Training Load Tests**: Updated unit tests for new formula with wellness modifier clamping and pushup adjustment tests

---

## [0.1.1] - 2025-10-09

### 🚀 Added

**Release Management System**
- **Three-environment deployment strategy**: Production (`main`), Staging (`develop`), PR Previews
- **GitHub Actions Workflows**:
  - `deploy-prod.yml` - Deploy to `app.winterarc.newrealm.de` on push to `main`
  - `deploy-staging.yml` - Deploy to `staging.winterarc.newrealm.de` on push to `develop`
  - `pr-preview.yml` - Deploy PR previews to `staging.winterarc.newrealm.de/pr-<num>/`
- **CNAME Management**: Separate CNAME files for production and staging (`ops/pages/`)
- **PR Preview Comments**: Automated bot comments on PRs with preview links

**System Indicator Component**
- Version + Environment badge (bottom-right corner)
- Color-coded environments:
  - 🟢 Production: Green (`vX.Y.Z – PROD`)
  - 🟠 Staging: Orange (`vX.Y.Z – TEST`)
  - 🔴 PR Preview: Red (`vX.Y.Z – PREVIEW`)
  - ⚪ Local: Gray (`vX.Y.Z – LOCAL`)
- Reads `VITE_APP_ENV` from build environment
- Replaces old `version-bubble` div

**Logger System**
- New centralized logger (`src/utils/logger.ts`)
- Conditional logging (DEV: all logs, PROD: only errors)
- Sentry integration for error reporting
- Suppresses logs in test environment

### ♻️ Changed

**Firebase Configuration**
- Migrated all `console.*` calls to new logger system
- Improved error tracking with Sentry integration
- Codacy-compliant (no direct console usage)

**Store Error Handling**
- Enhanced error handling with Sentry reporting
- Added context tags for localStorage errors (`dark-mode`, `leaderboard-filter`)
- Better debugging with extra metadata

**Vite Configuration**
- Added dynamic `base` path support for PR previews
- Reads `VITE_BASE_PATH` environment variable
- PWA manifest scope/start_url adjust to base path

**404.html (SPA Routing)**
- Added PR preview path detection (`/pr-123/`)
- Dynamic `pathSegmentsToKeep` based on URL pattern
- Improved client-side routing for deep links

### 📚 Documentation

**README.md**
- Added comprehensive "Release Management & Deployment" section
- Architecture overview with deployment flow diagram
- Detailed setup instructions (GitHub Pages repos, DNS, secrets)
- Rollback procedures (3 options: revert, reset, manual)
- System Indicator documentation with color reference
- SPA routing explanation (404.html workaround)
- PR Preview workflow step-by-step guide
- Troubleshooting section (common issues + fixes)
- Cleanup guide for old PR previews

### 🧹 Removed

**Code Cleanup**
- Deleted temporary Python scripts (`tmp_*.py`) from root directory
- Deleted `nul` file
- Removed old `version-bubble` implementation from `App.tsx`

### 🔧 Technical Details

**New Files (8):**
1. `src/utils/logger.ts` - Centralized logging utility
2. `src/components/SystemIndicator.tsx` - Environment badge component
3. `.github/workflows/deploy-prod.yml` - Production deployment
4. `.github/workflows/deploy-staging.yml` - Staging deployment
5. `.github/workflows/pr-preview.yml` - PR preview deployment
6. `ops/pages/CNAME.prod` - Production domain config
7. `ops/pages/CNAME.staging` - Staging domain config

**Modified Files (7):**
1. `src/firebase/config.ts` - Logger integration
2. `src/store/useStore.ts` - Enhanced error handling
3. `src/App.tsx` - SystemIndicator integration
4. `vite.config.ts` - Dynamic base path support
5. `public/404.html` - PR preview path detection
6. `package.json` - Version bump to 0.1.1
7. `README.md` - Extensive deployment documentation

**Deleted Files (6):**
- `tmp_edit_store.py`
- `tmp_pwa_prompt_edit.py`
- `tmp_trans_install.py`
- `tmp_update_import.py`
- `tmp_update_trans_settings_de.py`
- `nul`

---

## [0.1.0] - 2025-10-06

### 🎉 Features

- **Agentisches Entwicklungs-Setup** - Strukturiertes Agent-System für Qualitätssicherung
  - 4 spezialisierte Agents: UI-Refactor, PWA/Performance, Test/Guard, Docs/Changelog
  - Agent-Specs in `.agent/` Verzeichnis
  - Agent-Policies und PR-Templates
  - Agent-spezifische Scripts (Lighthouse, Bundle Analysis, Artifacts)

- **Design Token System** - Zentralisierte Design-Variablen
  - Design Tokens in `src/theme/tokens.ts`
  - Glass/Blur Presets (glassCardClasses, trackedTileClasses, etc.)
  - Spacing, Radius, Shadow, Blur Tokens
  - Helper Functions: `getTileClasses(isTracked)`

- **CI/CD Pipeline** - Automatisierte Quality Gates
  - GitHub Actions Workflow (`.github/workflows/ci.yml`)
  - ESLint, TypeScript, Unit Tests, E2E Tests, Build, Lighthouse CI
  - Parallel job execution für schnellere Builds
  - Quality Gates: Lint=0, TS=0, Tests pass, Lighthouse≥90

### ⚡ Performance

- **Lazy Loading Optimization** - Route-based Code Splitting erweitert
  - DashboardPage von eager zu lazy loading migriert
  - Nur kritische Auth-Pages eager: LoginPage, OnboardingPage
  - Main Bundle Size: 86 KB (vorher: ~110 KB)
  - Performance Report in `artifacts/performance/PERFORMANCE.md`

- **Bundle Analysis** - Detaillierte Bundle-Size-Reports
  - Total JS Size: 1204 KB (Firebase: 448 KB, Recharts: 376 KB)
  - Bundle Visualizer: `artifacts/bundle/stats.html`
  - Bundle Summary: `artifacts/bundle/bundle-summary.md`

### 🧪 Tests

- **E2E Test Specifications** - Playwright Test-Suites (26 Tests total)
  - Tracking Flow: 8 Tests (`tests/e2e/tracking.spec.ts`)
  - Navigation Flow: 9 Tests (`tests/e2e/navigation.spec.ts`)
  - Training Flow: 9 Tests (`tests/e2e/training.spec.ts`)
  - Test README mit Firebase Auth Emulator Setup-Anleitung
  - Status: Spezifikationen fertig, Emulator Setup ausstehend

### 📚 Documentation

- **README.md** - Umfassende Projekt-Dokumentation
  - Agent-System Erklärung
  - Performance-Metriken Tabelle
  - Testing Strategy mit Coverage-Zielen
  - Tech Stack detailliert
  - Development Scripts vollständig

- **CONTRIBUTING.md** - Beitrags-Guidelines
  - Branching-Strategie (main → dev → feat/*)
  - Commit-Konventionen (Conventional Commits)
  - PR-Prozess mit Template
  - Definition of Done
  - Code Quality Gates
  - Semantic Versioning Regeln

- **CLAUDE.md** - Agent-System Abschnitt
  - 4 Agents dokumentiert mit Triggern
  - Agent-Workflow erklärt
  - Policies referenziert

### 🔧 Chore

- **gitignore** - Auto-generierte Dateien ignorieren
  - `*.tsbuildinfo` (TypeScript Cache)
  - `stats.html` (Bundle Visualizer)

### 🏆 Agent PRs

- **PR #27**: Agent Infrastructure Setup
- **PR #28**: UI-Refactor Agent - Design Token Migration
- **PR #29**: Test/Guard Agent - E2E Test Specifications
- **PR #30**: PWA/Performance Agent - Lazy Loading & Bundle Optimization

---

## [0.0.5] - 2025-10-06

### Chore
- 🔧 **Archive GitHub Actions Workflows** - Moved CI/CD workflows to `.github/workflows-archived/`
  - Archived `ci.yml` (CI tests: TypeScript, ESLint, Playwright, hygiene scans)
  - Archived `deploy.yml` (GitHub Pages deployment)
  - Archived `lighthouse-ci.yml` (Lighthouse CI and mobile device tests)
  - Workflows can be restored by moving files back to `.github/workflows/`

## [0.0.4] - 2025-10-04

### Removed
- ♻️ **History/Verlauf Page** - Archived History page (reversible via HISTORY_ENABLED flag)
  - Removed route from router (`/tracking/history`)
  - Removed navigation links from Dashboard and BottomNav
  - Created feature flag system in `src/config/features.ts`
  - Archived `src/pages/HistoryPage.tsx` with clear reactivation instructions
  - Updated CLAUDE.md "Archived Features" section with detailed reactivation steps

### Features
- 🎨 **Dashboard Redesign** - New compact top layout with streak/weather cards
  - Added StreakMiniCard (168×88px compact card with fire icon)
  - Added WeatherCard with live Aachen weather data
  - Added WeekCirclesCard with horizontal chip-based week navigation
  - Removed "Hey, Lars!" header for cleaner layout
  - All cards use unified glass-card design
- 🎨 **Standardized Glass-Card Design** - All tiles now use consistent styling
  - Applied new glass-card classes to all tracking tiles (Pushup, Sport, Water, Protein, Weight)
  - Mandatory classes: `rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.25)]`
  - Deprecated old `glass-dark` class
  - Updated CLAUDE.md with mandatory design rules

### Documentation
- Updated CLAUDE.md with glass-card design system rules
- Added feature flag documentation

## [0.0.3] - 2025-10-04

### Removed
- ♻️ **AI Motivational Quote feature** - Temporarily removed AI-generated motivational quotes (archived for future reconsideration)
  - Removed Gemini API integration from dashboard header
  - Commented out VITE_GEMINI_API_KEY in .env.example
  - Archived aiService.ts and aiQuoteService.ts
  - Updated CLAUDE.md with "Archived Features" section

### Features
- Add Git hooks (Husky) to catch errors before push
- Pre-commit hook validates TypeScript and ESLint
- Pre-push hook runs full test suite including build
- Add Notes page with Firestore integration for personal workout notes
- Redesign tiles with compact mobile-first layout
- Simplify bottom navigation with glassmorphism style (remove Settings)
- Update WeekOverview with circular progress indicators
- Lower streak threshold from 4 to 3 tasks
- Implement Weekly Top 3 achievement system with automatic snapshots
- **Standardize tile design:** Emoji top-left, metric top-right for all tiles
- **Desktop layout:** Add tile-grid-2 class for flush alignment

### Bug Fixes
- Fix port conflict in Lighthouse CI workflows (mobile-tests now uses port 4174)
- Make Playwright baseURL configurable via BASE_URL environment variable
- Fix Vitest attempting to run Playwright tests by excluding tests/** directory
- **Fix streak calculation:** Only count days with 3/5 tasks completed (pushups, sports, water, protein, weight)

### Documentation
- Add Git Hooks section to CLAUDE.md
- Update DoD and PR process to mention hooks
- **Add local development instructions:** Emphasize npm run dev for live reloading
- **Add UI/UX Design Guidelines section:** Tile design system, layout rules, navigation structure

### Chore
- Configure workflow dependencies: CI → Lighthouse CI → Deploy
- Deploy only runs if both CI and Lighthouse CI succeed
- Prevent broken builds from reaching production
- Install Husky ^9.1.7 for Git hooks
- Add Firestore security rules for aiQuotes, notes, and weeklyTop3 collections
- Add firebase.json configuration file

## [0.0.2] - 2025-01-04

### Bug Fixes
- Fix 30 ESLint errors with proper TypeScript types
- Replace all 'any' types with proper interfaces (GroupMember, TrackingRecord)
- Remove unused variables (error, fetchError)
- Fix no-useless-escape in template strings
- Remove unnecessary try-catch wrapper in AI service

### Documentation
- Update CLAUDE.md with all implemented features
- Add Versioning & Changelog section to CLAUDE.md
- Document Weather Integration, History Page, and Lighthouse CI
- Add missing environment variables to .env.example (GEMINI, reCAPTCHA)

### Chore
- Configure Lighthouse CI for /login page with realistic thresholds
- Update accessibility threshold to 0.85 (from 0.9)

## [0.0.1] - 2025-01-03

### Features
- 🎉 Initial release of Winter Arc Fitness Tracker
- Pushup Training Mode with Base & Bump algorithm
- Progressive plan generation with automatic adjustment
- Leaderboard Preview Widget showing top 5 group members
- History Page for viewing and managing tracking entries
- Weather Integration (Open-Meteo API for Aachen, Germany)
- AI-generated motivational quotes via Google Gemini
- Google OAuth authentication with Firebase
- PWA support with offline functionality
- Dark mode with glassmorphism design
- Group-based tracking and leaderboard

### Testing
- Vitest unit tests for motivation logic
- Playwright E2E and visual regression tests
- Lighthouse CI integration
- Accessibility testing with vitest-axe

### Infrastructure
- Firebase Authentication, Firestore, Storage
- Sentry error tracking
- Performance budgets monitoring
- Bundle size analysis with rollup-plugin-visualizer

[unreleased]: https://github.com/NewRealm-Projects/winter-arc-app/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/NewRealm-Projects/winter-arc-app/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/NewRealm-Projects/winter-arc-app/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/NewRealm-Projects/winter-arc-app/compare/v0.0.5...v0.1.0
[0.0.5]: https://github.com/NewRealm-Projects/winter-arc-app/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/NewRealm-Projects/winter-arc-app/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/NewRealm-Projects/winter-arc-app/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/NewRealm-Projects/winter-arc-app/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/NewRealm-Projects/winter-arc-app/releases/tag/v0.0.1
