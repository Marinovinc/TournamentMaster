/**
 * =============================================================================
 * User Media Routes - Gestione Foto e Video Utente
 * =============================================================================
 * Endpoint per:
 * - Upload foto/video
 * - Lista media utente
 * - CRUD media
 */

import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";
import prisma from "../lib/prisma";

const router = Router();

// =============================================================================
// VALIDATION RULES
// =============================================================================

const createMediaValidation = [
  body("type").isIn(["PHOTO", "VIDEO"]).withMessage("Tipo deve essere PHOTO o VIDEO"),
  body("category").isIn([
    "FISHING_ACTIVITY", "RACE", "TOURNAMENT", "BOAT", "EQUIPMENT", "CATCH", "OTHER"
  ]).withMessage("Categoria non valida"),
  body("filename").trim().notEmpty().withMessage("Nome file obbligatorio"),
  body("path").trim().notEmpty().withMessage("Path file obbligatorio"),
  body("mimeType").optional().trim().isLength({ max: 100 }),
  body("fileSize").optional().isInt({ min: 0 }),
  body("title").optional().trim().isLength({ max: 255 }),
  body("description").optional().trim().isLength({ max: 2000 }),
  body("tags").optional().isArray(),
  body("width").optional().isInt({ min: 0 }),
  body("height").optional().isInt({ min: 0 }),
  body("duration").optional().isInt({ min: 0 }),
  body("thumbnailPath").optional().trim().isLength({ max: 500 }),
  body("latitude").optional().isDecimal(),
  body("longitude").optional().isDecimal(),
  body("locationName").optional().trim().isLength({ max: 255 }),
  body("takenAt").optional().isISO8601(),
  body("isPublic").optional().isBoolean(),
  body("boatId").optional().isUUID(),
  body("equipmentId").optional().isUUID(),
  body("tournamentId").optional().isUUID(),
];

const updateMediaValidation = [
  body("title").optional().trim().isLength({ max: 255 }),
  body("description").optional().trim().isLength({ max: 2000 }),
  body("tags").optional().isArray(),
  body("isPublic").optional().isBoolean(),
  body("locationName").optional().trim().isLength({ max: 255 }),
];

// =============================================================================
// GET /api/media - Lista media dell'utente corrente
// =============================================================================
router.get(
  "/",
  authenticate,
  [
    query("type").optional().isIn(["PHOTO", "VIDEO"]),
    query("category").optional().isIn([
      "FISHING_ACTIVITY", "RACE", "TOURNAMENT", "BOAT", "EQUIPMENT", "CATCH", "OTHER"
    ]),
    query("boatId").optional().isUUID(),
    query("equipmentId").optional().isUUID(),
    query("tournamentId").optional().isUUID(),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("offset").optional().isInt({ min: 0 }),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type, category, boatId, equipmentId, tournamentId, limit, offset } = req.query;

      const where: any = {
        userId: req.user!.userId,
        isActive: true,
      };

      if (type) where.type = type;
      if (category) where.category = category;
      if (boatId) where.boatId = boatId;
      if (equipmentId) where.equipmentId = equipmentId;
      if (tournamentId) where.tournamentId = tournamentId;

      const [media, total] = await Promise.all([
        prisma.userMedia.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit ? parseInt(limit as string) : 50,
          skip: offset ? parseInt(offset as string) : 0,
          include: {
            boat: {
              select: { id: true, name: true },
            },
            equipment: {
              select: { id: true, name: true },
            },
            tournament: {
              select: { id: true, name: true },
            },
          },
        }),
        prisma.userMedia.count({ where }),
      ]);

      // Parse tags JSON
      const parsedMedia = media.map((m) => ({
        ...m,
        tags: m.tags ? JSON.parse(m.tags) : [],
      }));

      res.json({
        success: true,
        data: parsedMedia,
        pagination: {
          total,
          limit: limit ? parseInt(limit as string) : 50,
          offset: offset ? parseInt(offset as string) : 0,
        },
      });
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({
        success: false,
        message: "Errore nel recupero dei media",
      });
    }
  }
);

// =============================================================================
// GET /api/media/public - Media pubblici (per tenant)
// =============================================================================
router.get(
  "/public",
  authenticate,
  [
    query("tenantId").optional().isUUID(),
    query("type").optional().isIn(["PHOTO", "VIDEO"]),
    query("category").optional().isIn([
      "FISHING_ACTIVITY", "RACE", "TOURNAMENT", "BOAT", "EQUIPMENT", "CATCH", "OTHER"
    ]),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tenantId, type, category, limit } = req.query;
      const targetTenantId = tenantId as string || req.user?.tenantId;

      const where: any = {
        isActive: true,
        isPublic: true,
        user: {
          tenantId: targetTenantId,
          isActive: true,
        },
      };

      if (type) where.type = type;
      if (category) where.category = category;

      const media = await prisma.userMedia.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit ? parseInt(limit as string) : 20,
        select: {
          id: true,
          type: true,
          category: true,
          path: true,
          thumbnailPath: true,
          title: true,
          description: true,
          tags: true,
          width: true,
          height: true,
          duration: true,
          takenAt: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      // Parse tags JSON
      const parsedMedia = media.map((m) => ({
        ...m,
        tags: m.tags ? JSON.parse(m.tags) : [],
      }));

      res.json({
        success: true,
        data: parsedMedia,
      });
    } catch (error) {
      console.error("Error fetching public media:", error);
      res.status(500).json({
        success: false,
        message: "Errore nel recupero dei media pubblici",
      });
    }
  }
);

