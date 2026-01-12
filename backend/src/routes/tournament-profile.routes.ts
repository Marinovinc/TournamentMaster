/**
 * =============================================================================
 * Tournament Profile Routes - Gestione Profili Torneo
 * =============================================================================
 * Endpoint per:
 * - Lista profili (sistema FIPSAS + associazione)
 * - Dettaglio profilo
 * - Creazione profilo associazione
 * - Fork profilo (Copy on Write)
 * - Aggiornamento profilo associazione
 * - Eliminazione profilo associazione
 * - Lista profili disponibili per creazione torneo
 *
 * Pattern: Copy on Write
 * - I profili FIPSAS (isSystemProfile=true) sono read-only
 * - Modificare un profilo sistema crea una copia per l'associazione
 * - basedOnId traccia il profilo di origine
 */

import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole, TournamentDiscipline, GameMode } from "../types";
import { TournamentProfileService } from "../services/tournament/tournament-profile.service";

const router = Router();

// =============================================================================
// VALIDATION RULES
// =============================================================================

const createProfileValidation = [
  body("name").trim().notEmpty().withMessage("Nome profilo richiesto"),
  body("description").optional().trim(),
  body("basedOnId").optional().isUUID().withMessage("ID profilo base deve essere UUID valido"),
  body("discipline")
    .isIn(Object.values(TournamentDiscipline))
    .withMessage("Disciplina non valida"),
  body("level")
    .optional()
    .isIn(["CLUB", "PROVINCIAL", "REGIONAL", "NATIONAL", "INTERNATIONAL"]),
  body("gameMode")
    .optional()
    .isIn(Object.values(GameMode)),
  body("followsFipsasRules").optional().isBoolean(),
  body("fipsasRegulationUrl").optional().isURL().withMessage("URL regolamento non valido"),
  body("defaultMinWeight").optional().isFloat({ min: 0 }),
  body("defaultMaxCatchesPerDay").optional().isInt({ min: 1 }),
  body("defaultPointsPerKg").optional().isFloat({ min: 0 }),
  body("defaultBonusPoints").optional().isInt({ min: 0 }),
  body("speciesScoringConfig").optional().isArray(),
  body("allowedSpeciesIds").optional().isArray(),
];

const updateProfileValidation = [
  body("name").optional().trim().notEmpty(),
  body("description").optional().trim(),
  body("discipline")
    .optional()
    .isIn(Object.values(TournamentDiscipline)),
  body("level")
    .optional()
    .isIn(["CLUB", "PROVINCIAL", "REGIONAL", "NATIONAL", "INTERNATIONAL"]),
  body("gameMode")
    .optional()
    .isIn(Object.values(GameMode)),
  body("followsFipsasRules").optional().isBoolean(),
  body("fipsasRegulationUrl").optional().isURL(),
  body("defaultMinWeight").optional().isFloat({ min: 0 }),
  body("defaultMaxCatchesPerDay").optional().isInt({ min: 1 }),
  body("defaultPointsPerKg").optional().isFloat({ min: 0 }),
  body("defaultBonusPoints").optional().isInt({ min: 0 }),
  body("speciesScoringConfig").optional().isArray(),
  body("allowedSpeciesIds").optional().isArray(),
  body("isActive").optional().isBoolean(),
  body("displayOrder").optional().isInt({ min: 0 }),
];

const forkProfileValidation = [
  body("name").optional().trim().notEmpty(),
  body("description").optional().trim(),
  body("discipline")
    .optional()
    .isIn(Object.values(TournamentDiscipline)),
  body("level")
    .optional()
    .isIn(["CLUB", "PROVINCIAL", "REGIONAL", "NATIONAL", "INTERNATIONAL"]),
  body("gameMode")
    .optional()
    .isIn(Object.values(GameMode)),
  body("followsFipsasRules").optional().isBoolean(),
  body("fipsasRegulationUrl").optional().isURL(),
  body("defaultMinWeight").optional().isFloat({ min: 0 }),
  body("defaultMaxCatchesPerDay").optional().isInt({ min: 1 }),
  body("defaultPointsPerKg").optional().isFloat({ min: 0 }),
  body("defaultBonusPoints").optional().isInt({ min: 0 }),
  body("speciesScoringConfig").optional().isArray(),
  body("allowedSpeciesIds").optional().isArray(),
];

// =============================================================================
// GET /api/tournament-profiles - Lista profili
// =============================================================================
/**
 * Lista profili torneo (sistema + associazione)
 * - Super Admin: tutti i profili sistema + tutti i profili tenant
 * - Tenant Admin/President: profili sistema + profili della propria associazione
 */
