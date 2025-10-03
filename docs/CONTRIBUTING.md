# Contributing to Winter Arc Tracker

Thank you for your interest in contributing! This document provides guidelines for contributing to the Winter Arc fitness tracking PWA.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase account for authentication and database
- Basic knowledge of React, TypeScript, and Tailwind CSS

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd winter-arc-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then fill in your Firebase credentials in `.env`:
   - Firebase config (required)
   - Gemini API key (optional, for AI quotes)
   - reCAPTCHA site key (optional, for App Check)

4. **Run development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branching Strategy
- `main` - Production code (protected)
- `develop` - Integration branch for features
- `feat/<name>` - Feature branches
- `fix/<name>` - Bug fix branches

**Example**:
```bash
git checkout develop
git pull origin develop
git checkout -b feat/pushup-training-mode
# Make changes...
git add .
git commit -m "feat(training): implement Base & Bump algorithm"
git push origin feat/pushup-training-mode
# Create PR to develop
```

### Commit Message Format
Follow conventional commits:
```
type(scope): subject

body (optional)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `refactor`, `chore`, `test`, `docs`, `style`, `perf`

**Examples**:
- `feat(tracking): add water intake quick buttons`
- `fix(auth): resolve redirect loop on logout`
- `refactor(utils): consolidate date formatting functions`

## Coding Standards

### TypeScript
- Use strict TypeScript - no `any` without justification
- Define interfaces for all data structures
- Prefer type inference where obvious
- Use enums for fixed sets of values

**Good**:
```typescript
interface User {
  id: string;
  nickname: string;
  height: number;
}

function getUser(userId: string): Promise<User | null> {
  // ...
}
```

**Bad**:
```typescript
function getUser(userId: any): any {
  // ...
}
```

### React
- Prefer functional components with hooks
- Use meaningful component and variable names
- Extract reusable logic into custom hooks
- Keep components focused (single responsibility)

**Good**:
```tsx
function PushupCard() {
  const { trackPushups } = useTracking();
  const handleSubmit = (count: number) => trackPushups(count);

  return (
    <div className="glass rounded-2xl p-6">
      {/* ... */}
    </div>
  );
}
```

### Styling
- Use Tailwind utility classes (preferred)
- Use CSS variables from `theme.css` for custom styles
- Always test both light and dark modes
- Follow mobile-first responsive design

**Tailwind Classes**:
```tsx
<div className="glass rounded-2xl p-6 shadow-xl">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
    Title
  </h2>
</div>
```

**CSS Variables**:
```css
.custom-card {
  background: var(--surface-alpha);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
}
```

### File Structure
```
src/
├── components/     # Reusable UI components
├── pages/          # Route pages
├── hooks/          # Custom React hooks
├── services/       # Firebase, API, storage services
├── store/          # Zustand state management
├── types/          # TypeScript type definitions
├── utils/          # Helper functions
└── styles/         # Global styles, theme
```

**Naming Convention**: `Feature/ComponentName.tsx`

## Testing Requirements

### Before Submitting PR

Run the full test suite:
```bash
npm run test:all
```

This runs:
1. **TypeScript type checking** (`tsc --noEmit`)
2. **ESLint** (code quality, unused imports)
3. **Vitest unit tests** (business logic)
4. **Playwright visual tests** (UI screenshots)

### Writing Tests

#### Unit Tests (Vitest)
Test business logic, utilities, and algorithms:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateBMI } from './calculations';

describe('calculateBMI', () => {
  it('calculates BMI correctly', () => {
    const bmi = calculateBMI(75, 180); // kg, cm
    expect(bmi).toBeCloseTo(23.15, 1);
  });
});
```

#### Visual Tests (Playwright)
Capture screenshots for UI changes:
```typescript
test('dashboard - light and dark mode', async ({ page }) => {
  await page.goto('/');

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page).toHaveScreenshot('dashboard-light.png');

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page).toHaveScreenshot('dashboard-dark.png');
});
```

### Light/Dark Mode Checklist
- [ ] Component renders correctly in light mode
- [ ] Component renders correctly in dark mode
- [ ] Text has sufficient contrast in both modes
- [ ] Interactive elements (buttons, inputs) are visible
- [ ] Glass effects work properly
- [ ] Background images load correctly

## Pull Request Process

### Before Creating PR

1. **Run all checks**
   ```bash
   npm run test:all
   ```

2. **Review your changes**
   ```bash
   git diff develop...your-branch
   ```

3. **Update documentation** if needed (CLAUDE.md, comments)

### Creating the PR

1. **Use the PR template** (auto-populated)
2. **Fill in all sections**:
   - Problem/Context
   - Solution
   - Screenshots (light + dark mode for UI changes)
   - Tests
   - Migrations/Breaking Changes
   - Checklist

3. **Add reviewers** (if applicable)

### PR Review Criteria

Your PR will be reviewed for:
- [ ] Code quality and readability
- [ ] Adherence to TypeScript/React best practices
- [ ] Test coverage
- [ ] Performance impact
- [ ] Accessibility (a11y)
- [ ] Mobile responsiveness
- [ ] Light/dark mode support
- [ ] Documentation updates

### After Approval

- PRs are squash-merged to keep history clean
- Delete your feature branch after merge
- Deployment happens automatically (if CI/CD is set up)

## Development Tips

### Useful Scripts

```bash
# Code quality
npm run lint              # ESLint
npm run lint:unused       # Find unused imports
npm run typecheck         # TypeScript check

# Hygiene checks
npm run scan:knip         # Find unused files/exports
npm run scan:tsprune      # Find dead TS exports
npm run scan:dep          # Find unused dependencies

# Testing
npm run test:unit         # Vitest unit tests
npm run test:ui           # Playwright visual tests

# Build
npm run build             # Production build
npm run preview           # Preview production build
```

### Common Issues

**Issue**: Popup blocked during Google login
**Solution**: Use redirect mode or allow popups

**Issue**: Dark mode not working
**Solution**: Check `tailwind.config.js` has `darkMode: 'media'`

**Issue**: Background image not loading
**Solution**: Check images exist in `public/bg/light` and `public/bg/dark`

**Issue**: Firestore permission denied
**Solution**: Review Firebase Security Rules

### Getting Help

- Check existing issues on GitHub
- Review CLAUDE.md for architecture details
- Ask in Discord/Slack (if applicable)
- Tag maintainers in your PR for guidance

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers and help them learn
- Focus on the code, not the person
- Assume good intent

Thank you for contributing to Winter Arc Tracker! 🏔️❄️
