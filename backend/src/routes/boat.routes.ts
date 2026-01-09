/**
 * =============================================================================
 * Boat Routes - Gestione Barche Personali
 * =============================================================================
 * Endpoint per:
 * - Lista barche utente
 * - CRUD barche
 * - Barche disponibili per gare (pubblico)
 */

import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";
import prisma from "../lib/prisma";

const router = Router();

// =============================================================================
// VALIDATION RULES
// =============================================================================

const createBoatValidation = [
  body("name").trim().notEmpty().withMessage("Il nome della barca e obbligatorio"),
  body("type").optional().isIn([
    "FISHING_BOAT", "SAILING_YACHT", "MOTOR_YACHT", "RIB",
    "CENTER_CONSOLE", "CABIN_CRUISER", "SPORT_FISHING", "OTHER"
  ]),
  body("lengthMeters").isDecimal({ decimal_digits: "0,2" }).withMessage("Lunghezza non valida"),
  body("beamMeters").optional().isDecimal({ decimal_digits: "0,2" }),
  body("homePort").optional().trim().isLength({ max: 255 }),
  body("seats").optional().isInt({ min: 1, max: 50 }),
  body("year").optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
  body("make").optional().trim().isLength({ max: 100 }),
  body("model").optional().trim().isLength({ max: 100 }),
  body("engineType").optional().isIn([
    "OUTBOARD", "INBOARD", "STERN_DRIVE", "SAIL", "HYBRID", "NONE"
  ]),
  body("enginePower").optional().isInt({ min: 0, max: 5000 }),
  body("engineMake").optional().trim().isLength({ max: 100 }),
  body("registrationNumber").optional().trim().isLength({ max: 100 }),
  body("flagState").optional().trim().isLength({ max: 50 }),
  body("insuranceExpiry").optional().isISO8601(),
  body("revisionExpiry").optional().isISO8601(),
  body("isAvailableForRaces").optional().isBoolean(),
  body("availabilityNotes").optional().trim().isLength({ max: 500 }),
];

const updateBoatValidation = [
  ...createBoatValidation.map((v) => v.optional()),
];

// =============================================================================
// GET /api/boats - Lista barche dell'utente corrente
// =============================================================================
router.get(
  "/",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const boats = await prisma.boat.findMany({
        where: {
          userId: req.user!.userId,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: boats,
      });
    } catch (error) {
      console.error("Error fetching boats:", error);
      res.status(500).json({
        success: false,
        message: "Errore nel recupero delle barche",
      });
    }
  }
);

// =============================================================================
// GET /api/boats/available - Barche disponibili per gare (pubblico per tenant)
// =============================================================================
router.get(
  "/available",
  authenticate,
  [
    query("tenantId").optional().isUUID(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.query.tenantId as string || req.user?.tenantId;

      const boats = await prisma.boat.findMany({
        where: {
          isActive: true,
          isAvailableForRaces: true,
          user: {
            tenantId: tenantId,
            isActive: true,
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
          lengthMeters: true,
          seats: true,
          make: true,
          model: true,
          homePort: true,
          photo: true,
          availabilityNotes: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      res.json({
        success: true,
        data: boats,
      });
    } catch (error) {
      console.error("Error fetching available boats:", error);
      res.status(500).json({
        success: false,
        message: "Errore nel recupero delle barche disponibili",
      });
    }
  }
);

// =============================================================================
// GET /api/boats/:id - Dettaglio barca
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

      const boat = await prisma.boat.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
          isActive: true,
        },
      });

      if (!boat) {
        return res.status(404).json({
          success: false,
          message: "Barca non trovata",
        });
      }

      res.json({
        success: true,
        data: boat,
      });
    } catch (error) {
      console.error("Error fetching boat:", error);
      res.status(500).json({
        success: false,
        message: "Errore nel recupero della barca",
      });
    }
  }
);

