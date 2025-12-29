/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/services/tournament.service.ts (righe 9-48)
 * Data refactoring: 2025-12-29
 * Motivo: Separazione tipi per riutilizzo e type safety
 *
 * Contiene:
 * - CreateTournamentData interface
 * - UpdateTournamentData interface
 * - TournamentFilters interface
 * - PaginationOptions interface
 *
 * Utilizzato da tutti i moduli tournament.*.service.ts
 * =============================================================================
 */

import { TournamentStatus, TournamentDiscipline } from "../../types";

/**
 * Data per creare un nuovo torneo
 */
export interface CreateTournamentData {
  name: string;
  description?: string;
  discipline: TournamentDiscipline;
  startDate: Date;
  endDate: Date;
  registrationOpens: Date;
  registrationCloses: Date;
  location: string;
  locationLat?: number;
  locationLng?: number;
  registrationFee?: number;
  maxParticipants?: number;
  minParticipants?: number;
  minWeight?: number;
  maxCatchesPerDay?: number;
  pointsPerKg?: number;
  bonusPoints?: number;
  bannerImage?: string;
  tenantId: string;
  organizerId: string;
}

/**
 * Data per aggiornare un torneo esistente
 */
export interface UpdateTournamentData extends Partial<CreateTournamentData> {
  status?: TournamentStatus;
}

/**
 * Filtri per la ricerca tornei
 */
export interface TournamentFilters {
  tenantId?: string;
  status?: TournamentStatus;
  discipline?: TournamentDiscipline;
  startDateFrom?: Date;
  startDateTo?: Date;
  searchQuery?: string;
}

/**
 * Opzioni di paginazione
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Risultato paginato
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
