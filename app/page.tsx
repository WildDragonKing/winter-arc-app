'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './hooks/useAuth';
import { useStore } from './store/useStore';

export default function HomePage() {
  const router = useRouter();
  const { status, user, isOnboarded } = useAuth();
  const authLoading = useStore((state) => state.authLoading);

  useEffect(() => {
    // Wait for auth to fully load before making routing decisions
    if (authLoading || status === 'loading') {
      return;
    }

    if (status !== 'authenticated') {
      return;
    }

    if (!user) {
      return;
    }

    if (!isOnboarded) {
      router.push('/onboarding');
    } else {
      router.push('/dashboard');
    }
  }, [status, user, isOnboarded, router, authLoading]);

  // Show unauthenticated UI only when we're SURE the user is not logged in
  // (not during loading, not during session hydration)
  if (status === 'unauthenticated' && !authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-winter-500 to-winter-700 p-6">
        <div className="max-w-md w-full text-center bg-black/40 backdrop-blur rounded-2xl border border-winter-600/40 p-8">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-white text-2xl font-semibold mb-2">Du bist nicht angemeldet</h1>
          <p className="text-winter-200 mb-6">
            Bitte melde dich an, um deine Winter Arc Statistiken zu sehen.
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 font-semibold text-winter-900 shadow-sm transition hover:bg-winter-100"
          >
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  // Loading state (shown during auth check or session hydration)
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-winter-500 to-winter-700">
      <div className="text-center">
        <div className="text-6xl mb-4">❄️</div>
        <div className="text-white text-lg font-semibold">Winter Arc</div>
        <div className="text-winter-200 mt-2">Dein Konto wird überprüft ...</div>
      </div>
    </div>
  );
}
