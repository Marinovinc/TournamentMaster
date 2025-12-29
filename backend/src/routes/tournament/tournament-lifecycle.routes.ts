/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/routes/tournament.routes.ts (righe 347-464)
 * Data refactoring: 2025-12-29
 * Motivo: Separazione routes lifecycle per manutenibilita
 *
 * Endpoints:
 * - POST /:id/publish        Publish tournament
 * - POST /:id/start          Start tournament
 * - POST /:id/complete       Complete tournament
 * - POST /:id/cancel         Cancel tournament (nuovo)
 *
 * Dipendenze:
 * - TournamentService (facade)
 * - ./tournament.validators.ts
 * =============================================================================
 */

import { Router, Response } from "express";
import { validationResult } from "express-validator";
import { TournamentService } from "../../services/tournament.service";
import {
  authenticate,
  authorize,
} from "../../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole } from "../../types";
import { tournamentIdParam } from "./tournament.validators";

const router = Router();

/**
 * POST /:id/publish - Publish tournament
 */
router.post(
  "/:id/publish",
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

      const tournament = await TournamentService.publish(
        req.params.id,
        req.user.userId
      );

      res.json({
        success: true,
        message: "Tournament published successfully",
        data: tournament,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to publish tournament";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * POST /:id/start - Start tournament
 */
router.post(
  "/:id/start",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  tournamentIdParam,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const tournament = await TournamentService.start(
        req.params.id,
        req.user.userId
      );

      res.json({
        success: true,
        message: "Tournament started",
        data: tournament,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start tournament";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * POST /:id/complete - Complete tournament
 */
router.post(
  "/:id/complete",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  tournamentIdParam,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const tournament = await TournamentService.complete(
        req.params.id,
        req.user.userId
      );

      res.json({
        success: true,
        message: "Tournament completed",
        data: tournament,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to complete tournament";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * POST /:id/cancel - Cancel tournament
 */
router.post(
  "/:id/cancel",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  tournamentIdParam,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const tournament = await TournamentService.cancel(
        req.params.id,
        req.user.userId,
        req.body.reason
      );

      res.json({
        success: true,
        message: "Tournament cancelled",
        data: tournament,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel tournament";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

export default router;
