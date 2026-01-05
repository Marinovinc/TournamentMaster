/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/routes/tournament.routes.ts (righe 513-591)
 * Data refactoring: 2025-12-29
 * Motivo: Separazione routes registrazione per manutenibilita
 *
 * Endpoints:
 * - GET /:id/participants     List tournament participants
 * - POST /:id/register        Register for tournament
 * - DELETE /:id/register      Cancel registration (nuovo)
 * - POST /:id/confirm         Confirm registration after payment (nuovo)
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
  optionalAuth,
} from "../../middleware/auth.middleware";
import { AuthenticatedRequest } from "../../types";
import {
  registerValidation,
  tournamentIdParam,
} from "./tournament.validators";

const router = Router();

/**
 * GET /:id/participants - Get tournament participants
 */
router.get(
  "/:id/participants",
  optionalAuth,
  tournamentIdParam,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const participants = await TournamentService.getParticipants(
        req.params.id
      );

      res.json({
        success: true,
        data: participants,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get participants";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * POST /:id/register - Register for tournament
 */
router.post(
  "/:id/register",
  authenticate,
  tournamentIdParam,
  registerValidation,
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

      const registration = await TournamentService.registerParticipant(
        req.params.id,
        req.user.userId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: registration,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";

      if (message.includes("Already registered")) {
        return res.status(409).json({
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
 * DELETE /:id/register - Cancel registration
 */
router.delete(
  "/:id/register",
  authenticate,
  tournamentIdParam,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const result = await TournamentService.cancelRegistration(
        req.params.id,
        req.user.userId
      );

      res.json({
        success: true,
        message: "Registration cancelled",
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel registration";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * POST /:id/confirm - Confirm registration after payment
 */
router.post(
  "/:id/confirm",
  authenticate,
  tournamentIdParam,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const registration = await TournamentService.confirmRegistration(
        req.params.id,
        req.user.userId,
        req.body.paymentId
      );

      res.json({
        success: true,
        message: "Registration confirmed",
        data: registration,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to confirm registration";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * POST /:id/registrations/:registrationId/payment - Record manual payment
 * Used by organizers to record cash/bank transfer payments
 */
router.post(
  "/:id/registrations/:registrationId/payment",
  authenticate,
  tournamentIdParam,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const { amount, method, notes } = req.body;

      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount",
        });
      }

      if (!method || !["CASH", "BANK_TRANSFER", "OTHER"].includes(method)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method. Must be CASH, BANK_TRANSFER, or OTHER",
        });
      }

      const result = await TournamentService.recordPayment(
        req.params.id,
        req.params.registrationId,
        {
          amount,
          method,
          notes,
          receivedBy: req.user.userId,
        }
      );

      res.json({
        success: true,
        message: "Payment recorded successfully",
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to record payment";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * GET /:id/registrations - Get all registrations (organizer view)
 * Returns all statuses, not just confirmed
 */
router.get(
  "/:id/registrations",
  authenticate,
  tournamentIdParam,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const registrations = await TournamentService.getAllRegistrations(
        req.params.id
      );

      res.json({
        success: true,
        data: registrations,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get registrations";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

export default router;
