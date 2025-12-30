/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/api/catches.ts
 * Creato: 2025-12-30
 * Descrizione: API per gestione catture (submit, view, validate)
 *
 * Dipendenze:
 * - @api/client
 * - @types (Catch, CatchSubmission)
 *
 * Utilizzato da:
 * - src/screens/SubmitCatchScreen.tsx
 * - src/screens/MyCatchesScreen.tsx
 * - src/hooks/useCatches.ts
 * =============================================================================
 */

import apiClient from './client';
import { Catch, CatchSubmission, Species } from '@/types';

export const catchesApi = {
  /**
   * Invia nuova cattura
   */
  submit: async (data: CatchSubmission): Promise<Catch> => {
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
   * Le mie catture (per un torneo specifico o tutte)
   */
  getMyCatches: async (tournamentId?: string): Promise<Catch[]> => {
    const response = await apiClient.get<Catch[]>('/catches/my', {
      params: tournamentId ? { tournamentId } : undefined,
    });
    return response.data;
  },

  /**
   * Dettaglio singola cattura
   */
  getById: async (id: string): Promise<Catch> => {
    const response = await apiClient.get<Catch>(`/catches/${id}`);
    return response.data;
  },

  /**
   * Lista specie disponibili per un torneo
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
};

export default catchesApi;