router.get(
  "/",
  authenticate,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.PRESIDENT,
    UserRole.ORGANIZER
  ),
  [
    query("discipline").optional().isIn(Object.values(TournamentDiscipline)),
    query("gameMode").optional().isIn(Object.values(GameMode)),
    query("isActive").optional().isBoolean(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Determine tenantId based on user role
      let tenantId: string | undefined;

      if (req.user?.role === UserRole.SUPER_ADMIN) {
        // Super admin can filter by tenantId or see all
        tenantId = req.query.tenantId as string | undefined;
      } else {
        // Other users can only see their tenant's profiles
        tenantId = req.user?.tenantId;
      }

      const filters = {
        discipline: req.query.discipline as TournamentDiscipline | undefined,
        gameMode: req.query.gameMode as GameMode | undefined,
        isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
      };

      const profiles = await TournamentProfileService.list(tenantId, filters);

      res.json({
        success: true,
        data: profiles,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to list profiles";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/tournament-profiles/available - Profili disponibili per creazione torneo
// =============================================================================
/**
 * Lista profili attivi disponibili per creare un nuovo torneo
 * Ritorna solo i profili attivi (sistema + associazione)
 */
router.get(
  "/available",
  authenticate,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.PRESIDENT,
    UserRole.ORGANIZER
  ),
  [
    query("discipline").optional().isIn(Object.values(TournamentDiscipline)),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Determine tenantId
      let tenantId: string | undefined;

      if (req.user?.role === UserRole.SUPER_ADMIN && req.query.tenantId) {
        tenantId = req.query.tenantId as string;
      } else {
        tenantId = req.user?.tenantId;
      }

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Associazione non specificata",
        });
      }

      const discipline = req.query.discipline as TournamentDiscipline | undefined;
      const profiles = await TournamentProfileService.getAvailableForTournament(
        tenantId,
        discipline
      );

      res.json({
        success: true,
        data: profiles,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to list available profiles";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/tournament-profiles/:id - Dettaglio profilo
// =============================================================================
router.get(
  "/:id",
  authenticate,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.PRESIDENT,
    UserRole.ORGANIZER
  ),
  param("id").isUUID().withMessage("ID profilo non valido"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const profile = await TournamentProfileService.getById(req.params.id);

      // Check access: system profiles are visible to all, tenant profiles only to their tenant
      if (
        !profile.isSystemProfile &&
        profile.tenantId !== req.user?.tenantId &&
        req.user?.role !== UserRole.SUPER_ADMIN
      ) {
        return res.status(403).json({
          success: false,
          message: "Non autorizzato a visualizzare questo profilo",
        });
      }

      res.json({ success: true, data: profile });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get profile";
      const status = message === "Profile not found" ? 404 : 500;
      res.status(status).json({ success: false, message });
    }
  }
);

// =============================================================================
// POST /api/tournament-profiles - Crea nuovo profilo associazione
// =============================================================================
/**
 * Crea un nuovo profilo per l'associazione
 * Non crea profili sistema (isSystemProfile=false)
 */
router.post(
  "/",
  authenticate,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.PRESIDENT
  ),
  createProfileValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Determine tenantId
      let tenantId: string | undefined;

      if (req.user?.role === UserRole.SUPER_ADMIN && req.body.tenantId) {
        tenantId = req.body.tenantId;
      } else {
        tenantId = req.user?.tenantId;
      }

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Associazione non specificata",
        });
      }

      const profile = await TournamentProfileService.create(tenantId, {
        name: req.body.name,
        description: req.body.description,
        basedOnId: req.body.basedOnId,
        discipline: req.body.discipline,
        level: req.body.level,
        gameMode: req.body.gameMode,
        followsFipsasRules: req.body.followsFipsasRules,
        fipsasRegulationUrl: req.body.fipsasRegulationUrl,
        defaultMinWeight: req.body.defaultMinWeight,
        defaultMaxCatchesPerDay: req.body.defaultMaxCatchesPerDay,
        defaultPointsPerKg: req.body.defaultPointsPerKg,
        defaultBonusPoints: req.body.defaultBonusPoints,
        speciesScoringConfig: req.body.speciesScoringConfig,
        allowedSpeciesIds: req.body.allowedSpeciesIds,
      });

      res.status(201).json({
        success: true,
        message: "Profilo creato con successo",
        data: profile,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create profile";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// POST /api/tournament-profiles/:id/fork - Fork profilo (Copy on Write)
// =============================================================================
/**
 * Crea una copia personalizzata di un profilo esistente
 * Utile per modificare un profilo FIPSAS standard
 */
router.post(
  "/:id/fork",
  authenticate,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.PRESIDENT
  ),
  param("id").isUUID().withMessage("ID profilo non valido"),
  forkProfileValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Determine tenantId
      let tenantId: string | undefined;

      if (req.user?.role === UserRole.SUPER_ADMIN && req.body.tenantId) {
        tenantId = req.body.tenantId;
      } else {
        tenantId = req.user?.tenantId;
      }

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Associazione non specificata",
        });
      }

      const forkedProfile = await TournamentProfileService.fork(
        req.params.id,
        tenantId,
        {
          name: req.body.name,
          description: req.body.description,
          discipline: req.body.discipline,
          level: req.body.level,
          gameMode: req.body.gameMode,
          followsFipsasRules: req.body.followsFipsasRules,
          fipsasRegulationUrl: req.body.fipsasRegulationUrl,
          defaultMinWeight: req.body.defaultMinWeight,
          defaultMaxCatchesPerDay: req.body.defaultMaxCatchesPerDay,
          defaultPointsPerKg: req.body.defaultPointsPerKg,
          defaultBonusPoints: req.body.defaultBonusPoints,
          speciesScoringConfig: req.body.speciesScoringConfig,
          allowedSpeciesIds: req.body.allowedSpeciesIds,
        }
      );

      res.status(201).json({
        success: true,
        message: "Profilo personalizzato creato con successo",
        data: forkedProfile,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fork profile";
      const status = message === "Source profile not found" ? 404 : 400;
      res.status(status).json({ success: false, message });
    }
  }
);

