import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users, type NewUser } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Defensive: ensure db is available for runtime operations.
// During build time, db may be null. The adapter and callbacks handle this gracefully
// by deferring database access until actual authentication requests occur.
const database = db ?? null;

// DrizzleAdapter's helper types expect the full default schema. We only override the users table,
// so silence the type mismatch while relying on the runtime contract provided by the adapter.
// @ts-expect-error Partial table override is intentional.
const adapter = database ? DrizzleAdapter(database, { usersTable: users }) : undefined;

// NextAuth v5 configuration with unified export pattern
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "", // empty fallback to avoid build-time crash
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!database) {
        console.warn('Database not available during sign in');
        return false;
      }

      if (account?.provider === "google" && user.email) {
        try {
          const email = user.email!;

          const existingUser = await database
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          const derivedNicknameBase = (user.name ?? email.split("@")[0]) as string;
          const derivedNickname = derivedNicknameBase.trim();

          if (existingUser.length === 0) {
            const payload: NewUser = {
              email: user.email,
              nickname: derivedNickname,
              name: user.name ?? derivedNickname,
              image: user.image ?? null,
              emailVerified: null,
            };

            await database.insert(users).values(payload);
          } else {
            const record = existingUser[0]!;
            const updates: Partial<NewUser> = {};

            if (!record.nickname || record.nickname.trim().length === 0) {
              updates.nickname = derivedNickname;
            }

            if (user.name && user.name !== record.name) {
              updates.name = user.name;
            }

            if (user.image && user.image !== record.image) {
              updates.image = user.image;
            }

            if (Object.keys(updates).length > 0) {
              await database.update(users).set(updates).where(eq(users.id, record.id));
            }
          }

          return true;
        } catch (error) {
          console.error('Error handling user sign in:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session }) {
      if (!database) {
        console.warn('Database not available during session callback');
        return session;
      }

      if (session.user?.email) {
        const dbUser = await database.select().from(users).where(eq(users.email, session.user.email)).limit(1)
        const first = dbUser[0]
        if (first) {
          // These properties are provided by module augmentation (types/next-auth.d.ts)
          session.user.id = first.id
          session.user.nickname = first.nickname
          session.user.groupCode = first.groupCode ?? null
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: { strategy: 'jwt' as const },
});

// Export API route handlers (NextAuth v5 pattern)
export { handlers as GET, handlers as POST };
