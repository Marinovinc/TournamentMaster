/**
 * =============================================================================
 * SPONSOR & PRIZE ROUTES
 * =============================================================================
 * API endpoints per gestione sponsor e premi tornei
 * =============================================================================
 */

import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { SponsorService, PrizeService } from "../services/sponsor.service";
import { authenticate } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const router = Router();

// Configurazione multer per upload media premi
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../uploads/prizes");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per video
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo file non supportato"));
    }
  },
});

// Helper per verificare ruoli admin
const adminRoles = ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"];

// ==============================================================================
// SPONSOR ROUTES
// ==============================================================================

/**
 * GET /api/sponsors
 * Lista sponsor del tenant corrente
 */
router.get(
  "/",
  authenticate,
  query("activeOnly").optional().isBoolean(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, message: "Tenant required" });
      }

      const activeOnly = req.query.activeOnly === "true";
      const sponsors = await SponsorService.getByTenant(tenantId, { activeOnly });

      res.json({ success: true, data: sponsors });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get sponsors";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/sponsors/:id
 * Dettaglio sponsor
 */
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

      const sponsor = await SponsorService.getById(req.params.id);
      if (!sponsor) {
        return res.status(404).json({ success: false, message: "Sponsor not found" });
      }

      res.json({ success: true, data: sponsor });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get sponsor";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/sponsors
 * Crea nuovo sponsor
 */
router.post(
  "/",
  authenticate,
  body("name").notEmpty().isString().isLength({ max: 255 }),
  body("description").optional().isString(),
  body("logo").optional().isString(),
  body("website").optional().isURL(),
  body("contactEmail").optional().isEmail(),
  body("contactPhone").optional().isString(),
  body("tier").optional().isIn(["PLATINUM", "GOLD", "SILVER", "BRONZE", "SUPPORTER"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Verifica permessi
      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      const tenantId = req.user!.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, message: "Tenant required" });
      }

      const sponsor = await SponsorService.create({
        ...req.body,
        tenantId,
      });

      res.status(201).json({ success: true, data: sponsor });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create sponsor";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * PUT /api/sponsors/:id
 * Aggiorna sponsor
 */
