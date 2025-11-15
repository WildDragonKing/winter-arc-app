import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { logger } from '@/app/utils/logger';
import * as schema from './schema';

// fetchConnectionCache deprecated (now always true); removed explicit set

// Use empty string as fallback to prevent build errors
const databaseUrl = process.env.DATABASE_URL || '';

// Create the Neon connection only if DATABASE_URL is provided
const sql = databaseUrl ? neon(databaseUrl) : null;

// Create the database instance using the Neon sql client when available
export const db = sql ? drizzle(sql, { schema }) : null;

// Connection test function
export async function testConnection() {
  if (!sql) {
    logger.warn('No database connection available');
    return false;
  }
  try {
    const result = await sql`SELECT NOW()`;
    logger.info('Neon database connected successfully:', result[0]);
    return true;
  } catch (error) {
    logger.error('Neon database connection failed:', error);
    return false;
  }
}

// Migration helper functions
export async function runMigrations() {
  if (!sql) {
    logger.warn('No database connection available for migrations');
    return false;
  }
  try {
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firebase_uid TEXT UNIQUE,
        email TEXT NOT NULL UNIQUE,
        nickname TEXT NOT NULL,
        gender TEXT,
        height INTEGER,
        weight REAL,
        max_pushups INTEGER DEFAULT 0,
        group_code TEXT,
        pushup_state JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        members JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tracking_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        date TEXT NOT NULL,
        pushups INTEGER DEFAULT 0,
        sports INTEGER DEFAULT 0,
        water INTEGER DEFAULT 0,
        protein REAL DEFAULT 0,
        weight REAL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS user_email_idx ON users(email);`;
    await sql`CREATE INDEX IF NOT EXISTS user_firebase_uid_idx ON users(firebase_uid);`;
    await sql`CREATE INDEX IF NOT EXISTS group_code_idx ON groups(code);`;
    await sql`CREATE INDEX IF NOT EXISTS tracking_user_date_idx ON tracking_entries(user_id, date);`;

    logger.info('Neon database migrations completed successfully');
    return true;
  } catch (error) {
    logger.error('Neon migration failed:', error);
    return false;
  }
}
