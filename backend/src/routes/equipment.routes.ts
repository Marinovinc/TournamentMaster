/**
 * =============================================================================
 * Equipment Routes - Gestione Attrezzature Personali
 * =============================================================================
 * Endpoint per:
 * - Lista attrezzature utente
 * - CRUD attrezzature
 */

import { Router, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";
import prisma from "../lib/prisma";

const router = Router();

// =============================================================================
// VALIDATION RULES
// =============================================================================

const createEquipmentValidation = [
  body("name").trim().notEmpty().withMessage("Il nome dell'attrezzatura e obbligatorio"),
  body("type").optional().isIn([
    "ROD", "REEL", "TACKLE_BOX", "FISHING_LINE", "LURE", "HOOK",
    "NET", "GAFF", "ELECTRONICS", "SAFETY_GEAR", "CLOTHING", "OTHER"
  ]),
  body("brand").optional().trim().isLength({ max: 100 }),
  body("model").optional().trim().isLength({ max: 100 }),
  body("quantity").optional().isInt({ min: 1, max: 999 }),
  body("condition").optional().isIn([
    "NEW", "EXCELLENT", "GOOD", "FAIR", "NEEDS_REPAIR"
  ]),
  body("description").optional().trim().isLength({ max: 2000 }),
  body("purchaseDate").optional().isISO8601(),
  body("purchasePrice").optional().isDecimal({ decimal_digits: "0,2" }),
  body("photo").optional().trim().isLength({ max: 500 }),
];

const updateEquipmentValidation = [
  ...createEquipmentValidation.map((v) => v.optional()),
];

// =============================================================================
// GET /api/equipment - Lista attrezzature dell'utente corrente
// =============================================================================
router.get(
  "/",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Admin can view other user's equipment via ?userId=xxx
      let targetUserId = req.user!.userId;
      const requestedUserId = req.query.userId as string;

      if (requestedUserId && requestedUserId !== req.user!.userId) {
        // Only admins can view other users' equipment
        const adminRoles = ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT"];
        if (!adminRoles.includes(req.user!.role)) {
          return res.status(403).json({
            success: false,
            message: "Non autorizzato a visualizzare le attrezzature di altri utenti",
          });
        }
        targetUserId = requestedUserId;
      }

      const equipment = await prisma.equipment.findMany({
        where: {
          userId: targetUserId,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: equipment,
      });
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({
        success: false,
        message: "Errore nel recupero delle attrezzature",
      });
    }
  }
);

// =============================================================================
// GET /api/equipment/:id - Dettaglio attrezzatura
// =============================================================================
router.get(
  "/:id",
  authenticate,
  [param("id").isUUID()],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const equipment = await prisma.equipment.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
          isActive: true,
        },
      });

      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: "Attrezzatura non trovata",
        });
      }

      res.json({
        success: true,
        data: equipment,
      });
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({
        success: false,
        message: "Errore nel recupero dell'attrezzatura",
      });
    }
  }
);

// =============================================================================
// POST /api/equipment - Crea nuova attrezzatura
// =============================================================================
router.post(
  "/",
  authenticate,
  createEquipmentValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const {
        name, type, brand, model, quantity, condition,
        description, purchaseDate, purchasePrice, photo
      } = req.body;

      const equipment = await prisma.equipment.create({
        data: {
          name,
          type: type || "OTHER",
          brand,
          model,
          quantity: quantity ? parseInt(quantity) : 1,
          condition: condition || "GOOD",
          description,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
          photo,
          userId: req.user!.userId,
        },
      });

      res.status(201).json({
        success: true,
        data: equipment,
        message: "Attrezzatura creata con successo",
      });
    } catch (error) {
      console.error("Error creating equipment:", error);
      res.status(500).json({
        success: false,
        message: "Errore nella creazione dell'attrezzatura",
      });
    }
  }
);

// =============================================================================
// PUT /api/equipment/:id - Aggiorna attrezzatura
// =============================================================================
router.put(
  "/:id",
  authenticate,
  [param("id").isUUID(), ...updateEquipmentValidation],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      // Verify ownership
      const existingEquipment = await prisma.equipment.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
          isActive: true,
        },
      });

      if (!existingEquipment) {
        return res.status(404).json({
          success: false,
          message: "Attrezzatura non trovata",
        });
      }

      const updateData: any = {};
      const fields = [
        "name", "type", "brand", "model", "condition", "description", "photo"
      ];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      // Handle numeric fields
      if (req.body.quantity !== undefined) {
        updateData.quantity = req.body.quantity ? parseInt(req.body.quantity) : 1;
      }
      if (req.body.purchasePrice !== undefined) {
        updateData.purchasePrice = req.body.purchasePrice ? parseFloat(req.body.purchasePrice) : null;
      }

      // Handle date fields
      if (req.body.purchaseDate !== undefined) {
        updateData.purchaseDate = req.body.purchaseDate ? new Date(req.body.purchaseDate) : null;
      }

      const equipment = await prisma.equipment.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({
        success: true,
        data: equipment,
        message: "Attrezzatura aggiornata con successo",
      });
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(500).json({
        success: false,
        message: "Errore nell'aggiornamento dell'attrezzatura",
      });
    }
  }
);

// =============================================================================
// DELETE /api/equipment/:id - Elimina attrezzatura (soft delete)
// =============================================================================
router.delete(
  "/:id",
  authenticate,
  [param("id").isUUID()],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      // Verify ownership
      const existingEquipment = await prisma.equipment.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
          isActive: true,
        },
      });

      if (!existingEquipment) {
        return res.status(404).json({
          success: false,
          message: "Attrezzatura non trovata",
        });
      }

      // Soft delete
      await prisma.equipment.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: "Attrezzatura eliminata con successo",
      });
    } catch (error) {
      console.error("Error deleting equipment:", error);
      res.status(500).json({
        success: false,
        message: "Errore nell'eliminazione dell'attrezzatura",
      });
    }
  }
);

export default router;
