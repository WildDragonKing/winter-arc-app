# Security Incident Response Guide

## Exposed API Key Incident

**Status**: 🔴 CRITICAL
**Date Reported**: 2025-10-13
**Affected Repository**: `winter-arc-app-staging`

---

## 1. Incident Summary

A Google API key (`AIzaSyCw2mlvqyoKOlr-SmL6l2ZNxr-E0PRW***`) associated with the Firebase project `gen-lang-client-0429587720` was found exposed in public GitHub repository build artifacts:

- **Primary Location**: `https://github.com/NewRealm-Projects/winter-arc-app-staging/blob/ec3b12b8ee21915cedb7ca1a5b11c996276cdaf1/assets/NotesPage-Bk5UZSYr.js`
- **Additional Locations**: Multiple JavaScript bundle files in the repository

### Root Cause

Build artifacts (`dist/` directory) containing bundled environment variables were committed to the public repository, exposing the API key embedded by Vite during the build process.

---

## 2. Immediate Actions Required

### ⚡ Priority 1: Revoke Exposed Credentials (Do This NOW)

1. **Revoke/Regenerate the API Key**:
   ```bash
   # Visit Google Cloud Console
   https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0429587720

   # Steps:
   # 1. Find API key: AIzaSyCw2mlvqyoKOlr-SmL6l2ZNxr-E0PRW***
   # 2. Click "Delete" or "Regenerate"
   # 3. Create a new API key with restrictions (see section 3)
   ```

2. **Update Environment Variables**:
   ```bash
   # Update .env files with new API key
   VITE_FIREBASE_API_KEY=<NEW_KEY>

   # DO NOT commit .env files to git
   ```

3. **Verify API Key Restrictions** (see section 3 for detailed setup)

---

### ⚡ Priority 2: Clean Repository History

The exposed key exists in git history and must be removed:

#### Option A: Remove Specific Commits (Recommended)

```bash
# 1. Clone the staging repository
git clone https://github.com/NewRealm-Projects/winter-arc-app-staging.git
cd winter-arc-app-staging

# 2. Find commits with dist/ files
git log --all --full-history --oneline -- dist/

# 3. Use git filter-repo to remove dist/ from history
# Install: pip install git-filter-repo
git filter-repo --path dist/ --invert-paths

# 4. Force push (CAUTION: This rewrites history)
git push origin --force --all
git push origin --force --tags
```

#### Option B: BFG Repo-Cleaner (Alternative)

```bash
# 1. Install BFG
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Clean the repository
java -jar bfg.jar --delete-folders dist --no-blob-protection winter-arc-app-staging.git

# 3. Force push
cd winter-arc-app-staging
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push origin --force --all
```

---

### ⚡ Priority 3: Prevent Future Incidents

1. **Verify `.gitignore` Configuration**:
   ```bash
   # Ensure these lines exist in .gitignore
   dist/
   dist-ssr/
   .env
   .env.local
   .env.production
   ```

2. **Run Security Check**:
   ```bash
   # In main repository
   npm run lint:secrets

   # Check git history
   node scripts/check-secrets.mjs --history
   ```

3. **Set Up Pre-Commit Hook** (see section 4)

---

## 3. API Key Security Best Practices

### Configure API Key Restrictions

**CRITICAL**: Never use unrestricted API keys in production.

#### Firebase/Google Cloud Console Setup

1. **Navigate to API Credentials**:
   ```
   https://console.cloud.google.com/apis/credentials?project=YOUR_PROJECT_ID
   ```

2. **Application Restrictions**:
   - **Type**: HTTP referrers (websites)
   - **Allowed Referrers**:
     ```
     https://your-app.vercel.app/*
     https://your-app-staging.vercel.app/*
     http://localhost:5173/*
     ```

3. **API Restrictions**:
   - **Restrict to specific APIs only**:
     - ✅ Firebase Realtime Database API
     - ✅ Cloud Firestore API
     - ✅ Firebase Authentication API
     - ✅ Cloud Storage for Firebase API
     - ❌ All other APIs (disable)

4. **Monitoring**:
   - Enable **API key usage metrics** in Google Cloud Console
   - Set up **billing alerts** for unusual activity
   - Review **API usage logs** regularly

---

## 4. Automated Security Checks

### A. Local Development

**Script Location**: `scripts/check-secrets.mjs`

**Usage**:
```bash
# Check working directory (git tracked files)
npm run lint:secrets

# Check git history
node scripts/check-secrets.mjs --history

# Check staged files (for pre-commit hook)
node scripts/check-secrets.mjs --staged
```

