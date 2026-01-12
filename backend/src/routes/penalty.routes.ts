/**
 * =============================================================================
 * PENALTY ROUTES
 * =============================================================================
 * API endpoints per gestione penalità tornei
 * =============================================================================
 */

import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import {
  PenaltyService,
  PenaltyType,
  PenaltyStatus,
} from "../services/penalty.service";
import {
  authenticate,
  isAdminOrPresident,
} from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";

const router = Router();

// Tutti gli endpoint richiedono autenticazione
router.use(authenticate);

// ==============================================================================
// VALIDAZIONE
// ==============================================================================

const createPenaltyValidation = [
  body("tournamentId").isUUID().withMessage("Invalid tournament ID"),
  body("teamId").optional().isUUID().withMessage("Invalid team ID"),
  body("userId").optional().isUUID().withMessage("Invalid user ID"),
  body("type")
    .isIn(Object.values(PenaltyType))
    .withMessage("Invalid penalty type"),
  body("points").isInt({ min: 0 }).withMessage("Points must be >= 0"),
  body("reason").trim().notEmpty().withMessage("Reason is required"),
  body("evidence").optional().trim(),
  body("evidencePhotos").optional().isArray(),
];

const updatePenaltyValidation = [
  param("penaltyId").isUUID().withMessage("Invalid penalty ID"),
  body("type")
    .optional()
    .isIn(Object.values(PenaltyType))
    .withMessage("Invalid penalty type"),
  body("points").optional().isInt({ min: 0 }).withMessage("Points must be >= 0"),
  body("reason").optional().trim().notEmpty(),
  body("evidence").optional().trim(),
  body("evidencePhotos").optional().isArray(),
];

const appealValidation = [
  param("penaltyId").isUUID().withMessage("Invalid penalty ID"),
  body("appealReason")
    .trim()
    .notEmpty()
    .withMessage("Appeal reason is required"),
];

const appealDecisionValidation = [
  param("penaltyId").isUUID().withMessage("Invalid penalty ID"),
  body("decision")
    .isIn(["UPHELD", "OVERTURNED"])
    .withMessage("Invalid decision"),
  body("decisionReason")
    .trim()
    .notEmpty()
    .withMessage("Decision reason is required"),
];

// ==============================================================================
// ROUTES
// ==============================================================================

/**
 * GET /api/penalties/types
 * Ottieni lista tipi di penalità con descrizioni
 */
router.get("/types", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const types = PenaltyService.getPenaltyTypes();
    res.json({
      success: true,
      data: types,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get penalty types";
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/penalties/tournament/:tournamentId
 * Ottieni tutte le penalità di un torneo
 */
router.get(
  "/tournament/:tournamentId",
  param("tournamentId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { tournamentId } = req.params;
      const { teamId, type, status } = req.query;

      const penalties = await PenaltyService.getByTournament(tournamentId, {
        tournamentId,
        teamId: teamId as string,
        type: type as PenaltyType,
        status: status as PenaltyStatus,
      });

      res.json({
        success: true,
        data: penalties,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get penalties";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/penalties/tournament/:tournamentId/summary
 * Ottieni riepilogo penalità per team
 */
router.get(
  "/tournament/:tournamentId/summary",
  param("tournamentId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const summary = await PenaltyService.getTournamentPenaltySummary(
        req.params.tournamentId
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get penalty summary";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/penalties/tournament/:tournamentId/stats
 * Ottieni statistiche penalità torneo
 */
router.get(
  "/tournament/:tournamentId/stats",
  param("tournamentId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await PenaltyService.getTournamentPenaltyStats(
        req.params.tournamentId
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get penalty stats";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/penalties/team/:tournamentId/:teamId/points
 * Ottieni totale punti penalità per un team
 */
router.get(
  "/team/:tournamentId/:teamId/points",
  param("tournamentId").isUUID(),
  param("teamId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tournamentId, teamId } = req.params;
      const points = await PenaltyService.getTeamPenaltyPoints(
        tournamentId,
        teamId
      );

      res.json({
        success: true,
        data: points,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get team penalty points";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/penalties/:penaltyId
 * Ottieni dettaglio singola penalità
 */
router.get(
  "/:penaltyId",
  param("penaltyId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const penalty = await PenaltyService.getById(req.params.penaltyId);

      res.json({
        success: true,
        data: penalty,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get penalty";
      const status = message === "Penalty not found" ? 404 : 500;
      res.status(status).json({ success: false, message });
    }
  }
);

/**
 * POST /api/penalties
 * Crea una nuova penalità (solo admin/direttore)
 */
router.post(
  "/",
  isAdminOrPresident(),
  createPenaltyValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { tournamentId, teamId, userId, type, points, reason, evidence, evidencePhotos } =
        req.body;

      const penalty = await PenaltyService.create({
        tournamentId,
        teamId,
        userId,
        type,
        points,
        reason,
        evidence,
        evidencePhotos,
        issuedById: req.user!.userId,
      });

      res.status(201).json({
        success: true,
        message: "Penalty created",
        data: penalty,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create penalty";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * PUT /api/penalties/:penaltyId
 * Aggiorna una penalità (solo admin/direttore)
 */
router.put(
  "/:penaltyId",
  isAdminOrPresident(),
  updatePenaltyValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const penalty = await PenaltyService.update(
        req.params.penaltyId,
        req.body
      );

      res.json({
        success: true,
        message: "Penalty updated",
        data: penalty,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update penalty";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * DELETE /api/penalties/:penaltyId
 * Elimina una penalità (solo admin/direttore)
 */
router.delete(
  "/:penaltyId",
  isAdminOrPresident(),
  param("penaltyId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await PenaltyService.delete(req.params.penaltyId);

      res.json({
        success: true,
        message: "Penalty deleted",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete penalty";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/penalties/:penaltyId/appeal
 * Presenta appello contro una penalità
 */
router.post(
  "/:penaltyId/appeal",
  appealValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const penalty = await PenaltyService.submitAppeal(req.params.penaltyId, {
        appealReason: req.body.appealReason,
      });

      res.json({
        success: true,
        message: "Appeal submitted",
        data: penalty,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit appeal";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/penalties/:penaltyId/appeal/decide
 * Decidi su un appello (solo admin/direttore)
 */
router.post(
  "/:penaltyId/appeal/decide",
  isAdminOrPresident(),
  appealDecisionValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const penalty = await PenaltyService.decideAppeal(req.params.penaltyId, {
        decision: req.body.decision,
        decisionReason: req.body.decisionReason,
        decidedById: req.user!.userId,
      });

      res.json({
        success: true,
        message: `Appeal ${req.body.decision.toLowerCase()}`,
        data: penalty,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to decide appeal";
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
