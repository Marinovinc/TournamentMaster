import prisma from "../lib/prisma";
import { CatchStatus } from "../types";

export class LeaderboardService {
  /**
   * Update leaderboard entry for a user in a tournament
   */
  static async updateEntry(tournamentId: string, userId: string) {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get user's registration (for team name)
    const registration = await prisma.tournamentRegistration.findUnique({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
    });

    // Get all approved catches for this user in this tournament
    const catches = await prisma.catch.findMany({
      where: {
        userId,
        tournamentId,
        status: CatchStatus.APPROVED,
      },
    });

    // Calculate stats
    const totalPoints = catches.reduce(
      (sum, c) => sum + Number(c.points || 0),
      0
    );
    const totalWeight = catches.reduce((sum, c) => sum + Number(c.weight), 0);
    const catchCount = catches.length;
    const biggestCatch =
      catches.length > 0
        ? Math.max(...catches.map((c) => Number(c.weight)))
        : null;

    // Upsert leaderboard entry
    await prisma.leaderboardEntry.upsert({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId,
        },
      },
      create: {
        tournamentId,
        userId,
        participantName: `${user.firstName} ${user.lastName}`,
        teamName: registration?.teamName,
        rank: 0, // Will be updated by recalculateRanks
        totalPoints,
        totalWeight,
        catchCount,
        biggestCatch,
        lastUpdated: new Date(),
      },
      update: {
        totalPoints,
        totalWeight,
        catchCount,
        biggestCatch,
        lastUpdated: new Date(),
      },
    });

    // Recalculate ranks
    await this.recalculateRanks(tournamentId);
  }

  /**
   * Recalculate all ranks for a tournament
   */
  static async recalculateRanks(tournamentId: string) {
    // Get all entries sorted by points (descending), then by biggest catch
    const entries = await prisma.leaderboardEntry.findMany({
      where: { tournamentId },
      orderBy: [
        { totalPoints: "desc" },
        { biggestCatch: "desc" },
        { catchCount: "desc" },
      ],
    });

    // Update ranks
    for (let i = 0; i < entries.length; i++) {
      await prisma.leaderboardEntry.update({
        where: { id: entries[i].id },
        data: { rank: i + 1 },
      });
    }
  }

  /**
   * Get leaderboard for a tournament
   */
  static async getLeaderboard(
    tournamentId: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 50;

    const [entries, total] = await Promise.all([
      prisma.leaderboardEntry.findMany({
        where: { tournamentId },
        orderBy: { rank: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.leaderboardEntry.count({
        where: { tournamentId },
      }),
    ]);

    return {
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user's position in leaderboard
   */
  static async getUserPosition(tournamentId: string, userId: string) {
    const entry = await prisma.leaderboardEntry.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId,
        },
      },
    });

    if (!entry) {
      return null;
    }

    const totalParticipants = await prisma.leaderboardEntry.count({
      where: { tournamentId },
    });

    return {
      ...entry,
      totalParticipants,
    };
  }

  /**
   * Get top N participants
   */
  static async getTopN(tournamentId: string, n: number) {
    const entries = await prisma.leaderboardEntry.findMany({
      where: { tournamentId },
      orderBy: { rank: "asc" },
      take: n,
    });

    return entries;
  }

  /**
   * Initialize leaderboard for all registered participants
   */
  static async initializeForTournament(tournamentId: string) {
    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
        status: "CONFIRMED",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    for (const registration of registrations) {
      await prisma.leaderboardEntry.upsert({
        where: {
          tournamentId_userId: {
            tournamentId,
            userId: registration.userId,
          },
        },
        create: {
          tournamentId,
          userId: registration.userId,
          participantName: `${registration.user.firstName} ${registration.user.lastName}`,
          teamName: registration.teamName,
          rank: 0,
          totalPoints: 0,
          totalWeight: 0,
          catchCount: 0,
        },
        update: {},
      });
    }

    // Set initial ranks (all tied at 1)
    await this.recalculateRanks(tournamentId);
  }

  /**
   * Get tournament statistics
   */
  static async getTournamentStats(tournamentId: string) {
    const [
      totalParticipants,
      totalCatches,
      approvedCatches,
      leaderboardData,
    ] = await Promise.all([
      prisma.leaderboardEntry.count({ where: { tournamentId } }),
      prisma.catch.count({ where: { tournamentId } }),
      prisma.catch.count({
        where: { tournamentId, status: CatchStatus.APPROVED },
      }),
      prisma.leaderboardEntry.aggregate({
        where: { tournamentId },
        _sum: {
          totalWeight: true,
          totalPoints: true,
        },
        _max: {
          biggestCatch: true,
        },
      }),
    ]);

    // Get leader
    const leader = await prisma.leaderboardEntry.findFirst({
      where: { tournamentId, rank: 1 },
    });

    return {
      totalParticipants,
      totalCatches,
      approvedCatches,
      pendingCatches: totalCatches - approvedCatches,
      totalWeight: Number(leaderboardData._sum.totalWeight || 0),
      totalPoints: Number(leaderboardData._sum.totalPoints || 0),
      biggestCatch: Number(leaderboardData._max.biggestCatch || 0),
      leader: leader
        ? {
            name: leader.participantName,
            points: Number(leader.totalPoints),
            catches: leader.catchCount,
          }
        : null,
    };
  }
}

export default LeaderboardService;