### B. Git Hooks (Recommended)

**Pre-Commit Hook**: Automatically scan staged files before commit

Create `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔒 Checking for exposed secrets..."
node scripts/check-secrets.mjs --staged || {
  echo "❌ Commit blocked: Secrets detected"
  exit 1
}
```

**Enable Hook**:
```bash
chmod +x .husky/pre-commit
```

### C. CI/CD Integration

**GitHub Actions**: Add to `.github/workflows/security-check.yml`

```yaml
name: Security Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for comprehensive scan

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run Secret Scan
        run: node scripts/check-secrets.mjs --history
```

---

## 5. Detected Secret Types

The security check script (`check-secrets.mjs`) detects:

| Type | Severity | Pattern |
|------|----------|---------|
| Google API Key | 🔴 Critical | `AIza[0-9A-Za-z_-]{35}` |
| AWS Access Key | 🔴 Critical | `AKIA[0-9A-Z]{16}` |
| Private Key | 🔴 Critical | `-----BEGIN ... PRIVATE KEY-----` |
| JWT Token | 🟠 High | `eyJ[a-zA-Z0-9_-]+\.eyJ...` |
| Bearer Token | 🟠 High | `Bearer [a-zA-Z0-9_-]{20,}` |
| Firebase Project ID | 🟠 High | `VITE_FIREBASE_PROJECT_ID` |
| Generic API Key | 🟠 High | `api_key` / `apikey` patterns |
| Sentry DSN | 🟡 Medium | `https://...@sentry.io/...` |

---

## 6. Environment Variable Management

### Development Setup

1. **Create `.env` file** (local only, never commit):
   ```bash
   cp .env.example .env
   ```

2. **Required Variables**:
   ```bash
   VITE_FIREBASE_API_KEY=<YOUR_KEY>
   VITE_FIREBASE_AUTH_DOMAIN=<YOUR_DOMAIN>
   VITE_FIREBASE_PROJECT_ID=<YOUR_PROJECT>
   VITE_FIREBASE_STORAGE_BUCKET=<YOUR_BUCKET>
   VITE_FIREBASE_MESSAGING_SENDER_ID=<YOUR_SENDER_ID>
   VITE_FIREBASE_APP_ID=<YOUR_APP_ID>
   ```

3. **Verify `.gitignore`**:
   ```bash
   # Check that .env is ignored
   git check-ignore .env
   # Should output: .env
   ```

### Production/Staging Deployment

**Vercel**:
```bash
# Set environment variables via Vercel dashboard
vercel env add VITE_FIREBASE_API_KEY production
vercel env add VITE_FIREBASE_API_KEY preview
```

**GitHub Actions**:
```yaml
env:
  VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
```

---

## 7. Incident Response Checklist

Use this checklist for any future security incidents:

- [ ] **Assess Impact**: Determine which credentials were exposed and where
- [ ] **Revoke Credentials**: Immediately disable/regenerate exposed keys
- [ ] **Update Applications**: Deploy new credentials to all environments
- [ ] **Clean Repository**: Remove secrets from git history
- [ ] **Notify Team**: Inform all team members of the incident
- [ ] **Review Logs**: Check API usage logs for unauthorized access
- [ ] **Monitor Activity**: Watch for unusual API calls or costs
- [ ] **Document Incident**: Record what happened and how it was resolved
- [ ] **Implement Prevention**: Add automated checks to prevent recurrence
- [ ] **Test Security**: Verify that fixes are working correctly

---

## 8. Contact Information

### Security Issues

- **Report Security Vulnerabilities**: [GitHub Security Advisories](https://github.com/NewRealm-Projects/winter-arc-app/security/advisories)
- **Email**: security@yourproject.com (if applicable)

### Google Cloud Support

- **Console**: https://console.cloud.google.com/support
- **Emergency**: For active incidents with financial impact

---

## 9. Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Google Cloud API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [git-filter-repo Documentation](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---

## 10. Post-Incident Review

After resolving the incident, conduct a post-mortem:

1. **What Happened**: Build artifacts with embedded API keys were committed
2. **Root Cause**: `.gitignore` was present but history contained old commits
3. **Impact**: Publicly exposed Google API key for Firebase project
4. **Resolution Time**: [To be filled]
5. **Prevention Measures**:
   - ✅ Automated secret scanning (scripts/check-secrets.mjs)
   - ✅ Pre-commit hooks
   - ✅ CI/CD security checks
   - ✅ API key restrictions configured
   - ✅ Team training on secure practices

---

**Last Updated**: 2025-10-13
**Next Review**: Quarterly or after any security incident
