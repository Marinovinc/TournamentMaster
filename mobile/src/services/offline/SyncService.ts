/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/services/offline/SyncService.ts
 * Creato: 2026-01-02
 * Descrizione: Servizio sincronizzazione automatica catture offline
 *              Invia catture pendenti quando torna la connessione
 * =============================================================================
 */

import * as LegacyFS from 'expo-file-system/legacy';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import apiClient from '@api/client';
import offlineStorage, { PendingCatch, SyncQueueItem } from './OfflineStorage';
import { useNetworkStore } from '@hooks/useNetwork';

// Task name per background sync
const BACKGROUND_SYNC_TASK = 'TOURNAMENT_MASTER_BACKGROUND_SYNC';

// Configurazione sync
const SYNC_CONFIG = {
  maxRetries: 5,
  retryDelayMs: 30000,        // 30 secondi tra retry
  maxConcurrentUploads: 2,    // Upload paralleli max
  uploadTimeoutMs: 120000,    // 2 minuti timeout upload
};

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  current: string | null;     // ID cattura in sync
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: Array<{ localId: string; error: string }>;
}

type SyncProgressCallback = (progress: SyncProgress) => void;

class SyncServiceClass {
  private isSyncing = false;
  private progressCallback: SyncProgressCallback | null = null;

  /**
   * Registra callback per aggiornamenti progresso
   */
  onProgress(callback: SyncProgressCallback): () => void {
    this.progressCallback = callback;
    return () => { this.progressCallback = null; };
  }

