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
import { ThumbnailService } from "../services/thumbnail.service";

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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max (for videos)
  fileFilter: (req, file, cb) => {
    // Check MIME type
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
      return;
    }
    // Fallback: check by extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".webm", ".avi", ".mkv"];
    if (allowedExts.includes(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error("Tipo file non supportato: " + file.mimetype + " (" + ext + ")"));
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

// Video extensions for filtering
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi'];

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
 * GET /api/media/tenants
 * Lista tenant disponibili (solo SuperAdmin)
 */
router.get("/tenants", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;

    if (user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Accesso non autorizzato",
      });
    }

    // Get only tenants that have media
    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        bannerImages: { some: { isActive: true } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { bannerImages: true } },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: tenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        mediaCount: t._count.bannerImages,
      })),
    });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero delle associazioni",
    });
  }
});

/**
 * GET /api/media/tournaments
 * Lista tornei disponibili per filtro (solo SuperAdmin)
 * Ritorna solo tornei che hanno almeno un media associato
 */
router.get("/tournaments", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { tenantId } = req.query;

    if (user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Accesso non autorizzato",
      });
    }

    const where: any = {
      mediaLibrary: { some: { isActive: true } },
    };
    if (tenantId && tenantId !== "all") {
      where.tenantId = tenantId;
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      select: {
        id: true,
        name: true,
        tenantId: true,
        tenant: { select: { name: true } },
        _count: { select: { mediaLibrary: true } },
      },
      orderBy: { startDate: "desc" },
    });

    res.json({
      success: true,
      data: tournaments.map(t => ({
        id: t.id,
        name: t.name,
        tenantId: t.tenantId,
        tenant: t.tenant,
        mediaCount: t._count.mediaLibrary,
      })),
    });
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero dei tornei",
    });
  }
});

/**
 * GET /api/media
 * Lista media con filtri e paginazione
 * - SuperAdmin: vede tutto
 * - TenantAdmin: vede globali (tenantId=null) + propri (tenantId=proprio)
 */
router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, search, page = "1", limit = "20", onlyGlobal, mediaType, tenantId, tournamentId } = req.query;
    const user = req.user!;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Build where clause based on role
    const where: any = { isActive: true };
    const andConditions: any[] = [];

    // SuperAdmin sees all, TenantAdmin sees global + own tenant
    if (user.role !== 'SUPER_ADMIN') {
      if (onlyGlobal === "true") {
        where.tenantId = null;
      } else {
        where.OR = [{ tenantId: null }, { tenantId: user.tenantId }];
      }
    } else {
      // SuperAdmin filters
      if (onlyGlobal === "true") {
        where.tenantId = null;
      } else if (tenantId && tenantId !== "all") {
        where.tenantId = tenantId;
      }
      // Tournament filter
      if (tournamentId && tournamentId !== "all") {
        where.tournamentId = tournamentId;
      }
    }

    if (category && category !== "all") {
      where.category = category;
    }

    // Media type filter (photo/video)
    if (mediaType === "photo") {
      VIDEO_EXTENSIONS.forEach(ext => {
        andConditions.push({ filename: { not: { endsWith: ext } } });
      });
    } else if (mediaType === "video") {
      andConditions.push({
        OR: VIDEO_EXTENSIONS.map(ext => ({ filename: { endsWith: ext } })),
      });
    }

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search as string } },
          { tags: { contains: search as string } },
          { description: { contains: search as string } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
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
          tournament: {
            select: { id: true, name: true },
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

      // Determine if it's a video or image
      const isVideo = ThumbnailService.isVideo(file.originalname);
      const mimeType = ThumbnailService.getMimeType(file.originalname);

      const bannersDir = path.join(__dirname, "../../../frontend/public/images/banners");
      if (!fs.existsSync(bannersDir)) {
        fs.mkdirSync(bannersDir, { recursive: true });
      }

      let filename: string;
      let outputPath: string;
      let width: number | null = null;
      let height: number | null = null;
      let aspectRatio: string | null = null;
      let thumbnailPath: string | null = null;
      let duration: number | null = null;

      if (isVideo) {
        // Handle video upload
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = `${Date.now()}-${path.parse(file.originalname).name}`;
        const tempPath = path.join(bannersDir, `${baseName}${ext}`);

        // Move video file to destination
        fs.copyFileSync(file.path, tempPath);
        fs.unlinkSync(file.path);

        // Check if video needs conversion for browser compatibility
        const needsConversion = !ThumbnailService.isBrowserCompatible(file.originalname);

        if (needsConversion) {
          console.log(`Video format ${ext} not browser-compatible, converting to MP4...`);
          try {
            const conversionResult = await ThumbnailService.convertToMp4(
              tempPath,
              bannersDir,
              baseName
            );

            if (conversionResult.success && conversionResult.outputPath) {
              // Use converted file
              filename = `${baseName}.mp4`;
              outputPath = conversionResult.outputPath;
              // Remove original file
              fs.unlinkSync(tempPath);
              console.log(`Video converted successfully: ${filename}`);
            } else {
              // Conversion failed, keep original
              console.warn("Video conversion failed, keeping original format:", conversionResult.error);
              filename = `${baseName}${ext}`;
              outputPath = tempPath;
            }
          } catch (convErr) {
            console.warn("Video conversion error, keeping original format:", convErr);
            filename = `${baseName}${ext}`;
            outputPath = tempPath;
          }
        } else {
          // Already browser-compatible
          filename = `${baseName}${ext}`;
          outputPath = tempPath;
        }

        // Generate thumbnail (will fail gracefully if FFmpeg not installed)
        try {
          const thumbnailResult = await ThumbnailService.generateThumbnail(
            outputPath,
            path.parse(filename).name
          );

          if (thumbnailResult.success) {
            thumbnailPath = thumbnailResult.thumbnailPath || null;
            duration = thumbnailResult.duration || null;
            width = thumbnailResult.width || null;
            height = thumbnailResult.height || null;
          }
        } catch (err) {
          console.warn("Thumbnail generation failed (FFmpeg may not be installed):", err);
        }

        // Calculate aspect ratio from video dimensions
        if (width && height) {
          aspectRatio = `${Math.round(width / Math.gcd(width, height))}:${Math.round(height / Math.gcd(width, height))}`;
        }
      } else {
        // Handle image upload
        filename = `${Date.now()}-${path.parse(file.originalname).name}.jpg`;
        outputPath = path.join(bannersDir, filename);

        // Get image dimensions
        const metadata = await sharp(file.path).metadata();
        width = metadata.width || null;
        height = metadata.height || null;

        // Resize maintaining aspect ratio
        await sharp(file.path)
          .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(outputPath);

        // Clean up temp file
        fs.unlinkSync(file.path);

        // Calculate aspect ratio
        if (width && height) {
          aspectRatio = `${Math.round(width / Math.gcd(width, height))}:${Math.round(height / Math.gcd(width, height))}`;
        }
      }

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
          width,
          height,
          aspectRatio,
          source: "upload",
          tenantId,
          uploadedById: user.userId,
          mimeType,
          thumbnailPath,
          duration,
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
        error: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
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
    // SUPER_ADMIN can delete anything
    // TENANT_ADMIN/PRESIDENT can delete their own media OR global media (tenantId = null)
    if (user.role !== 'SUPER_ADMIN') {
      if (existing.tenantId !== null && existing.tenantId !== user.tenantId) {
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
