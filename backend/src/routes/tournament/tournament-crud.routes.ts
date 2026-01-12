/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/routes/tournament.routes.ts (righe 68-345)
 * Data refactoring: 2025-12-29
 * Motivo: Separazione routes CRUD per manutenibilita
 *
 * Endpoints:
 * - GET /                    List tournaments
 * - GET /:id                 Get tournament by ID
 * - POST /                   Create tournament
 * - PUT /:id                 Update tournament
 * - DELETE /:id              Delete tournament
 *
 * Dipendenze:
 * - TournamentService (facade)
 * - ./tournament.validators.ts
 * =============================================================================
 */

import { Router, Response } from "express";
import { validationResult } from "express-validator";
import { TournamentService } from "../../services/tournament.service";
import { TournamentStatsService } from "../../services/tournament";
import {
  authenticate,
  authorize,
  optionalAuth,
} from "../../middleware/auth.middleware";
import {
  AuthenticatedRequest,
  UserRole,
  TournamentStatus,
  TournamentDiscipline,
} from "../../types";
import {
  createTournamentValidation,
  updateTournamentValidation,
  listTournamentsValidation,
  tournamentIdParam,
} from "./tournament.validators";

const router = Router();

/**
 * GET / - List tournaments (public, with optional auth)
 */
router.get(
  "/",
  optionalAuth,
  listTournamentsValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const filters = {
        tenantId: req.query.tenantId as string | undefined,
        status: req.query.status as TournamentStatus | undefined,
        discipline: req.query.discipline as TournamentDiscipline | undefined,
        searchQuery: req.query.search as string | undefined,
      };

      const result = await TournamentService.list(filters, { page, limit });

      res.json({
        success: true,
        data: result.tournaments,
        pagination: result.pagination,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to list tournaments";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * GET /:id - Get tournament details
 */
router.get(
  "/:id",
  optionalAuth,
  tournamentIdParam,
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

      const tournament = await TournamentService.getById(
        req.params.id,
        true // include full details
      );

      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: "Tournament not found",
        });
      }

      res.json({
        success: true,
        data: tournament,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get tournament";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * GET /:id/stats - Get tournament statistics (authenticated)
 */
router.get(
  "/:id/stats",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER, UserRole.JUDGE),
  tournamentIdParam,
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

      const stats = await TournamentStatsService.getStats(req.params.id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get tournament stats";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * POST / - Create tournament (organizers only)
 */
router.post(
  "/",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  createTournamentValidation,
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

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      // Require tenant for non-super-admins
      if (!req.user.tenantId && req.user.role !== UserRole.SUPER_ADMIN) {
        return res.status(400).json({
          success: false,
          message: "Tenant ID required",
        });
      }

      const tenantId = req.body.tenantId || req.user.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Tenant ID required",
        });
      }

      const tournament = await TournamentService.create({
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        registrationOpens: new Date(req.body.registrationOpens),
        registrationCloses: new Date(req.body.registrationCloses),
        tenantId,
        organizerId: req.user.userId,
      });

      res.status(201).json({
        success: true,
        message: "Tournament created successfully",
        data: tournament,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create tournament";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * PUT /:id - Update tournament
 */
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  tournamentIdParam,
  updateTournamentValidation,
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

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const updateData = {
        ...req.body,
        startDate: req.body.startDate
          ? new Date(req.body.startDate)
          : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        registrationOpens: req.body.registrationOpens
          ? new Date(req.body.registrationOpens)
          : undefined,
        registrationCloses: req.body.registrationCloses
          ? new Date(req.body.registrationCloses)
          : undefined,
      };

      const tournament = await TournamentService.update(
        req.params.id,
        updateData,
        req.user.userId
      );

      res.json({
        success: true,
        message: "Tournament updated successfully",
        data: tournament,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update tournament";

      if (
        message.includes("not found") ||
        message.includes("Only the organizer")
      ) {
        return res.status(403).json({
          success: false,
          message,
        });
      }

      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * DELETE /:id - Delete tournament
 */
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  tournamentIdParam,
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

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const result = await TournamentService.delete(
        req.params.id,
        req.user.userId
      );

      res.json({
        success: true,
        message: result.deleted
          ? "Tournament deleted successfully"
          : "Tournament cancelled successfully",
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete tournament";

      if (
        message.includes("not found") ||
        message.includes("Only the organizer")
      ) {
        return res.status(403).json({
          success: false,
          message,
        });
      }

      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

export default router;
