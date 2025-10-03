# Repository Hygiene Report

Generated: 2025-10-03

## Executive Summary

This report analyzes unused code, exports, and dependencies in the Winter Arc project using automated tools:
- **knip**: Detects unused files, exports, and dependencies
- **ts-prune**: Finds unused TypeScript exports
- **depcheck**: Identifies unused npm dependencies

## Findings

### 1. Unused Files (2)

| File | Status | Action |
|------|--------|--------|
| `src/components/LeaderboardPreview.tsx` | REVIEW | Component may be unused or ready for future feature |
| `src/services/storageService.ts` | REVIEW | Firebase Storage service - check if profile pictures feature is planned |

**Recommendation:**
- `LeaderboardPreview.tsx`: Check if this is part of the leaderboard feature. If not currently used, move to a `future/` directory or remove.
- `storageService.ts`: Contains profile picture upload/delete functions. If profile pictures are planned (mentioned in CLAUDE.md settings), mark as **SAFE**. Otherwise, remove.

### 2. Unused Exports (9)

| Export | Type | File | Status |
|--------|------|------|--------|
| `formatNumber` | function | src/utils/calculations.ts:69 | SAFE |
| `formatDate` | function | src/utils/calculations.ts:76 | SAFE |
| `getDailyPlan` | function | src/utils/pushupAlgorithm.ts:18 | REVIEW |
| `storage` | constant | src/firebase/config.ts:66 | SAFE |
| `default` | export | src/firebase/config.ts:76 | REVIEW |
| `getUser` | function | src/services/firestoreService.ts:23 | SAFE |
| `getDailyTracking` | function | src/services/firestoreService.ts:61 | SAFE |
| `getTrackingRange` | function | src/services/firestoreService.ts:76 | SAFE |
| `createGroup` | function | src/services/firestoreService.ts:100 | SAFE |

**Analysis:**
- **SAFE** utilities/functions: These are library functions that may be used in future features or are part of the public API. Keep them.
- `getDailyPlan`: Part of pushup training algorithm - likely needed for training mode UI. Mark **SAFE** if training mode is implemented.
- `storage` export: Firebase Storage instance - needed if profile pictures feature is active.

### 3. Unused Exported Types (4)

| Type | Kind | File | Status |
|------|------|------|--------|
| `PushupWorkout` | interface | src/types/index.ts:35 | SAFE |
| `Group` | interface | src/types/index.ts:65 | SAFE |
| `LeaderboardEntry` | interface | src/types/index.ts:72 | SAFE |
| `TranslationKey` | type | src/i18n/translations.ts:394 | SAFE |

**Analysis:**
All types are data models for core features (pushups, groups, leaderboard, i18n). These are **SAFE** - they define the structure of the app's data.

### 4. Unused Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| `autoprefixer` | devDependency | FALSE POSITIVE |
| `postcss` | devDependency | FALSE POSITIVE |
| `tailwindcss` | devDependency | FALSE POSITIVE |

**Analysis:**
These are used by Vite's build process through `postcss.config.js` and `tailwind.config.js`. Depcheck doesn't detect config-based usage. **No action needed.**

### 5. Unlisted Binaries

| Binary | File | Status |
|--------|------|--------|
| `vitest` | package.json | TODO |
| `playwright` | package.json | TODO |

**Action Required:**
- Install `vitest` for unit testing: `npm i -D vitest @vitest/ui`
- Install `@playwright/test` for UI testing: `npm i -D @playwright/test`

## Recommended Actions

### Immediate (Safe to do now)

1. **Configure knip.json**:
   - Remove `@types/*` from `ignoreDependencies` (not needed with modern TS)
   - Update entry patterns to include actual service worker path

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": ["src/main.tsx"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"]
}
```

2. **Install missing test dependencies**:
```bash
npm i -D vitest @vitest/ui @playwright/test
```

### Review Required (Check with team/features)

1. **LeaderboardPreview.tsx**:
   - If leaderboard preview feature is implemented → Mark SAFE
   - If not used and not planned → DELETE

2. **storageService.ts**:
   - If profile picture upload feature is implemented → Mark SAFE
   - If not implemented and not in current roadmap → DELETE
   - If planned for future → Move to `src/features/future/` or add TODO comment

3. **Clean up default exports**:
   - Review `src/firebase/config.ts:76` default export - may not be needed

### Future Improvements

1. **Add TODO comments** to planned-but-unimplemented features
2. **Create feature flags** for experimental features to track what's active
3. **Establish naming convention**: `Feature/ComponentName.tsx` pattern (per requirements)
4. **Set up pre-commit hook** to run `npm run lint:unused` automatically

## Conclusion

The codebase is relatively clean with minimal technical debt. Most "unused" exports are actually part of the public API or planned features. Primary actions:

1. ✅ Install vitest and playwright
2. 🔍 Review LeaderboardPreview and storageService usage
3. 🔧 Update knip.json configuration
4. 📝 Document planned features with TODO comments

**No critical issues found. Safe to proceed with refactoring and testing setup.**
