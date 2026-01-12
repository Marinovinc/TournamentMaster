/**
 * =============================================================================
 * NOTIFICATION ROUTES
 * =============================================================================
 * API endpoints per gestione notifiche utente
 * =============================================================================
 */

import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { NotificationService } from "../services/notification.service";
import { authenticate } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";

const router = Router();

// Tutti gli endpoint richiedono autenticazione
router.use(authenticate);

// ==============================================================================
// NOTIFICHE UTENTE
// ==============================================================================

/**
 * GET /api/notifications
 * Ottiene le notifiche dell'utente corrente
 */
router.get(
  "/",
  query("unreadOnly").optional().isBoolean(),
  query("type").optional().isString(),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("offset").optional().isInt({ min: 0 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const userId = req.user!.userId;
      const { unreadOnly, type, limit, offset } = req.query;

      const data = await NotificationService.getUserNotifications(userId, {
        unreadOnly: unreadOnly === "true",
        type: type as any,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get notifications";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/notifications/unread-count
 * Conta le notifiche non lette
 */
router.get("/unread-count", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const count = await NotificationService.getUnreadCount(userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get count";
    res.status(500).json({ success: false, message });
  }
});

/**
 * POST /api/notifications/:id/read
 * Segna una notifica come letta
 */
router.post(
  "/:id/read",
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const userId = req.user!.userId;
      const success = await NotificationService.markAsRead(req.params.id, userId);

      if (!success) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }

      res.json({ success: true, message: "Notification marked as read" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to mark as read";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/notifications/read-all
 * Segna tutte le notifiche come lette
 */
router.post("/read-all", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const count = await NotificationService.markAllAsRead(userId);
    res.json({ success: true, data: { markedCount: count } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark all as read";
    res.status(500).json({ success: false, message });
  }
});

/**
 * POST /api/notifications/:id/archive
 * Archivia una notifica
 */
router.post(
  "/:id/archive",
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const userId = req.user!.userId;
      const success = await NotificationService.archive(req.params.id, userId);

      if (!success) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }

      res.json({ success: true, message: "Notification archived" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to archive";
      res.status(500).json({ success: false, message });
    }
  }
);

// ==============================================================================
// PREFERENZE NOTIFICHE
// ==============================================================================

/**
 * GET /api/notifications/preferences
 * Ottiene le preferenze notifiche dell'utente
 */
router.get("/preferences", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const preferences = await NotificationService.getPreferences(userId);
    res.json({ success: true, data: preferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get preferences";
    res.status(500).json({ success: false, message });
  }
});

/**
 * PUT /api/notifications/preferences
 * Aggiorna le preferenze notifiche
 */
router.put(
  "/preferences",
  body("tournamentReminders").optional().isBoolean(),
  body("catchUpdates").optional().isBoolean(),
  body("rankingChanges").optional().isBoolean(),
  body("penaltyAlerts").optional().isBoolean(),
  body("messageNotifications").optional().isBoolean(),
  body("systemAlerts").optional().isBoolean(),
  body("emailEnabled").optional().isBoolean(),
  body("pushEnabled").optional().isBoolean(),
  body("reminderDaysBefore").optional().isInt({ min: 1, max: 7 }),
  body("digestEnabled").optional().isBoolean(),
  body("digestTime").optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body("quietHoursEnabled").optional().isBoolean(),
  body("quietHoursStart").optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body("quietHoursEnd").optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const userId = req.user!.userId;
      const preferences = await NotificationService.updatePreferences(userId, req.body);
      res.json({ success: true, data: preferences });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update preferences";
      res.status(500).json({ success: false, message });
    }
  }
);

// ==============================================================================
// ADMIN: INVIO NOTIFICHE (solo admin/organizer)
// ==============================================================================

/**
 * POST /api/notifications/send
 * Invia una notifica a uno o piu utenti (admin only)
 */
router.post(
  "/send",
  body("title").notEmpty().isString().isLength({ max: 255 }),
  body("body").notEmpty().isString(),
  body("userIds").optional().isArray(),
  body("tournamentId").optional().isUUID(),
  body("sendToAllParticipants").optional().isBoolean(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Verifica permessi (solo admin/organizer)
      const userRole = req.user!.role;
      if (!["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"].includes(userRole)) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      const { title, body: notifBody, userIds, tournamentId, sendToAllParticipants } = req.body;

      let sentCount = 0;

      if (sendToAllParticipants && tournamentId) {
        // Invia a tutti i partecipanti del torneo
        sentCount = await NotificationService.notifyAllParticipants(
          tournamentId,
          title,
          notifBody,
          "SYSTEM_ALERT"
        );
      } else if (userIds && userIds.length > 0) {
        // Invia a utenti specifici
        sentCount = await NotificationService.createBulk(userIds, {
          type: "SYSTEM_ALERT",
          title,
          body: notifBody,
          tournamentId,
          tenantId: req.user!.tenantId || undefined,
          icon: "bell",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Specify userIds or set sendToAllParticipants with tournamentId",
        });
      }

      res.json({ success: true, data: { sentCount } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send notifications";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/notifications/process-reminders
 * Processa reminder programmati (chiamato da cron job o manualmente)
 */
router.post("/process-reminders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Solo admin possono triggerare manualmente
    const userRole = req.user!.role;
    if (!["SUPER_ADMIN", "TENANT_ADMIN"].includes(userRole)) {
      return res.status(403).json({ success: false, message: "Permission denied" });
    }

    const processedCount = await NotificationService.processScheduledReminders();
    res.json({ success: true, data: { processedCount } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process reminders";
    res.status(500).json({ success: false, message });
  }
});

export default router;
