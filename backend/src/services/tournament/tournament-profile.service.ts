/**
 * =============================================================================
 * TOURNAMENT PROFILE SERVICE
 * =============================================================================
 * File creato: 2026-01-12
 * Motivo: Gestione profili torneo (FIPSAS standard + custom associazione)
 *
 * Contiene:
 * - list() - Lista profili (sistema + tenant-specifici)
 * - getById() - Lettura singolo profilo
 * - create() - Creazione nuovo profilo associazione
 * - fork() - Fork profilo (Copy on Write da profilo sistema)
 * - update() - Aggiornamento profilo (solo profili associazione)
 * - delete() - Cancellazione profilo (solo profili associazione)
 *
 * Pattern: Copy on Write
 * - I profili FIPSAS (isSystemProfile=true) sono read-only
 * - Modificare un profilo sistema crea una copia per l'associazione
 * - basedOnId traccia il profilo di origine
 * =============================================================================
 */

import prisma from "../../lib/prisma";
import {
  TournamentDiscipline,
  GameMode,
  CreateTournamentProfileDTO,
  UpdateTournamentProfileDTO,
  SpeciesScoringConfigItem,
} from "../../types";

/**
 * Operazioni CRUD per i profili torneo
 */
export class TournamentProfileService {
  /**
   * List profiles for a tenant
   * Returns both system profiles (FIPSAS) and tenant-specific profiles
   */
  static async list(tenantId?: string, filters?: {
    discipline?: TournamentDiscipline;
    gameMode?: GameMode;
    isActive?: boolean;
  }) {
    const where: any = {
      OR: [
        { isSystemProfile: true },  // Always include system profiles
        ...(tenantId ? [{ tenantId }] : []),  // Include tenant profiles if tenantId provided
      ],
    };

    if (filters?.discipline) {
      where.discipline = filters.discipline;
    }

    if (filters?.gameMode) {
      where.gameMode = filters.gameMode;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const profiles = await prisma.tournamentProfile.findMany({
      where,
      include: {
        basedOn: {
          select: {
            id: true,
            name: true,
            isSystemProfile: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            tournaments: true,
            derivedProfiles: true,
          },
        },
      },
      orderBy: [
        { isSystemProfile: "desc" },  // System profiles first
        { displayOrder: "asc" },
        { name: "asc" },
      ],
    });

    return profiles;
  }

  /**
   * Get profile by ID
   */
  static async getById(id: string) {
    const profile = await prisma.tournamentProfile.findUnique({
      where: { id },
      include: {
        basedOn: {
          select: {
            id: true,
            name: true,
            isSystemProfile: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        derivedProfiles: {
          select: {
            id: true,
            name: true,
            tenantId: true,
          },
        },
        _count: {
          select: {
            tournaments: true,
          },
        },
      },
    });

    if (!profile) {
      throw new Error("Profile not found");
    }

    // Parse speciesScoringConfig from JSON string
    if (profile.speciesScoringConfig) {
      try {
        (profile as any).speciesScoringConfigParsed = JSON.parse(
          profile.speciesScoringConfig
        ) as SpeciesScoringConfigItem[];
      } catch {
        (profile as any).speciesScoringConfigParsed = [];
      }
    }

    return profile;
  }

  /**
   * Create a new tenant profile
   * Only associations can create profiles, not system profiles
   */
  static async create(tenantId: string, data: CreateTournamentProfileDTO) {
    // Validate tenantId is provided
    if (!tenantId) {
      throw new Error("Tenant ID is required to create a profile");
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Check for duplicate name within tenant
    const existing = await prisma.tournamentProfile.findFirst({
      where: {
        tenantId,
        name: data.name,
      },
    });

    if (existing) {
      throw new Error("A profile with this name already exists for this association");
    }

    const profile = await prisma.tournamentProfile.create({
      data: {
        name: data.name,
        description: data.description,
        isSystemProfile: false,  // Tenant profiles are never system profiles
        basedOnId: data.basedOnId,
        tenantId,
        discipline: data.discipline,
        level: data.level || "CLUB",
        gameMode: data.gameMode || "TRADITIONAL",
        followsFipsasRules: data.followsFipsasRules || false,
        fipsasRegulationUrl: data.fipsasRegulationUrl,
        defaultMinWeight: data.defaultMinWeight,
        defaultMaxCatchesPerDay: data.defaultMaxCatchesPerDay,
        defaultPointsPerKg: data.defaultPointsPerKg || 1,
        defaultBonusPoints: data.defaultBonusPoints || 0,
        speciesScoringConfig: data.speciesScoringConfig
          ? JSON.stringify(data.speciesScoringConfig)
          : null,
        allowedSpeciesIds: data.allowedSpeciesIds
          ? JSON.stringify(data.allowedSpeciesIds)
          : null,
        isActive: true,
      },
      include: {
        basedOn: {
          select: {
            id: true,
            name: true,
            isSystemProfile: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return profile;
  }

  /**
   * Fork a system profile to create a tenant-specific copy
   * This is the "Copy on Write" pattern
   */
  static async fork(
    sourceProfileId: string,
    tenantId: string,
    customizations?: Partial<CreateTournamentProfileDTO>
  ) {
    // Get the source profile
    const sourceProfile = await prisma.tournamentProfile.findUnique({
      where: { id: sourceProfileId },
    });

    if (!sourceProfile) {
      throw new Error("Source profile not found");
    }

    // Generate name for forked profile
    const forkName = customizations?.name || `${sourceProfile.name} (Personalizzato)`;

    // Check for duplicate name within tenant
    const existing = await prisma.tournamentProfile.findFirst({
      where: {
        tenantId,
        name: forkName,
      },
    });

    if (existing) {
      throw new Error("A profile with this name already exists for this association");
    }

    // Create the forked profile
    const forkedProfile = await prisma.tournamentProfile.create({
      data: {
        name: forkName,
        description: customizations?.description || sourceProfile.description,
        isSystemProfile: false,  // Forked profiles are never system profiles
        basedOnId: sourceProfileId,  // Track origin
        tenantId,
        discipline: customizations?.discipline || sourceProfile.discipline,
        level: customizations?.level || sourceProfile.level,
        gameMode: customizations?.gameMode || sourceProfile.gameMode,
        followsFipsasRules: customizations?.followsFipsasRules ?? sourceProfile.followsFipsasRules,
        fipsasRegulationUrl: customizations?.fipsasRegulationUrl || sourceProfile.fipsasRegulationUrl,
        defaultMinWeight: customizations?.defaultMinWeight ?? sourceProfile.defaultMinWeight,
        defaultMaxCatchesPerDay: customizations?.defaultMaxCatchesPerDay ?? sourceProfile.defaultMaxCatchesPerDay,
        defaultPointsPerKg: customizations?.defaultPointsPerKg ?? sourceProfile.defaultPointsPerKg,
        defaultBonusPoints: customizations?.defaultBonusPoints ?? sourceProfile.defaultBonusPoints,
        speciesScoringConfig: customizations?.speciesScoringConfig
          ? JSON.stringify(customizations.speciesScoringConfig)
          : sourceProfile.speciesScoringConfig,
        allowedSpeciesIds: customizations?.allowedSpeciesIds
          ? JSON.stringify(customizations.allowedSpeciesIds)
          : sourceProfile.allowedSpeciesIds,
        isActive: true,
      },
      include: {
        basedOn: {
          select: {
            id: true,
            name: true,
            isSystemProfile: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return forkedProfile;
  }

  /**
   * Update a tenant profile
   * System profiles cannot be updated directly (use fork instead)
   */
  static async update(
    id: string,
    tenantId: string,
    data: UpdateTournamentProfileDTO
  ) {
    const existing = await prisma.tournamentProfile.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Profile not found");
    }

    // Cannot update system profiles
    if (existing.isSystemProfile) {
      throw new Error(
        "Cannot modify system profiles. Use fork to create a custom copy."
      );
    }

    // Can only update profiles belonging to the tenant
    if (existing.tenantId !== tenantId) {
      throw new Error("You can only update profiles belonging to your association");
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.tournamentProfile.findFirst({
        where: {
          tenantId,
          name: data.name,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new Error("A profile with this name already exists for this association");
      }
    }

    const profile = await prisma.tournamentProfile.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        discipline: data.discipline,
        level: data.level,
        gameMode: data.gameMode,
        followsFipsasRules: data.followsFipsasRules,
        fipsasRegulationUrl: data.fipsasRegulationUrl,
        defaultMinWeight: data.defaultMinWeight,
        defaultMaxCatchesPerDay: data.defaultMaxCatchesPerDay,
        defaultPointsPerKg: data.defaultPointsPerKg,
        defaultBonusPoints: data.defaultBonusPoints,
        speciesScoringConfig: data.speciesScoringConfig !== undefined
          ? JSON.stringify(data.speciesScoringConfig)
          : undefined,
        allowedSpeciesIds: data.allowedSpeciesIds !== undefined
          ? JSON.stringify(data.allowedSpeciesIds)
          : undefined,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
      },
      include: {
        basedOn: {
          select: {
            id: true,
            name: true,
            isSystemProfile: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return profile;
  }

  /**
   * Delete a tenant profile
   * System profiles cannot be deleted
   */
  static async delete(id: string, tenantId: string) {
    const existing = await prisma.tournamentProfile.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tournaments: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error("Profile not found");
    }

    // Cannot delete system profiles
    if (existing.isSystemProfile) {
      throw new Error("Cannot delete system profiles");
    }

    // Can only delete profiles belonging to the tenant
    if (existing.tenantId !== tenantId) {
      throw new Error("You can only delete profiles belonging to your association");
    }

    // Cannot delete if profile is used by tournaments
    if (existing._count.tournaments > 0) {
      throw new Error(
        `Cannot delete profile. It is used by ${existing._count.tournaments} tournament(s). ` +
        "Deactivate it instead by setting isActive to false."
      );
    }

    await prisma.tournamentProfile.delete({
      where: { id },
    });

    return { deleted: true };
  }

  /**
   * Get available profiles for creating a tournament
   * Returns active profiles (system + tenant-specific) for the given discipline
   */
  static async getAvailableForTournament(
    tenantId: string,
    discipline?: TournamentDiscipline
  ) {
    const where: any = {
      isActive: true,
      OR: [
        { isSystemProfile: true },
        { tenantId },
      ],
    };

    if (discipline) {
      where.discipline = discipline;
    }

    const profiles = await prisma.tournamentProfile.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        isSystemProfile: true,
        discipline: true,
        level: true,
        gameMode: true,
        followsFipsasRules: true,
        fipsasRegulationUrl: true,
        defaultMinWeight: true,
        defaultMaxCatchesPerDay: true,
        defaultPointsPerKg: true,
        defaultBonusPoints: true,
      },
      orderBy: [
        { isSystemProfile: "desc" },
        { displayOrder: "asc" },
        { name: "asc" },
      ],
    });

    return profiles;
  }
}
