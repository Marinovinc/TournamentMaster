/**
 * =============================================================================
 * Staff Routes - Tournament Staff Management
 * =============================================================================
 * Endpoint per la gestione dello staff del torneo:
 * - Giudici di gara (JUDGE)
 * - Direttori di gara (DIRECTOR)
 * - Ispettori (INSPECTOR)
 * - Addetti punteggi (SCORER)
 *
 * Features:
 * - Assegnazione staff a tornei
 * - Lista staff per torneo
 * - Rimozione assegnazione
 * - Verifica ruoli
 * =============================================================================
 */

import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole } from "../types";
import { StaffService } from "../services/staff.service";
import { TournamentStaffRole } from "@prisma/client";
import prisma from "../lib/prisma";

const router = Router();

// =============================================================================
// VALIDATION RULES
// =============================================================================

const assignStaffValidation = [
  body("userId").isUUID().withMessage("Valid user ID is required"),
  body("role")
    .isIn(["DIRECTOR", "JUDGE", "JUDGE_ASSISTANT", "INSPECTOR", "SCORER"])
    .withMessage("Role must be DIRECTOR, JUDGE, JUDGE_ASSISTANT, INSPECTOR, or SCORER"),
  body("notes").optional().trim().isLength({ max: 500 }),
  body("parentStaffId").optional().isUUID().withMessage("Valid parent staff ID required"),
];

// =============================================================================
// GET /api/staff/tournament/:tournamentId - List staff for a tournament
// =============================================================================
router.get(
  "/tournament/:tournamentId",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  [param("tournamentId").isString().notEmpty().withMessage("Tournament ID required")],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { tournamentId } = req.params;

      const staff = await StaffService.getByTournament(tournamentId);

      // Group by role for frontend convenience
      const grouped = {
        directors: staff.filter((s) => s.role === "DIRECTOR"),
        judges: staff.filter((s) => s.role === "JUDGE"),
        judgeAssistants: staff.filter((s) => s.role === "JUDGE_ASSISTANT"),
        inspectors: staff.filter((s) => s.role === "INSPECTOR"),
        scorers: staff.filter((s) => s.role === "SCORER"),
      };

      return res.json({
        success: true,
        data: {
          staff,
          grouped,
          total: staff.length,
        },
      });
    } catch (error: any) {
      console.error("[Staff] Error getting tournament staff:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get tournament staff",
      });
    }
  }
);

// =============================================================================
// GET /api/staff/tournament/:tournamentId/available - Get users that can be assigned
// =============================================================================
router.get(
  "/tournament/:tournamentId/available",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  [param("tournamentId").isString().notEmpty().withMessage("Tournament ID required")],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { tournamentId } = req.params;

      // Get tournament to find tenant
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { tenantId: true },
      });

      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: "Tournament not found",
        });
      }

      const availableUsers = await StaffService.getAvailableStaff(
        tournamentId,
        tournament.tenantId
      );

      return res.json({
        success: true,
        data: availableUsers,
      });
    } catch (error: any) {
      console.error("[Staff] Error getting available staff:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get available staff",
      });
    }
  }
);

// =============================================================================
// POST /api/staff/tournament/:tournamentId - Assign staff to tournament
// =============================================================================
router.post(
  "/tournament/:tournamentId",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  [
    param("tournamentId").isString().notEmpty().withMessage("Tournament ID required"),
    ...assignStaffValidation,
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { tournamentId } = req.params;
      const { userId, role, notes, parentStaffId } = req.body;

      const staff = await StaffService.assign({
        tournamentId,
        userId,
        role: role as TournamentStaffRole,
        notes,
        parentStaffId,
      });

      return res.status(201).json({
        success: true,
        message: `Staff member assigned as ${role}`,
        data: staff,
      });
    } catch (error: any) {
      console.error("[Staff] Error assigning staff:", error);

      if (error.message.includes("already assigned")) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to assign staff",
      });
    }
  }
);

// =============================================================================
// DELETE /api/staff/:staffId - Remove staff assignment
// =============================================================================
router.delete(
  "/:staffId",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  [param("staffId").isUUID().withMessage("Valid staff ID required")],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { staffId } = req.params;

      await StaffService.remove(staffId);

      return res.json({
        success: true,
        message: "Staff assignment removed",
      });
    } catch (error: any) {
      console.error("[Staff] Error removing staff:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to remove staff",
      });
    }
  }
);

// =============================================================================
// PUT /api/staff/:staffId/notes - Update staff notes
// =============================================================================
router.put(
  "/:staffId/notes",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  [
    param("staffId").isUUID().withMessage("Valid staff ID required"),
    body("notes").trim().isLength({ max: 500 }),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { staffId } = req.params;
      const { notes } = req.body;

      const staff = await StaffService.updateNotes(staffId, notes);

      return res.json({
        success: true,
        message: "Notes updated",
        data: staff,
      });
    } catch (error: any) {
      console.error("[Staff] Error updating notes:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update notes",
      });
    }
  }
);

