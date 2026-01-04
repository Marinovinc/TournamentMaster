/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/services/offline/OfflineStorage.ts
 * Creato: 2026-01-02
 * Descrizione: Servizio storage locale per funzionamento offline
 *              Salva catture, tornei, statistiche per uso senza internet
 * =============================================================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LegacyFS from 'expo-file-system/legacy';
import { Catch, Tournament, CatchSubmission } from '@/types';

// Storage keys
export const OFFLINE_KEYS = {
  PENDING_CATCHES: '@offline/pending_catches',
  CACHED_TOURNAMENTS: '@offline/cached_tournaments',
  CACHED_CATCHES: '@offline/cached_catches',
  CACHED_STATS: '@offline/cached_stats',
  SYNC_QUEUE: '@offline/sync_queue',
  LAST_SYNC: '@offline/last_sync',
};

// Directory per file media offline
const OFFLINE_MEDIA_DIR = `${LegacyFS.documentDirectory || ''}offline_media/`;

// Tipi per catture pendenti
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface PendingCatch extends Omit<CatchSubmission, 'photos' | 'video'> {
  localId: string;           // UUID generato localmente
  syncStatus: SyncStatus;
  createdAt: string;         // ISO timestamp
  syncAttempts: number;
  lastSyncError?: string;
  localPhotoPaths: string[]; // Path locali delle foto
  localVideoPath?: string;   // Path locale del video
}

export interface SyncQueueItem {
  id: string;
  type: 'catch' | 'update' | 'delete';
  data: PendingCatch;
  priority: number;          // 1 = alta, 5 = bassa
  createdAt: string;
}

export interface CachedStats {
  totalCatches: number;
  totalWeight: number;
  activeTournaments: number;
  pendingValidation: number;
  lastUpdated: string;
}

class OfflineStorageService {
  private initialized = false;

  /**
   * Inizializza lo storage (crea directory se necessario)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Crea directory per media offline
      const dirInfo = await LegacyFS.getInfoAsync(OFFLINE_MEDIA_DIR);
      if (!dirInfo.exists) {
        await LegacyFS.makeDirectoryAsync(OFFLINE_MEDIA_DIR, { intermediates: true });
      }
      this.initialized = true;
      console.log('[OfflineStorage] Initialized');
    } catch (error) {
      console.error('[OfflineStorage] Init error:', error);
      throw error;
    }
  }

  // ===========================================================================
  // CATTURE PENDENTI (Offline-first)
  // ===========================================================================

  /**
   * Salva una nuova cattura localmente
   * @returns localId della cattura creata
   */
  async savePendingCatch(catch_data: CatchSubmission): Promise<string> {
    await this.initialize();

    const localId = this.generateUUID();
    const localPhotoPaths: string[] = [];
    let localVideoPath: string | undefined;

    // Salva foto localmente
    for (let i = 0; i < catch_data.photos.length; i++) {
      const photo = catch_data.photos[i];
      const localPath = `${OFFLINE_MEDIA_DIR}${localId}_photo_${i}.jpg`;
      await LegacyFS.copyAsync({ from: photo.uri, to: localPath });
      localPhotoPaths.push(localPath);
    }

    // Salva video se presente
    if (catch_data.video) {
      localVideoPath = `${OFFLINE_MEDIA_DIR}${localId}_video.mp4`;
      await LegacyFS.copyAsync({ from: catch_data.video.uri, to: localVideoPath });
    }

    // Crea oggetto cattura pendente
    const pendingCatch: PendingCatch = {
      localId,
      tournamentId: catch_data.tournamentId,
      speciesId: catch_data.speciesId,
      weight: catch_data.weight,
      length: catch_data.length,
      notes: catch_data.notes,
      gps: catch_data.gps,
      capturedAt: catch_data.capturedAt,
      localPhotoPaths,
      localVideoPath,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      syncAttempts: 0,
    };

    // Aggiungi alla lista pendenti
    const pending = await this.getPendingCatches();
    pending.push(pendingCatch);
    await AsyncStorage.setItem(OFFLINE_KEYS.PENDING_CATCHES, JSON.stringify(pending));

    // Aggiungi alla coda sync
    await this.addToSyncQueue({
      id: localId,
      type: 'catch',
      data: pendingCatch,
      priority: 1,
      createdAt: new Date().toISOString(),
    });

    console.log(`[OfflineStorage] Saved pending catch: ${localId}`);
    return localId;
  }

