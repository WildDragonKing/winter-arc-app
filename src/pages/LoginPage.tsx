import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { useStore } from '../store/useStore';

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRedirect, setUseRedirect] = useState(false);
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const setIsOnboarded = useStore((state) => state.setIsOnboarded);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log('🔄 User already logged in, redirecting...');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Check for redirect result on mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('✅ Redirect login successful!', {
            uid: result.user.uid,
            email: result.user.email,
          });
        }
      } catch (err: any) {
        console.error('❌ Redirect result error:', err);
        setError(`Redirect error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    checkRedirectResult();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    console.log('🔐 Starting Google login...');
    console.log('Firebase Auth Config:', {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    });
    console.log('Current URL:', window.location.href);
    console.log('Current Domain:', window.location.hostname);

    try {
      if (useRedirect) {
        console.log('🔄 Using redirect-based login...');
        await signInWithRedirect(auth, googleProvider);
        // Page will reload after redirect, no need to handle result here
      } else {
        console.log('📱 Opening Google Sign-In popup...');
        const result = await signInWithPopup(auth, googleProvider);
        console.log('✅ Login successful!', {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
        });
        console.log('🔄 Waiting for auth state to propagate...');
        // The useAuth hook will handle the rest via onAuthStateChanged
      }
    } catch (err: any) {
      console.error('❌ Login error:', {
        code: err.code,
        message: err.message,
        details: err,
      });

      // Provide user-friendly error messages
      let errorMessage = 'Login fehlgeschlagen';
      const currentDomain = window.location.hostname;

      if (err.code === 'auth/internal-error' || err.code === 'auth/unauthorized-domain') {
        errorMessage = `⚠️ Firebase OAuth nicht konfiguriert. Bitte füge "${currentDomain}" in Firebase Console zu den autorisierten Domains hinzu.`;
        console.error(`📋 Fix: Firebase Console → Authentication → Settings → Authorized domains → Add: ${currentDomain}`);
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login abgebrochen';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup wurde blockiert. Versuche Redirect-Modus.';
        console.log('💡 Switching to redirect mode...');
        setUseRedirect(true);
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.';
      } else {
        errorMessage = `Fehler: ${err.message}`;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Create demo user for testing
    const demoUser = {
      id: 'demo-user-123',
      language: 'de' as const,
      nickname: 'Demo User',
      gender: 'male' as const,
      height: 180,
      weight: 75,
      bodyFat: 15,
      maxPushups: 30,
      groupCode: 'demo-group',
      birthday: '1990-05-15',
      createdAt: new Date('2024-01-01'),
      pushupState: {
        baseReps: 13,
        sets: 5,
        restTime: 60,
      },
    };

    setUser(demoUser);
    setIsOnboarded(true);
  };

  return (
    <div className="min-h-screen-mobile flex items-center justify-center px-4 py-6 app-bg safe-pt safe-pb">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl shadow-xl p-6 md:p-8 text-center">
          {/* Logo/Icon */}
          <div className="mb-8">
            <div className="text-6xl mb-4">❄️</div>
            <h1 className="text-fluid-h1 font-bold text-gray-900 dark:text-white mb-2">
              Winter Arc Tracker
            </h1>
            <p className="text-fluid-base text-gray-600 dark:text-gray-300">
              Track your winter fitness journey
            </p>
          </div>

          {/* Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="touch-target w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-lg px-6 py-3 font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <span>Loading...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              {error.includes('Popup') && (
                <button
                  onClick={() => {
                    setError(null);
                    setUseRedirect(true);
                  }}
                  className="mt-2 text-xs text-red-700 dark:text-red-300 underline"
                >
                  Try redirect mode instead
                </button>
              )}
            </div>
          )}

          {/* Login Mode Toggle */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <button
              onClick={() => setUseRedirect(!useRedirect)}
              className="underline hover:text-gray-700 dark:hover:text-gray-300"
            >
              {useRedirect ? 'Switch to popup mode' : 'Switch to redirect mode'}
            </button>
          </div>

          {/* Demo Mode Button */}
          <button
            onClick={handleDemoLogin}
            className="touch-target w-full mt-4 px-6 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>🧪</span>
            <span>Demo Mode (Testing)</span>
          </button>

          {/* Features */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <div className="text-2xl mb-1">💪</div>
                <div>Pushup Training</div>
              </div>
              <div>
                <div className="text-2xl mb-1">🏃</div>
                <div>Sport Tracking</div>
              </div>
              <div>
                <div className="text-2xl mb-1">💧</div>
                <div>Water & Protein</div>
              </div>
              <div>
                <div className="text-2xl mb-1">📈</div>
                <div>Weight Graph</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
