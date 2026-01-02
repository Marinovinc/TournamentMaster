/**
 * =============================================================================
 * Strike Routes - Registrazione Strike durante Gare
 * =============================================================================
 * Endpoint per:
 * - Registrazione strike (abboccate) durante la gara
 * - Timestamp + numero canne
 * - Validazione da parte dell'ispettore
 * - Statistiche strike per team
 */

import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole } from "../types";
import prisma from "../lib/prisma";

const router = Router();

// =============================================================================
// VALIDATION RULES
// =============================================================================

const createStrikeValidation = [
  body("tournamentId").isUUID().withMessage("Valid tournament ID required"),
  body("teamId").isUUID().withMessage("Valid team ID required"),
  body("rodCount").isInt({ min: 1, max: 10 }).withMessage("Rod count must be between 1 and 10"),
  body("strikeAt").optional().isISO8601().withMessage("Invalid timestamp"),
  body("latitude").optional().isFloat({ min: -90, max: 90 }),
  body("longitude").optional().isFloat({ min: -180, max: 180 }),
  body("notes").optional().trim(),
];

const updateStrikeValidation = [
  body("rodCount").optional().isInt({ min: 1, max: 10 }),
  body("notes").optional().trim(),
  body("result").optional().isIn(["CATCH", "LOST", "RELEASED"]),
];

