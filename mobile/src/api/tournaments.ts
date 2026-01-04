/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/api/tournaments.ts
 * Creato: 2025-12-30
 * Descrizione: API per gestione tornei
 *
 * Dipendenze:
 * - @api/client
 * - @types (Tournament, TournamentFilters)
 *
 * Utilizzato da:
 * - src/screens/TournamentsScreen.tsx
 * - src/screens/TournamentDetailScreen.tsx
 * - src/hooks/useTournaments.ts
 * =============================================================================
 */

import apiClient from './client';
import { Tournament, TournamentDetail, LeaderboardEntry, FishingZone } from '@/types';

export interface TournamentFilters {
  status?: 'DRAFT' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  discipline?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TournamentsResponse {
  data: Tournament[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const tournamentsApi = {
  /**
   * Lista tornei con filtri e paginazione
   */
  getAll: async (filters?: TournamentFilters): Promise<TournamentsResponse> => {
    const response = await apiClient.get<TournamentsResponse>('/tournaments', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Dettaglio singolo torneo
   */
  getById: async (id: string): Promise<TournamentDetail> => {
    const response = await apiClient.get<TournamentDetail>(`/tournaments/${id}`);
    return response.data;
  },

  /**
   * Classifica torneo
   */
  getLeaderboard: async (id: string): Promise<LeaderboardEntry[]> => {
    const response = await apiClient.get<LeaderboardEntry[]>(`/tournaments/${id}/leaderboard`);
    return response.data;
  },

  /**
   * Zone di pesca del torneo (GeoJSON)
   */
  getZones: async (id: string): Promise<FishingZone[]> => {
    const response = await apiClient.get<FishingZone[]>(`/tournaments/${id}/zones`);
    return response.data;
  },

  /**
   * Iscrizione a torneo
   */
  register: async (id: string, data?: { teamName?: string; boatName?: string }): Promise<void> => {
    await apiClient.post(`/tournaments/${id}/register`, data);
  },

  /**
   * Tornei a cui sono iscritto
   */
  getMyTournaments: async (): Promise<Tournament[]> => {
    const response = await apiClient.get<Tournament[]>('/tournaments/my');
    return response.data;
  },

  /**
   * Tornei in corso (live)
   */
  getLive: async (): Promise<Tournament[]> => {
    const response = await apiClient.get<TournamentsResponse>('/tournaments', {
      params: { status: 'IN_PROGRESS' },
    });
    return response.data.data;
  },
};

export default tournamentsApi;
