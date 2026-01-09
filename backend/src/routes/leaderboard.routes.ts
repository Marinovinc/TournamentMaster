import { Router, Response } from "express";
import { param, query, validationResult } from "express-validator";
import { LeaderboardService } from "../services/leaderboard.service";
import {
  authenticate,
  authorize,
  optionalAuth,
} from "../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole } from "../types";

const router = Router();

// GET /api/leaderboard/:tournamentId - Get tournament leaderboard (public)
router.get(
  "/:tournamentId",
  optionalAuth,
  param("tournamentId").notEmpty(),
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
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

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;

      const result = await LeaderboardService.getLeaderboard(
        req.params.tournamentId,
        { page, limit }
      );

      res.json({
        success: true,
        data: result.entries,
        pagination: result.pagination,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get leaderboard";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// GET /api/leaderboard/:tournamentId/top/:n - Get top N participants
router.get(
  "/:tournamentId/top/:n",
  optionalAuth,
  param("tournamentId").notEmpty(),
  param("n").isInt({ min: 1, max: 100 }),
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

      const n = parseInt(req.params.n, 10);
      const entries = await LeaderboardService.getTopN(
        req.params.tournamentId,
        n
      );

      res.json({
        success: true,
        data: entries,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get top entries";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// GET /api/leaderboard/:tournamentId/my - Get user's position
router.get(
  "/:tournamentId/my",
  authenticate,
  param("tournamentId").notEmpty(),
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

      const position = await LeaderboardService.getUserPosition(
        req.params.tournamentId,
        req.user.userId
      );

      if (!position) {
        return res.status(404).json({
          success: false,
          message: "Not found in leaderboard",
        });
      }

      res.json({
        success: true,
        data: position,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get position";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// GET /api/leaderboard/:tournamentId/stats - Get tournament statistics
router.get(
  "/:tournamentId/stats",
  optionalAuth,
  param("tournamentId").notEmpty(),
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

      const stats = await LeaderboardService.getTournamentStats(
        req.params.tournamentId
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get stats";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// POST /api/leaderboard/:tournamentId/initialize - Initialize leaderboard (organizers only)
router.post(
  "/:tournamentId/initialize",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  param("tournamentId").notEmpty(),
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

      await LeaderboardService.initializeForTournament(req.params.tournamentId);

      res.json({
        success: true,
        message: "Leaderboard initialized",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to initialize leaderboard";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// POST /api/leaderboard/:tournamentId/recalculate - Recalculate ranks (organizers only)
router.post(
  "/:tournamentId/recalculate",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  param("tournamentId").notEmpty(),
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

      await LeaderboardService.recalculateRanks(req.params.tournamentId);

      res.json({
        success: true,
        message: "Leaderboard recalculated",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to recalculate";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

export default router;
