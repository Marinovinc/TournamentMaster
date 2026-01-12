/**
 * =============================================================================
 * HOMOLOGATION ROUTES
 * =============================================================================
 * API endpoints per gestione omologazione FIPSAS tornei
 * =============================================================================
 */

import { Router, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { HomologationService } from "../services/homologation.service";
import {
  authenticate,
  isAdminOrPresident,
} from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";

const router = Router();

// Tutti gli endpoint richiedono autenticazione
router.use(authenticate);

// ==============================================================================
// ROUTES PUBBLICHE (per utenti autenticati)
// ==============================================================================

/**
 * GET /api/homologation/statuses
 * Ottieni lista stati omologazione
 */
router.get("/statuses", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const statuses = HomologationService.getStatusList();
    res.json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get statuses";
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/homologation/checklist-template
 * Ottieni template checklist FIPSAS
 */
router.get("/checklist-template", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const template = HomologationService.getChecklistTemplate();
    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get template";
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/homologation/tournament/:tournamentId
 * Ottieni stato omologazione di un torneo
 */
router.get(
  "/tournament/:tournamentId",
  param("tournamentId").notEmpty().trim(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const homologation = await HomologationService.getById(
        req.params.tournamentId
      );

      // Calcola progress
      const progress = HomologationService.getChecklistProgress(
        homologation.complianceChecklist
      );

      res.json({
        success: true,
        data: {
          ...homologation,
          progress,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get homologation";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/homologation/tournament/:tournamentId/report
 * Genera report FIPSAS per un torneo
 */
router.get(
  "/tournament/:tournamentId/report",
  param("tournamentId").notEmpty().trim(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const report = await HomologationService.generateFipsasReport(
        req.params.tournamentId
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate report";
      res.status(500).json({ success: false, message });
    }
  }
);

// ==============================================================================
// ROUTES ADMIN (richiedono privilegi)
// ==============================================================================

/**
 * POST /api/homologation/tournament/:tournamentId/start
 * Avvia processo omologazione
 */
router.post(
  "/tournament/:tournamentId/start",
  isAdminOrPresident(),
  param("tournamentId").notEmpty().trim(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const homologation = await HomologationService.startProcess(
        req.params.tournamentId,
        req.user!.userId
      );

      res.json({
        success: true,
        message: "Processo omologazione avviato",
        data: homologation,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start process";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * PUT /api/homologation/tournament/:tournamentId/checklist
 * Aggiorna checklist conformita
 */
router.put(
  "/tournament/:tournamentId/checklist",
  isAdminOrPresident(),
  param("tournamentId").notEmpty().trim(),
  body("checklist").isArray().withMessage("Checklist must be an array"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const homologation = await HomologationService.updateFullChecklist(
        req.params.tournamentId,
        req.body.checklist,
        req.user!.userId
      );

      res.json({
        success: true,
        message: "Checklist aggiornata",
        data: homologation,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update checklist";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * PUT /api/homologation/tournament/:tournamentId/checklist/:itemId
 * Aggiorna singolo item checklist
 */
router.put(
  "/tournament/:tournamentId/checklist/:itemId",
  isAdminOrPresident(),
  param("tournamentId").notEmpty().trim(),
  param("itemId").notEmpty(),
  body("checked").isBoolean(),
  body("notes").optional().isString(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const homologation = await HomologationService.updateChecklist(
        req.params.tournamentId,
        req.params.itemId,
        req.body.checked,
        req.body.notes,
        req.user!.userId
      );

      res.json({
        success: true,
        message: "Item checklist aggiornato",
        data: homologation,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update item";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/homologation/tournament/:tournamentId/documents
 * Aggiungi documento
 */
router.post(
  "/tournament/:tournamentId/documents",
  isAdminOrPresident(),
  param("tournamentId").notEmpty().trim(),
  body("name").trim().notEmpty(),
  body("url").trim().notEmpty(),
  body("type").trim().notEmpty(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const homologation = await HomologationService.addDocument(
        req.params.tournamentId,
        req.body
      );

      res.json({
        success: true,
        message: "Documento aggiunto",
        data: homologation,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add document";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * DELETE /api/homologation/tournament/:tournamentId/documents/:documentId
 * Rimuovi documento
 */
router.delete(
  "/tournament/:tournamentId/documents/:documentId",
  isAdminOrPresident(),
  param("tournamentId").notEmpty().trim(),
  param("documentId").notEmpty(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const homologation = await HomologationService.removeDocument(
        req.params.tournamentId,
        req.params.documentId
      );

      res.json({
        success: true,
        message: "Documento rimosso",
        data: homologation,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove document";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/homologation/tournament/:tournamentId/submit
 * Invia per revisione
 */
router.post(
  "/tournament/:tournamentId/submit",
  isAdminOrPresident(),
  param("tournamentId").notEmpty().trim(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const homologation = await HomologationService.submit(
        req.params.tournamentId,
        req.user!.userId
      );

      res.json({
        success: true,
        message: "Omologazione inviata per revisione",
        data: homologation,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/homologation/tournament/:tournamentId/review/start
 * Avvia revisione (admin federale)
 */
router.post(
  "/tournament/:tournamentId/review/start",
  isAdminOrPresident(),
  param("tournamentId").notEmpty().trim(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const homologation = await HomologationService.startReview(
        req.params.tournamentId,
        req.user!.userId
      );

      res.json({
        success: true,
        message: "Revisione avviata",
        data: homologation,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start review";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/homologation/tournament/:tournamentId/review/corrections
 * Richiedi correzioni
 */
router.post(
  "/tournament/:tournamentId/review/corrections",
  isAdminOrPresident(),
  param("tournamentId").notEmpty().trim(),
  body("correctionRequests").trim().notEmpty(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const homologation = await HomologationService.requestCorrections(
        req.params.tournamentId,
        req.body.correctionRequests,
        req.user!.userId
      );

      res.json({
        success: true,
        message: "Correzioni richieste",
        data: homologation,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to request corrections";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/homologation/tournament/:tournamentId/review/approve
 * Approva omologazione
 */
router.post(
  "/tournament/:tournamentId/review/approve",
  isAdminOrPresident(),
  param("tournamentId").notEmpty().trim(),
  body("fipsasEventCode").optional().isString(),
  body("homologationNumber").optional().isString(),
  body("reviewerNotes").optional().isString(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const homologation = await HomologationService.approve(
        req.params.tournamentId,
        req.body,
        req.user!.userId
      );

      res.json({
        success: true,
        message: "Omologazione approvata",
        data: homologation,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to approve";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/homologation/tournament/:tournamentId/review/reject
 * Respingi omologazione
 */
router.post(
  "/tournament/:tournamentId/review/reject",
  isAdminOrPresident(),
  param("tournamentId").notEmpty().trim(),
  body("reviewerNotes").trim().notEmpty(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const homologation = await HomologationService.reject(
        req.params.tournamentId,
        req.body.reviewerNotes,
        req.user!.userId
      );

      res.json({
        success: true,
        message: "Omologazione respinta",
        data: homologation,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reject";
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
