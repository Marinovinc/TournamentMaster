import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { CatchService } from "../services/catch.service";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole, CatchStatus } from "../types";

const router = Router();

// Validation rules
const submitCatchValidation = [
  body("tournamentId").notEmpty().withMessage("Tournament ID required"),
  body("weight")
    .isFloat({ min: 0.001 })
    .withMessage("Weight must be positive"),
  body("length").optional().isFloat({ min: 0 }),
  body("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Valid latitude required"),
  body("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Valid longitude required"),
  body("gpsAccuracy").optional().isFloat({ min: 0 }),
  body("speciesId").optional().isUUID(),
  body("photoPath").notEmpty().withMessage("Photo path required"),
  body("videoPath").optional().isString().withMessage("Video path must be a string"),
  body("caughtAt").isISO8601().withMessage("Valid catch time required"),
  body("notes").optional().trim(),
];

const reviewValidation = [
  body("reviewNotes").optional().trim(),
];

const rejectValidation = [
  body("reviewNotes")
    .trim()
    .notEmpty()
    .withMessage("Rejection reason is required"),
];

// GET /api/catches - List catches
router.get(
  "/",
  authenticate,
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("tournamentId").optional().isString(),
    query("status").optional().isIn(Object.values(CatchStatus)),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const filters = {
        tournamentId: req.query.tournamentId as string | undefined,
        userId: req.query.userId as string | undefined,
        status: req.query.status as CatchStatus | undefined,
        speciesId: req.query.speciesId as string | undefined,
      };

      // Non-admins can only see their own catches unless viewing tournament catches
      if (
        req.user?.role === UserRole.PARTICIPANT &&
        !filters.tournamentId
      ) {
        filters.userId = req.user.userId;
      }

      const result = await CatchService.list(filters, { page, limit });

      res.json({
        success: true,
        data: result.catches,
        pagination: result.pagination,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to list catches";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// GET /api/catches/:id - Get catch details
router.get(
  "/:id",
  authenticate,
  param("id").isUUID(),
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

      const catchRecord = await CatchService.getById(req.params.id);

      if (!catchRecord) {
        return res.status(404).json({
          success: false,
          message: "Catch not found",
        });
      }

      // Check access: owner, judge, or admin
      if (
        req.user?.role === UserRole.PARTICIPANT &&
        catchRecord.userId !== req.user.userId
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.json({
        success: true,
        data: catchRecord,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get catch";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// POST /api/catches - Submit a catch
router.post(
  "/",
  authenticate,
  submitCatchValidation,
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

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const result = await CatchService.submit({
        ...req.body,
        userId: req.user.userId,
        caughtAt: new Date(req.body.caughtAt),
      });

      // Include GPS validation warnings
      const warnings = result.validation.errors.filter(
        (e) => !e.includes("outside")
      );

      res.status(201).json({
        success: true,
        message: "Catch submitted successfully",
        data: result.catch,
        validation: {
          isInsideZone: result.validation.isInsideZone,
          gpsAccuracy: result.validation.gpsAccuracy,
          warnings,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit catch";

      if (
        message.includes("not registered") ||
        message.includes("not found")
      ) {
        return res.status(403).json({
          success: false,
          message,
        });
      }

      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

// PUT /api/catches/:id/approve - Approve a catch (judges only)
router.put(
  "/:id/approve",
  authenticate,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.ORGANIZER,
    UserRole.JUDGE
  ),
  param("id").isUUID(),
  reviewValidation,
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

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const catchRecord = await CatchService.approve(
        req.params.id,
        req.user.userId,
        req.body.reviewNotes
      );

      res.json({
        success: true,
        message: "Catch approved",
        data: catchRecord,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to approve catch";

      if (message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message,
        });
      }

      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

// PUT /api/catches/:id/reject - Reject a catch (judges only)
router.put(
  "/:id/reject",
  authenticate,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.ORGANIZER,
    UserRole.JUDGE
  ),
  param("id").isUUID(),
  rejectValidation,
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

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const catchRecord = await CatchService.reject(
        req.params.id,
        req.user.userId,
        req.body.reviewNotes
      );

      res.json({
        success: true,
        message: "Catch rejected",
        data: catchRecord,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reject catch";

      if (message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message,
        });
      }

      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

// GET /api/catches/tournament/:tournamentId/pending - Get pending catches for tournament
router.get(
  "/tournament/:tournamentId/pending",
  authenticate,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.ORGANIZER,
    UserRole.JUDGE
  ),
  param("tournamentId").notEmpty(),
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const result = await CatchService.getPendingForTournament(
        req.params.tournamentId,
        { page, limit }
      );

      res.json({
        success: true,
        data: result.catches,
        pagination: result.pagination,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get pending catches";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// GET /api/catches/tournament/:tournamentId/my - Get user's catches for tournament
router.get(
  "/tournament/:tournamentId/my",
  authenticate,
  param("tournamentId").notEmpty(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const result = await CatchService.getUserCatchesForTournament(
        req.user.userId,
        req.params.tournamentId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get catches";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

export default router;
