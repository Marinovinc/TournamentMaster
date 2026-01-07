/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/routes/media.routes.ts
 * Creato: 2026-01-06
 * Descrizione: API routes per Media Library (foto e video)
 *
 * Endpoints:
 * - GET    /api/media              - Lista media (filtrato per ruolo)
 * - GET    /api/media/:id          - Dettaglio singolo media
 * - POST   /api/media              - Upload nuovo media
 * - PUT    /api/media/:id          - Modifica media
 * - DELETE /api/media/:id          - Elimina media
 * - GET    /api/media/categories   - Lista categorie disponibili
 *
 * Accesso:
 * - SuperAdmin: vede e gestisce tutti i media
 * - TenantAdmin: vede globali + gestisce solo i propri
 * =============================================================================
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/temp");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo file non supportato"));
    }
  },
});

// Available categories
const CATEGORIES = [
  "tournament",
  "boat",
  "catch",
  "port",
  "sea",
  "sunset",
  "action",
  "team",
  "award",
  "general",
];

/**
 * GET /api/media/categories
 * Lista categorie disponibili
 */
router.get("/categories", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: CATEGORIES,
  });
});

/**
 * GET /api/media
 * Lista media con filtri e paginazione
 * - SuperAdmin: vede tutto
 * - TenantAdmin: vede globali (tenantId=null) + propri (tenantId=proprio)
 */
router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, search, page = "1", limit = "20", onlyGlobal, onlyTenant } = req.query;
    const user = req.user!;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Build where clause based on role
    const where: any = { isActive: true };

    // SuperAdmin sees all, TenantAdmin sees global + own tenant
    if (user.role !== 'SUPER_ADMIN') {
      if (onlyGlobal === "true") {
        where.tenantId = null;
      } else if (onlyTenant === "true") {
        where.tenantId = user.tenantId;
      } else {
        where.OR = [{ tenantId: null }, { tenantId: user.tenantId }];
      }
    } else {
      // SuperAdmin filters
      if (onlyGlobal === "true") {
        where.tenantId = null;
      } else if (onlyTenant === "true" && req.query.tenantId) {
        where.tenantId = req.query.tenantId;
      }
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: search as string } },
        { tags: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const [media, total] = await Promise.all([
      prisma.bannerImage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          tenant: {
            select: { id: true, name: true, slug: true },
          },
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.bannerImage.count({ where }),
    ]);

    res.json({
      success: true,
      data: media,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero dei media",
    });
  }
});

/**
 * GET /api/media/:id
 * Dettaglio singolo media
 */
router.get("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const media = await prisma.bannerImage.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media non trovato",
      });
    }

    // Check access: SuperAdmin can see all, TenantAdmin can see global + own
    if (user.role !== 'SUPER_ADMIN') {
      if (media.tenantId && media.tenantId !== user.tenantId) {
        return res.status(403).json({
          success: false,
          message: "Non hai accesso a questo media",
        });
      }
    }

    res.json({
      success: true,
      data: media,
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero del media",
    });
  }
});

/**
 * POST /api/media
 * Upload nuovo media
 */
router.post(
  "/",
  authenticate,
  upload.single("file"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const file = req.file;

      // Only admins can upload
      if (!["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT"].includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Non hai i permessi per caricare media",
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Nessun file caricato",
        });
      }

      const { title, description, category, tags, isGlobal } = req.body;

      if (!title || !category) {
        return res.status(400).json({
          success: false,
          message: "Titolo e categoria sono obbligatori",
        });
      }

      // Determine tenantId
      let tenantId: string | null = null;
      if (isGlobal === "true" && user.role === 'SUPER_ADMIN') {
        tenantId = null; // Global media
      } else if (user.tenantId) {
        tenantId = user.tenantId;
      }

      // Process image (resize to max 1920x1080, create thumbnail)
      const bannersDir = path.join(__dirname, "../../../frontend/public/images/banners");
      if (!fs.existsSync(bannersDir)) {
        fs.mkdirSync(bannersDir, { recursive: true });
      }

      const filename = `${Date.now()}-${path.parse(file.originalname).name}.jpg`;
      const outputPath = path.join(bannersDir, filename);

      // Get image dimensions
      const metadata = await sharp(file.path).metadata();

      // Resize maintaining aspect ratio
      await sharp(file.path)
        .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      // Clean up temp file
      fs.unlinkSync(file.path);

      // Calculate aspect ratio
      const aspectRatio = metadata.width && metadata.height
        ? `${Math.round(metadata.width / Math.gcd(metadata.width, metadata.height))}:${Math.round(metadata.height / Math.gcd(metadata.width, metadata.height))}`
        : null;

      // Create database entry
      const media = await prisma.bannerImage.create({
        data: {
          filename,
          path: `/images/banners/${filename}`,
          title,
          description: description || null,
          alt: title,
          category,
          tags: tags || null,
          width: metadata.width || null,
          height: metadata.height || null,
          aspectRatio,
          source: "upload",
          tenantId,
          uploadedById: user.userId,
        },
        include: {
          tenant: { select: { id: true, name: true } },
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      res.status(201).json({
        success: true,
        data: media,
        message: "Media caricato con successo",
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({
        success: false,
        message: "Errore nel caricamento del media",
      });
    }
  }
);

/**
 * PUT /api/media/:id
 * Modifica media (solo metadati, non file)
 */
router.put("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { title, description, category, tags, isActive, isFeatured } = req.body;

    const existing = await prisma.bannerImage.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Media non trovato",
      });
    }

    // Check permissions
    if (user.role !== 'SUPER_ADMIN') {
      if (existing.tenantId !== user.tenantId) {
        return res.status(403).json({
          success: false,
          message: "Non hai i permessi per modificare questo media",
        });
      }
    }

    const media = await prisma.bannerImage.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        category: category || undefined,
        tags: tags !== undefined ? tags : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        isFeatured: user.role === 'SUPER_ADMIN' && isFeatured !== undefined ? isFeatured : undefined,
      },
      include: {
        tenant: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.json({
      success: true,
      data: media,
      message: "Media aggiornato con successo",
    });
  } catch (error) {
    console.error("Error updating media:", error);
    res.status(500).json({
      success: false,
      message: "Errore nell'aggiornamento del media",
    });
  }
});

/**
 * DELETE /api/media/:id
 * Elimina media (soft delete)
 */
router.delete("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existing = await prisma.bannerImage.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Media non trovato",
      });
    }

    // Check permissions
    if (user.role !== 'SUPER_ADMIN') {
      if (existing.tenantId !== user.tenantId) {
        return res.status(403).json({
          success: false,
          message: "Non hai i permessi per eliminare questo media",
        });
      }
    }

    // Soft delete
    await prisma.bannerImage.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Media eliminato con successo",
    });
  } catch (error) {
    console.error("Error deleting media:", error);
    res.status(500).json({
      success: false,
      message: "Errore nell'eliminazione del media",
    });
  }
});

// Helper function for GCD (for aspect ratio calculation)
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// Extend Math object
declare global {
  interface Math {
    gcd: (a: number, b: number) => number;
  }
}
Math.gcd = gcd;

export default router;
