# 1Password Secrets Management

Comprehensive guide for integrating 1Password as the secrets management solution for Winter Arc App.

**Vault Name**: `winter-arc-app`

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start (20-30 minutes)](#quick-start-20-30-minutes)
3. [Vault Structure](#vault-structure)
4. [Local Development Setup](#local-development-setup)
5. [GitHub Actions Setup](#github-actions-setup)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Overview

### Why 1Password?

- ✅ **Centralized Secrets**: All secrets in one secure location
- ✅ **No Git Exposure**: Secrets never touch the repository
- ✅ **Team Collaboration**: Easy sharing within the team
- ✅ **Audit Trail**: Track who accessed what and when
- ✅ **CI/CD Integration**: Seamless GitHub Actions integration
- ✅ **Local Development**: Direct CLI access without `.env` files

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    1Password Vault                          │
│                   "winter-arc-app"                           │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Vercel Postgres  │  │ NextAuth         │                │
│  │ - DATABASE_URL   │  │ - Secret         │                │
│  │ - Direct URL     │  │ - Google OAuth   │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Sentry           │  │ GitHub           │                │
│  │ - DSN            │  │ - Deploy Token   │                │
│  │ - Auth Token     │  │                  │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                      │
    ┌─────▼──────┐                      ┌───────▼────────┐
    │   Local    │                      │ GitHub Actions │
    │ Development│                      │   (CI/CD)      │
    │            │                      │                │
    │ 1Password  │                      │ 1Password      │
    │ CLI (op)   │                      │ Action         │
    └────────────┘                      └────────────────┘
```

---

## Quick Start (20-30 minutes)

### Phase 1: Vault Setup (5-10 minutes)

#### Step 1: Install 1Password CLI

**Windows:**
```powershell
winget install AgileBits.1Password.CLI
```

**macOS:**
```bash
brew install 1password-cli
```

**Linux:**
```bash
# Download from: https://1password.com/downloads/command-line/
```

#### Step 2: Sign In to 1Password

```bash
# Add your account
op account add

# Sign in
eval $(op signin)  # macOS/Linux

# Windows PowerShell:
op signin
```

#### Step 3: Create Vault Items

Create the following items in your `winter-arc-app` vault:

**Item 1: Vercel Postgres**
- Type: `API Credential`
- Fields:
  - `database_url` - Full Vercel Postgres connection string
  - `database_url_direct` - Direct connection (non-pooled)

**Item 2: NextAuth**
- Type: `API Credential`
- Fields:
  - `secret` - NextAuth secret key (random string)
  - `url` - Application URL (e.g., `http://localhost:3000`)

**Item 3: Google OAuth**
- Type: `API Credential`
- Fields:
  - `client_id` - Google OAuth Client ID
  - `client_secret` - Google OAuth Client Secret

**Item 4: Sentry** (optional)
- Type: `API Credential`
- Fields:
  - `dsn` - Sentry DSN for error tracking
  - `auth_token` - Sentry auth token for source maps
  - `organization` - Sentry organization slug
  - `project` - Sentry project slug

**Item 5: GitHub Deployment** (for CI/CD)
- Type: `API Credential`
- Fields:
  - `pages_deploy_token` - GitHub Personal Access Token

#### Step 4: Test Vault Access

```bash
# List items in vault
op item list --vault winter-arc-app

# Test secret retrieval
op read "op://winter-arc-app/Vercel Postgres/database_url"
```

### Phase 2: Local Development (5 minutes)

#### Step 1: Create 1Password Environment File

Create `.env.1password.local` with 1Password references:

```bash
# Database
DATABASE_URL="op://winter-arc-app/Vercel Postgres/database_url"
POSTGRES_URL_NON_POOLING="op://winter-arc-app/Vercel Postgres/database_url_direct"

# NextAuth
NEXTAUTH_SECRET="op://winter-arc-app/NextAuth/secret"
NEXTAUTH_URL="op://winter-arc-app/NextAuth/url"

# Google OAuth
GOOGLE_CLIENT_ID="op://winter-arc-app/Google OAuth/client_id"
GOOGLE_CLIENT_SECRET="op://winter-arc-app/Google OAuth/client_secret"

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN="op://winter-arc-app/Sentry/dsn"
SENTRY_AUTH_TOKEN="op://winter-arc-app/Sentry/auth_token"
```

**Note:** This file can be safely committed to Git - it contains only `op://` references, not actual secrets.

#### Step 2: Update package.json Scripts

Add 1Password-enabled scripts to `package.json`:

```json
{
  "scripts": {
    "dev:1p": "op run --env-file=.env.1password.local -- npm run dev",
    "build:1p": "op run --env-file=.env.1password.local -- npm run build",
    "db:studio:1p": "op run --env-file=.env.1password.local -- npm run db:studio"
  }
}
```

#### Step 3: Start Development Server

```bash
# Run dev server with 1Password
npm run dev:1p

# Or manually
op run --env-file=.env.1password.local -- npm run dev
```

### Phase 3: GitHub Actions (10 minutes)

#### Step 1: Create Service Account

1. Go to [1Password Service Accounts](https://my.1password.com/developer/serviceaccounts)
2. Click **Create Service Account**
3. Name: `GitHub Actions - Winter Arc App`
4. Grant access to `winter-arc-app` vault (Read-Only)
5. Copy the **Service Account Token** (starts with `ops_`)

#### Step 2: Add Token to GitHub Secrets

1. Go to: `Repository Settings → Secrets and variables → Actions`
2. Click **New repository secret**
3. Name: `OP_SERVICE_ACCOUNT_TOKEN`
4. Value: `ops_xxxxxxxxxxxxxxxxxxxxx`

#### Step 3: Update Workflow Files

Add 1Password secret loading to your workflows:

```yaml
# .github/workflows/deploy-production.yml
- name: Load secrets from 1Password
  uses: 1password/load-secrets-action@v2
  with:
    export-env: true
  env:
    OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
    DATABASE_URL: op://winter-arc-app/Vercel Postgres/database_url
    NEXTAUTH_SECRET: op://winter-arc-app/NextAuth/secret
    GOOGLE_CLIENT_ID: op://winter-arc-app/Google OAuth/client_id
    GOOGLE_CLIENT_SECRET: op://winter-arc-app/Google OAuth/client_secret
```

#### Step 4: Test Deployment

1. Go to **Actions** tab on GitHub
2. Select your workflow
3. Click **Run workflow** (manual trigger)
4. Verify successful deployment

### Phase 4: Cleanup (5 minutes)

#### Step 1: Remove Old .env Files

```bash
# Backup first!
cp .env .env.backup

# Remove files with real secrets
rm .env
rm .env.local
rm .env.production

# Keep .env.example for documentation
```

#### Step 2: Remove GitHub Secrets

After confirming 1Password works, remove old secrets from GitHub:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- etc.

**IMPORTANT:** Keep `OP_SERVICE_ACCOUNT_TOKEN`!

#### Step 3: Verify .gitignore

Ensure `.env*` files are ignored (except 1Password reference files):

```bash
# .gitignore should include:
.env
.env*.local
!.env.1password.*  # Allow 1Password reference files
```

---

## Vault Structure

### Recommended Item Organization

| Item Name | Type | Fields | Purpose |
|-----------|------|--------|---------|
| **Vercel Postgres** | API Credential | `database_url`, `database_url_direct` | Database connections |
| **NextAuth** | API Credential | `secret`, `url` | Authentication |
| **Google OAuth** | API Credential | `client_id`, `client_secret` | Google sign-in |
| **Sentry** | API Credential | `dsn`, `auth_token`, `organization`, `project` | Error tracking |
| **GitHub Deployment** | API Credential | `pages_deploy_token` | CI/CD deployments |
| **Gemini API** (optional) | API Credential | `api_key` | AI features |

### 1Password Reference Format

```bash
op://[vault-name]/[item-name]/[field-name]

# Examples:
op://winter-arc-app/Vercel Postgres/database_url
op://winter-arc-app/NextAuth/secret
op://winter-arc-app/Google OAuth/client_id
```

**Important:** Field names are case-sensitive and must match exactly!

---

## Local Development Setup

### Method 1: npm Scripts (Recommended)

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev:1p": "op run --env-file=.env.1password.local -- npm run dev",
    "build:1p": "op run --env-file=.env.1password.local -- npm run build",
    "db:push:1p": "op run --env-file=.env.1password.local -- npm run db:push",
    "db:studio:1p": "op run --env-file=.env.1password.local -- npm run db:studio"
  }
}
```

Usage:
```bash
npm run dev:1p
npm run build:1p
```

### Method 2: Shell Script (Advanced)

Create `scripts/load-env-from-1password.sh`:

```bash
#!/bin/bash
#
# Load environment variables from 1Password
#

echo "🔐 Loading secrets from 1Password vault: winter-arc-app"

# Load Database
export DATABASE_URL=$(op read "op://winter-arc-app/Vercel Postgres/database_url")
export POSTGRES_URL_NON_POOLING=$(op read "op://winter-arc-app/Vercel Postgres/database_url_direct")

# Load NextAuth
export NEXTAUTH_SECRET=$(op read "op://winter-arc-app/NextAuth/secret")
export NEXTAUTH_URL=$(op read "op://winter-arc-app/NextAuth/url")

# Load Google OAuth
export GOOGLE_CLIENT_ID=$(op read "op://winter-arc-app/Google OAuth/client_id")
export GOOGLE_CLIENT_SECRET=$(op read "op://winter-arc-app/Google OAuth/client_secret")

# Load Sentry (optional)
export NEXT_PUBLIC_SENTRY_DSN=$(op read "op://winter-arc-app/Sentry/dsn" 2>/dev/null || echo "")
export SENTRY_AUTH_TOKEN=$(op read "op://winter-arc-app/Sentry/auth_token" 2>/dev/null || echo "")

echo "✅ Environment variables loaded from 1Password"
```

Make it executable:
```bash
chmod +x scripts/load-env-from-1password.sh
```

Usage:
```bash
source scripts/load-env-from-1password.sh
npm run dev
```

### Method 3: Manual CLI Commands

```bash
# Export individual secrets
export DATABASE_URL=$(op read "op://winter-arc-app/Vercel Postgres/database_url")
export NEXTAUTH_SECRET=$(op read "op://winter-arc-app/NextAuth/secret")

# Run command with secrets
npm run dev
```

---

## GitHub Actions Setup

### Complete Workflow Example

```yaml
name: Deploy Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.winterarc.newrealm.de

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Load secrets from 1Password
        uses: 1password/load-secrets-action@v2
        with:
          export-env: true
        env:
          OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
          # Database
          DATABASE_URL: op://winter-arc-app/Vercel Postgres/database_url
          POSTGRES_URL_NON_POOLING: op://winter-arc-app/Vercel Postgres/database_url_direct
          # NextAuth
          NEXTAUTH_SECRET: op://winter-arc-app/NextAuth/secret
          NEXTAUTH_URL: op://winter-arc-app/NextAuth/url
          # Google OAuth
          GOOGLE_CLIENT_ID: op://winter-arc-app/Google OAuth/client_id
          GOOGLE_CLIENT_SECRET: op://winter-arc-app/Google OAuth/client_secret
          # Sentry
          NEXT_PUBLIC_SENTRY_DSN: op://winter-arc-app/Sentry/dsn
          SENTRY_AUTH_TOKEN: op://winter-arc-app/Sentry/auth_token

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Deploy
        run: npm run deploy
```

### Service Account Permissions

Recommended permissions for service account:
- **Vault Access**: Read-only to `winter-arc-app` vault
- **Duration**: No expiration (or 1 year with renewal reminder)
- **Security**: Store token only in GitHub Secrets

---

## Troubleshooting

### Local Development Issues

#### Error: `op: command not found`

**Solution:**
```bash
# Install 1Password CLI
# Windows: winget install AgileBits.1Password.CLI
# macOS: brew install 1password-cli
# Linux: https://1password.com/downloads/command-line/

# Verify installation
op --version
```

#### Error: `[ERROR] 401: Invalid token`

**Solution:**
```bash
# Sign in again
eval $(op signin)

# Or re-authenticate
op account add --force
```

#### Error: `item "..." isn't in vault "winter-arc-app"`

**Solution:**
```bash
# List all items to verify names (case-sensitive!)
op item list --vault winter-arc-app

# Get exact item details
op item get "Vercel Postgres" --vault winter-arc-app
```

#### Error: App doesn't start with 1Password secrets

**Solution:**
```bash
# Debug: Print secret values (CAREFUL - don't share output!)
op read "op://winter-arc-app/Vercel Postgres/database_url"

# Check field names match exactly (case-sensitive)
op item get "Vercel Postgres" --vault winter-arc-app --format json
```

### GitHub Actions Issues

#### Error: `401 Unauthorized` in GitHub Actions

**Solution:**
1. Verify `OP_SERVICE_ACCOUNT_TOKEN` is set in GitHub Secrets
2. Regenerate service account token in 1Password
3. Update GitHub Secret with new token
4. Ensure service account has access to vault

#### Error: `Item not found` in GitHub Actions

**Solution:**
1. Verify item names match exactly (case-sensitive)
2. Check service account has read access to vault
3. Test 1Password references locally first

#### Secrets not loading in workflow

**Solution:**
1. Ensure `export-env: true` in `load-secrets-action`
2. Verify `OP_SERVICE_ACCOUNT_TOKEN` is set
3. Check 1Password references use correct format: `op://vault/item/field`
4. Add debug step to verify environment variables (remove after testing):
   ```yaml
   - name: Debug environment
     run: |
       echo "DATABASE_URL is set: ${{ env.DATABASE_URL != '' }}"
       echo "Length: ${#DATABASE_URL}"
   ```

### Migration Issues

#### Database connection fails after migration

**Solution:**
```bash
# Verify DATABASE_URL is correct
op read "op://winter-arc-app/Vercel Postgres/database_url"

# Test database connection
npm run db:studio:1p
```

#### Team members can't access secrets

**Solution:**
1. Invite team members to 1Password vault
2. Ensure they have installed 1Password CLI
3. Verify they've signed in: `op signin`
4. Check vault permissions in 1Password

---

## Best Practices

### Security

1. **Never commit real secrets** - Always use 1Password references (`op://...`)
2. **Use service accounts for CI/CD** - Don't use personal account tokens
3. **Rotate secrets regularly** - Update in 1Password, then redeploy
4. **Audit access logs** - Review who accessed which secrets in 1Password
5. **Use descriptive item names** - Makes troubleshooting easier
6. **Separate environments** - Use different items for prod/staging/dev

### Development

1. **Test locally first** - Before pushing to CI/CD
2. **Use npm scripts** - Simplifies 1Password integration (`npm run dev:1p`)
3. **Document field names** - Keep this guide updated when adding new secrets
4. **Commit .env.1password.* files** - They contain references, not secrets
5. **Verify .gitignore** - Ensure real `.env` files are never committed

### Team Workflow

1. **Onboarding checklist**:
   - Install 1Password CLI
   - Get access to `winter-arc-app` vault
   - Test `op read` command
   - Run `npm run dev:1p`

2. **Adding new secrets**:
   - Add to 1Password vault item
   - Update `.env.1password.*` file with reference
   - Update this documentation
   - Update GitHub Actions workflows if needed
   - Test locally, then deploy

3. **Secret rotation**:
   - Generate new secret value
   - Update in 1Password vault
   - Redeploy affected environments
   - No code changes needed!

---

## Migration Checklist

Use this checklist when migrating from `.env` files to 1Password:

### Setup
- [ ] Install 1Password CLI
- [ ] Create `winter-arc-app` vault
- [ ] Create vault items for all secrets
- [ ] Test vault access with `op item list`
- [ ] Test secret retrieval with `op read`

### Local Development
- [ ] Create `.env.1password.local` with references
- [ ] Add 1Password npm scripts to `package.json`
- [ ] Test `npm run dev:1p` works
- [ ] Verify app connects to database
- [ ] Verify OAuth login works

### GitHub Actions
- [ ] Create 1Password service account
- [ ] Add `OP_SERVICE_ACCOUNT_TOKEN` to GitHub Secrets
- [ ] Update workflow files with `load-secrets-action`
- [ ] Test deployment with manual workflow trigger
- [ ] Verify production/staging deployments work

### Cleanup
- [ ] Backup old `.env` files
- [ ] Remove old `.env` files (keep `.env.example`)
- [ ] Remove old GitHub Secrets
- [ ] Update `.gitignore` to allow `.env.1password.*`
- [ ] Run security scan: `npm run lint` (if available)

### Documentation
- [ ] Update `README.md` with 1Password setup
- [ ] Update `CLAUDE.md` (Section 7: Environment Variables)
- [ ] Update `.github/copilot-instructions.md`
- [ ] Inform team members of migration

### Verification
- [ ] Local development works: `npm run dev:1p`
- [ ] Build works: `npm run build:1p`
- [ ] Database Studio works: `npm run db:studio:1p`
- [ ] CI/CD deployments succeed
- [ ] Production app works correctly
- [ ] Staging app works correctly
- [ ] No secrets in Git history: `git log --all --full-history --source -- "*env*"`

---

## Additional Resources

- [1Password CLI Documentation](https://developer.1password.com/docs/cli/)
- [1Password GitHub Actions](https://github.com/1password/load-secrets-action)
- [1Password Service Accounts](https://developer.1password.com/docs/service-accounts/)
- [Security Incident Response Guide](./SECURITY_INCIDENT_RESPONSE.md)

---

**Last Updated**: 2025-11-15
**Maintained By**: Winter Arc Development Team