router.put(
  "/:id",
  authenticate,
  param("id").isUUID(),
  body("name").optional().isString().isLength({ max: 255 }),
  body("description").optional().isString(),
  body("logo").optional().isString(),
  body("website").optional().isURL(),
  body("contactEmail").optional().isEmail(),
  body("contactPhone").optional().isString(),
  body("tier").optional().isIn(["PLATINUM", "GOLD", "SILVER", "BRONZE", "SUPPORTER"]),
  body("isActive").optional().isBoolean(),
  body("displayOrder").optional().isInt(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      const sponsor = await SponsorService.update(req.params.id, req.body);
      res.json({ success: true, data: sponsor });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update sponsor";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * DELETE /api/sponsors/:id
 * Elimina sponsor
 */
router.delete(
  "/:id",
  authenticate,
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      await SponsorService.delete(req.params.id);
      res.json({ success: true, message: "Sponsor deleted" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete sponsor";
      res.status(500).json({ success: false, message });
    }
  }
);

// ==============================================================================
// TOURNAMENT-SPONSOR ROUTES
// ==============================================================================

/**
 * GET /api/sponsors/tournament/:tournamentId
 * Lista sponsor di un torneo
 */
router.get(
  "/tournament/:tournamentId",
  param("tournamentId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const sponsors = await SponsorService.getTournamentSponsors(req.params.tournamentId);
      res.json({ success: true, data: sponsors });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get sponsors";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/sponsors/tournament/:tournamentId/:sponsorId
 * Associa sponsor a torneo
 */
router.post(
  "/tournament/:tournamentId/:sponsorId",
  authenticate,
  param("tournamentId").isUUID(),
  param("sponsorId").isUUID(),
  body("tier").optional().isIn(["PLATINUM", "GOLD", "SILVER", "BRONZE", "SUPPORTER"]),
  body("customMessage").optional().isString(),
  body("displayOrder").optional().isInt(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      const { tournamentId, sponsorId } = req.params;
      const association = await SponsorService.addToTournament(tournamentId, sponsorId, req.body);

      res.status(201).json({ success: true, data: association });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add sponsor";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * DELETE /api/sponsors/tournament/:tournamentId/:sponsorId
 * Rimuove sponsor da torneo
 */
router.delete(
  "/tournament/:tournamentId/:sponsorId",
  authenticate,
  param("tournamentId").isUUID(),
  param("sponsorId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      const { tournamentId, sponsorId } = req.params;
      await SponsorService.removeFromTournament(tournamentId, sponsorId);

      res.json({ success: true, message: "Sponsor removed from tournament" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove sponsor";
      res.status(500).json({ success: false, message });
    }
  }
);

// ==============================================================================
// PRIZE ROUTES
// ==============================================================================

/**
 * GET /api/sponsors/prizes/tournament/:tournamentId
 * Lista premi di un torneo
 */
router.get(
  "/prizes/tournament/:tournamentId",
  param("tournamentId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const prizes = await PrizeService.getByTournament(req.params.tournamentId);
      res.json({ success: true, data: prizes });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get prizes";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/sponsors/prizes/:id
 * Dettaglio premio
 */
router.get(
  "/prizes/:id",
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const prize = await PrizeService.getById(req.params.id);
      if (!prize) {
        return res.status(404).json({ success: false, message: "Prize not found" });
      }

      res.json({ success: true, data: prize });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get prize";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/sponsors/prizes
 * Crea nuovo premio
 */
router.post(
  "/prizes",
  authenticate,
  body("name").notEmpty().isString().isLength({ max: 255 }),
  body("description").optional().isString(),
  body("category")
    .optional()
    .isIn([
      "FIRST_PLACE",
      "SECOND_PLACE",
      "THIRD_PLACE",
      "BIGGEST_CATCH",
      "MOST_CATCHES",
      "YOUNGEST",
      "OLDEST",
      "SPECIAL",
      "PARTICIPATION",
    ]),
  body("position").optional().isInt(),
  body("value").optional().isDecimal(),
  body("valueDescription").optional().isString(),
  body("sponsorId").optional().isUUID(),
  body("tournamentId").notEmpty().isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      const prize = await PrizeService.create(req.body);
      res.status(201).json({ success: true, data: prize });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create prize";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * PUT /api/sponsors/prizes/:id
 * Aggiorna premio
 */
router.put(
  "/prizes/:id",
  authenticate,
  param("id").isUUID(),
  body("name").optional().isString().isLength({ max: 255 }),
  body("description").optional().isString(),
  body("category")
    .optional()
    .isIn([
      "FIRST_PLACE",
      "SECOND_PLACE",
      "THIRD_PLACE",
      "BIGGEST_CATCH",
      "MOST_CATCHES",
      "YOUNGEST",
      "OLDEST",
      "SPECIAL",
      "PARTICIPATION",
    ]),
  body("position").optional().isInt(),
  body("value").optional().isDecimal(),
  body("valueDescription").optional().isString(),
  body("sponsorId").optional(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      const prize = await PrizeService.update(req.params.id, req.body);
      res.json({ success: true, data: prize });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update prize";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * DELETE /api/sponsors/prizes/:id
 * Elimina premio
 */
router.delete(
  "/prizes/:id",
  authenticate,
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      await PrizeService.delete(req.params.id);
      res.json({ success: true, message: "Prize deleted" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete prize";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/sponsors/prizes/:id/award
 * Assegna premio a vincitore
 */
router.post(
  "/prizes/:id/award",
  authenticate,
  param("id").isUUID(),
  body("winnerId").notEmpty().isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      const prize = await PrizeService.awardPrize(req.params.id, req.body.winnerId);
      res.json({ success: true, data: prize });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to award prize";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * DELETE /api/sponsors/prizes/:id/award
 * Rimuove assegnazione premio
 */
router.delete(
  "/prizes/:id/award",
  authenticate,
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      const prize = await PrizeService.unassignPrize(req.params.id);
      res.json({ success: true, data: prize });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to unassign prize";
      res.status(500).json({ success: false, message });
    }
  }
);

// ==============================================================================
// PRIZE MEDIA ROUTES
// ==============================================================================

/**
 * POST /api/sponsors/prizes/:id/media
 * Upload media per premio
 */
router.post(
  "/prizes/:id/media",
  authenticate,
  param("id").isUUID(),
  upload.single("file"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const file = req.file;
      const isVideo = file.mimetype.startsWith("video/");

      // Costruisci URL
      const baseUrl = process.env.API_URL || "http://localhost:3001";
      const url = `${baseUrl}/uploads/prizes/${file.filename}`;

      // Per video, thumbnail potrebbe essere generato separatamente
      // Per ora lasciamo null
      const thumbnailUrl = isVideo ? null : url;

      const media = await PrizeService.addMedia(req.params.id, {
        type: isVideo ? "video" : "image",
        url,
        thumbnailUrl: thumbnailUrl || undefined,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        caption: req.body.caption,
      });

      res.status(201).json({ success: true, data: media });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload media";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/sponsors/prizes/:id/media
 * Lista media di un premio
 */
router.get(
  "/prizes/:id/media",
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const media = await PrizeService.getMedia(req.params.id);
      res.json({ success: true, data: media });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get media";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * DELETE /api/sponsors/prizes/media/:mediaId
 * Elimina media
 */
router.delete(
  "/prizes/media/:mediaId",
  authenticate,
  param("mediaId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      await PrizeService.deleteMedia(req.params.mediaId);
      res.json({ success: true, message: "Media deleted" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete media";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * PUT /api/sponsors/prizes/:id/media/order
 * Riordina media
 */
router.put(
  "/prizes/:id/media/order",
  authenticate,
  param("id").isUUID(),
  body("mediaIds").isArray(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      await PrizeService.updateMediaOrder(req.params.id, req.body.mediaIds);
      res.json({ success: true, message: "Media order updated" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update order";
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
