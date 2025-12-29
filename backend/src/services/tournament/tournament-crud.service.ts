/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/services/tournament.service.ts (righe 54-332)
 * Data refactoring: 2025-12-29
 * Motivo: Separazione operazioni CRUD per manutenibilita
 *
 * Contiene:
 * - create() - Creazione nuovo torneo
 * - getById() - Lettura singolo torneo
 * - list() - Lista tornei con filtri e paginazione
 * - update() - Aggiornamento torneo
 * - delete() - Cancellazione torneo (soft delete)
 *
 * Dipendenze:
 * - ./tournament.types.ts (interfaces)
 * - ../../lib/prisma (database)
 * =============================================================================
 */

import prisma from "../../lib/prisma";
import { TournamentStatus } from "../../types";
import {
  CreateTournamentData,
  UpdateTournamentData,
  TournamentFilters,
  PaginationOptions,
} from "./tournament.types";

/**
 * Operazioni CRUD per i tornei
 */
export class TournamentCrudService {
  /**
   * Create a new tournament
   */
  static async create(data: CreateTournamentData) {
    // Validate dates
    if (data.startDate >= data.endDate) {
      throw new Error("End date must be after start date");
    }
    if (data.registrationOpens >= data.registrationCloses) {
      throw new Error("Registration close date must be after open date");
    }
    if (data.registrationCloses > data.startDate) {
      throw new Error("Registration must close before tournament starts");
    }

    const tournament = await prisma.tournament.create({
      data: {
        name: data.name,
        description: data.description,
        discipline: data.discipline,
        startDate: data.startDate,
        endDate: data.endDate,
        registrationOpens: data.registrationOpens,
        registrationCloses: data.registrationCloses,
        location: data.location,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        registrationFee: data.registrationFee || 0,
        maxParticipants: data.maxParticipants,
        minParticipants: data.minParticipants || 1,
        minWeight: data.minWeight,
        maxCatchesPerDay: data.maxCatchesPerDay,
        pointsPerKg: data.pointsPerKg || 1,
        bonusPoints: data.bonusPoints || 0,
        bannerImage: data.bannerImage,
        tenantId: data.tenantId,
        organizerId: data.organizerId,
        status: TournamentStatus.DRAFT,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

    return tournament;
  }

  /**
   * Get tournament by ID
   */
  static async getById(id: string, includeFull = false) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        fishingZones: includeFull,
        allowedSpecies: includeFull
          ? {
              include: {
                species: true,
              },
            }
          : false,
        // Include actual registrations data for tournament detail page
        registrations: includeFull
          ? {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            }
          : false,
        // Include catches data sorted by points (leaderboard order)
        catches: includeFull
          ? {
              include: {
                species: {
                  select: {
                    id: true,
                    commonNameIt: true,
                    commonNameEn: true,
                  },
                },
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: { points: "desc" },
            }
          : false,
        _count: {
          select: {
            registrations: true,
            catches: true,
          },
        },
      },
    });

    return tournament;
  }

  /**
   * List tournaments with filters and pagination
   */
  static async list(filters: TournamentFilters, pagination: PaginationOptions) {
    const where: any = {};

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.discipline) {
      where.discipline = filters.discipline;
    }

    if (filters.startDateFrom || filters.startDateTo) {
      where.startDate = {};
      if (filters.startDateFrom) {
        where.startDate.gte = filters.startDateFrom;
      }
      if (filters.startDateTo) {
        where.startDate.lte = filters.startDateTo;
      }
    }

    if (filters.searchQuery) {
      where.OR = [
        { name: { contains: filters.searchQuery } },
        { description: { contains: filters.searchQuery } },
        { location: { contains: filters.searchQuery } },
      ];
    }

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
              registrations: true,
              catches: true,
            },
          },
        },
        orderBy: { startDate: "asc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.tournament.count({ where }),
    ]);

    return {
      tournaments,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  /**
   * Update tournament
   */
  static async update(id: string, data: UpdateTournamentData, userId: string) {
    // Check tournament exists and user has permission
    const existing = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Tournament not found");
    }

    // Only organizer can update
    if (existing.organizerId !== userId) {
      throw new Error("Only the organizer can update this tournament");
    }

    // Can't update if already completed or cancelled
    if (
      existing.status === TournamentStatus.COMPLETED ||
      existing.status === TournamentStatus.CANCELLED
    ) {
      throw new Error("Cannot update a completed or cancelled tournament");
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        discipline: data.discipline,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        registrationOpens: data.registrationOpens,
        registrationCloses: data.registrationCloses,
        location: data.location,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        registrationFee: data.registrationFee,
        maxParticipants: data.maxParticipants,
        minParticipants: data.minParticipants,
        minWeight: data.minWeight,
        maxCatchesPerDay: data.maxCatchesPerDay,
        pointsPerKg: data.pointsPerKg,
        bonusPoints: data.bonusPoints,
        bannerImage: data.bannerImage,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return tournament;
  }

  /**
   * Delete tournament (soft delete by setting status to CANCELLED)
   */
  static async delete(id: string, userId: string) {
    const existing = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Tournament not found");
    }

    if (existing.organizerId !== userId) {
      throw new Error("Only the organizer can delete this tournament");
    }

    // Can only delete draft tournaments, otherwise cancel
    if (existing.status !== TournamentStatus.DRAFT) {
      // Cancel instead of delete
      await prisma.tournament.update({
        where: { id },
        data: { status: TournamentStatus.CANCELLED },
      });
      return { deleted: false, cancelled: true };
    }

    // Hard delete for draft tournaments
    await prisma.tournament.delete({
      where: { id },
    });

    return { deleted: true, cancelled: false };
  }
}
