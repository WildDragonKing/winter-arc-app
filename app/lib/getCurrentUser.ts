import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Session } from 'next-auth';
import type { Activity, Gender, Language, PushupState, User } from '@/app/types';

export type AuthStatus = 'authenticated' | 'unauthenticated';

export interface SerializedUser extends Omit<User, 'createdAt' | 'pushupState' | 'enabledActivities'> {
  createdAt: string;
  pushupState: PushupState;
  enabledActivities: Activity[];
}

export interface SerializedSession {
  user: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    nickname?: string | null;
    groupCode?: string | null;
  };
  expires: string;
}

export interface AuthHydration {
  session: SerializedSession | null;
  user: SerializedUser | null;
  status: AuthStatus;
  isOnboarded: boolean;
}

const DEFAULT_PUSHUP_STATE: PushupState = { baseReps: 0, sets: 5, restTime: 90 };
const DEFAULT_ACTIVITIES: Activity[] = ['pushups', 'sports', 'water', 'protein'];

function deriveNickname(email?: string | null, fallback?: string | null) {
  if (fallback && fallback.trim().length > 0) {
    return fallback;
  }
  if (!email) {
    return '';
  }
  const [name] = email.split('@');
  return name ?? '';
}

/**
 * Serializes a NextAuth session object to remove non-serializable data.
 * This prevents "TypeError: X is not a function" errors when passing to client components.
 */
function serializeSession(session: Session | null): SerializedSession | null {
  if (!session) return null;

  return {
    user: {
      id: session.user?.id ?? null,
      name: session.user?.name ?? null,
      email: session.user?.email ?? null,
      image: session.user?.image ?? null,
      nickname: session.user?.nickname ?? null,
      groupCode: session.user?.groupCode ?? null,
    },
    expires: session.expires,
  };
}

function mapUserRecordToSerialized({
  record,
  session,
}: {
  record: typeof users.$inferSelect | undefined;
  session: Session;
}): SerializedUser {
  const pushupState = (record?.pushupState as PushupState | null) ?? DEFAULT_PUSHUP_STATE;
  const createdAt = record?.createdAt instanceof Date ? record.createdAt.toISOString() : new Date().toISOString();

  const nickname = record?.nickname ?? deriveNickname(session.user.email, session.user.nickname ?? session.user.name);

  return {
    id: record?.id ?? session.user.id ?? session.user.email ?? '',
    language: (record?.language as Language | undefined) ?? 'de',
    nickname,
    gender: (record?.gender as Gender | undefined) ?? 'male',
    height: record?.height ?? 0,
    weight: record?.weight ?? 0,
    maxPushups: record?.maxPushups ?? 0,
    groupCode: record?.groupCode ?? '',
    birthday: (record as any)?.birthday ?? undefined,
    photoURL: session.user.image ?? undefined,
    shareProfilePicture: true,
    enabledActivities: DEFAULT_ACTIVITIES,
    hydrationGoalLiters: undefined,
    hydrationPresets: undefined,
    proteinGoalGrams: undefined,
    bodyFat: undefined,
    activityLevel: undefined,
    createdAt,
    pushupState,
  };
}

export async function getCurrentUser(): Promise<AuthHydration> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      session: serializeSession(session),
      user: null,
      status: 'unauthenticated',
      isOnboarded: false,
    };
  }

  const userId = session.user.id;

  if (!db) {
    const fallback = mapUserRecordToSerialized({ record: undefined, session });
    return {
      session: serializeSession(session),
      user: fallback,
      status: 'authenticated',
      isOnboarded: Boolean(fallback.birthday),
    };
  }

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const record = result[0];
    const user = mapUserRecordToSerialized({ record, session });

    return {
      session: serializeSession(session),
      user,
      status: 'authenticated',
      isOnboarded: Boolean(user.birthday),
    };
  } catch (error) {
    console.error('Failed to load current user', error);
    const fallback = mapUserRecordToSerialized({ record: undefined, session });
    return {
      session: serializeSession(session),
      user: fallback,
      status: 'authenticated',
      isOnboarded: Boolean(fallback.birthday),
    };
  }
}
