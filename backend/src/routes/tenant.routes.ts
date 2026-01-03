/**
 * =============================================================================
 * Tenant Routes - Gestione Associazioni (Super Admin Only)
 * =============================================================================
 * Endpoint per:
 * - Lista associazioni
 * - Creazione nuova associazione
 * - Conferma pagamento/registrazione
 * - Congelamento/Attivazione associazione
 * - Selezione associazione da amministrare
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

const createTenantValidation = [
  body("name").trim().notEmpty().withMessage("Nome associazione richiesto"),
  body("slug")
    .trim()
    .notEmpty()
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Slug deve contenere solo lettere minuscole, numeri e trattini"),
  body("domain").optional().trim(),
  body("logo").optional().trim(),
  body("primaryColor")
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage("Colore deve essere in formato hex (#RRGGBB)"),
  body("adminEmail").isEmail().withMessage("Email amministratore richiesta"),
  body("adminFirstName").trim().notEmpty().withMessage("Nome amministratore richiesto"),
  body("adminLastName").trim().notEmpty().withMessage("Cognome amministratore richiesto"),
  body("adminPassword").isLength({ min: 6 }).withMessage("Password minimo 6 caratteri"),
];

const updateTenantValidation = [
  body("name").optional().trim().notEmpty(),
  body("domain").optional().trim(),
  body("logo").optional().trim(),
  body("primaryColor")
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/),
];

const updateBrandingValidation = [
  body("name").optional().trim().notEmpty(),
  body("description").optional().trim(),
  body("logo").optional().trim(),
  body("bannerImage").optional().trim(),
  body("primaryColor").optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body("secondaryColor").optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body("contactEmail").optional().isEmail(),
  body("contactPhone").optional().trim(),
  body("website").optional().trim(),
  body("address").optional().trim(),
  body("socialFacebook").optional().trim(),
  body("socialInstagram").optional().trim(),
  body("socialYoutube").optional().trim(),
  body("fipsasCode").optional().trim(),
  body("fipsasRegion").optional().trim(),
];

// =============================================================================
// GET /api/tenants - Lista tutte le associazioni (Super Admin only)
// =============================================================================
router.get(
  "/",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("search").optional().trim(),
    query("status").optional().isIn(["all", "active", "frozen", "pending"]),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      // Search by name
      if (req.query.search) {
        where.name = { contains: req.query.search as string };
      }

      // Filter by status
      if (req.query.status && req.query.status !== "all") {
        if (req.query.status === "active") {
          where.isActive = true;
        } else if (req.query.status === "frozen") {
          where.isActive = false;
        }
        // "pending" will be handled when we add registrationStatus field
      }

      const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
          where,
          include: {
            users: {
              where: { role: { in: ["TENANT_ADMIN", "PRESIDENT"] } },
              select: { id: true, firstName: true, lastName: true, email: true, role: true },
            },
            _count: {
              select: { users: true, tournaments: true },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.tenant.count({ where }),
      ]);

      res.json({
        success: true,
        data: tenants,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to list tenants";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/tenants/:id - Dettaglio associazione
// =============================================================================
router.get(
  "/:id",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.params.id },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
          tournaments: {
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
            },
            orderBy: { startDate: "desc" },
            take: 10,
          },
          _count: {
            select: { users: true, tournaments: true },
          },
        },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: "Associazione non trovata" });
      }

      res.json({ success: true, data: tenant });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get tenant";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// POST /api/tenants - Crea nuova associazione con admin
// =============================================================================
router.post(
  "/",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  createTenantValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Check if slug already exists
      const existingSlug = await prisma.tenant.findUnique({
        where: { slug: req.body.slug },
      });
      if (existingSlug) {
        return res.status(400).json({ success: false, message: "Slug già in uso" });
      }

      // Check if admin email already exists
      const existingEmail = await prisma.user.findUnique({
        where: { email: req.body.adminEmail },
      });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "Email amministratore già in uso" });
      }

      // Hash password
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(req.body.adminPassword, 10);

      // Create tenant and admin in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create tenant
        const tenant = await tx.tenant.create({
          data: {
            name: req.body.name,
            slug: req.body.slug,
            domain: req.body.domain || null,
            logo: req.body.logo || null,
            primaryColor: req.body.primaryColor || "#0066CC",
            isActive: false, // Start as inactive until payment confirmed
          },
        });

        // Create admin user for the tenant
        const admin = await tx.user.create({
          data: {
            email: req.body.adminEmail,
            passwordHash: hashedPassword,
            firstName: req.body.adminFirstName,
            lastName: req.body.adminLastName,
            role: UserRole.TENANT_ADMIN,
            tenantId: tenant.id,
            isActive: true,
          },
        });

        return { tenant, admin };
      });

      res.status(201).json({
        success: true,
        message: "Associazione creata. In attesa di conferma pagamento.",
        data: {
          tenant: result.tenant,
          admin: {
            id: result.admin.id,
            email: result.admin.email,
            firstName: result.admin.firstName,
            lastName: result.admin.lastName,
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create tenant";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// PUT /api/tenants/:id - Aggiorna associazione
// =============================================================================
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  param("id").isUUID(),
  updateTenantValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: req.params.id },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: "Associazione non trovata" });
      }

      const updateData: any = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.domain !== undefined) updateData.domain = req.body.domain;
      if (req.body.logo !== undefined) updateData.logo = req.body.logo;
      if (req.body.primaryColor !== undefined) updateData.primaryColor = req.body.primaryColor;

      const updated = await prisma.tenant.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({
        success: true,
        message: "Associazione aggiornata",
        data: updated,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update tenant";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// PATCH /api/tenants/:id/confirm - Conferma registrazione (dopo pagamento)
// =============================================================================
router.patch(
  "/:id/confirm",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.params.id },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: "Associazione non trovata" });
      }

      if (tenant.isActive) {
        return res.status(400).json({ success: false, message: "Associazione già attiva" });
      }

      const updated = await prisma.tenant.update({
        where: { id: req.params.id },
        data: { isActive: true },
      });

      res.json({
        success: true,
        message: "Registrazione confermata. Associazione attiva.",
        data: updated,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to confirm tenant";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// PATCH /api/tenants/:id/freeze - Congela/Scongela associazione
// =============================================================================
router.patch(
  "/:id/freeze",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  param("id").isUUID(),
  body("frozen").isBoolean().withMessage("frozen deve essere true o false"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: req.params.id },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: "Associazione non trovata" });
      }

      const updated = await prisma.tenant.update({
        where: { id: req.params.id },
        data: { isActive: !req.body.frozen },
      });

      res.json({
        success: true,
        message: req.body.frozen ? "Associazione congelata" : "Associazione scongelata",
        data: updated,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to freeze tenant";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// POST /api/tenants/:id/impersonate - Entra nell'associazione per amministrarla
// =============================================================================
router.post(
  "/:id/impersonate",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.params.id },
        select: { id: true, name: true, slug: true },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: "Associazione non trovata" });
      }

      // Generate a special token with the tenant context
      const jwt = require("jsonwebtoken");
      const impersonationToken = jwt.sign(
        {
          userId: req.user!.userId,
          email: req.user!.email,
          role: UserRole.SUPER_ADMIN,
          tenantId: tenant.id,
          impersonating: true,
          originalTenantId: req.user!.tenantId || null,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "4h" }
      );

      res.json({
        success: true,
        message: `Stai amministrando ${tenant.name}`,
        data: {
          tenant,
          token: impersonationToken,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to impersonate tenant";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// POST /api/tenants/exit-impersonation - Esci dalla modalità impersonazione
// =============================================================================
router.post(
  "/exit-impersonation",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Generate a new token without tenant context
      const jwt = require("jsonwebtoken");
      const originalToken = jwt.sign(
        {
          userId: req.user!.userId,
          email: req.user!.email,
          role: UserRole.SUPER_ADMIN,
          tenantId: null,
          impersonating: false,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        message: "Tornato alla visualizzazione Super Admin",
        data: { token: originalToken },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to exit impersonation";
      res.status(400).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/tenants/:id/stats - Statistiche associazione
// =============================================================================
router.get(
  "/:id/stats",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.params.id;

      const [userCount, tournamentCount, teamCount, activeUsers] = await Promise.all([
        prisma.user.count({ where: { tenantId } }),
        prisma.tournament.count({ where: { tenantId } }),
        prisma.team.count({
          where: { tournament: { tenantId } },
        }),
        prisma.user.count({
          where: { tenantId, isActive: true },
        }),
      ]);

      res.json({
        success: true,
        data: {
          users: { total: userCount, active: activeUsers },
          tournaments: tournamentCount,
          teams: teamCount,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get stats";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// PUBLIC ENDPOINTS (No auth required)
// =============================================================================

/**
 * GET /api/tenants/public/:slug - Get public tenant info by slug
 * This endpoint is used to display association homepage
 */
