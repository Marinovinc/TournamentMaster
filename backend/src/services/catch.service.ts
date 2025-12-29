import prisma from "../lib/prisma";
import { CatchStatus, TournamentStatus } from "../types";
import { GPSService } from "./gps.service";
import { LeaderboardService } from "./leaderboard.service";

interface SubmitCatchData {
  tournamentId: string;
  userId: string;
  weight: number;
  length?: number;
  latitude: number;
  longitude: number;
  gpsAccuracy?: number;
  speciesId?: string;
  photoPath: string;
  photoExifData?: string;
  caughtAt: Date;
  notes?: string;
}

interface CatchFilters {
  tournamentId?: string;
  userId?: string;
  status?: CatchStatus;
  speciesId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface PaginationOptions {
  page: number;
  limit: number;
}

export class CatchService {
  /**
   * Submit a new catch
   */
  static async submit(data: SubmitCatchData) {
    // Verify tournament exists and is ongoing
    const tournament = await prisma.tournament.findUnique({
      where: { id: data.tournamentId },
      include: {
        fishingZones: {
          where: { isActive: true },
        },
      },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (tournament.status !== TournamentStatus.ONGOING) {
      throw new Error("Tournament is not currently active");
    }

    // Verify user is registered
    const registration = await prisma.tournamentRegistration.findUnique({
      where: {
        userId_tournamentId: {
          userId: data.userId,
          tournamentId: data.tournamentId,
        },
      },
    });

    if (!registration || registration.status !== "CONFIRMED") {
      throw new Error("User is not registered for this tournament");
    }

    // Check catch time is within tournament dates
    if (
      data.caughtAt < tournament.startDate ||
      data.caughtAt > tournament.endDate
    ) {
      throw new Error("Catch time is outside tournament dates");
    }

    // Check daily catch limit
    if (tournament.maxCatchesPerDay) {
      const today = new Date(data.caughtAt);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCatchCount = await prisma.catch.count({
        where: {
          userId: data.userId,
          tournamentId: data.tournamentId,
          caughtAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      if (todayCatchCount >= tournament.maxCatchesPerDay) {
        throw new Error(
          `Daily catch limit of ${tournament.maxCatchesPerDay} reached`
        );
      }
    }

    // Check minimum weight
    if (
      tournament.minWeight &&
      data.weight < Number(tournament.minWeight)
    ) {
      throw new Error(
        `Catch weight must be at least ${tournament.minWeight} kg`
      );
    }

    // Validate GPS location
    const gpsValidation = GPSService.validateCatchLocation(
      {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.gpsAccuracy,
      },
      tournament.fishingZones.map((z) => ({
        geoJson: z.geoJson,
        name: z.name,
      }))
    );

    // Create catch
    const catchRecord = await prisma.catch.create({
      data: {
        tournamentId: data.tournamentId,
        userId: data.userId,
        weight: data.weight,
        length: data.length,
        latitude: data.latitude,
        longitude: data.longitude,
        gpsAccuracy: data.gpsAccuracy,
        speciesId: data.speciesId,
        photoPath: data.photoPath,
        photoExifData: data.photoExifData,
        caughtAt: data.caughtAt,
        notes: data.notes,
        status: CatchStatus.PENDING,
        isInsideZone: gpsValidation.isInsideZone,
        validationData: JSON.stringify(gpsValidation),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
        species: true,
      },
    });

    return {
      catch: catchRecord,
      validation: gpsValidation,
    };
  }

  /**
   * Get catch by ID
   */
  static async getById(id: string) {
    const catchRecord = await prisma.catch.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            pointsPerKg: true,
          },
        },
        species: true,
      },
    });

    return catchRecord;
  }

