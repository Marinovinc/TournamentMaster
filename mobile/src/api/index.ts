/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/api/index.ts
 * Creato: 2025-12-30
 * Descrizione: Barrel export per tutti i moduli API
 * =============================================================================
 */

export { default as apiClient, STORAGE_KEYS } from './client';
export { authApi } from './auth';
export { tournamentsApi } from './tournaments';
export { catchesApi } from './catches';
