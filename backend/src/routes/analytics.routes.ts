/**
 * =============================================================================
 * ANALYTICS ROUTES
 * =============================================================================
 * API endpoints per analytics e report statistici
 * =============================================================================
 */

import { Router, Response } from "express";
import { param, query, validationResult } from "express-validator";
import { AnalyticsService } from "../services/analytics.service";
import { authenticate } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";

const router = Router();

// Tutti gli endpoint richiedono autenticazione
router.use(authenticate);

// ==============================================================================
// TOURNAMENT ANALYTICS
// ==============================================================================

/**
 * GET /api/analytics/tournament/:tournamentId/catches-timeline
 * Get catches over time
 */
router.get(
  "/tournament/:tournamentId/catches-timeline",
  param("tournamentId").notEmpty().trim(),
  query("granularity").optional().isIn(["hourly", "daily"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const granularity = (req.query.granularity as "hourly" | "daily") || "hourly";
      const data = await AnalyticsService.getCatchesTimeSeries(
        req.params.tournamentId,
        granularity
      );

      res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get timeline";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/analytics/tournament/:tournamentId/weight-distribution
 * Get weight distribution histogram
 */
router.get(
  "/tournament/:tournamentId/weight-distribution",
  param("tournamentId").notEmpty().trim(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await AnalyticsService.getWeightDistribution(req.params.tournamentId);
      res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get distribution";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/analytics/tournament/:tournamentId/species-distribution
 * Get species distribution
 */
router.get(
  "/tournament/:tournamentId/species-distribution",
  param("tournamentId").notEmpty().trim(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await AnalyticsService.getSpeciesDistribution(req.params.tournamentId);
      res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get species distribution";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/analytics/tournament/:tournamentId/participant-performance
 * Get participant performance rankings
 */
router.get(
  "/tournament/:tournamentId/participant-performance",
  param("tournamentId").notEmpty().trim(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await AnalyticsService.getParticipantPerformance(req.params.tournamentId);
      res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get performance data";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/analytics/tournament/:tournamentId/activity-heatmap
 * Get activity heatmap data
 */
router.get(
  "/tournament/:tournamentId/activity-heatmap",
  param("tournamentId").notEmpty().trim(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await AnalyticsService.getActivityHeatmap(req.params.tournamentId);
      res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get heatmap";
      res.status(500).json({ success: false, message });
    }
  }
);

// ==============================================================================
// TENANT/ASSOCIATION ANALYTICS
// ==============================================================================

/**
 * GET /api/analytics/tenant/:tenantId/dashboard
 * Get dashboard KPIs for a tenant
 */
router.get(
  "/tenant/:tenantId/dashboard",
  param("tenantId").notEmpty().trim(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await AnalyticsService.getDashboardKPIs(req.params.tenantId);
      res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get dashboard KPIs";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/analytics/tenant/:tenantId/tournaments-comparison
 * Compare tournaments within a tenant
 */
router.get(
  "/tenant/:tenantId/tournaments-comparison",
  param("tenantId").notEmpty().trim(),
  query("limit").optional().isInt({ min: 1, max: 50 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await AnalyticsService.compareTournaments(req.params.tenantId, limit);
      res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to compare tournaments";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/analytics/tenant/:tenantId/season-stats
 * Get season statistics
 */
router.get(
  "/tenant/:tenantId/season-stats",
  param("tenantId").notEmpty().trim(),
  query("year").optional().isInt({ min: 2020, max: 2030 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const data = await AnalyticsService.getSeasonStats(req.params.tenantId, year);
      res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get season stats";
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
