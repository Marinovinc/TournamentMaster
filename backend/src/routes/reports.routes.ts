/**
 * =============================================================================
 * Reports Routes - Endpoint per report e statistiche
 * =============================================================================
 * Endpoint per:
 * - Report Associazione (tenant-scoped)
 * - Report Piattaforma (Super Admin)
 * - Export CSV/PDF
 */

import { Router, Response } from "express";
import { param, query, validationResult } from "express-validator";
import { authenticate, authorize, getTenantId } from "../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole } from "../types";
import { ReportsService } from "../services/reports.service";
import { PDFService } from "../services/pdf.service";

const router = Router();

// =============================================================================
// ASSOCIATION REPORTS (Tenant-scoped)
// Accessibili a: TENANT_ADMIN, PRESIDENT, ORGANIZER, JUDGE
// =============================================================================

/**
 * GET /api/reports/association/overview
 * Overview statistiche associazione
 * Super Admin può specificare tenantId via query param
 */
router.get(
  "/association/overview",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.ORGANIZER, UserRole.JUDGE),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Seleziona un'associazione per visualizzare i dati",
        });
      }

      const overview = await ReportsService.getAssociationOverview(tenantId);

      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get overview";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/reports/association/tournaments
 * Lista tornei con statistiche
 * Super Admin può specificare tenantId via query param
 */
router.get(
  "/association/tournaments",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.ORGANIZER, UserRole.JUDGE),
  [
    query("status").optional().isIn(["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"]),
    query("discipline").optional().trim(),
    query("from").optional().isISO8601(),
    query("to").optional().isISO8601(),
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Seleziona un'associazione per visualizzare i dati",
        });
      }

      const result = await ReportsService.getAssociationTournaments(tenantId, {
        status: req.query.status as any,
        discipline: req.query.discipline as string,
        from: req.query.from ? new Date(req.query.from as string) : undefined,
        to: req.query.to ? new Date(req.query.to as string) : undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get tournaments";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/reports/association/tournaments/:tournamentId
 * Report dettagliato singolo torneo
 * Super Admin può specificare tenantId via query param
 */
router.get(
  "/association/tournaments/:tournamentId",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.ORGANIZER, UserRole.JUDGE),
  param("tournamentId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Seleziona un'associazione per visualizzare i dati",
        });
      }

      const report = await ReportsService.getTournamentDetailedReport(
        req.params.tournamentId,
        tenantId
      );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Torneo non trovato",
        });
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get tournament report";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// PLATFORM REPORTS (Super Admin only)
// =============================================================================

/**
 * GET /api/reports/platform/overview
 * Overview statistiche piattaforma
 */
router.get(
  "/platform/overview",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const overview = await ReportsService.getPlatformOverview();

      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get platform overview";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/reports/platform/tenants
 * Comparazione tra associazioni
 */
router.get(
  "/platform/tenants",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  [
    query("sortBy").optional().isIn(["tournaments", "users", "teams", "catches", "createdAt"]),
    query("order").optional().isIn(["asc", "desc"]),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenants = await ReportsService.getTenantsComparison(
        (req.query.sortBy as string) || "tournaments",
        (req.query.order as "asc" | "desc") || "desc"
      );

      res.json({
        success: true,
        data: tenants,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get tenants comparison";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// EXPORT ENDPOINTS - CSV
// =============================================================================

/**
 * GET /api/reports/export/csv/overview
 * Export CSV overview associazione
 */
router.get(
  "/export/csv/overview",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.ORGANIZER),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Seleziona un'associazione per visualizzare i dati",
        });
      }

      const data = await ReportsService.getExportData("overview", tenantId);

      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Nessun dato da esportare",
        });
      }

      // Generate CSV
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(";"),
        ...data.map(row =>
          headers.map(h => {
            const val = row[h];
            if (val instanceof Date) return val.toISOString().split("T")[0];
            if (typeof val === "string" && val.includes(";")) return `"${val}"`;
            return val ?? "";
          }).join(";")
        ),
      ];

      const csv = csvRows.join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=report_tornei_${new Date().toISOString().split("T")[0]}.csv`
      );
      res.send(csv);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export CSV";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/reports/export/csv/tournament/:tournamentId
 * Export CSV classifica torneo
 */
router.get(
  "/export/csv/tournament/:tournamentId",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.ORGANIZER, UserRole.JUDGE),
  param("tournamentId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Seleziona un'associazione per visualizzare i dati",
        });
      }

      const data = await ReportsService.getExportData(
        "tournament",
        tenantId,
        req.params.tournamentId
      );

      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Torneo non trovato o nessun dato da esportare",
        });
      }

      // Generate CSV
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(";"),
        ...data.map(row =>
          headers.map(h => {
            const val = row[h];
            if (val instanceof Date) return val.toISOString().split("T")[0];
            if (typeof val === "string" && val.includes(";")) return `"${val}"`;
            return val ?? "";
          }).join(";")
        ),
      ];

      const csv = csvRows.join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=classifica_${req.params.tournamentId.slice(0, 8)}_${new Date().toISOString().split("T")[0]}.csv`
      );
      res.send(csv);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export CSV";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// EXPORT ENDPOINTS - PDF
// =============================================================================

/**
 * GET /api/reports/export/pdf/judge-assignments/:tournamentId
 * Download PDF Assegnazioni Giudici di Bordo
 */
router.get(
  "/export/pdf/judge-assignments/:tournamentId",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.ORGANIZER),
  param("tournamentId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Seleziona un'associazione per visualizzare i dati",
        });
      }

      const pdfBuffer = await PDFService.generateJudgeAssignmentsPDF(
        req.params.tournamentId,
        tenantId
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=assegnazioni_giudici_${req.params.tournamentId.slice(0, 8)}_${new Date().toISOString().split("T")[0]}.pdf`
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate PDF";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/reports/export/pdf/judge-assignments/:tournamentId/preview
 * Anteprima PDF Assegnazioni Giudici (apre in browser)
 */
router.get(
  "/export/pdf/judge-assignments/:tournamentId/preview",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.ORGANIZER),
  param("tournamentId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Seleziona un'associazione per visualizzare i dati",
        });
      }

      const pdfBuffer = await PDFService.generateJudgeAssignmentsPDF(
        req.params.tournamentId,
        tenantId
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate PDF";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/reports/export/pdf/leaderboard/:tournamentId
 * Download PDF Classifica Torneo (FIPSAS compliant)
 */
router.get(
  "/export/pdf/leaderboard/:tournamentId",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.ORGANIZER, UserRole.JUDGE),
  param("tournamentId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Seleziona un'associazione per visualizzare i dati",
        });
      }

      const pdfBuffer = await PDFService.generateLeaderboardPDF(
        req.params.tournamentId,
        tenantId
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=classifica_${req.params.tournamentId.slice(0, 8)}_${new Date().toISOString().split("T")[0]}.pdf`
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate PDF";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/reports/export/pdf/leaderboard/:tournamentId/preview
 * Anteprima PDF Classifica Torneo (apre in browser)
 */
router.get(
  "/export/pdf/leaderboard/:tournamentId/preview",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.ORGANIZER, UserRole.JUDGE),
  param("tournamentId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Seleziona un'associazione per visualizzare i dati",
        });
      }

      const pdfBuffer = await PDFService.generateLeaderboardPDF(
        req.params.tournamentId,
        tenantId
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate PDF";
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
