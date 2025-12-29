/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File refactored: 2025-12-29
 * Linee originali: 618
 * Linee dopo refactoring: ~80 (facade)
 *
 * Questo file ora e' una FACADE che mantiene la backward compatibility.
 * La logica e' stata spostata in moduli separati:
 *
 * - tournament.types.ts               - Interfaces e tipi
 * - tournament-crud.service.ts        - create, getById, list, update, delete
 * - tournament-lifecycle.service.ts   - publish, start, complete, cancel
 * - tournament-zones.service.ts       - addFishingZone, getFishingZones, etc.
 * - tournament-registration.service.ts - registerParticipant, getParticipants, etc.
 *
 * Per nuovi sviluppi, importare i servizi specifici:
 * import { TournamentCrudService } from "./tournament";
 *
 * Per backward compatibility, continuare a usare:
 * import { TournamentService } from "./tournament.service";
 * =============================================================================
 */

import { TournamentCrudService } from "./tournament-crud.service";
import { TournamentLifecycleService } from "./tournament-lifecycle.service";
import { TournamentZonesService, FishingZoneData } from "./tournament-zones.service";
import { TournamentRegistrationService, RegistrationData } from "./tournament-registration.service";
import {
  CreateTournamentData,
  UpdateTournamentData,
  TournamentFilters,
  PaginationOptions,
} from "./tournament.types";

/**
 * Facade service per backward compatibility
 * Delega tutte le operazioni ai servizi specifici
 */
export class TournamentService {
  // CRUD Operations (delegato a TournamentCrudService)
  static create = TournamentCrudService.create;
  static getById = TournamentCrudService.getById;
  static list = TournamentCrudService.list;
  static update = TournamentCrudService.update;
  static delete = TournamentCrudService.delete;

  // Lifecycle Operations (delegato a TournamentLifecycleService)
  static publish = TournamentLifecycleService.publish;
  static start = TournamentLifecycleService.start;
  static complete = TournamentLifecycleService.complete;
  static cancel = TournamentLifecycleService.cancel;

  // Zone Operations (delegato a TournamentZonesService)
  static addFishingZone = TournamentZonesService.addFishingZone;
  static getFishingZones = TournamentZonesService.getFishingZones;
  static updateFishingZone = TournamentZonesService.updateFishingZone;
  static removeFishingZone = TournamentZonesService.removeFishingZone;

  // Registration Operations (delegato a TournamentRegistrationService)
  static registerParticipant = TournamentRegistrationService.registerParticipant;
  static getParticipants = TournamentRegistrationService.getParticipants;
  static cancelRegistration = TournamentRegistrationService.cancelRegistration;
  static confirmRegistration = TournamentRegistrationService.confirmRegistration;
}

export default TournamentService;

// Re-export types for convenience
export type {
  CreateTournamentData,
  UpdateTournamentData,
  TournamentFilters,
  PaginationOptions,
  FishingZoneData,
  RegistrationData,
};
