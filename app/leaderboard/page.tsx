'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-winter-500 to-winter-700">
      <div className="text-center">
        <div className="text-6xl mb-4">❄️</div>
        <div className="text-white text-lg font-semibold">Loading...</div>
      </div>
    </div>
  );
}

function LeaderboardContent() {
  const router = useRouter();
  const { status, user: authUser } = useAuth();
  const storeUser = useStore((state) => state.user);
  const authLoading = useStore((state) => state.authLoading);

  const effectiveUser = storeUser ?? authUser;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    if (!effectiveUser) {
      router.replace('/auth/signin');
    }
  }, [effectiveUser, router, status]);

  if (authLoading || !effectiveUser) {
    return <LoadingScreen />;
  }

  return (
    <Layout>
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Performers</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white font-medium">🥇 Top Performer</span>
              <span className="text-white/80">Coming soon...</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white font-medium">🥈 Runner Up</span>
              <span className="text-white/80">Coming soon...</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-white font-medium">🥉 Third Place</span>
              <span className="text-white/80">Coming soon...</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LeaderboardContent />
    </Suspense>
  );
}
