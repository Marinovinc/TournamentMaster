/**
 * =============================================================================
 * IMPORT/EXPORT ROUTES
 * =============================================================================
 * API endpoints per import/export dati tornei
 * =============================================================================
 */

import { Router, Response } from "express";
import { param, query, validationResult } from "express-validator";
import multer from "multer";
import { ImportExportService } from "../services/import-export.service";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole } from "../types";

const router = Router();

// Multer config for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato file non supportato. Usare XLSX o CSV."));
    }
  },
});

// ==============================================================================
// IMPORT ENDPOINTS
// ==============================================================================

/**
 * POST /api/import-export/participants/:tournamentId
 * Import partecipanti da file Excel/CSV
 */
router.post(
  "/participants/:tournamentId",
  authenticate,
  authorize(UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  param("tournamentId").isUUID(),
  upload.single("file"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: "File richiesto" });
      }

      const { tournamentId } = req.params;
      const tenantId = req.user!.tenantId!;
      const fileType = req.file.mimetype.includes("csv") ? "csv" : "xlsx";

      const result = await ImportExportService.importParticipants(
        tournamentId,
        req.file.buffer,
        fileType,
        tenantId
      );

      res.json({
        success: result.success,
        data: {
          imported: result.imported,
          errors: result.errors,
          warnings: result.warnings,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import fallito";
      res.status(500).json({ success: false, message });
    }
  }
);

// NOTE: Import catture non implementato - le catture vengono registrate via app mobile

// ==============================================================================
// EXPORT ENDPOINTS
// ==============================================================================

/**
 * GET /api/import-export/export/participants/:tournamentId
 * Export partecipanti torneo
 */
router.get(
  "/export/participants/:tournamentId",
  authenticate,
  authorize(UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  param("tournamentId").isUUID(),
  query("format").optional().isIn(["xlsx", "csv", "json"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { tournamentId } = req.params;
      const format = (req.query.format as "xlsx" | "csv" | "json") || "xlsx";

      const buffer = await ImportExportService.exportParticipants(tournamentId, { format });

      const contentType =
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : format === "csv"
          ? "text/csv"
          : "application/json";

      const extension = format;

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="partecipanti_${tournamentId}.${extension}"`
      );
      res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export fallito";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/import-export/export/catches/:tournamentId
 * Export catture torneo
 */
router.get(
  "/export/catches/:tournamentId",
  authenticate,
  authorize(UserRole.TENANT_ADMIN, UserRole.ORGANIZER, UserRole.JUDGE),
  param("tournamentId").isUUID(),
  query("format").optional().isIn(["xlsx", "csv", "json"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { tournamentId } = req.params;
      const format = (req.query.format as "xlsx" | "csv" | "json") || "xlsx";

      const buffer = await ImportExportService.exportCatches(tournamentId, { format });

      const contentType =
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : format === "csv"
          ? "text/csv"
          : "application/json";

      const extension = format;

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="catture_${tournamentId}.${extension}"`
      );
      res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export fallito";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/import-export/export/leaderboard/:tournamentId
 * Export classifica torneo
 */
router.get(
  "/export/leaderboard/:tournamentId",
  authenticate,
  param("tournamentId").isUUID(),
  query("format").optional().isIn(["xlsx", "csv", "json"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { tournamentId } = req.params;
      const format = (req.query.format as "xlsx" | "csv" | "json") || "xlsx";

      const buffer = await ImportExportService.exportLeaderboard(tournamentId, { format });

      const contentType =
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : format === "csv"
          ? "text/csv"
          : "application/json";

      const extension = format;

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="classifica_${tournamentId}.${extension}"`
      );
      res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export fallito";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/import-export/export/fipsas/:tournamentId
 * Export completo formato FIPSAS
 */
router.get(
  "/export/fipsas/:tournamentId",
  authenticate,
  authorize(UserRole.TENANT_ADMIN, UserRole.ORGANIZER),
  param("tournamentId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { tournamentId } = req.params;

      const buffer = await ImportExportService.exportFIPSAS(tournamentId);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="fipsas_export_${tournamentId}.xlsx"`
      );
      res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export fallito";
      res.status(500).json({ success: false, message });
    }
  }
);

// ==============================================================================
// TEMPLATE ENDPOINTS
// ==============================================================================

/**
 * GET /api/import-export/templates/participants
 * Download template per import partecipanti
 */
router.get(
  "/templates/participants",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const buffer = ImportExportService.generateParticipantTemplate();

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="template_partecipanti.xlsx"'
      );
      res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generazione template fallita";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/import-export/templates/catches
 * Download template per import catture
 */
router.get(
  "/templates/catches",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const buffer = ImportExportService.generateCatchTemplate();

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="template_catture.xlsx"'
      );
      res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generazione template fallita";
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