  /**
   * Recupera tutte le catture pendenti
   */
  async getPendingCatches(): Promise<PendingCatch[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_KEYS.PENDING_CATCHES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[OfflineStorage] Error getting pending catches:', error);
      return [];
    }
  }

  /**
   * Conta le catture pendenti
   */
  async getPendingCount(): Promise<number> {
    const pending = await this.getPendingCatches();
    return pending.filter(c => c.syncStatus === 'pending' || c.syncStatus === 'failed').length;
  }

  /**
   * Aggiorna lo stato di una cattura pendente
   */
  async updatePendingCatchStatus(
    localId: string,
    status: SyncStatus,
    error?: string
  ): Promise<void> {
    const pending = await this.getPendingCatches();
    const index = pending.findIndex(c => c.localId === localId);

    if (index !== -1) {
      pending[index].syncStatus = status;
      pending[index].syncAttempts += 1;
      if (error) pending[index].lastSyncError = error;
      await AsyncStorage.setItem(OFFLINE_KEYS.PENDING_CATCHES, JSON.stringify(pending));
    }
  }

  /**
   * Rimuove una cattura pendente (dopo sync riuscito)
   */
  async removePendingCatch(localId: string): Promise<void> {
    const pending = await this.getPendingCatches();
    const catchToRemove = pending.find(c => c.localId === localId);

    if (catchToRemove) {
      // Elimina file media locali
      for (const path of catchToRemove.localPhotoPaths) {
        try {
          await LegacyFS.deleteAsync(path, { idempotent: true });
        } catch (e) { /* ignora */ }
      }
      if (catchToRemove.localVideoPath) {
        try {
          await LegacyFS.deleteAsync(catchToRemove.localVideoPath, { idempotent: true });
        } catch (e) { /* ignora */ }
      }
    }

    const filtered = pending.filter(c => c.localId !== localId);
    await AsyncStorage.setItem(OFFLINE_KEYS.PENDING_CATCHES, JSON.stringify(filtered));

    // Rimuovi dalla coda sync
    await this.removeFromSyncQueue(localId);
  }

  // ===========================================================================
  // CACHE TORNEI E STATISTICHE
  // ===========================================================================

  /**
   * Salva tornei in cache per visualizzazione offline
   */
  async cacheTournaments(tournaments: Tournament[]): Promise<void> {
    await AsyncStorage.setItem(
      OFFLINE_KEYS.CACHED_TOURNAMENTS,
      JSON.stringify({ data: tournaments, cachedAt: new Date().toISOString() })
    );
  }

  /**
   * Recupera tornei dalla cache
   */
  async getCachedTournaments(): Promise<{ data: Tournament[], cachedAt: string } | null> {
    try {
      const cached = await AsyncStorage.getItem(OFFLINE_KEYS.CACHED_TOURNAMENTS);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Salva catture dell'utente in cache
   */
  async cacheMyCatches(catches: Catch[]): Promise<void> {
    await AsyncStorage.setItem(
      OFFLINE_KEYS.CACHED_CATCHES,
      JSON.stringify({ data: catches, cachedAt: new Date().toISOString() })
    );
  }

  /**
   * Recupera catture dalla cache
   */
  async getCachedCatches(): Promise<{ data: Catch[], cachedAt: string } | null> {
    try {
      const cached = await AsyncStorage.getItem(OFFLINE_KEYS.CACHED_CATCHES);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Salva statistiche in cache
   */
  async cacheStats(stats: CachedStats): Promise<void> {
    await AsyncStorage.setItem(OFFLINE_KEYS.CACHED_STATS, JSON.stringify(stats));
  }

  /**
   * Recupera statistiche dalla cache
   */
  async getCachedStats(): Promise<CachedStats | null> {
    try {
      const cached = await AsyncStorage.getItem(OFFLINE_KEYS.CACHED_STATS);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  // ===========================================================================
  // CODA SINCRONIZZAZIONE
  // ===========================================================================

  /**
   * Aggiungi item alla coda sync
   */
  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    const queue = await this.getSyncQueue();
    queue.push(item);
    // Ordina per priorita
    queue.sort((a, b) => a.priority - b.priority);
    await AsyncStorage.setItem(OFFLINE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  }

  /**
   * Recupera coda sync
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Rimuovi item dalla coda
   */
  async removeFromSyncQueue(id: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const filtered = queue.filter(item => item.id !== id);
    await AsyncStorage.setItem(OFFLINE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
  }

  /**
   * Salva timestamp ultimo sync
   */
  async setLastSync(): Promise<void> {
    await AsyncStorage.setItem(OFFLINE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  /**
   * Recupera timestamp ultimo sync
   */
  async getLastSync(): Promise<string | null> {
    return AsyncStorage.getItem(OFFLINE_KEYS.LAST_SYNC);
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Genera UUID v4 locale
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Pulisci tutti i dati offline (per logout)
   */
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(OFFLINE_KEYS));

    // Pulisci directory media
    try {
      await LegacyFS.deleteAsync(OFFLINE_MEDIA_DIR, { idempotent: true });
      await LegacyFS.makeDirectoryAsync(OFFLINE_MEDIA_DIR, { intermediates: true });
    } catch (error) {
      console.error('[OfflineStorage] Error clearing media dir:', error);
    }
  }

  /**
   * Ottieni spazio usato in bytes
   */
  async getStorageSize(): Promise<number> {
    let totalSize = 0;

    try {
      // Dimensione AsyncStorage (approssimata)
      for (const key of Object.values(OFFLINE_KEYS)) {
        const value = await AsyncStorage.getItem(key);
        if (value) totalSize += value.length * 2; // UTF-16
      }

      // Dimensione file media
      const dirInfo = await LegacyFS.getInfoAsync(OFFLINE_MEDIA_DIR);
      if (dirInfo.exists) {
        const files = await LegacyFS.readDirectoryAsync(OFFLINE_MEDIA_DIR);
        for (const file of files) {
          const fileInfo = await LegacyFS.getInfoAsync(`${OFFLINE_MEDIA_DIR}${file}`);
          if (fileInfo.exists && 'size' in fileInfo) {
            totalSize += fileInfo.size || 0;
          }
        }
      }
    } catch (error) {
      console.error('[OfflineStorage] Error calculating size:', error);
    }

    return totalSize;
  }
}

// Export singleton
export const offlineStorage = new OfflineStorageService();
export default offlineStorage;