// =============================================================================
// POST /api/boats - Crea nuova barca
// =============================================================================
router.post(
  "/",
  authenticate,
  createBoatValidation,
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
        name, type, lengthMeters, beamMeters, photo, homePort, seats, year,
        make, model, engineType, enginePower, engineMake, registrationNumber,
        flagState, insuranceExpiry, revisionExpiry, isAvailableForRaces, availabilityNotes
      } = req.body;

      const boat = await prisma.boat.create({
        data: {
          name,
          type: type || "OTHER",
          lengthMeters: parseFloat(lengthMeters),
          beamMeters: beamMeters ? parseFloat(beamMeters) : null,
          photo,
          homePort,
          seats: seats ? parseInt(seats) : 4,
          year: year ? parseInt(year) : null,
          make,
          model,
          engineType: engineType || "OUTBOARD",
          enginePower: enginePower ? parseInt(enginePower) : null,
          engineMake,
          registrationNumber,
          flagState,
          insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
          revisionExpiry: revisionExpiry ? new Date(revisionExpiry) : null,
          isAvailableForRaces: isAvailableForRaces ?? true,
          availabilityNotes,
          userId: req.user!.userId,
        },
      });

      res.status(201).json({
        success: true,
        data: boat,
        message: "Barca creata con successo",
      });
    } catch (error) {
      console.error("Error creating boat:", error);
      res.status(500).json({
        success: false,
        message: "Errore nella creazione della barca",
      });
    }
  }
);

// =============================================================================
// PUT /api/boats/:id - Aggiorna barca
// =============================================================================
router.put(
  "/:id",
  authenticate,
  [param("id").isUUID(), ...updateBoatValidation],
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
      const existingBoat = await prisma.boat.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
          isActive: true,
        },
      });

      if (!existingBoat) {
        return res.status(404).json({
          success: false,
          message: "Barca non trovata",
        });
      }

      const updateData: any = {};
      const fields = [
        "name", "type", "photo", "homePort", "make", "model",
        "engineType", "engineMake", "registrationNumber", "flagState",
        "availabilityNotes"
      ];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      // Handle numeric fields
      if (req.body.lengthMeters !== undefined) {
        updateData.lengthMeters = parseFloat(req.body.lengthMeters);
      }
      if (req.body.beamMeters !== undefined) {
        updateData.beamMeters = req.body.beamMeters ? parseFloat(req.body.beamMeters) : null;
      }
      if (req.body.seats !== undefined) {
        updateData.seats = req.body.seats ? parseInt(req.body.seats) : null;
      }
      if (req.body.year !== undefined) {
        updateData.year = req.body.year ? parseInt(req.body.year) : null;
      }
      if (req.body.enginePower !== undefined) {
        updateData.enginePower = req.body.enginePower ? parseInt(req.body.enginePower) : null;
      }

      // Handle date fields
      if (req.body.insuranceExpiry !== undefined) {
        updateData.insuranceExpiry = req.body.insuranceExpiry ? new Date(req.body.insuranceExpiry) : null;
      }
      if (req.body.revisionExpiry !== undefined) {
        updateData.revisionExpiry = req.body.revisionExpiry ? new Date(req.body.revisionExpiry) : null;
      }

      // Handle boolean
      if (req.body.isAvailableForRaces !== undefined) {
        updateData.isAvailableForRaces = req.body.isAvailableForRaces;
      }

      const boat = await prisma.boat.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({
        success: true,
        data: boat,
        message: "Barca aggiornata con successo",
      });
    } catch (error) {
      console.error("Error updating boat:", error);
      res.status(500).json({
        success: false,
        message: "Errore nell'aggiornamento della barca",
      });
    }
  }
);

// =============================================================================
// DELETE /api/boats/:id - Elimina barca (soft delete)
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
      const existingBoat = await prisma.boat.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
          isActive: true,
        },
      });

      if (!existingBoat) {
        return res.status(404).json({
          success: false,
          message: "Barca non trovata",
        });
      }

      // Soft delete
      await prisma.boat.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: "Barca eliminata con successo",
      });
    } catch (error) {
      console.error("Error deleting boat:", error);
      res.status(500).json({
        success: false,
        message: "Errore nell'eliminazione della barca",
      });
    }
  }
);

export default router;
