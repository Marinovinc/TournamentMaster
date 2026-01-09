import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { MessageService, MessageType, MessagePriority } from "../services/message.service";
import { authenticate, isAdminOrPresident, getTenantId } from "../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole } from "../types";

const router = Router();

// Tutti gli endpoint richiedono autenticazione
router.use(authenticate);

// ==============================================================================
// VALIDAZIONE
// ==============================================================================

const sendMessageValidation = [
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({ max: 255 })
    .withMessage("Subject too long"),
  body("body").trim().notEmpty().withMessage("Message body is required"),
  body("recipientId").optional().isUUID().withMessage("Invalid recipient ID"),
  body("priority")
    .optional()
    .isIn(Object.values(MessagePriority))
    .withMessage("Invalid priority"),
];

const replyValidation = [
  param("messageId").isUUID().withMessage("Invalid message ID"),
  body("body").trim().notEmpty().withMessage("Reply body is required"),
  body("subject").optional().trim().isLength({ max: 255 }),
];

const paginationValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

// ==============================================================================
// ROUTES
// ==============================================================================

/**
 * GET /api/messages/inbox
 * Ottieni messaggi ricevuti
 */
router.get(
  "/inbox",
  paginationValidation,
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

      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          message: "No tenant associated",
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unreadOnly === "true";

      const result = await MessageService.getInbox(req.user!.userId, tenantId, {
        page,
        limit,
        unreadOnly,
      });

      res.json({
        success: true,
        data: result.messages,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get inbox";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/messages/sent
 * Ottieni messaggi inviati
 */
router.get(
  "/sent",
  paginationValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          message: "No tenant associated",
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await MessageService.getSentMessages(
        req.user!.userId,
        tenantId,
        { page, limit }
      );

      res.json({
        success: true,
        data: result.messages,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get sent messages";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/messages/unread-count
 * Conta messaggi non letti
 */
router.get("/unread-count", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: "No tenant associated",
      });
    }

    const counts = await MessageService.getUnreadCount(req.user!.userId, tenantId);

    res.json({
      success: true,
      data: counts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get unread count";
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/messages/recipients
 * Ottieni lista destinatari disponibili (solo admin)
 */
router.get(
  "/recipients",
  isAdminOrPresident(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          message: "No tenant associated",
        });
      }

      const recipients = await MessageService.getRecipientsList(
        tenantId,
        req.user!.userId
      );

      res.json({
        success: true,
        data: recipients,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get recipients";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * GET /api/messages/:messageId
 * Ottieni dettaglio messaggio con risposte
 */
router.get(
  "/:messageId",
  param("messageId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID",
          errors: errors.array(),
        });
      }

      const message = await MessageService.getMessage(
        req.params.messageId,
        req.user!.userId
      );

      res.json({
        success: true,
        data: message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get message";
      const status = message === "Message not found" ? 404 : 500;
      res.status(status).json({ success: false, message });
    }
  }
);

/**
 * POST /api/messages/send
 * Invia messaggio diretto (admin a iscritto o iscritto ad admin)
 */
router.post(
  "/send",
  sendMessageValidation,
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

      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          message: "No tenant associated",
        });
      }

      const { subject, body, recipientId, priority } = req.body;

      if (!recipientId) {
        return res.status(400).json({
          success: false,
          message: "Recipient ID required for direct messages",
        });
      }

      const message = await MessageService.sendDirectMessage({
        senderId: req.user!.userId,
        recipientId,
        tenantId,
        subject,
        body,
        priority,
      });

      res.status(201).json({
        success: true,
        message: "Message sent",
        data: message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send message";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/messages/broadcast
 * Invia messaggio a tutti gli iscritti (solo admin)
 */
router.post(
  "/broadcast",
  isAdminOrPresident(),
  sendMessageValidation,
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

      const tenantId = getTenantId(req);
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          message: "No tenant associated",
        });
      }

      const { subject, body, priority } = req.body;

      const message = await MessageService.sendBroadcastMessage({
        senderId: req.user!.userId,
        tenantId,
        subject,
        body,
        priority,
      });

      res.status(201).json({
        success: true,
        message: "Broadcast sent to all members",
        data: message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send broadcast";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * POST /api/messages/:messageId/reply
 * Rispondi a un messaggio
 */
router.post(
  "/:messageId/reply",
  replyValidation,
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

      const { body, subject } = req.body;

      const reply = await MessageService.replyToMessage(
        req.params.messageId,
        req.user!.userId,
        body,
        subject
      );

      res.status(201).json({
        success: true,
        message: "Reply sent",
        data: reply,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reply";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * PUT /api/messages/:messageId/read
 * Segna messaggio come letto
 */
router.put(
  "/:messageId/read",
  param("messageId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await MessageService.markAsRead(req.params.messageId, req.user!.userId);

      res.json({
        success: true,
        message: "Marked as read",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to mark as read";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * PUT /api/messages/:messageId/archive
 * Archivia messaggio
 */
router.put(
  "/:messageId/archive",
  param("messageId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await MessageService.archiveMessage(req.params.messageId, req.user!.userId);

      res.json({
        success: true,
        message: "Message archived",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to archive message";
      res.status(500).json({ success: false, message });
    }
  }
);

/**
 * DELETE /api/messages/:messageId
 * Elimina messaggio (soft delete, solo mittente)
 */
router.delete(
  "/:messageId",
  param("messageId").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await MessageService.deleteMessage(req.params.messageId, req.user!.userId);

      res.json({
        success: true,
        message: "Message deleted",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete message";
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