// =============================================================================
// GET /api/media/:id - Dettaglio media
// =============================================================================
router.get(
  "/:id",
  authenticate,
  [param("id").isUUID()],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const media = await prisma.userMedia.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
          isActive: true,
        },
        include: {
          boat: {
            select: { id: true, name: true },
          },
          equipment: {
            select: { id: true, name: true },
          },
          tournament: {
            select: { id: true, name: true },
          },
        },
      });

      if (!media) {
        return res.status(404).json({
          success: false,
          message: "Media non trovato",
        });
      }

      res.json({
        success: true,
        data: {
          ...media,
          tags: media.tags ? JSON.parse(media.tags) : [],
        },
      });
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({
        success: false,
        message: "Errore nel recupero del media",
      });
    }
  }
);

// =============================================================================
// POST /api/media - Crea nuovo media
// =============================================================================
router.post(
  "/",
  authenticate,
  createMediaValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const {
        type, category, filename, path, mimeType, fileSize,
        title, description, tags, width, height, duration,
        thumbnailPath, latitude, longitude, locationName,
        takenAt, isPublic, boatId, equipmentId, tournamentId
      } = req.body;

      // Validate referenced entities belong to user
      if (boatId) {
        const boat = await prisma.boat.findFirst({
          where: { id: boatId, userId: req.user!.userId, isActive: true },
        });
        if (!boat) {
          return res.status(400).json({
            success: false,
            message: "Barca non trovata",
          });
        }
      }

      if (equipmentId) {
        const equipment = await prisma.equipment.findFirst({
          where: { id: equipmentId, userId: req.user!.userId, isActive: true },
        });
        if (!equipment) {
          return res.status(400).json({
            success: false,
            message: "Attrezzatura non trovata",
          });
        }
      }

      const media = await prisma.userMedia.create({
        data: {
          type,
          category,
          filename,
          path,
          mimeType,
          fileSize: fileSize ? parseInt(fileSize) : 0,
          title,
          description,
          tags: tags ? JSON.stringify(tags) : null,
          width: width ? parseInt(width) : null,
          height: height ? parseInt(height) : null,
          duration: duration ? parseInt(duration) : null,
          thumbnailPath,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          locationName,
          takenAt: takenAt ? new Date(takenAt) : null,
          isPublic: isPublic ?? false,
          boatId,
          equipmentId,
          tournamentId,
          userId: req.user!.userId,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...media,
          tags: media.tags ? JSON.parse(media.tags) : [],
        },
        message: "Media caricato con successo",
      });
    } catch (error) {
      console.error("Error creating media:", error);
      res.status(500).json({
        success: false,
        message: "Errore nel caricamento del media",
      });
    }
  }
);

// =============================================================================
// PUT /api/media/:id - Aggiorna media
// =============================================================================
router.put(
  "/:id",
  authenticate,
  [param("id").isUUID(), ...updateMediaValidation],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      // Verify ownership
      const existingMedia = await prisma.userMedia.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
          isActive: true,
        },
      });

      if (!existingMedia) {
        return res.status(404).json({
          success: false,
          message: "Media non trovato",
        });
      }

      const updateData: any = {};
      const fields = ["title", "description", "locationName"];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      if (req.body.tags !== undefined) {
        updateData.tags = JSON.stringify(req.body.tags);
      }

      if (req.body.isPublic !== undefined) {
        updateData.isPublic = req.body.isPublic;
      }

      const media = await prisma.userMedia.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({
        success: true,
        data: {
          ...media,
          tags: media.tags ? JSON.parse(media.tags) : [],
        },
        message: "Media aggiornato con successo",
      });
    } catch (error) {
      console.error("Error updating media:", error);
      res.status(500).json({
        success: false,
        message: "Errore nell'aggiornamento del media",
      });
    }
  }
);

// =============================================================================
// DELETE /api/media/:id - Elimina media (soft delete)
// =============================================================================
router.delete(
  "/:id",
  authenticate,
  [param("id").isUUID()],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      // Verify ownership
      const existingMedia = await prisma.userMedia.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
          isActive: true,
        },
      });

      if (!existingMedia) {
        return res.status(404).json({
          success: false,
          message: "Media non trovato",
        });
      }

      // Soft delete
      await prisma.userMedia.update({
        where: { id: req.params.id },
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
  }
);

export default router;
