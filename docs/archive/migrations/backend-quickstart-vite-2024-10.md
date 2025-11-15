# [HISTORICAL - 2024-10-30] Next.js Backend - Quick Start Guide

> **Archived:** 2025-11-15
> **Reason:** Migration complete - Vite to Next.js 16 migration completed in October 2024
> **See current docs:** [CLAUDE.md](../../CLAUDE.md) for Next.js 16 architecture and patterns

---

# 🚀 Next.js Backend - Quick Start Guide

## 📋 Übersicht

Dieses Dokument beschreibt die **Next.js API Routes** (Serverless Functions) auf Vercel. Die Migration von Vite zu Next.js ist **abgeschlossen**.

---

## 🎯 Phase 1: Vercel Setup (Lokal)

### Schritt 1: Vercel CLI installieren

```powershell
npm install -g vercel
```

### Schritt 2: Projekt-Struktur vorbereiten

```powershell
# API-Verzeichnis erstellen
New-Item -ItemType Directory -Path "api" -Force

# Environment Variables Template
New-Item -ItemType File -Path ".env.local" -Force
```

### Schritt 3: `.env.local` befüllen

Kopiere deine Firebase-Config aus `src/firebase/config.ts` und erstelle:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Gemini AI (für Quotes)
GEMINI_API_KEY=your-gemini-key

# Frontend URL (für CORS)
FRONTEND_URL=http://localhost:3000
```

**Wichtig**: `.env.local` ist bereits in `.gitignore` ✅

### Schritt 4: Ersten API-Endpoint erstellen

Datei: `api/health.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'winter-arc-backend',
  });
}
```

### Schritt 5: Vercel Config erstellen

Datei: `vercel.json`

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev:frontend",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "http://localhost:5173" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

### Schritt 6: Package.json erweitern

Füge zu `package.json` hinzu:

```json
{
  "scripts": {
    "dev:frontend": "vite --port 5173",
    "dev:backend": "vercel dev --listen 3000",
    "dev": "concurrently \"npm:dev:frontend\" \"npm:dev:backend\"",
    "deploy": "vercel --prod"
  },
  "devDependencies": {
    "@vercel/node": "^3.0.0",
    "concurrently": "^8.2.2"
  }
}
```

### Schritt 7: Dependencies installieren

```powershell
npm install -D @vercel/node concurrently
npm install firebase-admin
```

### Schritt 8: Lokalen Dev-Server starten

```powershell
# Terminal 1: Backend
vercel dev --listen 3000

# Terminal 2: Frontend
npm run dev:frontend

# ODER beides parallel:
npm run dev
```

### Schritt 9: Testen

```powershell
# Backend Health-Check
curl http://localhost:3000/api/health

# Frontend
# Öffne http://localhost:5173
```

---

## 🔧 Phase 2: Firebase Admin SDK

### Firebase Service Account Key erstellen

1. Gehe zu Firebase Console → Project Settings → Service Accounts
2. Klicke "Generate New Private Key"
3. Speichere JSON-Datei als `serviceAccountKey.json` (gitignored)
4. Extrahiere Werte für `.env.local`

### API-Endpoint für Firestore erstellen

Datei: `api/tracking/get.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (nur einmal)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId, dateKey } = req.query;

    if (!userId || !dateKey) {
      return res.status(400).json({ error: 'Missing userId or dateKey' });
    }

    const docRef = db
      .collection('tracking')
      .doc(userId as string)
      .collection('entries')
      .doc(dateKey as string);

    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.status(200).json(doc.data());
  } catch (error) {
    console.error('Firestore error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Testen:

```powershell
curl "http://localhost:3000/api/tracking/get?userId=test123&dateKey=2025-10-30"
```

---

## 🌐 Phase 3: Vercel Deployment

### Schritt 1: Vercel Account verbinden

```powershell
vercel login
```

### Schritt 2: Projekt verlinken

```powershell
vercel
# Folge den Prompts:
# - Link to existing project? NO
# - Project name: winter-arc-app
# - Directory: ./
```

### Schritt 3: Environment Variables setzen

```powershell
# In Vercel Dashboard oder via CLI:
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_PRIVATE_KEY
vercel env add GEMINI_API_KEY
```

### Schritt 4: Deployen

```powershell
# Preview Deployment
vercel

# Production Deployment
vercel --prod
```

### Schritt 5: Custom Domain (später)

In Vercel Dashboard:

1. Settings → Domains
2. Add `app.winterarc.newrealm.de`
3. Update DNS Records (CNAME)

---

## 📊 Nächste Schritte

### Sofort (Phase 1):

- [ ] Vercel CLI installieren
- [ ] `api/health.ts` erstellen
- [ ] Lokalen Test durchführen

### Bald (Phase 2):

- [ ] Firebase Admin SDK einrichten
- [ ] `/api/tracking/get` Endpoint testen
- [ ] Frontend API-Client bauen

### Später (Phase 3+):

- [ ] Alle Firestore-Calls migrieren
- [ ] Gemini AI Endpoint
- [ ] Production Deployment

---

## 🆘 Troubleshooting

### "vercel: command not found"

```powershell
npm install -g vercel
# Oder mit PowerShell Admin-Rechten
```

### "Firebase Admin SDK error"

- Prüfe `.env.local` Syntax (besonders `PRIVATE_KEY` mit `\n`)
- Stelle sicher, Service Account hat Firestore-Rechte

### "CORS error in browser"

- Prüfe `vercel.json` Headers
- Frontend muss `Authorization` Header senden

### "Cold Start slow"

- Normal für Serverless (erste Request ~1-2s)
- Warmup-Requests implementieren (später)

---

## 📚 Ressourcen

- [Vercel Docs](https://vercel.com/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Serverless Functions Guide](https://vercel.com/docs/functions/serverless-functions)

---

**Erstellt**: 30. Oktober 2025
**Projekt**: Winter Arc App - Backend Migration
