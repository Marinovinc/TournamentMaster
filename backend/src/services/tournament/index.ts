/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File creato: 2025-12-29
 * Motivo: Barrel export per moduli tournament
 *
 * Struttura directory:
 * src/services/tournament/
 * ├── index.ts                          (questo file)
 * ├── tournament.types.ts               (interfaces)
 * ├── tournament-crud.service.ts        (create, read, update, delete)
 * ├── tournament-lifecycle.service.ts   (publish, start, complete, cancel)
 * ├── tournament-zones.service.ts       (fishing zones)
 * └── tournament-registration.service.ts (registrations)
 *
 * Utilizzo:
 * import { TournamentCrudService, TournamentLifecycleService } from "./tournament";
 * =============================================================================
 */

// Types
export * from "./tournament.types";

// Services
export { TournamentCrudService } from "./tournament-crud.service";
export { TournamentLifecycleService } from "./tournament-lifecycle.service";
export { TournamentZonesService } from "./tournament-zones.service";
export { TournamentRegistrationService } from "./tournament-registration.service";
export { TournamentStatsService } from "./tournament-stats.service";
export { TournamentSchedulerService } from "./tournament-scheduler.service";
export { TournamentProfileService } from "./tournament-profile.service";

// Re-export combined service for backward compatibility
export { TournamentService } from "./tournament.service";
