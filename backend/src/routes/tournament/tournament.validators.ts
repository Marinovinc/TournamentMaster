/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/routes/tournament.routes.ts (righe 18-66)
 * Data refactoring: 2025-12-29
 * Motivo: Separazione regole validazione per riutilizzo
 *
 * Contiene:
 * - createTournamentValidation
 * - updateTournamentValidation
 * - fishingZoneValidation
 * - registerValidation
 * - listTournamentsValidation (nuovo)
 *
 * Utilizzato da tutti i moduli tournament.*.routes.ts
 * =============================================================================
 */

import { body, param, query } from "express-validator";
import { TournamentStatus, TournamentDiscipline } from "../../types";

/**
 * Validation for creating a new tournament
 */
export const createTournamentValidation = [
  body("name").trim().notEmpty().withMessage("Tournament name required"),
  body("discipline")
    .isIn(Object.values(TournamentDiscipline))
    .withMessage("Invalid discipline"),
  body("startDate").isISO8601().withMessage("Valid start date required"),
  body("endDate").isISO8601().withMessage("Valid end date required"),
  body("registrationOpens")
    .isISO8601()
    .withMessage("Valid registration open date required"),
  body("registrationCloses")
    .isISO8601()
    .withMessage("Valid registration close date required"),
  body("location").trim().notEmpty().withMessage("Location required"),
  body("locationLat").optional().isFloat({ min: -90, max: 90 }),
  body("locationLng").optional().isFloat({ min: -180, max: 180 }),
  body("registrationFee").optional().isFloat({ min: 0 }),
  body("maxParticipants").optional().isInt({ min: 1 }),
  body("minParticipants").optional().isInt({ min: 1 }),
  body("minWeight").optional().isFloat({ min: 0 }),
  body("maxCatchesPerDay").optional().isInt({ min: 1 }),
  body("pointsPerKg").optional().isFloat({ min: 0 }),
  body("bonusPoints").optional().isInt({ min: 0 }),
];

/**
 * Validation for updating a tournament
 */
export const updateTournamentValidation = [
  body("name").optional().trim().notEmpty(),
  body("discipline")
    .optional()
    .isIn(Object.values(TournamentDiscipline)),
  body("status").optional().isIn(Object.values(TournamentStatus)),
  body("startDate").optional().isISO8601(),
  body("endDate").optional().isISO8601(),
  body("registrationOpens").optional().isISO8601(),
  body("registrationCloses").optional().isISO8601(),
  body("location").optional().trim().notEmpty(),
];

/**
 * Validation for fishing zone
 */
export const fishingZoneValidation = [
  body("name").trim().notEmpty().withMessage("Zone name required"),
  body("geoJson").notEmpty().withMessage("GeoJSON required"),
  body("description").optional().trim(),
];

/**
 * Validation for tournament registration
 */
export const registerValidation = [
  body("teamName").optional().trim(),
  body("boatName").optional().trim(),
  body("boatLength").optional().isFloat({ min: 0 }),
];

/**
 * Validation for listing tournaments
 */
export const listTournamentsValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(Object.values(TournamentStatus)),
  query("discipline").optional().isIn(Object.values(TournamentDiscipline)),
  query("search").optional().trim(),
];

/**
 * Common param validation for tournament ID
 * Accepts both UUID and CUID formats (Prisma default)
 */
export const tournamentIdParam = param("id")
  .notEmpty()
  .withMessage("Tournament ID is required")
  .isString()
  .trim();

/**
 * Common param validation for zone ID
 * Accepts both UUID and CUID formats (Prisma default)
 */
export const zoneIdParam = param("zoneId")
  .notEmpty()
  .withMessage("Zone ID is required")
  .isString()
  .trim();
