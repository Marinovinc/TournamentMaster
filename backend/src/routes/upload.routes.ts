/**
 * =============================================================================
 * Upload Routes - Endpoint per upload media su Cloudinary
 * =============================================================================
 * POST /api/upload/catch-photo - Upload foto cattura
 * POST /api/upload/catch-video - Upload video cattura
 * DELETE /api/upload/:publicId - Elimina file da Cloudinary
 * =============================================================================
 */

import { Router, Response } from "express";
import multer from "multer";
import { UploadService } from "../services/upload.service";
import { authenticate } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";

const router = Router();

// Configurazione Multer per gestione file in memoria
const storage = multer.memoryStorage();

const uploadPhoto = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per foto
  },
  fileFilter: (req, file, cb) => {
    if (UploadService.isValidPhotoType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo file non supportato: ${file.mimetype}. Usa JPEG, PNG, HEIC o WebP.`));
    }
  },
});

const uploadVideo = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max per video
  },
  fileFilter: (req, file, cb) => {
    if (UploadService.isValidVideoType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo file non supportato: ${file.mimetype}. Usa MP4, MOV, AVI o WebM.`));
    }
  },
});

// Error handler per multer
const handleMulterError = (err: any, res: Response) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File troppo grande",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Errore upload: ${err.message}`,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Errore durante upload",
    });
  }
  return null;
};

/**
 * POST /api/upload/catch-photo
 * Upload foto cattura su Cloudinary
 *
 * Body (multipart/form-data):
 * - photo: File (jpeg, png, heic, webp) - max 10MB
 * - tournamentId?: string - ID torneo per organizzazione folder
 *
 * Response:
 * - url: string - URL pubblico Cloudinary
 * - thumbnailUrl: string - URL thumbnail 300x300
 * - publicId: string - ID per eliminazione futura
 */
router.post(
  "/catch-photo",
  authenticate,
  (req: AuthenticatedRequest, res: Response, next) => {
    uploadPhoto.single("photo")(req, res, (err) => {
      const errorResponse = handleMulterError(err, res);
      if (errorResponse) return;
      next();
    });
  },
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Nessun file fornito. Usa campo 'photo' nel form.",
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Non autenticato",
        });
      }

      const result = await UploadService.uploadCatchPhoto(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        {
          tournamentId: req.body.tournamentId,
          userId: req.user.userId,
          folder: "catches",
          generateThumbnail: true,
        }
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      res.status(201).json({
        success: true,
        message: "Foto caricata con successo",
        data: {
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          publicId: result.publicId,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.size,
        },
      });
    } catch (error) {
      console.error("Upload photo error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Errore upload foto",
      });
    }
  }
);

/**
 * POST /api/upload/catch-video
 * Upload video cattura su Cloudinary
 *
 * Body (multipart/form-data):
 * - video: File (mp4, mov, avi, webm) - max 100MB
 * - tournamentId?: string - ID torneo per organizzazione folder
 *
 * Response:
 * - url: string - URL pubblico Cloudinary
 * - thumbnailUrl: string - URL thumbnail estratto dal video
 * - publicId: string - ID per eliminazione futura
 */
router.post(
  "/catch-video",
  authenticate,
  (req: AuthenticatedRequest, res: Response, next) => {
    uploadVideo.single("video")(req, res, (err) => {
      const errorResponse = handleMulterError(err, res);
      if (errorResponse) return;
      next();
    });
  },
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Nessun file fornito. Usa campo 'video' nel form.",
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Non autenticato",
        });
      }

      const result = await UploadService.uploadCatchVideo(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        {
          tournamentId: req.body.tournamentId,
          userId: req.user.userId,
          folder: "catches",
          generateThumbnail: true,
        }
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      res.status(201).json({
        success: true,
        message: "Video caricato con successo",
        data: {
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          publicId: result.publicId,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.size,
        },
      });
    } catch (error) {
      console.error("Upload video error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Errore upload video",
      });
    }
  }
);

/**
 * DELETE /api/upload/file
 * Elimina file da Cloudinary
 *
 * Query:
 * - publicId: string - ID Cloudinary del file (URL encoded)
 * - type: "image" | "video" - Tipo di risorsa (default: image)
 */
router.delete(
  "/file",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Non autenticato",
        });
      }

      const publicId = req.query.publicId as string;
      const resourceType = (req.query.type as "image" | "video") || "image";

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: "Public ID richiesto",
        });
      }

      const success = await UploadService.deleteFile(publicId, resourceType);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "File non trovato o già eliminato",
        });
      }

      res.json({
        success: true,
        message: "File eliminato con successo",
      });
    } catch (error) {
      console.error("Delete file error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Errore eliminazione file",
      });
    }
  }
);

export default router;
