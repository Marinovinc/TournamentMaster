/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/hooks/useNetwork.ts
 * Creato: 2026-01-02
 * Descrizione: Hook per monitorare stato connessione di rete
 *              Attiva sync automatico quando torna la connessione
 * =============================================================================
 */

import { useEffect, useCallback } from 'react';
import { create } from 'zustand';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
  lastCheckedAt: string | null;

  // Actions
  checkConnection: () => Promise<boolean>;
  _updateState: (state: NetInfoState) => void;
}

/**
 * Store Zustand per stato rete (singleton globale)
 */
export const useNetworkStore = create<NetworkState>((set, get) => ({
  isConnected: true,
  isInternetReachable: null,
  type: NetInfoStateType.unknown,
  lastCheckedAt: null,

  checkConnection: async () => {
    const state = await NetInfo.fetch();
    get()._updateState(state);
    return state.isConnected === true && state.isInternetReachable === true;
  },

  _updateState: (state: NetInfoState) => {
    set({
      isConnected: state.isConnected === true,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      lastCheckedAt: new Date().toISOString(),
    });
  },
}));

/**
 * Hook per usare stato rete con auto-subscription
 */
export function useNetwork() {
  const { isConnected, isInternetReachable, type, lastCheckedAt, checkConnection } = useNetworkStore();

  useEffect(() => {
    // Sottoscrivi ai cambiamenti di rete
    const unsubscribe = NetInfo.addEventListener((state) => {
      useNetworkStore.getState()._updateState(state);

      // Log per debug
      console.log('[Network] State changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    // Check iniziale
    checkConnection();

    return () => unsubscribe();
  }, []);

  // Computed: veramente online (connesso E internet raggiungibile)
  const isOnline = isConnected && isInternetReachable === true;

  return {
    isConnected,
    isInternetReachable,
    isOnline,
    type,
    lastCheckedAt,
    checkConnection,
  };
}

/**
 * Hook semplificato che ritorna solo isOnline
 */
export function useIsOnline(): boolean {
  const { isConnected, isInternetReachable } = useNetworkStore();
  return isConnected && isInternetReachable === true;
}

export default useNetwork;