  /**
   * List catches with filters and pagination
   */
  static async list(filters: CatchFilters, pagination: PaginationOptions) {
    const where: any = {};

    if (filters.tournamentId) {
      where.tournamentId = filters.tournamentId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.speciesId) {
      where.speciesId = filters.speciesId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.caughtAt = {};
      if (filters.dateFrom) {
        where.caughtAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.caughtAt.lte = filters.dateTo;
      }
    }

    const [catches, total] = await Promise.all([
      prisma.catch.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          tournament: {
            select: {
              id: true,
              name: true,
            },
          },
          species: {
            select: {
              id: true,
              commonNameIt: true,
              commonNameEn: true,
            },
          },
        },
        orderBy: { caughtAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.catch.count({ where }),
    ]);

    return {
      catches,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  /**
   * Approve a catch (judges only)
   */
  static async approve(
    catchId: string,
    reviewerId: string,
    reviewNotes?: string
  ) {
    const catchRecord = await prisma.catch.findUnique({
      where: { id: catchId },
      include: {
        tournament: {
          select: {
            id: true,
            pointsPerKg: true,
            bonusPoints: true,
          },
        },
        species: {
          select: {
            pointsMultiplier: true,
          },
        },
      },
    });

    if (!catchRecord) {
      throw new Error("Catch not found");
    }

    if (catchRecord.status !== CatchStatus.PENDING) {
      throw new Error("Catch has already been reviewed");
    }

    // Calculate points
    const basePoints =
      Number(catchRecord.weight) *
      Number(catchRecord.tournament.pointsPerKg);
    const speciesMultiplier = catchRecord.species?.pointsMultiplier
      ? Number(catchRecord.species.pointsMultiplier)
      : 1;
    const points = basePoints * speciesMultiplier;

    // Update catch
    const updatedCatch = await prisma.catch.update({
      where: { id: catchId },
      data: {
        status: CatchStatus.APPROVED,
        points,
        reviewerId,
        reviewNotes,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
        species: true,
      },
    });

    // Update leaderboard
    await LeaderboardService.updateEntry(
      catchRecord.tournament.id,
      catchRecord.userId
    );

    return updatedCatch;
  }

  /**
   * Reject a catch (judges only)
   */
  static async reject(
    catchId: string,
    reviewerId: string,
    reviewNotes: string
  ) {
    const catchRecord = await prisma.catch.findUnique({
      where: { id: catchId },
    });

    if (!catchRecord) {
      throw new Error("Catch not found");
    }

    if (catchRecord.status !== CatchStatus.PENDING) {
      throw new Error("Catch has already been reviewed");
    }

    if (!reviewNotes) {
      throw new Error("Rejection reason is required");
    }

    const updatedCatch = await prisma.catch.update({
      where: { id: catchId },
      data: {
        status: CatchStatus.REJECTED,
        reviewerId,
        reviewNotes,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
        species: true,
      },
    });

    return updatedCatch;
  }

  /**
   * Get catches pending review for a tournament
   */
  static async getPendingForTournament(
    tournamentId: string,
    pagination: PaginationOptions
  ) {
    const [catches, total] = await Promise.all([
      prisma.catch.findMany({
        where: {
          tournamentId,
          status: CatchStatus.PENDING,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          species: {
            select: {
              id: true,
              commonNameIt: true,
              commonNameEn: true,
            },
          },
        },
        orderBy: { submittedAt: "asc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.catch.count({
        where: {
          tournamentId,
          status: CatchStatus.PENDING,
        },
      }),
    ]);

    return {
      catches,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  /**
   * Get user's catches for a tournament
   */
  static async getUserCatchesForTournament(
    userId: string,
    tournamentId: string
  ) {
    const catches = await prisma.catch.findMany({
      where: {
        userId,
        tournamentId,
      },
      include: {
        species: {
          select: {
            id: true,
            commonNameIt: true,
            commonNameEn: true,
          },
        },
      },
      orderBy: { caughtAt: "desc" },
    });

    // Calculate stats
    const approvedCatches = catches.filter(
      (c) => c.status === CatchStatus.APPROVED
    );
    const totalWeight = approvedCatches.reduce(
      (sum, c) => sum + Number(c.weight),
      0
    );
    const totalPoints = approvedCatches.reduce(
      (sum, c) => sum + Number(c.points || 0),
      0
    );
    const biggestCatch =
      approvedCatches.length > 0
        ? Math.max(...approvedCatches.map((c) => Number(c.weight)))
        : 0;

    return {
      catches,
      stats: {
        totalCatches: catches.length,
        approvedCatches: approvedCatches.length,
        pendingCatches: catches.filter((c) => c.status === CatchStatus.PENDING)
          .length,
        rejectedCatches: catches.filter(
          (c) => c.status === CatchStatus.REJECTED
        ).length,
        totalWeight,
        totalPoints,
        biggestCatch,
      },
    };
  }
}

export default CatchService;
