/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File creato: 2025-12-29
 * Motivo: Barrel export e composizione router modulare
 *
 * Struttura directory:
 * src/routes/tournament/
 * ├── index.ts                          (questo file - router composito)
 * ├── tournament.validators.ts          (regole validazione)
 * ├── tournament-crud.routes.ts         (list, get, create, update, delete)
 * ├── tournament-lifecycle.routes.ts    (publish, start, complete, cancel)
 * ├── tournament-zones.routes.ts        (fishing zones CRUD)
 * └── tournament-registration.routes.ts (registration management)
 *
 * Utilizzo:
 * import tournamentRouter from "./routes/tournament";
 * app.use("/api/tournaments", tournamentRouter);
 * =============================================================================
 */

import { Router } from "express";
import crudRoutes from "./tournament-crud.routes";
import lifecycleRoutes from "./tournament-lifecycle.routes";
import zonesRoutes from "./tournament-zones.routes";
import registrationRoutes from "./tournament-registration.routes";

const router = Router();

// Mount all sub-routers
// CRUD operations (/, /:id)
router.use("/", crudRoutes);

// Lifecycle operations (/:id/publish, /:id/start, /:id/complete, /:id/cancel)
router.use("/", lifecycleRoutes);

// Zone operations (/:id/zones, /:id/zones/:zoneId)
router.use("/", zonesRoutes);

// Registration operations (/:id/register, /:id/participants, /:id/confirm)
router.use("/", registrationRoutes);

export default router;

// Re-export validators for external use
export * from "./tournament.validators";
