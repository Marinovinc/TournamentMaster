/**
 * =============================================================================
 * User Routes - Gestione Utenti
 * =============================================================================
 * Endpoint per:
 * - Lista utenti (con filtri e paginazione)
 * - Profilo utente corrente
 * - CRUD utenti (admin)
 * - Gestione stato utenti
 */

import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole } from "../types";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";

const router = Router();

// =============================================================================
// VALIDATION RULES
// =============================================================================

const updateProfileValidation = [
  body("firstName").optional().trim().isLength({ min: 1, max: 100 }),
  body("lastName").optional().trim().isLength({ min: 1, max: 100 }),
  body("phone").optional().trim(),
];

const updateUserValidation = [
  body("firstName").optional().trim().isLength({ min: 1, max: 100 }),
  body("lastName").optional().trim().isLength({ min: 1, max: 100 }),
  body("phone").optional().trim(),
  body("role").optional().isIn(Object.values(UserRole)),
  body("isActive").optional().isBoolean(),
];

// =============================================================================
// GET /api/users - Lista utenti (admin only)
// =============================================================================
router.get(
  "/",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT),
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("search").optional().trim(),
    query("role").optional().isIn(Object.values(UserRole)),
    query("isActive").optional().isBoolean(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 100;
      const skip = (page - 1) * limit;

      const where: any = {};

      // Filter by tenant for non-super admins
      if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.tenantId) {
        where.tenantId = req.user.tenantId;
      }

      // Search by name or email
      if (req.query.search) {
        const search = req.query.search as string;
        where.OR = [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
        ];
      }

      // Filter by role
      if (req.query.role) {
        where.role = req.query.role;
      }

      // Filter by active status
      if (req.query.isActive !== undefined) {
        where.isActive = req.query.isActive === "true";
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            phone: true,
            createdAt: true,
            lastLoginAt: true,
            tenant: {
              select: { id: true, name: true },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to list users";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/users/me - Profilo utente corrente
// =============================================================================
router.get("/me", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true,
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get profile";
    res.status(500).json({ success: false, message });
  }
});

// =============================================================================
// PUT /api/users/me - Aggiorna profilo utente corrente
// =============================================================================
router.put(
  "/me",
  authenticate,
  updateProfileValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const updateData: any = {};
      if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
      if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
      if (req.body.phone !== undefined) updateData.phone = req.body.phone;

      const user = await prisma.user.update({
        where: { id: req.user.userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
        },
      });

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/users/:id - Dettaglio utente (admin only)
// =============================================================================
router.get(
  "/:id",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT),
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          phone: true,
          createdAt: true,
          lastLoginAt: true,
          tenant: {
            select: { id: true, name: true },
          },
          captainedTeams: {
            select: { id: true, name: true, boatName: true },
          },
          teamMemberships: {
            select: {
              team: { select: { id: true, name: true, boatName: true } },
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Check tenant access for non-super admins
      if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.tenantId) {
        const userTenant = await prisma.user.findUnique({
          where: { id: req.params.id },
          select: { tenantId: true },
        });
        if (userTenant?.tenantId !== req.user.tenantId) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      }

      res.json({ success: true, data: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get user";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// PUT /api/users/:id - Aggiorna utente (admin only)
// =============================================================================
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT),
  param("id").isUUID(),
  updateUserValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, tenantId: true, role: true },
      });

      if (!existingUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Check tenant access for non-super admins
      if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.tenantId) {
        if (existingUser.tenantId !== req.user.tenantId) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      }

      // Prevent non-super admins from creating super admins
      if (req.body.role === UserRole.SUPER_ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ success: false, message: "Cannot assign SUPER_ADMIN role" });
      }

      const updateData: any = {};
      if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
      if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
      if (req.body.phone !== undefined) updateData.phone = req.body.phone;
      if (req.body.role !== undefined) updateData.role = req.body.role;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          phone: true,
        },
      });

      res.json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// PATCH /api/users/:id/status - Attiva/Disattiva utente (admin only)
// =============================================================================
router.patch(
  "/:id/status",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT),
  param("id").isUUID(),
  body("isActive").isBoolean().withMessage("isActive must be a boolean"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, tenantId: true },
      });

      if (!existingUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Check tenant access for non-super admins
      if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.tenantId) {
        if (existingUser.tenantId !== req.user.tenantId) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      }

      // Prevent self-deactivation
      if (req.params.id === req.user?.userId && req.body.isActive === false) {
        return res.status(400).json({ success: false, message: "Cannot deactivate yourself" });
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: req.body.isActive },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      });

      res.json({
        success: true,
        message: `User ${req.body.isActive ? "activated" : "deactivated"} successfully`,
        data: user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user status";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// DELETE /api/users/:id - Elimina utente (super admin only)
// =============================================================================
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Prevent self-deletion
      if (req.params.id === req.user?.userId) {
        return res.status(400).json({ success: false, message: "Cannot delete yourself" });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: req.params.id },
      });

      if (!existingUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Soft delete by deactivating (or hard delete if needed)
      await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });

      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete user";
      res.status(400).json({ success: false, message });
    }
  }
);

export default router;
