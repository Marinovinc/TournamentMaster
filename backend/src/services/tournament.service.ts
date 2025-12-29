/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File refactored: 2025-12-29
 * Stato: DEPRECATO - Usare import da "./tournament"
 *
 * Questo file mantiene la backward compatibility re-esportando
 * il TournamentService dalla nuova posizione.
 *
 * NUOVA STRUTTURA:
 * src/services/tournament/
 * ├── index.ts                          (barrel export)
 * ├── tournament.types.ts               (interfaces)
 * ├── tournament-crud.service.ts        (create, read, update, delete)
 * ├── tournament-lifecycle.service.ts   (publish, start, complete)
 * ├── tournament-zones.service.ts       (fishing zones)
 * ├── tournament-registration.service.ts (registrations)
 * └── tournament.service.ts             (facade)
 *
 * MIGRAZIONE:
 * // Vecchio import (deprecato ma funzionante)
 * import { TournamentService } from "./tournament.service";
 *
 * // Nuovo import (raccomandato)
 * import { TournamentService } from "./tournament";
 * // Oppure importa servizi specifici:
 * import { TournamentCrudService, TournamentLifecycleService } from "./tournament";
 * =============================================================================
 */

// Re-export everything from new location
export * from "./tournament";
export { TournamentService } from "./tournament";
export { default } from "./tournament/tournament.service";
