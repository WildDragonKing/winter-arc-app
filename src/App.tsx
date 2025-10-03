import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { usePagePerf, useNetworkToast } from './hooks/usePagePerf';

function App() {
  // Initialize Firebase authentication listener
  useAuth();

  // Track page performance
  usePagePerf();

  // Show network status toasts
  useNetworkToast();

  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AppRoutes />
        <PWAInstallPrompt />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
