/**
 * =============================================================================
 * Skipper Routes - Profilo Skipper
 * =============================================================================
 * Endpoint per:
 * - Gestione profilo skipper personale
 * - Lista skipper disponibili (pubblico per tenant)
 */

import { Router, Response } from "express";
import { body, query, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";
import prisma from "../lib/prisma";

const router = Router();

// =============================================================================
// VALIDATION RULES
// =============================================================================

const updateSkipperValidation = [
  body("isAvailable").optional().isBoolean(),
  body("licenseType").optional().isIn([
    "NONE", "ENTRO_12_MIGLIA", "SENZA_LIMITI", "SHIP_MASTER"
  ]),
  body("licenseNumber").optional().trim().isLength({ max: 50 }),
  body("licenseExpiry").optional().isISO8601(),
  body("yearsOfExperience").optional().isInt({ min: 0, max: 70 }),
  body("canOperateTypes").optional().isArray(),
  body("maxBoatLength").optional().isDecimal({ decimal_digits: "0,2" }),
  body("specializations").optional().isArray(),
  body("hourlyRate").optional().isDecimal({ decimal_digits: "0,2" }),
  body("availabilityNotes").optional().trim().isLength({ max: 2000 }),
  body("serviceArea").optional().trim().isLength({ max: 255 }),
];

// =============================================================================
// GET /api/skippers/me - Profilo skipper dell'utente corrente
// =============================================================================
router.get(
  "/me",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const skipperProfile = await prisma.skipperProfile.findUnique({
        where: {
          userId: req.user!.userId,
        },
      });

      res.json({
        success: true,
        data: skipperProfile,
      });
    } catch (error) {
      console.error("Error fetching skipper profile:", error);
      res.status(500).json({
        success: false,
        message: "Errore nel recupero del profilo skipper",
      });
    }
  }
);

// =============================================================================
// PUT /api/skippers/me - Aggiorna/Crea profilo skipper (upsert)
// =============================================================================
router.put(
  "/me",
  authenticate,
  updateSkipperValidation,
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
        isAvailable, licenseType, licenseNumber, licenseExpiry,
        yearsOfExperience, canOperateTypes, maxBoatLength,
        specializations, hourlyRate, availabilityNotes, serviceArea
      } = req.body;

      const data: any = {};

      if (isAvailable !== undefined) data.isAvailable = isAvailable;
      if (licenseType !== undefined) data.licenseType = licenseType;
      if (licenseNumber !== undefined) data.licenseNumber = licenseNumber;
      if (licenseExpiry !== undefined) {
        data.licenseExpiry = licenseExpiry ? new Date(licenseExpiry) : null;
      }
      if (yearsOfExperience !== undefined) {
        data.yearsOfExperience = parseInt(yearsOfExperience);
      }
      if (canOperateTypes !== undefined) {
        data.canOperateTypes = JSON.stringify(canOperateTypes);
      }
      if (maxBoatLength !== undefined) {
        data.maxBoatLength = maxBoatLength ? parseFloat(maxBoatLength) : null;
      }
      if (specializations !== undefined) {
        data.specializations = JSON.stringify(specializations);
      }
      if (hourlyRate !== undefined) {
        data.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : null;
      }
      if (availabilityNotes !== undefined) data.availabilityNotes = availabilityNotes;
      if (serviceArea !== undefined) data.serviceArea = serviceArea;

      const skipperProfile = await prisma.skipperProfile.upsert({
        where: {
          userId: req.user!.userId,
        },
        update: data,
        create: {
          ...data,
          userId: req.user!.userId,
        },
      });

      res.json({
        success: true,
        data: skipperProfile,
        message: "Profilo skipper aggiornato con successo",
      });
    } catch (error) {
      console.error("Error updating skipper profile:", error);
      res.status(500).json({
        success: false,
        message: "Errore nell'aggiornamento del profilo skipper",
      });
    }
  }
);

// =============================================================================
// GET /api/skippers/available - Skipper disponibili (pubblico per tenant)
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

      const skippers = await prisma.skipperProfile.findMany({
        where: {
          isAvailable: true,
          user: {
            tenantId: tenantId,
            isActive: true,
          },
        },
        select: {
          id: true,
          isAvailable: true,
          licenseType: true,
          yearsOfExperience: true,
          canOperateTypes: true,
          maxBoatLength: true,
          specializations: true,
          hourlyRate: true,
          availabilityNotes: true,
          serviceArea: true,
          isVerified: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: [
          { isVerified: "desc" },
          { yearsOfExperience: "desc" },
        ],
      });

      // Parse JSON fields
      const parsedSkippers = skippers.map((s) => ({
        ...s,
        canOperateTypes: s.canOperateTypes ? JSON.parse(s.canOperateTypes) : [],
        specializations: s.specializations ? JSON.parse(s.specializations) : [],
      }));

      res.json({
        success: true,
        data: parsedSkippers,
      });
    } catch (error) {
      console.error("Error fetching available skippers:", error);
      res.status(500).json({
        success: false,
        message: "Errore nel recupero degli skipper disponibili",
      });
    }
  }
);

export default router;