  /**
   * Verifica se sync in corso
   */
  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Esegue sincronizzazione di tutte le catture pendenti
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress, skipping');
      return { success: false, syncedCount: 0, failedCount: 0, errors: [] };
    }

    // Verifica connessione
    const networkState = useNetworkStore.getState();
    const isOnline = networkState.isConnected && networkState.isInternetReachable === true;

    if (!isOnline) {
      console.log('[SyncService] Offline, skipping sync');
      return { success: false, syncedCount: 0, failedCount: 0, errors: [] };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      const pendingCatches = await offlineStorage.getPendingCatches();
      const toSync = pendingCatches.filter(
        c => c.syncStatus === 'pending' || c.syncStatus === 'failed'
      );

      if (toSync.length === 0) {
        console.log('[SyncService] No pending catches to sync');
        await offlineStorage.setLastSync();
        return result;
      }

      console.log(`[SyncService] Starting sync of ${toSync.length} catches`);

      // Aggiorna progresso
      this.updateProgress({
        total: toSync.length,
        completed: 0,
        failed: 0,
        current: null,
      });

      // Sync una alla volta per affidabilita
      for (const pendingCatch of toSync) {
        // Verifica se ancora online
        await networkState.checkConnection();
        if (!networkState.isConnected || networkState.isInternetReachable !== true) {
          console.log('[SyncService] Lost connection during sync, stopping');
          result.success = false;
          break;
        }

        // Skip se troppi tentativi
        if (pendingCatch.syncAttempts >= SYNC_CONFIG.maxRetries) {
          console.log(`[SyncService] Max retries reached for ${pendingCatch.localId}`);
          result.failedCount++;
          result.errors.push({
            localId: pendingCatch.localId,
            error: 'Max retry attempts reached',
          });
          continue;
        }

        this.updateProgress({
          total: toSync.length,
          completed: result.syncedCount,
          failed: result.failedCount,
          current: pendingCatch.localId,
        });

        try {
          await this.syncSingleCatch(pendingCatch);
          result.syncedCount++;
          console.log(`[SyncService] Synced ${pendingCatch.localId}`);
        } catch (error) {
          result.failedCount++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push({ localId: pendingCatch.localId, error: errorMsg });
          console.error(`[SyncService] Failed to sync ${pendingCatch.localId}:`, error);
        }
      }

      // Salva timestamp ultimo sync
      await offlineStorage.setLastSync();

      // Aggiorna progresso finale
      this.updateProgress({
        total: toSync.length,
        completed: result.syncedCount,
        failed: result.failedCount,
        current: null,
      });

      console.log(`[SyncService] Sync complete: ${result.syncedCount} synced, ${result.failedCount} failed`);
    } catch (error) {
      console.error('[SyncService] Sync error:', error);
      result.success = false;
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sincronizza una singola cattura
   */
  private async syncSingleCatch(pendingCatch: PendingCatch): Promise<void> {
    // Aggiorna stato a syncing
    await offlineStorage.updatePendingCatchStatus(pendingCatch.localId, 'syncing');

    try {
      // Prepara FormData
      const formData = new FormData();

      formData.append('tournamentId', pendingCatch.tournamentId);
      formData.append('speciesId', pendingCatch.speciesId);
      formData.append('weight', pendingCatch.weight.toString());
      if (pendingCatch.length) formData.append('length', pendingCatch.length.toString());
      if (pendingCatch.notes) formData.append('notes', pendingCatch.notes);

      // GPS
      formData.append('latitude', pendingCatch.gps.latitude.toString());
      formData.append('longitude', pendingCatch.gps.longitude.toString());
      formData.append('gpsAccuracy', pendingCatch.gps.accuracy.toString());

      // Timestamp cattura (momento originale, non momento sync)
      formData.append('capturedAt', new Date(pendingCatch.capturedAt).toISOString());

      // Flag offline
      formData.append('capturedOffline', 'true');
      formData.append('offlineLocalId', pendingCatch.localId);

      // Aggiungi foto da file locali
      for (let i = 0; i < pendingCatch.localPhotoPaths.length; i++) {
        const photoPath = pendingCatch.localPhotoPaths[i];
        const fileInfo = await LegacyFS.getInfoAsync(photoPath);

        if (fileInfo.exists) {
          formData.append('photos', {
            uri: photoPath,
            type: 'image/jpeg',
            name: `catch_photo_${i}.jpg`,
          } as unknown as Blob);
        } else {
          console.warn(`[SyncService] Photo not found: ${photoPath}`);
        }
      }

      // Aggiungi video se presente
      if (pendingCatch.localVideoPath) {
        const videoInfo = await LegacyFS.getInfoAsync(pendingCatch.localVideoPath);

        if (videoInfo.exists) {
          formData.append('video', {
            uri: pendingCatch.localVideoPath,
            type: 'video/mp4',
            name: 'catch_video.mp4',
          } as unknown as Blob);
        }
      }

      // Invia al server
      await apiClient.post('/catches', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: SYNC_CONFIG.uploadTimeoutMs,
      });

      // Successo: rimuovi da pendenti
      await offlineStorage.removePendingCatch(pendingCatch.localId);
    } catch (error) {
      // Fallimento: aggiorna stato a failed
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await offlineStorage.updatePendingCatchStatus(pendingCatch.localId, 'failed', errorMsg);
      throw error;
    }
  }

  /**
   * Aggiorna progresso sync
   */
  private updateProgress(progress: SyncProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  // ===========================================================================
  // BACKGROUND SYNC (iOS/Android)
  // ===========================================================================

  /**
   * Registra task per background sync
   */
  async registerBackgroundSync(): Promise<void> {
    try {
      // Definisci task (deve essere fatto all'avvio app)
      TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
        console.log('[SyncService] Background sync triggered');

        try {
          const result = await this.syncAll();

          if (result.syncedCount > 0) {
            return BackgroundFetch.BackgroundFetchResult.NewData;
          } else if (result.failedCount > 0) {
            return BackgroundFetch.BackgroundFetchResult.Failed;
          }
          return BackgroundFetch.BackgroundFetchResult.NoData;
        } catch (error) {
          console.error('[SyncService] Background sync error:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Registra per background fetch
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60,  // 15 minuti minimo
        stopOnTerminate: false,    // Continua anche se app chiusa
        startOnBoot: true,         // Avvia dopo reboot
      });

      console.log('[SyncService] Background sync registered');
    } catch (error) {
      console.error('[SyncService] Failed to register background sync:', error);
    }
  }

  /**
   * Deregistra background sync
   */
  async unregisterBackgroundSync(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      console.log('[SyncService] Background sync unregistered');
    } catch (error) {
      console.error('[SyncService] Failed to unregister background sync:', error);
    }
  }

  /**
   * Verifica stato background sync
   */
  async getBackgroundSyncStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
    return BackgroundFetch.getStatusAsync();
  }
}

// Export singleton
export const syncService = new SyncServiceClass();
export default syncService;
