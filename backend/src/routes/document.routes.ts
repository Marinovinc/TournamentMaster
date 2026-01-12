/**
 * =============================================================================
 * Document Routes - Gestione Documenti Utente
 * =============================================================================
 * Endpoint per:
 * - Lista documenti utente
 * - Upload documenti (patente nautica, MIPAF, FIPSAS, assicurazione)
 * - Dettaglio e eliminazione documenti
 */

import { Router, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole } from "../types";
import prisma from "../lib/prisma";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Document types allowed for user upload (subset of all DocumentType enum values)
const USER_UPLOADABLE_TYPES = [
  "NAUTICAL_LICENSE",
  "MIPAF",
  "TESSERA_FIPSAS",
  "ASSICURAZIONE",
  "MEDICAL_CERTIFICATE",
  "IDENTITY_DOCUMENT",
];

// Document storage config
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = (req as AuthenticatedRequest).user?.userId || "unknown";
    const uploadDir = path.join(__dirname, `../../uploads/documents/${userId}`);
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

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo file non supportato. Usa JPG, PNG, GIF, WEBP o PDF."));
    }
  },
});

// Validation rules
const uploadDocumentValidation = [
  body("type")
    .isIn(USER_UPLOADABLE_TYPES)
    .withMessage("Invalid document type"),
  body("expiryDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid expiry date format"),
];

// =============================================================================
// GET /api/documents - Lista documenti utente
// =============================================================================
router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // Admin can view other user's documents via ?userId=xxx
    let targetUserId = req.user.userId;
    const requestedUserId = req.query.userId as string;

    if (requestedUserId && requestedUserId !== req.user.userId) {
      const adminRoles = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT];
      if (!adminRoles.includes(req.user.role as UserRole)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view other users documents",
        });
      }
      targetUserId = requestedUserId;
    }

    const documents = await prisma.document.findMany({
      where: { userId: targetUserId },
      select: {
        id: true,
        type: true,
        status: true,
        filePath: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        expiryDate: true,
        reviewNotes: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Check for expired documents and update status
    const now = new Date();
    for (const doc of documents) {
      if (doc.expiryDate && new Date(doc.expiryDate) < now && doc.status !== "EXPIRED") {
        await prisma.document.update({
          where: { id: doc.id },
          data: { status: "EXPIRED" },
        });
        doc.status = "EXPIRED";
      }
    }

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get documents";
    res.status(500).json({ success: false, message });
  }
});

// =============================================================================
// POST /api/documents - Upload nuovo documento
// =============================================================================
router.post(
  "/",
  authenticate,
  documentUpload.single("file"),
  uploadDocumentValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const { type, expiryDate } = req.body;

      // Check if document of this type already exists
      const existingDoc = await prisma.document.findFirst({
        where: {
          userId: req.user.userId,
          type: type,
        },
      });

      // If exists, delete old file and update record
      if (existingDoc) {
        const oldFilePath = path.join(__dirname, "../../", existingDoc.filePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }

        const updatedDoc = await prisma.document.update({
          where: { id: existingDoc.id },
          data: {
            filePath: `/uploads/documents/${req.user.userId}/${req.file.filename}`,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            status: "PENDING", // Reset to pending for review
            reviewNotes: null,
            reviewedAt: null,
          },
        });

        return res.json({
          success: true,
          message: "Document updated successfully",
          data: updatedDoc,
        });
      }

      // Create new document record
      const document = await prisma.document.create({
        data: {
          userId: req.user.userId,
          type: type,
          filePath: `/uploads/documents/${req.user.userId}/${req.file.filename}`,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        },
      });

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: document,
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      const message = error instanceof Error ? error.message : "Failed to upload document";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// GET /api/documents/:id - Dettaglio documento
// =============================================================================
router.get(
  "/:id",
  authenticate,
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const document = await prisma.document.findUnique({
        where: { id: req.params.id },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!document) {
        return res.status(404).json({ success: false, message: "Document not found" });
      }

      // Check access: owner or admin
      const adminRoles = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT];
      if (document.userId !== req.user.userId && !adminRoles.includes(req.user.role as UserRole)) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get document";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// DELETE /api/documents/:id - Elimina documento
// =============================================================================
router.delete(
  "/:id",
  authenticate,
  param("id").isUUID(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const document = await prisma.document.findUnique({
        where: { id: req.params.id },
      });

      if (!document) {
        return res.status(404).json({ success: false, message: "Document not found" });
      }

      // Check access: owner or admin
      const adminRoles = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT];
      if (document.userId !== req.user.userId && !adminRoles.includes(req.user.role as UserRole)) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      // Delete file
      const filePath = path.join(__dirname, "../../", document.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete record
      await prisma.document.delete({
        where: { id: req.params.id },
      });

      res.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete document";
      res.status(500).json({ success: false, message });
    }
  }
);

// =============================================================================
// PUT /api/documents/:id/review - Admin: Approva/Rifiuta documento
// =============================================================================
router.put(
  "/:id/review",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT),
  param("id").isUUID(),
  [
    body("status").isIn(["APPROVED", "REJECTED"]).withMessage("Status must be APPROVED or REJECTED"),
    body("reviewNotes").optional().trim().isLength({ max: 1000 }),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const document = await prisma.document.findUnique({
        where: { id: req.params.id },
      });

      if (!document) {
        return res.status(404).json({ success: false, message: "Document not found" });
      }

      const { status, reviewNotes } = req.body;

      const updatedDoc = await prisma.document.update({
        where: { id: req.params.id },
        data: {
          status,
          reviewNotes: reviewNotes || null,
          reviewedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: `Document ${status.toLowerCase()} successfully`,
        data: updatedDoc,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to review document";
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