// =============================================================================
// PUT /api/tournament-profiles/:id - Aggiorna profilo associazione
// =============================================================================
/**
 * Aggiorna un profilo dell'associazione
 * I profili sistema (FIPSAS) non possono essere modificati
 */
router.put(
  "/:id",
  authenticate,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.PRESIDENT
  ),
  param("id").isUUID().withMessage("ID profilo non valido"),
  updateProfileValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Determine tenantId
      let tenantId: string | undefined;

      if (req.user?.role === UserRole.SUPER_ADMIN && req.query.tenantId) {
        tenantId = req.query.tenantId as string;
      } else {
        tenantId = req.user?.tenantId;
      }

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Associazione non specificata",
        });
      }

      const profile = await TournamentProfileService.update(
        req.params.id,
        tenantId,
        {
          name: req.body.name,
          description: req.body.description,
          discipline: req.body.discipline,
          level: req.body.level,
          gameMode: req.body.gameMode,
          followsFipsasRules: req.body.followsFipsasRules,
          fipsasRegulationUrl: req.body.fipsasRegulationUrl,
          defaultMinWeight: req.body.defaultMinWeight,
          defaultMaxCatchesPerDay: req.body.defaultMaxCatchesPerDay,
          defaultPointsPerKg: req.body.defaultPointsPerKg,
          defaultBonusPoints: req.body.defaultBonusPoints,
          speciesScoringConfig: req.body.speciesScoringConfig,
          allowedSpeciesIds: req.body.allowedSpeciesIds,
          isActive: req.body.isActive,
          displayOrder: req.body.displayOrder,
        }
      );

      res.json({
        success: true,
        message: "Profilo aggiornato con successo",
        data: profile,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      const status = message.includes("not found") ? 404 :
                    message.includes("Cannot modify system") ? 403 :
                    message.includes("only update profiles") ? 403 : 400;
      res.status(status).json({ success: false, message });
    }
  }
);

// =============================================================================
// DELETE /api/tournament-profiles/:id - Elimina profilo associazione
// =============================================================================
/**
 * Elimina un profilo dell'associazione
 * I profili sistema (FIPSAS) non possono essere eliminati
 * I profili usati da tornei non possono essere eliminati (disattivarli invece)
 */
router.delete(
  "/:id",
  authenticate,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.PRESIDENT
  ),
  param("id").isUUID().withMessage("ID profilo non valido"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Determine tenantId
      let tenantId: string | undefined;

      if (req.user?.role === UserRole.SUPER_ADMIN && req.query.tenantId) {
        tenantId = req.query.tenantId as string;
      } else {
        tenantId = req.user?.tenantId;
      }

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Associazione non specificata",
        });
      }

      const result = await TournamentProfileService.delete(req.params.id, tenantId);

      res.json({
        success: true,
        message: "Profilo eliminato con successo",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete profile";
      const status = message.includes("not found") ? 404 :
                    message.includes("Cannot delete system") ? 403 :
                    message.includes("only delete profiles") ? 403 :
                    message.includes("used by") ? 409 : 400;
      res.status(status).json({ success: false, message });
    }
  }
);

export default router;
