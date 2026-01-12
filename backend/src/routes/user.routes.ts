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
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { AuthService } from "../services/auth.service";

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

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

// Avatar storage config
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/avatars");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthenticatedRequest).user?.userId || "unknown";
    cb(null, `${userId}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

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
// POST /api/users - Crea nuovo utente (admin only)
// =============================================================================
router.post(
  "/",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT),
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").optional().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("firstName").trim().notEmpty().withMessage("First name required"),
    body("lastName").trim().notEmpty().withMessage("Last name required"),
    body("phone").optional().trim(),
    body("fipsasNumber").optional().trim(),
    body("role").optional().isIn(Object.values(UserRole)),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password, firstName, lastName, phone, fipsasNumber, role } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "User with this email already exists" });
      }

      // Non-super admins can only create users in their tenant
      const tenantId = req.user?.role === UserRole.SUPER_ADMIN
        ? req.body.tenantId || req.user?.tenantId
        : req.user?.tenantId;

      // Non-super admins cannot create SUPER_ADMIN users
      const finalRole = role || UserRole.PARTICIPANT;
      if (finalRole === UserRole.SUPER_ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ success: false, message: "Cannot create SUPER_ADMIN user" });
      }

      // Generate password if not provided
      const generateRandomPassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 10; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };
      const finalPassword = password || generateRandomPassword();
      const wasPasswordGenerated = !password;

      // Hash password
      const passwordHash = await bcrypt.hash(finalPassword, 12);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          phone: phone || null,
          fipsasNumber: fipsasNumber || null,
          role: finalRole as any,
          tenantId: tenantId || null,
          isActive: true,
          isVerified: true, // Admin-created users are pre-verified
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          fipsasNumber: true,
          isActive: true,
          createdAt: true,
          tenant: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: newUser,
        generatedPassword: wasPasswordGenerated ? finalPassword : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create user";
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
// PUT /api/users/me/password - Cambia password utente
// =============================================================================
router.put(
  "/me/password",
  authenticate,
  changePasswordValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, passwordHash: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Verify current password
      const isCurrentValid = await AuthService.verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return res.status(401).json({ success: false, message: "Current password is incorrect" });
      }

      // Hash and update new password
      const newPasswordHash = await AuthService.hashPassword(newPassword);
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { passwordHash: newPasswordHash },
      });

      res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to change password";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// POST /api/users/me/avatar - Upload avatar utente
// =============================================================================
router.post(
  "/me/avatar",
  authenticate,
  avatarUpload.single("avatar"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const uploadDir = path.join(__dirname, "../../uploads/avatars");
      const outputFileName = `${req.user.userId}.jpg`;
      const outputPath = path.join(uploadDir, outputFileName);

      // Process image with sharp (resize to 256x256, convert to jpg)
      await sharp(req.file.path)
        .resize(256, 256, { fit: "cover" })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      // Remove original uploaded file if different from output
      if (req.file.path !== outputPath) {
        fs.unlinkSync(req.file.path);
      }

      const avatarUrl = `/uploads/avatars/${outputFileName}`;

      // Update user avatar field
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { avatar: avatarUrl },
      });

      res.status(201).json({
        success: true,
        message: "Avatar uploaded successfully",
        data: { avatar: avatarUrl },
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      const message = error instanceof Error ? error.message : "Failed to upload avatar";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// DELETE /api/users/me/avatar - Rimuovi avatar utente
// =============================================================================
router.delete(
  "/me/avatar",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      // Get current user avatar
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { avatar: true },
      });

      if (user?.avatar) {
        // Delete avatar file
        const avatarPath = path.join(__dirname, "../../", user.avatar);
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
        }
      }

      // Clear avatar field
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { avatar: null },
      });

      res.json({
        success: true,
        message: "Avatar removed successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove avatar";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/users/me/registrations - Tornei a cui l'utente ha partecipato
// =============================================================================
router.get(
  "/me/registrations",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const registrations = await prisma.tournamentRegistration.findMany({
        where: { userId: req.user.userId },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              discipline: true,
              status: true,
              startDate: true,
              endDate: true,
              location: true,
              bannerImage: true,
              tenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { registeredAt: "desc" },
      });

      // Separate into upcoming and past tournaments
      const now = new Date();
      const upcoming = registrations.filter(
        (r) => new Date(r.tournament.endDate) >= now
      );
      const past = registrations.filter(
        (r) => new Date(r.tournament.endDate) < now
      );

      res.json({
        success: true,
        data: {
          upcoming,
          past,
          total: registrations.length,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get registrations";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/users/me/stats - Statistiche di pesca dell'utente
// =============================================================================
router.get(
  "/me/stats",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      // Get all approved catches
      const catches = await prisma.catch.findMany({
        where: {
          userId: req.user.userId,
          status: "APPROVED",
        },
        select: {
          weight: true,
          points: true,
          caughtAt: true,
          species: {
            select: {
              id: true,
              commonNameIt: true,
            },
          },
        },
      });

      // Get tournament count
      const tournamentCount = await prisma.tournamentRegistration.count({
        where: {
          userId: req.user.userId,
          status: "CONFIRMED",
        },
      });

      // Get leaderboard entries (for podium finishes)
      const leaderboardEntries = await prisma.leaderboardEntry.findMany({
        where: {
          userId: req.user.userId,
          rank: { lte: 3 }, // Top 3 positions
        },
        select: {
          rank: true,
          tournamentId: true,
        },
      });

      // Calculate stats
      const totalCatches = catches.length;
      const totalWeight = catches.reduce(
        (sum, c) => sum + Number(c.weight),
        0
      );
      const totalPoints = catches.reduce(
        (sum, c) => sum + (c.points ? Number(c.points) : 0),
        0
      );
      const biggestCatch = catches.length > 0
        ? Math.max(...catches.map((c) => Number(c.weight)))
        : 0;

      // Species breakdown
      const speciesMap = new Map<string, { name: string; count: number; totalWeight: number }>();
      catches.forEach((c) => {
        if (c.species) {
          const existing = speciesMap.get(c.species.id);
          if (existing) {
            existing.count++;
            existing.totalWeight += Number(c.weight);
          } else {
            speciesMap.set(c.species.id, {
              name: c.species.commonNameIt,
              count: 1,
              totalWeight: Number(c.weight),
            });
          }
        }
      });

      const speciesBreakdown = Array.from(speciesMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 species

      // Podium counts
      const goldCount = leaderboardEntries.filter((e) => e.rank === 1).length;
      const silverCount = leaderboardEntries.filter((e) => e.rank === 2).length;
      const bronzeCount = leaderboardEntries.filter((e) => e.rank === 3).length;

      res.json({
        success: true,
        data: {
          tournamentsParticipated: tournamentCount,
          totalCatches,
          totalWeight: Math.round(totalWeight * 1000) / 1000, // Round to 3 decimals
          totalPoints: Math.round(totalPoints * 100) / 100,
          biggestCatch: Math.round(biggestCatch * 1000) / 1000,
          averageWeight: totalCatches > 0
            ? Math.round((totalWeight / totalCatches) * 1000) / 1000
            : 0,
          podiums: {
            gold: goldCount,
            silver: silverCount,
            bronze: bronzeCount,
            total: goldCount + silverCount + bronzeCount,
          },
          speciesBreakdown,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get stats";
      res.status(500).json({ success: false, message });
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
// GET /api/users/:id/registrations - Tornei di un utente specifico (admin only)
// =============================================================================
router.get(
  "/:id/registrations",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT),
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetUserId = req.params.id;

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, tenantId: true },
      });

      if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Check tenant access for non-super admins
      if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.tenantId) {
        if (targetUser.tenantId !== req.user.tenantId) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      }

      const registrations = await prisma.tournamentRegistration.findMany({
        where: { userId: targetUserId },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              discipline: true,
              status: true,
              startDate: true,
              endDate: true,
              location: true,
              bannerImage: true,
              tenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { registeredAt: "desc" },
      });

      // Separate into upcoming and past tournaments
      const now = new Date();
      const upcoming = registrations.filter(
        (r) => new Date(r.tournament.endDate) >= now
      );
      const past = registrations.filter(
        (r) => new Date(r.tournament.endDate) < now
      );

      res.json({
        success: true,
        data: {
          upcoming,
          past,
          total: registrations.length,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get registrations";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/users/:id/stats - Statistiche di pesca di un utente specifico (admin only)
// =============================================================================
router.get(
  "/:id/stats",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT),
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetUserId = req.params.id;

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, tenantId: true, firstName: true, lastName: true },
      });

      if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Check tenant access for non-super admins
      if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.tenantId) {
        if (targetUser.tenantId !== req.user.tenantId) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      }

      // Get all approved catches
      const catches = await prisma.catch.findMany({
        where: {
          userId: targetUserId,
          status: "APPROVED",
        },
        select: {
          weight: true,
          points: true,
          caughtAt: true,
          species: {
            select: {
              id: true,
              commonNameIt: true,
            },
          },
        },
      });

      // Get tournament count
      const tournamentCount = await prisma.tournamentRegistration.count({
        where: {
          userId: targetUserId,
          status: "CONFIRMED",
        },
      });

      // Get leaderboard entries (for podium finishes)
      const leaderboardEntries = await prisma.leaderboardEntry.findMany({
        where: {
          userId: targetUserId,
          rank: { lte: 3 }, // Top 3 positions
        },
        select: {
          rank: true,
          tournamentId: true,
        },
      });

      // Calculate stats
      const totalCatches = catches.length;
      const totalWeight = catches.reduce(
        (sum, c) => sum + Number(c.weight),
        0
      );
      const totalPoints = catches.reduce(
        (sum, c) => sum + (c.points ? Number(c.points) : 0),
        0
      );
      const biggestCatch = catches.length > 0
        ? Math.max(...catches.map((c) => Number(c.weight)))
        : 0;

      // Species breakdown
      const speciesMap = new Map<string, { name: string; count: number; totalWeight: number }>();
      catches.forEach((c) => {
        if (c.species) {
          const existing = speciesMap.get(c.species.id);
          if (existing) {
            existing.count++;
            existing.totalWeight += Number(c.weight);
          } else {
            speciesMap.set(c.species.id, {
              name: c.species.commonNameIt,
              count: 1,
              totalWeight: Number(c.weight),
            });
          }
        }
      });

      const speciesBreakdown = Array.from(speciesMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 species

      // Podium counts
      const goldCount = leaderboardEntries.filter((e) => e.rank === 1).length;
      const silverCount = leaderboardEntries.filter((e) => e.rank === 2).length;
      const bronzeCount = leaderboardEntries.filter((e) => e.rank === 3).length;

      res.json({
        success: true,
        data: {
          user: {
            id: targetUser.id,
            firstName: targetUser.firstName,
            lastName: targetUser.lastName,
          },
          tournamentsParticipated: tournamentCount,
          totalCatches,
          totalWeight: Math.round(totalWeight * 1000) / 1000,
          totalPoints: Math.round(totalPoints * 100) / 100,
          biggestCatch: Math.round(biggestCatch * 1000) / 1000,
          averageWeight: totalCatches > 0
            ? Math.round((totalWeight / totalCatches) * 1000) / 1000
            : 0,
          podiums: {
            gold: goldCount,
            silver: silverCount,
            bronze: bronzeCount,
            total: goldCount + silverCount + bronzeCount,
          },
          speciesBreakdown,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get stats";
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
