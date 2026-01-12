import { Request } from "express";

// User types
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string;
}

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  TENANT_ADMIN = "TENANT_ADMIN",
  PRESIDENT = "PRESIDENT",           // Presidente (stessi permessi di TENANT_ADMIN)
  VICE_PRESIDENT = "VICE_PRESIDENT", // Vice Presidente
  SECRETARY = "SECRETARY",           // Segretario
  TREASURER = "TREASURER",           // Tesoriere
  BOARD_MEMBER = "BOARD_MEMBER",     // Membro del Consiglio Direttivo
  ORGANIZER = "ORGANIZER",
  JUDGE = "JUDGE",
  CAPTAIN = "CAPTAIN",               // Capitano squadra
  PARTICIPANT = "PARTICIPANT",
  MEMBER = "MEMBER",                 // Alias legacy per PARTICIPANT
}

export enum DocumentType {
  MASAF_LICENSE = "MASAF_LICENSE",
  MEDICAL_CERTIFICATE = "MEDICAL_CERTIFICATE",
  NAUTICAL_LICENSE = "NAUTICAL_LICENSE",
  IDENTITY_DOCUMENT = "IDENTITY_DOCUMENT",
}

export enum DocumentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum TournamentStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  REGISTRATION_OPEN = "REGISTRATION_OPEN",
  REGISTRATION_CLOSED = "REGISTRATION_CLOSED",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum TournamentDiscipline {
  BIG_GAME = "BIG_GAME",
  DRIFTING = "DRIFTING",
  TRAINA_COSTIERA = "TRAINA_COSTIERA",
  BOLENTINO = "BOLENTINO",
  EGING = "EGING",
  VERTICAL_JIGGING = "VERTICAL_JIGGING",
  SHORE = "SHORE",
  SOCIAL = "SOCIAL",
}

// Modalità di gioco del torneo
export enum GameMode {
  TRADITIONAL = "TRADITIONAL",       // Punteggio basato sul peso (sistema classico)
  CATCH_RELEASE = "CATCH_RELEASE",   // Punteggio per specie + fascia taglia (C&R)
}

// Fascia taglia per modalità Catch & Release
export enum SizeCategory {
  SMALL = "SMALL",             // S - Taglia piccola
  MEDIUM = "MEDIUM",           // M - Taglia media
  LARGE = "LARGE",             // L - Taglia grande
  EXTRA_LARGE = "EXTRA_LARGE", // XL - Taglia extra large
}


// Livello torneo
export enum TournamentLevel {
  CLUB = "CLUB",
  PROVINCIAL = "PROVINCIAL",
  REGIONAL = "REGIONAL",
  NATIONAL = "NATIONAL",
  INTERNATIONAL = "INTERNATIONAL",
}

// Configurazione punteggi C&R per specie
export interface SpeciesScoringConfigItem {
  speciesId: string;
  speciesName?: string;
  pointsSmall: number;
  pointsMedium: number;
  pointsLarge: number;
  pointsExtraLarge: number;
  thresholdSmallCm?: number;
  thresholdMediumCm?: number;
  thresholdLargeCm?: number;
  catchReleaseBonus?: number;
  catchReleaseOnly?: boolean;
}

// Profilo torneo
export interface TournamentProfile {
  id: string;
  name: string;
  description?: string;
  isSystemProfile: boolean;
  basedOnId?: string;
  tenantId?: string;
  discipline: TournamentDiscipline;
  level: TournamentLevel;
  gameMode: GameMode;
  followsFipsasRules: boolean;
  fipsasRegulationUrl?: string;
  defaultMinWeight?: number;
  defaultMaxCatchesPerDay?: number;
  defaultPointsPerKg: number;
  defaultBonusPoints: number;
  speciesScoringConfig?: SpeciesScoringConfigItem[];
  allowedSpeciesIds?: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// DTO per creazione profilo
export interface CreateTournamentProfileDTO {
  name: string;
  description?: string;
  basedOnId?: string;
  discipline: TournamentDiscipline;
  level?: TournamentLevel;
  gameMode?: GameMode;
  followsFipsasRules?: boolean;
  fipsasRegulationUrl?: string;
  defaultMinWeight?: number;
  defaultMaxCatchesPerDay?: number;
  defaultPointsPerKg?: number;
  defaultBonusPoints?: number;
  speciesScoringConfig?: SpeciesScoringConfigItem[];
  allowedSpeciesIds?: string[];
}

// DTO per update profilo
export interface UpdateTournamentProfileDTO extends Partial<CreateTournamentProfileDTO> {
  isActive?: boolean;
  displayOrder?: number;
}

export enum CatchStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// GPS types
export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface GeoJSONMultiPolygon {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

export type FishingZone = GeoJSONPolygon | GeoJSONMultiPolygon;

// Express extended types
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Catch validation result
export interface CatchValidationResult {
  isValid: boolean;
  isInsideZone: boolean;
  gpsAccuracy: number;
  distanceFromZone?: number;
  errors: string[];
}
