/**
 * =============================================================================
 * ARCHIVE & HALL OF FAME ROUTES
 * =============================================================================
 * API endpoints per archivio storico, hall of fame e statistiche partecipanti
 * =============================================================================
 */

import { Router, Response } from "express";
import { param, query, validationResult } from "express-validator";
import { ArchiveService } from "../services/archive.service";
import { authenticate, optionalAuth } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";

const router = Router();

// ==============================================================================
// HALL OF FAME
// ==============================================================================

/**
 * GET /api/archive/hall-of-fame
 * Hall of Fame del tenant
 */
router.get(
  "/hall-of-fame",
  optionalAuth,
  query("discipline").optional().isString(),
  query("year").optional().isInt({ min: 2000, max: 2100 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const tenantId = req.user?.tenantId || (req.query.tenantId as string);
      if (!tenantId) {
        return res.status(400).json({ success: false, message: "Tenant required" });
      }

      const discipline = req.query.discipline as string | undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const hallOfFame = await ArchiveService.getHallOfFame(tenantId, {
        discipline,
        year,
        limit,
      });

      res.json({ success: true, data: hallOfFame });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get hall of fame";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/archive/hall-of-fame/tenant/:tenantId
 * Hall of Fame pubblico per tenant specifico
 */
router.get(
  "/hall-of-fame/tenant/:tenantId",
  param("tenantId").isUUID(),
  query("discipline").optional().isString(),
  query("year").optional().isInt({ min: 2000, max: 2100 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { tenantId } = req.params;
      const discipline = req.query.discipline as string | undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const hallOfFame = await ArchiveService.getHallOfFame(tenantId, {
        discipline,
        year,
        limit,
      });

      res.json({ success: true, data: hallOfFame });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get hall of fame";
      res.status(500).json({ success: false, message });
    }
  }
);

// ==============================================================================
// RECORDS
// ==============================================================================

/**
 * GET /api/archive/records
 * Record storici del tenant
 */
router.get(
  "/records",
  optionalAuth,
  query("discipline").optional().isString(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const tenantId = req.user?.tenantId || (req.query.tenantId as string);
      if (!tenantId) {
        return res.status(400).json({ success: false, message: "Tenant required" });
      }

      const discipline = req.query.discipline as string | undefined;
      const records = await ArchiveService.getRecords(tenantId, { discipline });

      res.json({ success: true, data: records });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get records";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/archive/records/tenant/:tenantId
 * Record storici pubblici per tenant specifico
 */
router.get(
  "/records/tenant/:tenantId",
  param("tenantId").isUUID(),
  query("discipline").optional().isString(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { tenantId } = req.params;
      const discipline = req.query.discipline as string | undefined;
      const records = await ArchiveService.getRecords(tenantId, { discipline });

      res.json({ success: true, data: records });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get records";
      res.status(500).json({ success: false, message });
    }
  }
);

// ==============================================================================
// TOP WINNERS
// ==============================================================================

/**
 * GET /api/archive/top-winners
 * Classifica vincitori
 */
router.get(
  "/top-winners",
  optionalAuth,
  query("discipline").optional().isString(),
  query("limit").optional().isInt({ min: 1, max: 50 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const tenantId = req.user?.tenantId || (req.query.tenantId as string);
      if (!tenantId) {
        return res.status(400).json({ success: false, message: "Tenant required" });
      }

      const discipline = req.query.discipline as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const winners = await ArchiveService.getTopWinners(tenantId, discipline, limit);

      res.json({ success: true, data: winners });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get top winners";
      res.status(500).json({ success: false, message });
    }
  }
);

// ==============================================================================
// TOURNAMENT ARCHIVE
// ==============================================================================

/**
 * GET /api/archive/tournaments
 * Archivio tornei completati
 */
router.get(
  "/tournaments",
  optionalAuth,
  query("year").optional().isInt({ min: 2000, max: 2100 }),
  query("discipline").optional().isString(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const tenantId = req.user?.tenantId || (req.query.tenantId as string);
      if (!tenantId) {
        return res.status(400).json({ success: false, message: "Tenant required" });
      }

      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const discipline = req.query.discipline as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const archive = await ArchiveService.getTournamentArchive(tenantId, {
        year,
        discipline,
        page,
        limit,
      });

      res.json({ success: true, data: archive });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get archive";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/archive/tournaments/tenant/:tenantId
 * Archivio tornei pubblico per tenant
 */
router.get(
  "/tournaments/tenant/:tenantId",
  param("tenantId").isUUID(),
  query("year").optional().isInt({ min: 2000, max: 2100 }),
  query("discipline").optional().isString(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { tenantId } = req.params;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const discipline = req.query.discipline as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const archive = await ArchiveService.getTournamentArchive(tenantId, {
        year,
        discipline,
        page,
        limit,
      });

      res.json({ success: true, data: archive });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get archive";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/archive/years
 * Anni disponibili nell'archivio
 */
router.get(
  "/years",
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId || (req.query.tenantId as string);
      if (!tenantId) {
        return res.status(400).json({ success: false, message: "Tenant required" });
      }

      const years = await ArchiveService.getAvailableYears(tenantId);

      res.json({ success: true, data: years });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get years";
      res.status(500).json({ success: false, message });
    }
  }
);

// ==============================================================================
// PARTICIPANT HISTORY & STATS
// ==============================================================================

/**
 * GET /api/archive/participant/:userId/history
 * Storico tornei di un partecipante
 */
router.get(
  "/participant/:userId/history",
  authenticate,
  param("userId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { userId } = req.params;
      const tenantId = req.user?.tenantId;

      const history = await ArchiveService.getParticipantHistory(userId, tenantId);

      res.json({ success: true, data: history });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get history";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/archive/participant/:userId/stats
 * Statistiche aggregate di un partecipante
 */
router.get(
  "/participant/:userId/stats",
  authenticate,
  param("userId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { userId } = req.params;
      const tenantId = req.user?.tenantId;

      const stats = await ArchiveService.getParticipantStats(userId, tenantId);

      res.json({ success: true, data: stats });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get stats";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/archive/my-history
 * Storico tornei dell'utente corrente
 */
router.get(
  "/my-history",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const tenantId = req.user?.tenantId;

      const history = await ArchiveService.getParticipantHistory(userId, tenantId);

      res.json({ success: true, data: history });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get history";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/archive/my-stats
 * Statistiche dell'utente corrente
 */
router.get(
  "/my-stats",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const tenantId = req.user?.tenantId;

      const stats = await ArchiveService.getParticipantStats(userId, tenantId);

      res.json({ success: true, data: stats });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get stats";
      res.status(500).json({ success: false, message });
    }
  }
);

// ==============================================================================
// PRIZES
// ==============================================================================

/**
 * GET /api/archive/prizes
 * Premi assegnati nei tornei del tenant
 */
router.get(
  "/prizes",
  optionalAuth,
  query("tournamentId").optional().isString(),
  query("year").optional().isInt({ min: 2000, max: 2100 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const tenantId = req.user?.tenantId || (req.query.tenantId as string);
      if (!tenantId) {
        return res.status(400).json({ success: false, message: "Tenant required" });
      }

      const tournamentId = req.query.tournamentId as string | undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const prizes = await ArchiveService.getPrizes(tenantId, {
        tournamentId,
        year,
        limit,
      });

      res.json({ success: true, data: prizes });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get prizes";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/archive/prizes/tenant/:tenantId
 * Premi pubblici per tenant specifico
 */
router.get(
  "/prizes/tenant/:tenantId",
  param("tenantId").isUUID(),
  query("tournamentId").optional().isString(),
  query("year").optional().isInt({ min: 2000, max: 2100 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { tenantId } = req.params;
      const tournamentId = req.query.tournamentId as string | undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const prizes = await ArchiveService.getPrizes(tenantId, {
        tournamentId,
        year,
        limit,
      });

      res.json({ success: true, data: prizes });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get prizes";
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
