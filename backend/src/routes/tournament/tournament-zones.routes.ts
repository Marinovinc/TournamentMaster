/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/routes/tournament.routes.ts (righe 466-511)
 * Data refactoring: 2025-12-29
 * Motivo: Separazione routes zone per manutenibilita
 *
 * Endpoints:
 * - GET /:id/zones           List fishing zones
 * - POST /:id/zones          Add fishing zone
 * - PUT /:id/zones/:zoneId   Update fishing zone
 * - DELETE /:id/zones/:zoneId Delete fishing zone
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
  optionalAuth,
} from "../../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole } from "../../types";
import {
  fishingZoneValidation,
  tournamentIdParam,
  zoneIdParam,
} from "./tournament.validators";

const router = Router();

/**
 * GET /:id/zones - List fishing zones for tournament
 */
router.get(
  "/:id/zones",
  optionalAuth,
  tournamentIdParam,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const zones = await TournamentService.getFishingZones(req.params.id);

      res.json({
        success: true,
        data: zones,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get fishing zones";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * POST /:id/zones - Add fishing zone
 */
router.post(
  "/:id/zones",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  tournamentIdParam,
  fishingZoneValidation,
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

      const zone = await TournamentService.addFishingZone(
        req.params.id,
        req.body,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        message: "Fishing zone added successfully",
        data: zone,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add fishing zone";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * PUT /:id/zones/:zoneId - Update fishing zone
 */
router.put(
  "/:id/zones/:zoneId",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  tournamentIdParam,
  zoneIdParam,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const zone = await TournamentService.updateFishingZone(
        req.params.zoneId,
        req.body,
        req.user.userId
      );

      res.json({
        success: true,
        message: "Fishing zone updated successfully",
        data: zone,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update fishing zone";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * DELETE /:id/zones/:zoneId - Delete fishing zone
 */
router.delete(
  "/:id/zones/:zoneId",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  tournamentIdParam,
  zoneIdParam,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      await TournamentService.removeFishingZone(
        req.params.zoneId,
        req.user.userId
      );

      res.json({
        success: true,
        message: "Fishing zone deleted successfully",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete fishing zone";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

export default router;