router.get(
  "/public/:slug",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: {
          slug: req.params.slug,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          bannerImage: true,
          primaryColor: true,
          secondaryColor: true,
          description: true,
          contactEmail: true,
          contactPhone: true,
          website: true,
          address: true,
          socialFacebook: true,
          socialInstagram: true,
          socialYoutube: true,
          fipsasCode: true,
          fipsasRegion: true,
          _count: {
            select: { tournaments: true, users: true },
          },
        },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: "Associazione non trovata" });
      }

      // Get recent public tournaments
      const recentTournaments = await prisma.tournament.findMany({
        where: {
          tenantId: tenant.id,
          status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] },
        },
        select: {
          id: true,
          name: true,
          discipline: true,
          status: true,
          startDate: true,
          endDate: true,
          location: true,
          bannerImage: true,
        },
        orderBy: { startDate: "desc" },
        take: 6,
      });

      res.json({
        success: true,
        data: {
          ...tenant,
          recentTournaments,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get tenant";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// TENANT BRANDING (For Tenant Admin / President)
// =============================================================================

/**
 * GET /api/tenants/me/branding - Get current tenant branding settings
 */
router.get(
  "/me/branding",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get tenantId from token or query param for super admin
      let tenantId = req.user?.tenantId;

      // Super admin can specify tenantId via query param
      if (req.user?.role === UserRole.SUPER_ADMIN && req.query.tenantId) {
        tenantId = req.query.tenantId as string;
      }

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Nessuna associazione selezionata",
        });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          logo: true,
          bannerImage: true,
          primaryColor: true,
          secondaryColor: true,
          description: true,
          contactEmail: true,
          contactPhone: true,
          website: true,
          address: true,
          socialFacebook: true,
          socialInstagram: true,
          socialYoutube: true,
          fipsasCode: true,
          fipsasRegion: true,
        },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: "Associazione non trovata" });
      }

      res.json({ success: true, data: tenant });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get branding";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * PUT /api/tenants/me/branding - Update current tenant branding settings
 */
