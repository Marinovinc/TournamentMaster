/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/api/catches.ts
 * Creato: 2025-12-30
 * Aggiornato: 2026-01-02 - Aggiunto supporto offline-first
 * Descrizione: API per gestione catture con supporto offline
 *
 * Dipendenze:
 * - @api/client
 * - @types (Catch, CatchSubmission)
 * - @services/offline (OfflineStorage, SyncService)
 * - @hooks/useNetwork
 *
 * Utilizzato da:
 * - src/screens/SubmitCatchScreen.tsx
 * - src/screens/MyCatchesScreen.tsx
 * - src/hooks/useCatches.ts
 * =============================================================================
 */

import apiClient from './client';
import { Catch, CatchSubmission, Species } from '@/types';
import { offlineStorage, syncService, PendingCatch } from '@services/offline';
import { useNetworkStore } from '@hooks/useNetwork';

export interface SubmitResult {
  success: boolean;
  localId?: string;       // Se salvato offline
  catch?: Catch;          // Se inviato online
  savedOffline: boolean;
}

export const catchesApi = {
  /**
   * Invia nuova cattura (OFFLINE-FIRST)
   * - Se online: invia subito al server
   * - Se offline: salva localmente e sincronizza dopo
   */
  submit: async (data: CatchSubmission): Promise<SubmitResult> => {
    const networkState = useNetworkStore.getState();
    const isOnline = networkState.isConnected && networkState.isInternetReachable === true;

    // SEMPRE salva prima localmente (per sicurezza)
    const localId = await offlineStorage.savePendingCatch(data);
    console.log(`[CatchesAPI] Saved locally: ${localId}`);

    if (isOnline) {
      // Prova a sincronizzare immediatamente
      try {
        const result = await syncService.syncAll();

        if (result.syncedCount > 0) {
          // Successo - cattura inviata
          return {
            success: true,
            savedOffline: false,
          };
        } else {
          // Sync fallito ma salvato localmente
          return {
            success: true,
            localId,
            savedOffline: true,
          };
        }
      } catch (error) {
        console.error('[CatchesAPI] Sync failed after save:', error);
        return {
          success: true,
          localId,
          savedOffline: true,
        };
      }
    } else {
      // Offline - cattura salvata localmente
      console.log('[CatchesAPI] Offline - saved for later sync');
      return {
        success: true,
        localId,
        savedOffline: true,
      };
    }
  },

  /**
   * [LEGACY] Invia direttamente (usare submit() invece)
   */
  submitDirect: async (data: CatchSubmission): Promise<Catch> => {
    const formData = new FormData();

    // Aggiungi dati base
    formData.append('tournamentId', data.tournamentId);
    formData.append('speciesId', data.speciesId);
    formData.append('weight', data.weight.toString());
    if (data.length) formData.append('length', data.length.toString());
    if (data.notes) formData.append('notes', data.notes);

    // Aggiungi coordinate GPS
    formData.append('latitude', data.gps.latitude.toString());
    formData.append('longitude', data.gps.longitude.toString());
    formData.append('gpsAccuracy', data.gps.accuracy.toString());

    // Aggiungi timestamp cattura
    formData.append('capturedAt', data.capturedAt.toISOString());

    // Aggiungi foto (obbligatoria)
    data.photos.forEach((photo, index) => {
      formData.append('photos', {
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.name || `catch_photo_${index}.jpg`,
      } as unknown as Blob);
    });

    // Aggiungi video (opzionale)
    if (data.video) {
      formData.append('video', {
        uri: data.video.uri,
        type: data.video.type || 'video/mp4',
        name: data.video.name || 'catch_video.mp4',
      } as unknown as Blob);
    }

    const response = await apiClient.post<Catch>('/catches', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60s per upload
    });

    return response.data;
  },

  /**
   * Le mie catture (OFFLINE-FIRST)
   * - Se online: fetch da server + aggiorna cache
   * - Se offline: restituisci dalla cache
   */
  getMyCatches: async (tournamentId?: string): Promise<Catch[]> => {
    const networkState = useNetworkStore.getState();
    const isOnline = networkState.isConnected && networkState.isInternetReachable === true;

    if (isOnline) {
      try {
        const response = await apiClient.get<Catch[]>('/catches/my', {
          params: tournamentId ? { tournamentId } : undefined,
        });

        // Aggiorna cache
        await offlineStorage.cacheMyCatches(response.data);

        return response.data;
      } catch (error) {
        console.error('[CatchesAPI] Failed to fetch catches online:', error);
        // Fallback a cache
        const cached = await offlineStorage.getCachedCatches();
        return cached?.data || [];
      }
    } else {
      // Offline - usa cache
      const cached = await offlineStorage.getCachedCatches();
      return cached?.data || [];
    }
  },

  /**
   * Catture pendenti (non ancora sincronizzate)
   */
  getPendingCatches: async (): Promise<PendingCatch[]> => {
    return offlineStorage.getPendingCatches();
  },

  /**
   * Conta catture pendenti
   */
  getPendingCount: async (): Promise<number> => {
    return offlineStorage.getPendingCount();
  },

  /**
   * Dettaglio singola cattura
   */
  getById: async (id: string): Promise<Catch> => {
    const response = await apiClient.get<Catch>(`/catches/${id}`);
    return response.data;
  },

  /**
   * Lista specie disponibili per un torneo (con cache)
   */
  getSpecies: async (tournamentId: string): Promise<Species[]> => {
    const response = await apiClient.get<Species[]>(`/tournaments/${tournamentId}/species`);
    return response.data;
  },

  /**
   * [GIUDICE] Catture in attesa di validazione
   */
  getPending: async (tournamentId: string): Promise<Catch[]> => {
    const response = await apiClient.get<Catch[]>(`/tournaments/${tournamentId}/catches/pending`);
    return response.data;
  },

  /**
   * [GIUDICE] Approva cattura
   */
  approve: async (id: string, data?: { weight?: number; length?: number }): Promise<Catch> => {
    const response = await apiClient.put<Catch>(`/catches/${id}/approve`, data);
    return response.data;
  },

  /**
   * [GIUDICE] Rifiuta cattura
   */
  reject: async (id: string, reason: string): Promise<Catch> => {
    const response = await apiClient.put<Catch>(`/catches/${id}/reject`, { reason });
    return response.data;
  },

  /**
   * Forza sincronizzazione manuale
   */
  forceSync: async () => {
    return syncService.syncAll();
  },
};

export default catchesApi;