// =============================================================================
// GET /api/staff/user/:userId - Get tournaments where user is staff
// =============================================================================
router.get(
  "/user/:userId",
  authenticate,
  [param("userId").isUUID().withMessage("Valid user ID required")],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { userId } = req.params;

      // Users can only see their own assignments unless admin
      if (
        req.user?.userId !== userId &&
        req.user?.role !== UserRole.SUPER_ADMIN &&
        req.user?.role !== UserRole.TENANT_ADMIN
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view other user's assignments",
        });
      }

      const assignments = await StaffService.getTournamentsByUser(userId);

      return res.json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      console.error("[Staff] Error getting user assignments:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get user assignments",
      });
    }
  }
);

// =============================================================================
// GET /api/staff/check/:tournamentId - Check if current user is staff
// =============================================================================
router.get(
  "/check/:tournamentId",
  authenticate,
  [param("tournamentId").isString().notEmpty().withMessage("Tournament ID required")],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { tournamentId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const isStaff = await StaffService.isStaff(userId, tournamentId);
      const isDirector = await StaffService.hasRole(
        userId,
        tournamentId,
        TournamentStaffRole.DIRECTOR
      );
      const isJudge = await StaffService.hasRole(
        userId,
        tournamentId,
        TournamentStaffRole.JUDGE
      );

      return res.json({
        success: true,
        data: {
          isStaff,
          isDirector,
          isJudge,
          canValidateCatches: isStaff || isDirector || isJudge,
        },
      });
    } catch (error: any) {
      console.error("[Staff] Error checking staff status:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to check staff status",
      });
    }
  }
);


// =============================================================================
// JUDGE ASSISTANTS ENDPOINTS
// =============================================================================

// GET /api/staff/tournament/:tournamentId/judges - Get judges with their assistants
router.get(
  "/tournament/:tournamentId/judges",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  [param("tournamentId").isString().notEmpty().withMessage("Tournament ID required")],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { tournamentId } = req.params;
      const judges = await StaffService.getJudges(tournamentId);

      return res.json({
        success: true,
        data: judges,
      });
    } catch (error: any) {
      console.error("[Staff] Error getting judges:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get judges",
      });
    }
  }
);

// POST /api/staff/judge/:judgeStaffId/assistant - Assign assistant to judge
router.post(
  "/judge/:judgeStaffId/assistant",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  [
    param("judgeStaffId").isUUID().withMessage("Valid judge staff ID required"),
    body("userId").isUUID().withMessage("Valid user ID is required"),
    body("notes").optional().trim().isLength({ max: 500 }),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { judgeStaffId } = req.params;
      const { userId, notes } = req.body;

      // Get tournament ID from judge
      const judge = await prisma.tournamentStaff.findUnique({
        where: { id: judgeStaffId },
        select: { tournamentId: true },
      });

      if (!judge) {
        return res.status(404).json({
          success: false,
          message: "Judge not found",
        });
      }

      const assistant = await StaffService.assignAssistant(
        judge.tournamentId,
        judgeStaffId,
        userId,
        notes
      );

      return res.status(201).json({
        success: true,
        message: "Assistant assigned to judge",
        data: assistant,
      });
    } catch (error: any) {
      console.error("[Staff] Error assigning assistant:", error);

      if (error.message.includes("already assigned")) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to assign assistant",
      });
    }
  }
);

// GET /api/staff/judge/:judgeStaffId/assistants - Get assistants of a judge
router.get(
  "/judge/:judgeStaffId/assistants",
  authenticate,
  [param("judgeStaffId").isUUID().withMessage("Valid judge staff ID required")],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { judgeStaffId } = req.params;
      const assistants = await StaffService.getAssistants(judgeStaffId);

      return res.json({
        success: true,
        data: assistants,
      });
    } catch (error: any) {
      console.error("[Staff] Error getting assistants:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get assistants",
      });
    }
  }
);

// DELETE /api/staff/assistant/:assistantStaffId - Remove assistant
router.delete(
  "/assistant/:assistantStaffId",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  [param("assistantStaffId").isUUID().withMessage("Valid assistant staff ID required")],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { assistantStaffId } = req.params;
      await StaffService.removeAssistant(assistantStaffId);

      return res.json({
        success: true,
        message: "Assistant removed",
      });
    } catch (error: any) {
      console.error("[Staff] Error removing assistant:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to remove assistant",
      });
    }
  }
);

// PUT /api/staff/assistant/:assistantStaffId/reassign - Reassign assistant to different judge
router.put(
  "/assistant/:assistantStaffId/reassign",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  [
    param("assistantStaffId").isUUID().withMessage("Valid assistant staff ID required"),
    body("newJudgeStaffId").isUUID().withMessage("Valid new judge staff ID required"),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { assistantStaffId } = req.params;
      const { newJudgeStaffId } = req.body;

      const updated = await StaffService.reassignAssistant(
        assistantStaffId,
        newJudgeStaffId
      );

      return res.json({
        success: true,
        message: "Assistant reassigned",
        data: updated,
      });
    } catch (error: any) {
      console.error("[Staff] Error reassigning assistant:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to reassign assistant",
      });
    }
  }
);

export default router;
