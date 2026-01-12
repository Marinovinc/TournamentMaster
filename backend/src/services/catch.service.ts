import prisma from "../lib/prisma";
import { CatchStatus, TournamentStatus, SizeCategory } from "../types";
import { GPSService } from "./gps.service";
import { LeaderboardService } from "./leaderboard.service";
import { emitCatchUpdate, emitLeaderboardUpdate, emitActivity } from "./websocket.service";

interface SubmitCatchData {
  tournamentId: string;
  userId: string;
  weight?: number;  // Opzionale per C&R mode
  length?: number;  // Alla forca per C&R mode
  latitude: number;
  longitude: number;
  gpsAccuracy?: number;
  speciesId?: string;
  photoPath: string;
  photoExifData?: string;
  videoPath?: string;
  caughtAt: Date;
  notes?: string;
  // Catch & Release specific
  sizeCategory?: SizeCategory;  // Fascia taglia per C&R mode
  wasReleased?: boolean;        // Pesce rilasciato
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

    // Check if tournament is Catch & Release mode
    const isCatchReleaseMode = tournament.gameMode === "CATCH_RELEASE";

    // Catch & Release mode validations
    if (isCatchReleaseMode) {
      // Video is mandatory for C&R mode
      if (!data.videoPath) {
        throw new Error("Video obbligatorio per tornei Catch & Release - deve mostrare il rilascio del pesce");
      }
      // Size category is mandatory for C&R mode
      if (!data.sizeCategory) {
        throw new Error("Fascia taglia (S/M/L/XL) obbligatoria per tornei Catch & Release");
      }
      // Species is mandatory for C&R scoring
      if (!data.speciesId) {
        throw new Error("Specie obbligatoria per tornei Catch & Release");
      }
    } else {
      // Traditional mode: weight is mandatory
      if (data.weight === undefined || data.weight === null) {
        throw new Error("Peso obbligatorio per tornei tradizionali");
      }
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

    // Check minimum weight (only for traditional mode)
    if (
      !isCatchReleaseMode &&
      tournament.minWeight &&
      data.weight !== undefined &&
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
        videoPath: data.videoPath,
        caughtAt: data.caughtAt,
        notes: data.notes,
        status: CatchStatus.PENDING,
        isInsideZone: gpsValidation.isInsideZone,
        validationData: JSON.stringify(gpsValidation),
        // Catch & Release specific fields
        sizeCategory: data.sizeCategory,
        wasReleased: data.wasReleased || false,
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

    // Emit WebSocket events
    const userName = `${catchRecord.user.firstName} ${catchRecord.user.lastName}`;
    emitCatchUpdate(data.tournamentId, {
      id: catchRecord.id,
      status: CatchStatus.PENDING,
      weight: Number(catchRecord.weight),
      userId: catchRecord.userId,
      userName,
    });

    emitActivity(data.tournamentId, {
      id: `catch-${catchRecord.id}`,
      type: "catch_submitted",
      description: `${userName} ha registrato una cattura di ${catchRecord.weight} kg`,
      userName,
      timestamp: new Date(),
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
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        media: {
          orderBy: { displayOrder: "asc" },
        },
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
              email: true,
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
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          media: {
            orderBy: { displayOrder: "asc" },
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
            gameMode: true,
          },
        },
        species: {
          select: {
            id: true,
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

    // Calculate points based on game mode
    let points: number;

    if (catchRecord.tournament.gameMode === "CATCH_RELEASE") {
      // Catch & Release mode: points based on species + size category
      points = await this.calculateCatchReleasePoints(
        catchRecord.tournament.id,
        catchRecord.species?.id || null,
        catchRecord.sizeCategory,
        catchRecord.wasReleased
      );
    } else {
      // Traditional mode: points based on weight
      const basePoints =
        Number(catchRecord.weight || 0) *
        Number(catchRecord.tournament.pointsPerKg);
      const speciesMultiplier = catchRecord.species?.pointsMultiplier
        ? Number(catchRecord.species.pointsMultiplier)
        : 1;
      points = basePoints * speciesMultiplier;
    }

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
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update leaderboard
    await LeaderboardService.updateEntry(
      catchRecord.tournament.id,
      catchRecord.userId
    );

    // Emit WebSocket events
    const approvedUserName = `${updatedCatch.user.firstName} ${updatedCatch.user.lastName}`;
    emitCatchUpdate(catchRecord.tournament.id, {
      id: updatedCatch.id,
      status: CatchStatus.APPROVED,
      weight: Number(updatedCatch.weight),
      userId: updatedCatch.userId,
      userName: approvedUserName,
    });

    emitActivity(catchRecord.tournament.id, {
      id: `approved-${updatedCatch.id}`,
      type: "catch_approved",
      description: `Cattura di ${approvedUserName} approvata: ${updatedCatch.weight} kg`,
      userName: approvedUserName,
      timestamp: new Date(),
    });

    // Fetch and emit updated leaderboard
    const leaderboard = await LeaderboardService.getLeaderboard(catchRecord.tournament.id, { limit: 50 });
    if (leaderboard && leaderboard.entries) {
      emitLeaderboardUpdate(catchRecord.tournament.id, leaderboard.entries.map((e: any, i: number) => ({
        rank: i + 1,
        teamId: e.odilTeamId || undefined,
        teamName: e.odilTeamName || undefined,
        userId: e.odilUserId || undefined,
        userName: e.odilUserName || undefined,
        totalWeight: Number(e.totalWeight),
        catchCount: e.catchCount,
      })));
    }

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
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Emit WebSocket events
    const rejectedUserName = `${updatedCatch.user.firstName} ${updatedCatch.user.lastName}`;
    emitCatchUpdate(updatedCatch.tournament.id, {
      id: updatedCatch.id,
      status: CatchStatus.REJECTED,
      weight: Number(updatedCatch.weight),
      userId: updatedCatch.userId,
      userName: rejectedUserName,
    });

    emitActivity(updatedCatch.tournament.id, {
      id: `rejected-${updatedCatch.id}`,
      type: "catch_rejected",
      description: `Cattura di ${rejectedUserName} rifiutata: ${reviewNotes}`,
      userName: rejectedUserName,
      timestamp: new Date(),
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
              email: true,
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
          media: {
            orderBy: { displayOrder: "asc" },
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

  /**
   * Calculate points for Catch & Release mode
   * Points are based on species + size category from SpeciesScoring table
   */
  private static async calculateCatchReleasePoints(
    tournamentId: string,
    speciesId: string | null,
    sizeCategory: string | null,
    wasReleased: boolean
  ): Promise<number> {
    // If no species, return 0 points
    if (!speciesId) {
      return 0;
    }

    // Look up scoring configuration for this tournament + species
    const scoring = await prisma.speciesScoring.findUnique({
      where: {
        tournamentId_speciesId: {
          tournamentId,
          speciesId,
        },
      },
    });

    // If no specific scoring configured, use default values
    let basePoints: number;
    let bonusMultiplier = 1.5; // Default C&R bonus

    if (scoring) {
      // Get points based on size category
      switch (sizeCategory) {
        case "SMALL":
          basePoints = scoring.pointsSmall;
          break;
        case "MEDIUM":
          basePoints = scoring.pointsMedium;
          break;
        case "LARGE":
          basePoints = scoring.pointsLarge;
          break;
        case "EXTRA_LARGE":
          basePoints = scoring.pointsExtraLarge;
          break;
        default:
          basePoints = scoring.pointsSmall; // Fallback to smallest
      }

      // Use configured bonus multiplier
      bonusMultiplier = Number(scoring.catchReleaseBonus) || 1.5;
    } else {
      // Default points if no scoring configured
      switch (sizeCategory) {
        case "SMALL":
          basePoints = 100;
          break;
        case "MEDIUM":
          basePoints = 200;
          break;
        case "LARGE":
          basePoints = 400;
          break;
        case "EXTRA_LARGE":
          basePoints = 800;
          break;
        default:
          basePoints = 100;
      }
    }

    // Apply catch & release bonus if fish was released
    const finalPoints = wasReleased
      ? Math.round(basePoints * bonusMultiplier)
      : basePoints;

    return finalPoints;
  }
}

export default CatchService;
