'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import PushupTile from '../components/PushupTile';
import WeightTile from '../components/WeightTile';
import HydrationTile from '../components/HydrationTile';
import NutritionTile from '../components/NutritionTile';
import TrainingLoadGraph from '../components/TrainingLoadGraph';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import SystemIndicator from '../components/SystemIndicator';
import { CardSkeleton } from '../components/ui/Skeleton';

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

function DashboardContent() {
  const router = useRouter();
  const { status, user: authUser, isOnboarded: authIsOnboarded } = useAuth();
  const storeUser = useStore((state) => state.user);
  const storeIsOnboarded = useStore((state) => state.isOnboarded);
  const authLoading = useStore((state) => state.authLoading);

  const effectiveUser = storeUser ?? authUser;
  const effectiveIsOnboarded = storeUser ? storeIsOnboarded : authIsOnboarded;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== 'authenticated' || !effectiveUser) {
      return;
    }

    if (!effectiveIsOnboarded) {
      router.replace('/onboarding');
    }
  }, [effectiveIsOnboarded, effectiveUser, router, status]);

  if (authLoading || !effectiveUser || !effectiveIsOnboarded) {
    return <LoadingScreen />;
  }

  return (
    <Layout>
      <div className="space-y-6 p-4">
        {/* Main Tracking Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Suspense fallback={<CardSkeleton />}>
            <PushupTile />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <WeightTile />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <HydrationTile />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <NutritionTile />
          </Suspense>
        </div>

        {/* Training Load Graph */}
        <div className="mt-8">
          <Suspense fallback={<CardSkeleton />}>
            <TrainingLoadGraph />
          </Suspense>
        </div>
      </div>

      {/* Global Components */}
      <PWAInstallPrompt />
      <SystemIndicator />
    </Layout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-winter-500 to-winter-700">
          <div className="text-center">
            <div className="text-6xl mb-4">❄️</div>
            <div className="text-white text-lg font-semibold">Loading...</div>
          </div>
        </div>
      }
    >
      <Suspense fallback={<LoadingScreen />}>
        <DashboardContent />
      </Suspense>
    </Suspense>
  );
}
