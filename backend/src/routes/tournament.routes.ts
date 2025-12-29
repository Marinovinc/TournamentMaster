/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File refactored: 2025-12-29
 * Stato: DEPRECATO - Usare import da "./tournament"
 *
 * Questo file mantiene la backward compatibility re-esportando
 * il router dalla nuova posizione.
 *
 * NUOVA STRUTTURA:
 * src/routes/tournament/
 * ├── index.ts                          (router composito)
 * ├── tournament.validators.ts          (regole validazione)
 * ├── tournament-crud.routes.ts         (CRUD routes)
 * ├── tournament-lifecycle.routes.ts    (lifecycle routes)
 * ├── tournament-zones.routes.ts        (zone routes)
 * └── tournament-registration.routes.ts (registration routes)
 *
 * MIGRAZIONE:
 * // Vecchio import (deprecato ma funzionante)
 * import tournamentRouter from "./routes/tournament.routes";
 *
 * // Nuovo import (raccomandato)
 * import tournamentRouter from "./routes/tournament";
 * =============================================================================
 */

// Re-export router from new location
export { default } from "./tournament";

// Re-export validators
export * from "./tournament";
