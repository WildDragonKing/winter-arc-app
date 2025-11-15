# Database Migration Guide

## Übersicht

Diese Migration überführt die Winter Arc App von Firebase Firestore zu Vercel Postgres als Teil der kompletten Next.js + Vercel Platform Migration.

## Status

- ✅ Next.js 15 App Router Setup
- ✅ Vercel Postgres Dependencies installiert
- ✅ Database Schema definiert
- ✅ Migration Scripts erstellt
- ⏳ **HEUTE: Vercel Postgres Database Setup**
- ⏳ **HEUTE: Data Migration ausführen**

## Schema Migration

### Firebase Firestore → Vercel Postgres

| Firebase Collection | Postgres Table | Schema Changes |
|-------------------|----------------|----------------|
| `users/{uid}` | `users` | + `id` (UUID Primary Key)<br/>+ `firebase_uid` (Migration compatibility)<br/>+ `email` (Required for OAuth) |
| `groups/{code}` | `groups` | + `id` (UUID Primary Key)<br/>+ `code` (Unique identifier) |
| `tracking/{uid}/entries/{date}` | `tracking_entries` | + `id` (UUID Primary Key)<br/>+ `user_id` (Foreign Key)<br/>Flattened structure |

## Setup Schritte

### 1. Vercel Postgres Database erstellen

```bash
# Im Vercel Dashboard:
# 1. Projekt auswählen
# 2. Storage Tab → Create Database
# 3. Postgres auswählen
# 4. Environment Variables kopieren
```

### 2. Environment Variables setzen

```bash
# .env.local (Development)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NO_SSL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

### 3. Database Schema erstellen

```bash
# Schema zu Postgres pushen
npm run db:push

# Oder: Migrations generieren
npm run db:generate
npm run db:migrate
```

### 4. Database Connection testen

```bash
# Test über API
curl http://localhost:3000/api/db/test

# Oder Browser: http://localhost:3000/database
```

### 5. Data Migration ausführen

```bash
# Via API (Sicherer für Production)
curl -X POST http://localhost:3000/api/db/migrate \
  -H "Authorization: Bearer migration-secret"

# Oder: Direkt über Script
npx tsx scripts/migrate-data.ts
```

## Migration Workflow

### Aktueller Stand (Phase 0)

1. **Database Setup** (HEUTE)
   - Vercel Postgres Database erstellen
   - Environment Variables konfigurieren
   - Schema deployment

2. **Data Migration** (HEUTE)
   - Firebase Daten exportieren
   - Postgres Daten importieren
   - Verifikation

3. **Deploy to Develop** (HEUTE)
   - Branch: `develop`
   - Vercel Production Environment
   - Database connectivity testen

### Nächste Phasen

4. **Auth Migration** (Post-Deploy)
   - Firebase Auth → Google OAuth 2.0
   - NextAuth.js Integration

5. **Frontend Migration** (Post-Auth)
   - React Components → Next.js App Router
   - State Management Update

## Database Schema

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE,        -- For migration compatibility
  email TEXT NOT NULL UNIQUE,     -- Required for Google OAuth
  nickname TEXT NOT NULL,
  gender TEXT,
  height INTEGER,                  -- cm
  weight REAL,                    -- kg
  max_pushups INTEGER DEFAULT 0,
  group_code TEXT,
  pushup_state JSONB,             -- Complex state objects
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Groups Table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,      -- Group identifier
  name TEXT NOT NULL,
  members JSONB,                  -- Array of user IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tracking Entries Table
CREATE TABLE tracking_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,          -- Foreign key to users
  date TEXT NOT NULL,             -- Format: YYYY-MM-DD
  pushups INTEGER DEFAULT 0,
  sports INTEGER DEFAULT 0,       -- minutes
  water INTEGER DEFAULT 0,        -- ml
  protein REAL DEFAULT 0,         -- grams
  weight REAL,                    -- kg
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX user_email_idx ON users(email);
CREATE INDEX user_firebase_uid_idx ON users(firebase_uid);
CREATE INDEX group_code_idx ON groups(code);
CREATE INDEX tracking_user_date_idx ON tracking_entries(user_id, date);
```

## API Endpoints

### Database Test
- **GET** `/api/db/test`
- **Response**: Connection status, migrations status

### Data Migration
- **POST** `/api/db/migrate`
- **Headers**: `Authorization: Bearer migration-secret`
- **Response**: Migration results

## Commands

```bash
# Development
npm run dev                    # Next.js dev server
npm run db:studio             # Drizzle Studio (Database GUI)

# Database
npm run db:generate           # Generate migrations
npm run db:migrate           # Run migrations
npm run db:push              # Push schema to database

# Deployment
npm run build                # Build for production
npm run deploy               # Deploy to Vercel
```

## Monitoring

- **Development**: http://localhost:3000/database
- **API Health**: http://localhost:3000/api/db/test
- **Drizzle Studio**: `npm run db:studio`

## Troubleshooting

### Connection Issues
1. Vercel Dashboard → Storage → Postgres → Environment Variables kopieren
2. `.env.local` mit korrekten Werten aktualisieren
3. `npm run dev` neustarten

### Migration Errors
1. Firebase Credentials prüfen (`VITE_FIREBASE_*`)
2. Postgres Connection testen (`/api/db/test`)
3. Log Files prüfen (Browser Console + Terminal)

### Schema Issues
1. `npm run db:push` für Schema Updates
2. `npm run db:studio` für Manual Review
3. SQL Commands direkt in Vercel Dashboard

## Timeline

**HEUTE (30. Oktober 2024)**
- [x] Next.js 15 Setup
- [x] Database Dependencies
- [x] Schema Definition
- [x] Migration Scripts
- [ ] **Vercel Postgres Setup** (Critical)
- [ ] **Data Migration** (Critical)
- [ ] **Deploy to Develop Branch** (Deadline)

Das Ziel ist eine funktionsfähige Next.js + Postgres App auf dem `develop` Branch noch heute Abend!