// =============================================================================
// GET /api/strikes - Lista strike (filtrata)
// =============================================================================
router.get(
  "/",
  authenticate,
  [
    query("tournamentId").optional().isUUID(),
    query("teamId").optional().isUUID(),
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (req.query.tournamentId) {
        where.tournamentId = req.query.tournamentId;
      }

      if (req.query.teamId) {
        where.teamId = req.query.teamId;
      }

      const [strikes, total] = await Promise.all([
        prisma.strike.findMany({
          where,
          include: {
            team: { select: { id: true, name: true, boatName: true, boatNumber: true } },
            tournament: { select: { id: true, name: true } },
          },
          skip,
          take: limit,
          orderBy: { strikeAt: "desc" },
        }),
        prisma.strike.count({ where }),
      ]);

      res.json({
        success: true,
        data: strikes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to list strikes";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/strikes/:id - Dettaglio strike
// =============================================================================
router.get(
  "/:id",
  authenticate,
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const strike = await prisma.strike.findUnique({
        where: { id: req.params.id },
        include: {
          team: {
            include: {
              captain: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          tournament: { select: { id: true, name: true, status: true } },
        },
      });

      if (!strike) {
        return res.status(404).json({ success: false, message: "Strike not found" });
      }

      res.json({ success: true, data: strike });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get strike";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// POST /api/strikes - Registra nuovo strike
// =============================================================================
router.post(
  "/",
  authenticate,
  createStrikeValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      // Verify tournament is ONGOING
      const tournament = await prisma.tournament.findUnique({
        where: { id: req.body.tournamentId },
        select: { id: true, status: true, tenantId: true },
      });

      if (!tournament) {
        return res.status(404).json({ success: false, message: "Tournament not found" });
      }

      if (tournament.status !== "ONGOING") {
        return res.status(400).json({ success: false, message: "Tournament is not currently active" });
      }

      // Verify team exists and belongs to tournament
      const team = await prisma.team.findFirst({
        where: {
          id: req.body.teamId,
          tournamentId: req.body.tournamentId,
        },
        include: {
          members: { select: { userId: true } },
        },
      });

      if (!team) {
        return res.status(404).json({ success: false, message: "Team not found in this tournament" });
      }

      // Check if user can report strike (team member, inspector, or admin)
      const isTeamMember = team.members.some((m) => m.userId === req.user!.userId) || team.captainId === req.user.userId;
      const isInspector = team.inspectorId === req.user.userId;
      const isAdmin = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.JUDGE].includes(req.user.role);

      if (!isTeamMember && !isInspector && !isAdmin) {
        return res.status(403).json({ success: false, message: "Not authorized to report strikes for this team" });
      }

      // Create strike
      const strike = await prisma.strike.create({
        data: {
          tournamentId: req.body.tournamentId,
          teamId: req.body.teamId,
          rodCount: req.body.rodCount,
          strikeAt: req.body.strikeAt ? new Date(req.body.strikeAt) : new Date(),
          latitude: req.body.latitude,
          longitude: req.body.longitude,
          notes: req.body.notes,
          reportedById: req.user.userId,
        },
        include: {
          team: { select: { id: true, name: true, boatName: true, boatNumber: true } },
        },
      });

      res.status(201).json({
        success: true,
        message: "Strike registered successfully",
        data: strike,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to register strike";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// PUT /api/strikes/:id - Aggiorna strike
// =============================================================================
router.put(
  "/:id",
  authenticate,
  param("id").isUUID(),
  updateStrikeValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const strike = await prisma.strike.findUnique({
        where: { id: req.params.id },
        include: { team: true },
      });

      if (!strike) {
        return res.status(404).json({ success: false, message: "Strike not found" });
      }

      // Check permission: reporter, team captain, inspector, or admin
      const isReporter = strike.reportedById === req.user.userId;
      const isCaptain = strike.team?.captainId === req.user.userId;
      const isInspector = strike.team?.inspectorId === req.user.userId;
      const isAdmin = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.JUDGE].includes(req.user.role);

      if (!isReporter && !isCaptain && !isInspector && !isAdmin) {
        return res.status(403).json({ success: false, message: "Not authorized to update this strike" });
      }

      const updateData: any = {};
      if (req.body.rodCount !== undefined) updateData.rodCount = req.body.rodCount;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;
      if (req.body.result !== undefined) updateData.result = req.body.result;

      const updatedStrike = await prisma.strike.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          team: { select: { id: true, name: true, boatName: true } },
        },
      });

      res.json({
        success: true,
        message: "Strike updated successfully",
        data: updatedStrike,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update strike";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// DELETE /api/strikes/:id - Elimina strike (admin/judge only)
// =============================================================================
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.JUDGE),
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await prisma.strike.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: "Strike deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete strike";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/strikes/team/:teamId - Strike di un team specifico
// =============================================================================
router.get(
  "/team/:teamId",
  authenticate,
  param("teamId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const strikes = await prisma.strike.findMany({
        where: { teamId: req.params.teamId },
        orderBy: { strikeAt: "desc" },
      });

      // Stats
      const stats = {
        total: strikes.length,
        totalRods: strikes.reduce((sum, s) => sum + s.rodCount, 0),
        catches: strikes.filter((s) => s.result === "CATCH").length,
        lost: strikes.filter((s) => s.result === "LOST").length,
        released: strikes.filter((s) => s.result === "RELEASED").length,
      };

      res.json({
        success: true,
        data: { strikes, stats },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get team strikes";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/strikes/tournament/:tournamentId/live - Strike live del torneo
// =============================================================================
router.get(
  "/tournament/:tournamentId/live",
  authenticate,
  param("tournamentId").isUUID(),
  [query("since").optional().isISO8601()],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const where: any = { tournamentId: req.params.tournamentId };

      // Optional: only strikes since timestamp (for polling)
      if (req.query.since) {
        where.createdAt = { gte: new Date(req.query.since as string) };
      }

      const strikes = await prisma.strike.findMany({
        where,
        include: {
          team: { select: { id: true, name: true, boatName: true, boatNumber: true } },
        },
        orderBy: { strikeAt: "desc" },
        take: 50,
      });

      // Team stats summary
      const teamStats = await prisma.strike.groupBy({
        by: ["teamId"],
        where: { tournamentId: req.params.tournamentId },
        _count: { id: true },
        _sum: { rodCount: true },
      });

      res.json({
        success: true,
        data: {
          strikes,
          teamStats,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get live strikes";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// POST /api/strikes/:id/result - Aggiorna risultato strike (CATCH/LOST/RELEASED)
// =============================================================================
router.post(
  "/:id/result",
  authenticate,
  param("id").isUUID(),
  body("result").isIn(["CATCH", "LOST", "RELEASED"]).withMessage("Invalid result"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const strike = await prisma.strike.findUnique({
        where: { id: req.params.id },
        include: { team: true },
      });

      if (!strike) {
        return res.status(404).json({ success: false, message: "Strike not found" });
      }

      // Check permission
      const isTeamMember = strike.team?.captainId === req.user.userId || strike.reportedById === req.user.userId;
      const isInspector = strike.team?.inspectorId === req.user.userId;
      const isAdmin = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.JUDGE].includes(req.user.role);

      if (!isTeamMember && !isInspector && !isAdmin) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }

      const updatedStrike = await prisma.strike.update({
        where: { id: req.params.id },
        data: { result: req.body.result },
      });

      res.json({
        success: true,
        message: "Strike result updated",
        data: updatedStrike,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update result";
      res.status(400).json({ success: false, message });
    }
  }
);

export default router;
