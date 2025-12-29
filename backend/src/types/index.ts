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
  ORGANIZER = "ORGANIZER",
  JUDGE = "JUDGE",
  PARTICIPANT = "PARTICIPANT",
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