router.put(
  "/me/branding",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT),
  updateBrandingValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Get tenantId from token or query param for super admin
      let tenantId = req.user?.tenantId;

      // Super admin can specify tenantId via query param
      if (req.user?.role === UserRole.SUPER_ADMIN && req.query.tenantId) {
        tenantId = req.query.tenantId as string;
      }

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Nessuna associazione selezionata",
        });
      }

      // Build update data from request body
      const updateData: any = {};
      const allowedFields = [
        "name", "description", "logo", "bannerImage",
        "primaryColor", "secondaryColor",
        "contactEmail", "contactPhone", "website", "address",
        "socialFacebook", "socialInstagram", "socialYoutube",
        "fipsasCode", "fipsasRegion",
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field] || null;
        }
      }

      const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: updateData,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          bannerImage: true,
          primaryColor: true,
          secondaryColor: true,
          description: true,
          contactEmail: true,
          contactPhone: true,
          website: true,
          address: true,
          socialFacebook: true,
          socialInstagram: true,
          socialYoutube: true,
          fipsasCode: true,
          fipsasRegion: true,
        },
      });

      res.json({
        success: true,
        message: "Impostazioni aggiornate con successo",
        data: updated,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update branding";
      res.status(400).json({ success: false, message });
    }
  }
);

export default router;
