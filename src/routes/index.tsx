import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Layout from '../components/Layout';
import LoginPage from '../pages/LoginPage';
import OnboardingPage from '../pages/OnboardingPage';
import DashboardPage from '../pages/DashboardPage';
import LeaderboardPage from '../pages/LeaderboardPage';
import SettingsPage from '../pages/SettingsPage';
import PushupTrainingPage from '../pages/PushupTrainingPage';

function AppRoutes() {
  const user = useStore((state) => state.user);
  const isOnboarded = useStore((state) => state.isOnboarded);

  // Not logged in
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Logged in but not onboarded
  if (!isOnboarded) {
    // Check if user has basic data but missing birthday
    const birthdayOnly = user.nickname && user.height && !user.birthday;

    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage birthdayOnly={!!birthdayOnly} />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Logged in and onboarded
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tracking/pushup-training" element={<PushupTrainingPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default AppRoutes;
