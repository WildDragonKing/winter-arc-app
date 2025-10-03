import { useEffect } from 'react';

interface PagePerformanceMetrics {
  ttfb?: number; // Time to First Byte
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  tti?: number; // Time to Interactive
}

/**
 * Lightweight performance telemetry hook
 *
 * Tracks Core Web Vitals and logs to console
 * Can be extended to send to analytics service
 */
export function usePagePerf() {
  useEffect(() => {
    // Check if Performance API is available
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    const metrics: PagePerformanceMetrics = {};

    // Get Navigation Timing metrics
    const getNavigationMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        metrics.ttfb = Math.round(navigation.responseStart - navigation.requestStart);
      }
    };

    // Get Paint Timing metrics
    const getPaintMetrics = () => {
      const paintEntries = performance.getEntriesByType('paint');

      for (const entry of paintEntries) {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = Math.round(entry.startTime);
        }
      }
    };

    // Use PerformanceObserver for modern metrics
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
  const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        metrics.lcp = Math.round(lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          if (entry.entryType === 'first-input') {
            const firstInputEntry = entry as PerformanceEventTiming;
            metrics.fid = Math.round(firstInputEntry.processingStart - entry.startTime);
          }
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const clsEntry = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value ?? 0;
            metrics.cls = Math.round(clsValue * 1000) / 1000;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Cleanup observers
      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    } catch (error) {
      console.warn('[Perf] PerformanceObserver not supported:', error);
    }

    // Log metrics after page load
    const logMetrics = () => {
      getNavigationMetrics();
      getPaintMetrics();

      console.info('[Performance Metrics]', {
        'TTFB (ms)': metrics.ttfb,
        'FCP (ms)': metrics.fcp,
        'LCP (ms)': metrics.lcp,
        'FID (ms)': metrics.fid,
        CLS: metrics.cls,
      });

      // Check against thresholds
      const issues: string[] = [];

      if (metrics.ttfb && metrics.ttfb > 800) {
        issues.push(`⚠️ High TTFB: ${metrics.ttfb}ms (target: <800ms)`);
      }

      if (metrics.fcp && metrics.fcp > 1800) {
        issues.push(`⚠️ Slow FCP: ${metrics.fcp}ms (target: <1800ms)`);
      }

      if (metrics.lcp && metrics.lcp > 2500) {
        issues.push(`⚠️ Slow LCP: ${metrics.lcp}ms (target: <2500ms)`);
      }

      if (metrics.fid && metrics.fid > 100) {
        issues.push(`⚠️ High FID: ${metrics.fid}ms (target: <100ms)`);
      }

      if (metrics.cls && metrics.cls > 0.1) {
        issues.push(`⚠️ High CLS: ${metrics.cls} (target: <0.1)`);
      }

      if (issues.length > 0) {
        console.warn('[Performance Issues]', issues);
      } else {
        console.info('✅ All Core Web Vitals within thresholds');
      }

      // Future: Send to analytics
      // sendToAnalytics(metrics);
    };

    // Wait for page load
    if (document.readyState === 'complete') {
      setTimeout(logMetrics, 1000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(logMetrics, 1000);
      });
    }
  }, []);
}

/**
 * Hook for monitoring network status and showing toast
 */
export function useNetworkToast() {
  useEffect(() => {
    const handleOffline = () => {
      console.warn('[Network] Offline - mutations will be queued');
      // Show toast notification
      showToast('You are offline. Changes will sync when connection is restored.', 'warning');
    };

    const handleOnline = () => {
      console.info('[Network] Online - processing queued mutations');
      showToast('Back online! Syncing changes...', 'success');
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}

/**
 * Simple toast notification (can be replaced with a proper toast library)
 */
function showToast(message: string, type: 'success' | 'warning' | 'error') {
  // For now, just console log
  // In production, use a toast library like react-hot-toast or sonner
  const emoji = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
  console.info(`${emoji} ${message}`);
}
