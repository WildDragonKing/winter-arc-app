'use client';

import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [nickname, setNickname] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const setUser = useStore((state) => state.setUser);
  const user = useStore((state) => state.user);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname || !height) {
      return;
    }

    if (!user) {
      console.error('No user session found');
      return;
    }

    // Update user with onboarding data
    const updatedUser = {
      ...user,
      nickname,
      height: parseInt(height),
      weight: weight ? parseFloat(weight) : user.weight,
    };

    setUser(updatedUser);

    // Navigate to dashboard
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-winter-500 to-winter-700 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">❄️</div>
          <h1 className="text-white text-2xl font-bold mb-2">Welcome to Winter Arc</h1>
          <p className="text-winter-200">Let&apos;s set up your profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nickname *
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="Enter your nickname"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Height (cm) *
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="170"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Current Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="70.5"
            />
          </div>

          <button
            type="submit"
            disabled={!nickname || !height}
            className="w-full bg-white text-winter-600 font-semibold py-3 px-4 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}
