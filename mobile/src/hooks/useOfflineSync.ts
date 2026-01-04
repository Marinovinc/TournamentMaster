/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/hooks/useOfflineSync.ts
 * Creato: 2026-01-02
 * Descrizione: Hook globale per gestire sincronizzazione automatica offline
 *              Monitora connessione e avvia sync quando torna online
 * =============================================================================
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

import { syncService, SyncProgress, SyncResult, offlineStorage } from '@services/offline';

export interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  lastSyncResult: SyncResult | null;
  syncProgress: SyncProgress | null;
  syncError: string | null;

  // Actions
  _setOnline: (isOnline: boolean) => void;
  _setSyncing: (isSyncing: boolean) => void;
  _setPendingCount: (count: number) => void;
  _setSyncProgress: (progress: SyncProgress | null) => void;
  _setSyncResult: (result: SyncResult) => void;
  _setSyncError: (error: string | null) => void;
}

/**
 * Store globale per stato sync offline
 */
export const useOfflineSyncStore = create<OfflineSyncState>((set) => ({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  lastSyncResult: null,
  syncProgress: null,
  syncError: null,

  _setOnline: (isOnline) => set({ isOnline }),
  _setSyncing: (isSyncing) => set({ isSyncing }),
  _setPendingCount: (pendingCount) => set({ pendingCount }),
  _setSyncProgress: (syncProgress) => set({ syncProgress }),
  _setSyncResult: (result) =>
    set({
      lastSyncResult: result,
      lastSyncAt: new Date().toISOString(),
    }),
  _setSyncError: (syncError) => set({ syncError }),
}));

/**
 * Hook principale per gestire sync offline
 * Da usare nel componente App root
 */
export function useOfflineSync() {
  const wasOfflineRef = useRef(false);
  const syncInProgressRef = useRef(false);

  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncAt,
    lastSyncResult,
    syncProgress,
    syncError,
    _setOnline,
    _setSyncing,
    _setPendingCount,
    _setSyncProgress,
    _setSyncResult,
    _setSyncError,
  } = useOfflineSyncStore();

  /**
   * Aggiorna conteggio catture pendenti
   */
  const updatePendingCount = useCallback(async () => {
    const count = await offlineStorage.getPendingCount();
    _setPendingCount(count);
  }, []);

  /**
   * Esegui sincronizzazione
   */
  const performSync = useCallback(async () => {
    if (syncInProgressRef.current) {
      console.log('[useOfflineSync] Sync already in progress');
      return;
    }

    const count = await offlineStorage.getPendingCount();
    if (count === 0) {
      console.log('[useOfflineSync] No pending catches to sync');
      return;
    }

    console.log(`[useOfflineSync] Starting sync of ${count} pending catches`);
    syncInProgressRef.current = true;
    _setSyncing(true);
    _setSyncError(null);

    try {
      // Sottoscrivi a progressi
      const unsubscribe = syncService.onProgress((progress) => {
        _setSyncProgress(progress);
      });

      const result = await syncService.syncAll();

      unsubscribe();
      _setSyncResult(result);
      _setSyncProgress(null);

      console.log('[useOfflineSync] Sync complete:', result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Sync failed';
      _setSyncError(errorMsg);
      console.error('[useOfflineSync] Sync error:', error);
    } finally {
      syncInProgressRef.current = false;
      _setSyncing(false);
      await updatePendingCount();
    }
  }, []);

  /**
   * Gestisci cambio stato connessione
   */
  const handleNetworkChange = useCallback(
    async (isConnected: boolean, isInternetReachable: boolean | null) => {
      const nowOnline = isConnected && isInternetReachable === true;
      const wasOffline = wasOfflineRef.current;

      _setOnline(nowOnline);

      // Se torniamo online dopo essere stati offline, avvia sync
      if (nowOnline && wasOffline) {
        console.log('[useOfflineSync] Back online! Starting sync...');
        // Piccolo delay per stabilizzare connessione
        setTimeout(() => {
          performSync();
        }, 2000);
      }

      wasOfflineRef.current = !nowOnline;
    },
    [performSync]
  );

  /**
   * Gestisci cambio stato app (foreground/background)
   */
  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App tornata in foreground - verifica e sync se necessario
        await updatePendingCount();

        const networkState = await NetInfo.fetch();
        const isOnline =
          networkState.isConnected === true &&
          networkState.isInternetReachable === true;

        if (isOnline) {
          const count = await offlineStorage.getPendingCount();
          if (count > 0) {
            console.log('[useOfflineSync] App active with pending catches, syncing...');
            performSync();
          }
        }
      }
    },
    [performSync, updatePendingCount]
  );

  // Setup listeners
  useEffect(() => {
    // Init: carica stato iniziale
    const init = async () => {
      await offlineStorage.initialize();
      await updatePendingCount();

      const lastSync = await offlineStorage.getLastSync();
      if (lastSync) {
        useOfflineSyncStore.setState({ lastSyncAt: lastSync });
      }

      // Registra background sync (se supportato)
      try {
        await syncService.registerBackgroundSync();
      } catch (error) {
        console.log('[useOfflineSync] Background sync not available');
      }
    };
    init();

    // Network listener
    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      handleNetworkChange(
        state.isConnected === true,
        state.isInternetReachable
      );
    });

    // App state listener
    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      unsubscribeNetwork();
      appStateSubscription.remove();
    };
  }, [handleNetworkChange, handleAppStateChange, updatePendingCount]);

  return {
    // State
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncAt,
    lastSyncResult,
    syncProgress,
    syncError,

    // Actions
    sync: performSync,
    refreshPendingCount: updatePendingCount,
  };
}

/**
 * Hook semplificato per ottenere solo conteggio pendenti
 */
export function usePendingCount(): number {
  return useOfflineSyncStore((state) => state.pendingCount);
}

/**
 * Hook per verificare se sync in corso
 */
export function useIsSyncing(): boolean {
  return useOfflineSyncStore((state) => state.isSyncing);
}

export default useOfflineSync;
