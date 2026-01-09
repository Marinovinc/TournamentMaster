/**
 * =============================================================================
 * User Media Routes - Gestione Foto e Video Utente
 * =============================================================================
 */

import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";
import prisma from "../lib/prisma";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { ThumbnailService } from "../services/thumbnail.service";

const router = Router();

// Multer config
const userMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/user-media");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

const userMediaUpload = multer({
  storage: userMediaStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
      return;
    }
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".webm", ".avi", ".mkv"];
    if (allowedExts.includes(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error("Tipo file non supportato"));
  },
});

// Validation rules
const createMediaValidation = [
  body("type").isIn(["PHOTO", "VIDEO"]),
  body("category").isIn(["FISHING_ACTIVITY", "RACE", "TOURNAMENT", "BOAT", "EQUIPMENT", "CATCH", "OTHER"]),
  body("filename").trim().notEmpty(),
  body("path").trim().notEmpty(),
];

const updateMediaValidation = [
  body("title").optional().trim().isLength({ max: 255 }),
  body("description").optional().trim().isLength({ max: 2000 }),
  body("tags").optional().isArray(),
  body("isPublic").optional().isBoolean(),
];

// GET /api/user-media
router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, category, limit, offset, equipmentId, boatId } = req.query;
    // Admin can view other user's media via ?userId=xxx
    let targetUserId = req.user!.userId;
    const requestedUserId = req.query.userId as string;

    if (requestedUserId && requestedUserId !== req.user!.userId) {
      const adminRoles = ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT"];
      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({
          success: false,
          message: "Non autorizzato a visualizzare i media di altri utenti",
        });
      }
      targetUserId = requestedUserId;
    }

    const where: any = { userId: targetUserId, isActive: true };
    if (type) where.type = type;
    if (category) where.category = category;
    if (equipmentId) where.equipmentId = equipmentId as string;
    if (boatId) where.boatId = boatId as string;

    const [media, total] = await Promise.all([
      prisma.userMedia.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit ? parseInt(limit as string) : 50,
        skip: offset ? parseInt(offset as string) : 0,
        include: {
          boat: { select: { id: true, name: true } },
          equipment: { select: { id: true, name: true } },
          tournament: { select: { id: true, name: true } },
        },
      }),
      prisma.userMedia.count({ where }),
    ]);

    res.json({
      success: true,
      data: media.map(m => ({ ...m, tags: m.tags ? JSON.parse(m.tags) : [] })),
      pagination: { total, limit: limit ? parseInt(limit as string) : 50, offset: offset ? parseInt(offset as string) : 0 },
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({ success: false, message: "Errore nel recupero dei media" });
  }
});

// POST /api/user-media/upload
router.post("/upload", authenticate, userMediaUpload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: "Nessun file caricato" });

    const { category, title, description, tags, isPublic, boatId, equipmentId, tournamentId } = req.body;
    if (!category) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: "Categoria obbligatoria" });
    }

    const isVideo = file.mimetype.startsWith("video/") || [".mp4", ".mov", ".webm", ".avi", ".mkv"].includes(path.extname(file.originalname).toLowerCase());
    const type = isVideo ? "VIDEO" : "PHOTO";

    const userMediaDir = path.join(__dirname, "../../../frontend/public/uploads/user-media");
    if (!fs.existsSync(userMediaDir)) fs.mkdirSync(userMediaDir, { recursive: true });

    let finalFilename: string;
    let width: number | null = null;
    let height: number | null = null;
    let thumbnailPath: string | null = null;
    let duration: number | null = null;

    if (isVideo) {
      finalFilename = file.filename;
      const outputPath = path.join(userMediaDir, finalFilename);
      fs.copyFileSync(file.path, outputPath);
      fs.unlinkSync(file.path);
      try {
        const thumbResult = await ThumbnailService.generateThumbnail(outputPath, path.parse(finalFilename).name);
        if (thumbResult.success) {
          thumbnailPath = thumbResult.thumbnailPath || null;
          duration = thumbResult.duration || null;
          width = thumbResult.width || null;
          height = thumbResult.height || null;
        }
      } catch (err) { console.warn("Thumbnail failed:", err); }
    } else {
      const baseName = path.parse(file.filename).name;
      finalFilename = baseName + ".jpg";
      const outputPath = path.join(userMediaDir, finalFilename);
      const metadata = await sharp(file.path).metadata();
      width = metadata.width || null;
      height = metadata.height || null;
      await sharp(file.path).resize(1920, 1080, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toFile(outputPath);
      fs.unlinkSync(file.path);
    }

    const media = await prisma.userMedia.create({
      data: {
        type,
        category,
        filename: finalFilename,
        path: "/uploads/user-media/" + finalFilename,
        mimeType: file.mimetype,
        fileSize: file.size,
        title: title || null,
        description: description || null,
        tags: tags ? (typeof tags === "string" ? tags : JSON.stringify(tags)) : null,
        width,
        height,
        duration,
        thumbnailPath,
        isPublic: isPublic === "true" || isPublic === true,
        boatId: boatId || null,
        equipmentId: equipmentId || null,
        tournamentId: tournamentId || null,
        userId: req.user!.userId,
      },
    });

    res.status(201).json({ success: true, data: { ...media, tags: media.tags ? JSON.parse(media.tags) : [] }, message: "Media caricato con successo" });
  } catch (error) {
    console.error("Error uploading:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: "Errore nel caricamento" });
  }
});

// GET /api/user-media/:id
router.get("/:id", authenticate, [param("id").isUUID()], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const media = await prisma.userMedia.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, isActive: true },
      include: { boat: { select: { id: true, name: true } }, equipment: { select: { id: true, name: true } }, tournament: { select: { id: true, name: true } } },
    });
    if (!media) return res.status(404).json({ success: false, message: "Media non trovato" });
    res.json({ success: true, data: { ...media, tags: media.tags ? JSON.parse(media.tags) : [] } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Errore nel recupero del media" });
  }
});

// PUT /api/user-media/:id
router.put("/:id", authenticate, [param("id").isUUID(), ...updateMediaValidation], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existingMedia = await prisma.userMedia.findFirst({ where: { id: req.params.id, userId: req.user!.userId, isActive: true } });
    if (!existingMedia) return res.status(404).json({ success: false, message: "Media non trovato" });

    const updateData: any = {};
    ["title", "description", "locationName"].forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });
    if (req.body.tags !== undefined) updateData.tags = JSON.stringify(req.body.tags);
    if (req.body.isPublic !== undefined) updateData.isPublic = req.body.isPublic;

    const media = await prisma.userMedia.update({ where: { id: req.params.id }, data: updateData });
    res.json({ success: true, data: { ...media, tags: media.tags ? JSON.parse(media.tags) : [] }, message: "Media aggiornato" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Errore aggiornamento" });
  }
});

// DELETE /api/user-media/:id
router.delete("/:id", authenticate, [param("id").isUUID()], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existingMedia = await prisma.userMedia.findFirst({ where: { id: req.params.id, userId: req.user!.userId, isActive: true } });
    if (!existingMedia) return res.status(404).json({ success: false, message: "Media non trovato" });
    await prisma.userMedia.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: "Media eliminato" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Errore eliminazione" });
  }
});

export default router;
