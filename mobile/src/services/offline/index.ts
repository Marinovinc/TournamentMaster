/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/services/offline/index.ts
 * Creato: 2026-01-02
 * Descrizione: Export centrale servizi offline
 * =============================================================================
 */

export { offlineStorage, OFFLINE_KEYS } from './OfflineStorage';
export type { PendingCatch, SyncStatus, SyncQueueItem, CachedStats } from './OfflineStorage';

export { syncService } from './SyncService';
export type { SyncProgress, SyncResult } from './SyncService';
