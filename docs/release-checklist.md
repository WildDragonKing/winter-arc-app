# Release Checklist

Use this checklist before deploying a new version of Winter Arc Tracker.

## Pre-Release Testing

### Functionality
- [ ] Login with Google OAuth works
- [ ] Onboarding flow completes successfully
- [ ] Dashboard loads and displays user data
- [ ] Tracking page saves data to Firestore
- [ ] Leaderboard shows group members correctly
- [ ] Settings page allows profile updates
- [ ] Logout works and clears state

### Data Persistence
- [ ] Tracking data syncs to Firestore
- [ ] Offline changes sync when reconnected
- [ ] No data loss on page refresh
- [ ] User preferences persist

### Cross-Browser Testing
- [ ] Chrome/Edge (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

### Responsive Design
- [ ] Mobile (320px - 480px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1280px+)
- [ ] PWA install prompt works on mobile

### Light/Dark Mode
- [ ] Light mode renders correctly
- [ ] Dark mode renders correctly
- [ ] System preference auto-detected
- [ ] Background images load in both modes

### Performance
- [ ] Lighthouse score > 90 (Performance)
- [ ] Lighthouse score > 90 (Accessibility)
- [ ] Lighthouse score > 90 (Best Practices)
- [ ] Lighthouse score > 90 (SEO)
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s

## Security & Privacy

### Firebase Security
- [ ] Firestore security rules prevent unauthorized access
- [ ] Firebase App Check enabled (production)
- [ ] API keys restricted to authorized domains
- [ ] CORS configured correctly

### Data Protection
- [ ] No sensitive data logged to console (production build)
- [ ] User data encrypted in transit (HTTPS)
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] Account deletion works and removes all user data

## PWA Configuration

### Manifest
- [ ] App name correct
- [ ] Short name < 12 characters
- [ ] Icons present (512x512, 192x192)
- [ ] Theme color matches brand
- [ ] Background color set
- [ ] Display mode is `standalone`

### Service Worker
- [ ] Service worker registers successfully
- [ ] Offline page loads when network unavailable
- [ ] Assets cached correctly
- [ ] Cache invalidation works on updates

### Install Prompt
- [ ] Install prompt appears on supported browsers
- [ ] App installs to home screen (iOS)
- [ ] App installs to desktop/app drawer (Android)
- [ ] Splash screen displays correctly

## Environment Configuration

### Production Environment Variables
- [ ] `VITE_FIREBASE_API_KEY` set
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` set
- [ ] `VITE_FIREBASE_PROJECT_ID` set
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` set
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` set
- [ ] `VITE_FIREBASE_APP_ID` set
- [ ] `VITE_GEMINI_API_KEY` set (optional)
- [ ] `VITE_RECAPTCHA_SITE_KEY` set (recommended)
- [ ] `VITE_SENTRY_DSN` set (optional)

### Firebase Console
- [ ] Authorized domains include production domain
- [ ] Firestore indexes created (if needed)
- [ ] Firebase Hosting configured (if using)
- [ ] App Check configured for production

## Code Quality

### Automated Checks
- [ ] `npm run test:all` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] No console errors in production build
- [ ] No TypeScript errors
- [ ] No ESLint warnings

### Code Review
- [ ] All PRs reviewed and approved
- [ ] No TODO comments left in critical code
- [ ] No commented-out code blocks
- [ ] No debug code (console.log, debugger)

## Build & Deployment

### Build Process
- [ ] Production build completes without errors
  ```bash
  npm run build
  ```
- [ ] Preview production build works
  ```bash
  npm run preview
  ```
- [ ] Bundle size is reasonable (< 500KB gzipped)
- [ ] Source maps generated (if desired)

### Deployment
- [ ] Deploy to staging environment first
- [ ] Test staging environment thoroughly
- [ ] Deploy to production
- [ ] Verify production deployment

### Post-Deployment
- [ ] Production app loads successfully
- [ ] No errors in browser console
- [ ] No errors in Sentry/error tracking
- [ ] Monitor initial user sessions
- [ ] Check Firebase usage/quotas

## Documentation

- [ ] CHANGELOG.md updated with new features/fixes
- [ ] README.md reflects current features
- [ ] CLAUDE.md updated if architecture changed
- [ ] API documentation updated (if applicable)
- [ ] User-facing help docs updated (if applicable)

## Rollback Plan

### If Issues Arise
- [ ] Rollback steps documented
- [ ] Previous version tagged in git
- [ ] Database migrations are reversible (if applicable)
- [ ] Communication plan for users (if downtime)

### Monitoring
- [ ] Sentry error tracking active
- [ ] Firebase Analytics tracking events
- [ ] User feedback channel available
- [ ] On-call contact available for critical issues

## Accessibility (A11y) Quick Scan

- [ ] All images have alt text
- [ ] Interactive elements keyboard-accessible
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader friendly (test with VoiceOver/NVDA)
- [ ] No flashing/strobing content
- [ ] Focus indicators visible

## Optional Enhancements

### Nice-to-Have Before Release
- [ ] Dark mode background image optimized
- [ ] Loading skeletons for async content
- [ ] Error boundaries for graceful failures
- [ ] Rate limiting on API calls
- [ ] Analytics event tracking

### Future Considerations
- [ ] Push notifications (FCM)
- [ ] Social sharing
- [ ] Data export feature
- [ ] Achievements/badges system

---

## Version Information

**Version**: _____
**Release Date**: _____
**Released By**: _____
**Git Tag**: _____

## Sign-Off

- [ ] Tech Lead approval
- [ ] Product Owner approval
- [ ] QA approval

---

**Notes**:
