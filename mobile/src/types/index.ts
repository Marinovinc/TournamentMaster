/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/types/index.ts
 * Creato: 2025-12-30
 * Descrizione: TypeScript types per TournamentMaster Mobile
 *
 * Basato su: backend/prisma/schema.prisma
 * =============================================================================
 */

// =============================================================================
// ENUMS
// =============================================================================

export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'ORGANIZER' | 'JUDGE' | 'PARTICIPANT';

export type TournamentStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type TournamentDiscipline =
  | 'BIG_GAME'
  | 'DRIFTING'
  | 'TRAINA_COSTIERA'
  | 'BOLENTINO'
  | 'EGING'
  | 'VERTICAL_JIGGING'
  | 'SHORE'
  | 'SOCIAL';

export type CatchStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLIST';

// =============================================================================
// AUTH
// =============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  licenseNumber?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// =============================================================================
// USER
// =============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  licenseNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// TOURNAMENT
// =============================================================================

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  discipline: TournamentDiscipline;
  status: TournamentStatus;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  currentParticipants: number;
  entryFee?: number;
  currency: string;
  location?: string;
  bannerImage?: string;
  createdAt: string;
}

export interface TournamentDetail extends Tournament {
  rules?: string;
  prizes?: string;
  organizer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  zones: FishingZone[];
  species: Species[];
  isRegistered: boolean;
  myRegistration?: TournamentRegistration;
}

export interface TournamentRegistration {
  id: string;
  status: RegistrationStatus;
  teamName?: string;
  boatName?: string;
  registeredAt: string;
}

// =============================================================================
// FISHING ZONE
// =============================================================================

export interface FishingZone {
  id: string;
  name: string;
  description?: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  color?: string;
}

// =============================================================================
// SPECIES
// =============================================================================

export interface Species {
  id: string;
  commonName: string;
  scientificName?: string;
  minWeight?: number;
  maxWeight?: number;
  minLength?: number;
  pointsPerKg?: number;
  image?: string;
}

// =============================================================================
// CATCH
// =============================================================================

export interface Catch {
  id: string;
  tournamentId: string;
  participantId: string;
  participant?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  species: Species;
  weight: number;
  length?: number;
  photos: string[];
  videoUrl?: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
  status: CatchStatus;
  rejectionReason?: string;
  points?: number;
  createdAt: string;
  validatedAt?: string;
  validatedBy?: string;
}

export interface CatchSubmission {
  tournamentId: string;
  speciesId: string;
  weight: number;
  length?: number;
  notes?: string;
  gps: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
  };
  capturedAt: Date;
  photos: MediaFile[];
  video?: MediaFile;
}

export interface MediaFile {
  uri: string;
  type?: string;
  name?: string;
}

// =============================================================================
// LEADERBOARD
// =============================================================================

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  participantName: string;
  teamName?: string;
  totalCatches: number;
  totalWeight: number;
  totalPoints: number;
  lastCatchAt?: string;
}

// =============================================================================
// OFFLINE SYNC
// =============================================================================

export interface OfflineCatch extends CatchSubmission {
  localId: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  createdAt: string;
  errorMessage?: string;
}

// =============================================================================
// GPS
// =============================================================================

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface ZoneValidationResult {
  isInside: boolean;
  zoneName?: string;
  distance?: number; // meters to nearest boundary if outside
}

// =============================================================================
// NAVIGATION
// =============================================================================

export type RootStackParamList = {
  // Auth Navigator (wrapper)
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;

  // Main tabs
  MainTabs: undefined;

  // Tournaments
  TournamentDetail: { id: string };
  TournamentRegister: { id: string };
  TournamentLeaderboard: { id: string };
  TournamentZones: { id: string };

  // Catches
  SubmitCatch: { tournamentId: string };
  CatchDetail: { id: string };
  MyCatches: { tournamentId?: string };

  // Judge
  JudgeDashboard: { tournamentId: string };
  ReviewCatch: { catchId: string };

  // Profile
  EditProfile: undefined;
  Documents: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tournaments: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};
