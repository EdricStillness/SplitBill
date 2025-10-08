import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { syncWithServer } from '../services/api';

let syncInterval: NodeJS.Timeout | null = null;

export function useSync() {
  const sync = useCallback(async () => {
    try {
      await syncWithServer();
    } catch (error) {
      console.warn('Background sync failed:', error);
    }
  }, []);

  useEffect(() => {
    // Initial sync
    sync();

    // Sync when app becomes active
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        sync();
      }
    });

    // Periodic sync every 30 seconds when app is active
    syncInterval = setInterval(() => {
      if (AppState.currentState === 'active') {
        sync();
      }
    }, 30000);

    return () => {
      subscription.remove();
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [sync]);

  return { sync };
}

