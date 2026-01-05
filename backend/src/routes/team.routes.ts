/**
 * =============================================================================
 * Team Routes - Gestione Barche ed Equipaggio
 * =============================================================================
 * Endpoint per:
 * - CRUD team/barche
 * - Gestione equipaggio (membri)
 * - Assegnazione ispettori
 * - Iscrizione a tornei
 */

import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { authenticate, authorize, isAdminOrPresident } from "../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole } from "../types";
import prisma from "../lib/prisma";

const router = Router();

// =============================================================================
// VALIDATION RULES
// =============================================================================

const createTeamValidation = [
  body("name").trim().notEmpty().withMessage("Team name is required"),
  body("boatName").trim().notEmpty().withMessage("Boat name is required"),
  body("tournamentId").notEmpty().withMessage("Tournament ID is required"),
  body("clubName").optional().trim(),
  body("clubCode").optional().trim(),
];

const updateTeamValidation = [
  body("name").optional().trim().notEmpty(),
  body("boatName").optional().trim().notEmpty(),
  body("boatNumber").optional().isInt({ min: 1 }),
  body("clubName").optional().trim(),
  body("clubCode").optional().trim(),
  body("inspectorId").optional().isUUID(),
  body("inspectorName").optional().trim(),
  body("inspectorClub").optional().trim(),
  // Representing club (for provincial/national tournaments)
  body("representingClubName").optional().trim(),
  body("representingClubCode").optional().trim(),
];

const addMemberValidation = [
  body("userId").isUUID().withMessage("Valid user ID required"),
  body("role").optional().isIn(["SKIPPER", "TEAM_LEADER", "CREW", "ANGLER", "GUEST"]).withMessage("Invalid role"),
];

const addExternalMemberValidation = [
  body("name").trim().notEmpty().withMessage("External member name is required"),
  body("role").isIn(["SKIPPER", "GUEST"]).withMessage("External members can only be SKIPPER or GUEST"),
  body("phone").optional().trim(),
  body("email").optional().isEmail().withMessage("Invalid email format"),
];

