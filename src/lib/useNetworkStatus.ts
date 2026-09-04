import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  offlineSince: Date | null;
  reconnect: () => Promise<boolean>;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  const [offlineSince, setOfflineSince] = useState<Date | null>(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return new Date();
    }
    return null;
  });

  const reconnect = useCallback(async (): Promise<boolean> => {
    try {
      // Attempt a lightweight fetch test to verify actual connectivity
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 3000) : null;
      
      const response = await fetch('/favicon.png?_ping=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller?.signal,
      });
      if (timeoutId) clearTimeout(timeoutId);

      const online = response.ok || response.status === 304 || response.status === 200;
      setIsOnline(online);
      if (online) {
        setOfflineSince(null);
      }
      return online;
    } catch {
      const currentNavStatus = typeof navigator !== 'undefined' ? navigator.onLine : false;
      setIsOnline(currentNavStatus);
      if (!currentNavStatus && !offlineSince) {
        setOfflineSince(new Date());
      }
      return currentNavStatus;
    }
  }, [offlineSince]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setOfflineSince(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineSince(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setOfflineSince(new Date());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    offlineSince,
    reconnect,
  };
}
