# Pull Request

## Problem / Context
<!-- What problem does this PR solve? Link to related issue if applicable -->

## Solution
<!-- Describe your solution and implementation approach -->

## Screenshots
<!-- Include screenshots for UI changes in both light and dark mode -->

### Light Mode
<!-- Screenshot here -->

### Dark Mode
<!-- Screenshot here -->

## Tests
<!-- Describe the tests you've added or run -->
- [ ] Unit tests pass (`npm run test:unit`)
- [ ] Visual tests pass (`npm run test:ui`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] Manual testing completed

## Migrations / Breaking Changes
<!-- Are there any database migrations, env var changes, or breaking changes? -->
- [ ] No migrations or breaking changes
- [ ] Yes (describe below)

<!-- If yes, describe: -->

## Quality Gates
- [ ] **Accessibility (A11y)**: No axe violations, proper aria-* attributes, focus management tested
- [ ] **Performance**: CLS < 0.03, LCP < 2.5s, FCP < 1.8s, verified with Chrome DevTools
- [ ] **Feature Flags**: Tested with and without active flags (if applicable)
- [ ] **Lighthouse CI**: Performance ≥ 0.9, A11y ≥ 0.95, PWA ≥ 0.9 (run `npm run lhci:run`)

## Checklist
- [ ] Code works as expected in dev environment
- [ ] All tests pass (`npm run test:all`)
- [ ] Visual regression OK in both light and dark mode
- [ ] No TypeScript errors or ESLint warnings
- [ ] Docs updated (CLAUDE.md, comments, etc.)
- [ ] Commits follow message format
- [ ] Mobile/responsive behavior tested
- [ ] Telemetry/error logging added if needed
- [ ] Bundle size acceptable (check with `npm run analyze`)

## Additional Notes
<!-- Any other context, concerns, or notes for reviewers -->