// =============================================================================
// GET /api/teams - Lista team (filtrata per tenant/torneo)
// =============================================================================
router.get(
  "/",
  authenticate,
  [
    query("tournamentId").optional().notEmpty(),
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      // Filter by tournament
      if (req.query.tournamentId) {
        where.tournamentId = req.query.tournamentId;
      }

      // Non-superadmin can only see their tenant's teams
      if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.tenantId) {
        where.tournament = { tenantId: req.user.tenantId };
      }

      const [teams, total] = await Promise.all([
        prisma.team.findMany({
          where,
          include: {
            captain: { select: { id: true, firstName: true, lastName: true, email: true } },
            members: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            },
            tournament: { select: { id: true, name: true, level: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.team.count({ where }),
      ]);

      res.json({
        success: true,
        data: teams,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to list teams";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/teams/:id - Dettaglio team
// =============================================================================
router.get(
  "/:id",
  authenticate,
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const team = await prisma.team.findUnique({
        where: { id: req.params.id },
        include: {
          captain: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          members: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true, fipsasNumber: true } },
            },
          },
          tournament: {
            select: { id: true, name: true, level: true, status: true, tenantId: true },
          },
          strikes: {
            orderBy: { strikeAt: "desc" },
            take: 10,
          },
        },
      });

      if (!team) {
        return res.status(404).json({ success: false, message: "Team not found" });
      }

      // Check tenant access
      if (
        req.user?.role !== UserRole.SUPER_ADMIN &&
        req.user?.tenantId !== team.tournament.tenantId
      ) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      res.json({ success: true, data: team });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get team";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// POST /api/teams - Crea nuovo team/barca
// =============================================================================
router.post(
  "/",
  authenticate,
  createTeamValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      // Verify tournament exists and user has access
      const tournament = await prisma.tournament.findUnique({
        where: { id: req.body.tournamentId },
        select: { id: true, tenantId: true, level: true },
      });

      if (!tournament) {
        return res.status(404).json({ success: false, message: "Tournament not found" });
      }

      // Only admin/president or tournament tenant users can create teams
      const isAdmin = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT].includes(req.user.role);
      if (!isAdmin && req.user.tenantId !== tournament.tenantId) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      // Create team with captain
      const team = await prisma.team.create({
        data: {
          name: req.body.name,
          boatName: req.body.boatName,
          captainId: req.user.userId,
          tournamentId: req.body.tournamentId,
          clubName: req.body.clubName,
          clubCode: req.body.clubCode,
        },
        include: {
          captain: { select: { id: true, firstName: true, lastName: true } },
          tournament: { select: { id: true, name: true } },
        },
      });

      // Auto-add captain as team member (with TEAM_LEADER role)
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: req.user.userId,
          role: "TEAM_LEADER",
        },
      });

      res.status(201).json({
        success: true,
        message: "Team created successfully",
        data: team,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create team";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// PUT /api/teams/:id - Aggiorna team (admin, president, o capitano)
// =============================================================================
router.put(
  "/:id",
  authenticate,
  param("id").isUUID(),
  updateTeamValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const team = await prisma.team.findUnique({
        where: { id: req.params.id },
        include: { tournament: { select: { tenantId: true } } },
      });

      if (!team) {
        return res.status(404).json({ success: false, message: "Team not found" });
      }

      // Check permission: admin/president or captain
      const isAdmin = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT].includes(req.user.role);
      const isCaptain = team.captainId === req.user.userId;

      if (!isAdmin && !isCaptain) {
        return res.status(403).json({ success: false, message: "Only team captain or admin can update team" });
      }

      // Only admin can assign boat number and inspector
      const updateData: any = {};
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.boatName) updateData.boatName = req.body.boatName;
      if (req.body.clubName !== undefined) updateData.clubName = req.body.clubName;
      if (req.body.clubCode !== undefined) updateData.clubCode = req.body.clubCode;

      // Admin-only fields
      if (isAdmin) {
        if (req.body.boatNumber !== undefined) updateData.boatNumber = req.body.boatNumber;
        if (req.body.inspectorId !== undefined) updateData.inspectorId = req.body.inspectorId;
        if (req.body.inspectorName !== undefined) updateData.inspectorName = req.body.inspectorName;
        if (req.body.inspectorClub !== undefined) updateData.inspectorClub = req.body.inspectorClub;
        // Representing club (for provincial/national tournaments)
        if (req.body.representingClubName !== undefined) updateData.representingClubName = req.body.representingClubName;
        if (req.body.representingClubCode !== undefined) updateData.representingClubCode = req.body.representingClubCode;
      }

      const updatedTeam = await prisma.team.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          captain: { select: { id: true, firstName: true, lastName: true } },
          members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        },
      });

      res.json({
        success: true,
        message: "Team updated successfully",
        data: updatedTeam,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update team";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// DELETE /api/teams/:id - Elimina team (solo admin/president)
// =============================================================================
router.delete(
  "/:id",
  authenticate,
  isAdminOrPresident(),
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      await prisma.team.delete({ where: { id: req.params.id } });

      res.json({ success: true, message: "Team deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete team";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// POST /api/teams/:id/members - Aggiungi membro equipaggio
// =============================================================================
router.post(
  "/:id/members",
  authenticate,
  param("id").isUUID(),
  addMemberValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const team = await prisma.team.findUnique({
        where: { id: req.params.id },
      });

      if (!team) {
        return res.status(404).json({ success: false, message: "Team not found" });
      }

      // Check permission: admin/president or captain
      const isAdmin = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT].includes(req.user.role);
      const isCaptain = team.captainId === req.user.userId;

      if (!isAdmin && !isCaptain) {
        return res.status(403).json({ success: false, message: "Only team captain or admin can add members" });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: req.body.userId } });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Add member
      const member = await prisma.teamMember.create({
        data: {
          teamId: req.params.id,
          userId: req.body.userId,
          role: req.body.role || "CREW",
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      res.status(201).json({
        success: true,
        message: "Member added successfully",
        data: member,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add member";
      if (message.includes("Unique constraint")) {
        return res.status(400).json({ success: false, message: "User is already a team member" });
      }
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// DELETE /api/teams/:id/members/:userId - Rimuovi membro equipaggio
// =============================================================================
router.delete(
  "/:id/members/:userId",
  authenticate,
  [param("id").isUUID(), param("userId").isUUID()],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const team = await prisma.team.findUnique({ where: { id: req.params.id } });

      if (!team) {
        return res.status(404).json({ success: false, message: "Team not found" });
      }

      // Check permission
      const isAdmin = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT].includes(req.user.role);
      const isCaptain = team.captainId === req.user.userId;

      if (!isAdmin && !isCaptain) {
        return res.status(403).json({ success: false, message: "Only team captain or admin can remove members" });
      }

      // Cannot remove captain
      if (req.params.userId === team.captainId) {
        return res.status(400).json({ success: false, message: "Cannot remove team captain" });
      }

      await prisma.teamMember.delete({
        where: {
          teamId_userId: {
            teamId: req.params.id,
            userId: req.params.userId,
          },
        },
      });

      res.json({ success: true, message: "Member removed successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove member";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// POST /api/teams/:id/members/external - Aggiungi membro esterno (skipper/ospite)
// =============================================================================
router.post(
  "/:id/members/external",
  authenticate,
  param("id").isUUID(),
  addExternalMemberValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const team = await prisma.team.findUnique({
        where: { id: req.params.id },
        include: { tournament: { select: { level: true } } },
      });

      if (!team) {
        return res.status(404).json({ success: false, message: "Team not found" });
      }

      // Check permission: admin/president or captain
      const isAdmin = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT].includes(req.user.role);
      const isCaptain = team.captainId === req.user.userId;

      if (!isAdmin && !isCaptain) {
        return res.status(403).json({ success: false, message: "Only team captain or admin can add members" });
      }

      // External members (SKIPPER/GUEST) are only allowed for SOCIAL/CLUB tournaments
      const allowedLevels = ["SOCIAL", "CLUB"];
      if (!allowedLevels.includes(team.tournament.level)) {
        return res.status(400).json({
          success: false,
          message: "External members are only allowed for internal (SOCIAL/CLUB) tournaments",
        });
      }

      // Create external member
      const member = await prisma.teamMember.create({
        data: {
          teamId: req.params.id,
          userId: null, // No registered user
          isExternal: true,
          externalName: req.body.name,
          externalPhone: req.body.phone || null,
          externalEmail: req.body.email || null,
          role: req.body.role,
        },
      });

      res.status(201).json({
        success: true,
        message: "External member added successfully",
        data: member,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add external member";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// PUT /api/teams/:id/inspector - Assegna ispettore di bordo (solo admin)
// =============================================================================
router.put(
  "/:id/inspector",
  authenticate,
  isAdminOrPresident(),
  param("id").isUUID(),
  [
    body("inspectorId").optional().isUUID(),
    body("inspectorName").optional().trim().notEmpty(),
    body("inspectorClub").optional().trim(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const team = await prisma.team.update({
        where: { id: req.params.id },
        data: {
          inspectorId: req.body.inspectorId || null,
          inspectorName: req.body.inspectorName || null,
          inspectorClub: req.body.inspectorClub || null,
        },
        include: {
          captain: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      res.json({
        success: true,
        message: "Inspector assigned successfully",
        data: team,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to assign inspector";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/teams/tournament/:tournamentId - Team di un torneo specifico
// =============================================================================
router.get(
  "/tournament/:tournamentId",
  authenticate,
  param("tournamentId").notEmpty(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teams = await prisma.team.findMany({
        where: { tournamentId: req.params.tournamentId },
        include: {
          captain: { select: { id: true, firstName: true, lastName: true } },
          members: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          _count: { select: { strikes: true } },
        },
        orderBy: [{ boatNumber: "asc" }, { name: "asc" }],
      });

      res.json({ success: true, data: teams });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get teams";
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
