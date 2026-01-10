/**
 * =============================================================================
 * ARCHIVE & HALL OF FAME SERVICE
 * =============================================================================
 * Gestione archivio storico, hall of fame e statistiche partecipanti
 * =============================================================================
 */

import { PrismaClient, TournamentDiscipline } from "@prisma/client";

const prisma = new PrismaClient();

// Types
interface HallOfFameEntry {
  tournamentId: string;
  tournamentName: string;
  tournamentDate: Date;
  discipline: string;
  category: string;
  position: number;
  userId: string;
  userName: string;
  userAvatar: string | null;
  teamName: string | null;
  value: number | null;
  valueLabel: string;
}

interface ParticipantHistory {
  tournamentId: string;
  tournamentName: string;
  date: Date;
  discipline: string;
  status: string;
  position: number | null;
  points: number;
  catches: number;
  totalWeight: number;
  biggestCatch: number | null;
  teamName: string | null;
}

interface ParticipantStats {
  totalTournaments: number;
  totalCatches: number;
  totalWeight: number;
  averagePosition: number | null;
  bestPosition: number | null;
  wins: number;
  podiums: number;
  biggestCatch: number | null;
  favoriteBoat: string | null;
  favoriteDiscipline: string | null;
}

export class ArchiveService {
  // ==============================================================================
  // HALL OF FAME
  // ==============================================================================

  /**
   * Ottiene la Hall of Fame per un tenant
   */
  static async getHallOfFame(
    tenantId: string,
    options?: {
      discipline?: string;
      year?: number;
      limit?: number;
    }
  ): Promise<HallOfFameEntry[]> {
    const { discipline, year, limit = 50 } = options || {};

    // Get completed tournaments
    const tournaments = await prisma.tournament.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
        ...(discipline && { discipline: discipline as TournamentDiscipline }),
        ...(year && {
          startDate: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          },
        }),
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        discipline: true,
      },
      orderBy: { startDate: "desc" },
    });

    const hallOfFame: HallOfFameEntry[] = [];

    for (const tournament of tournaments) {
      // Get leaderboard for this tournament (top 3)
      const leaderboard = await this.getTournamentLeaderboard(tournament.id, 3);

      for (const entry of leaderboard) {
        hallOfFame.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          tournamentDate: tournament.startDate,
          discipline: tournament.discipline,
          category: "GENERAL",
          position: entry.position,
          userId: entry.userId,
          userName: entry.userName,
          userAvatar: entry.userAvatar,
          teamName: entry.teamName,
          value: entry.totalPoints,
          valueLabel: `${entry.totalPoints} punti`,
        });
      }

      // Get biggest catch winner
      const biggestCatch = await prisma.catch.findFirst({
        where: {
          tournamentId: tournament.id,
          status: "APPROVED",
        },
        orderBy: { weight: "desc" },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      });

      if (biggestCatch && biggestCatch.weight) {
        // Get team name from registration
        const registration = await prisma.tournamentRegistration.findFirst({
          where: {
            userId: biggestCatch.user.id,
            tournamentId: tournament.id,
          },
          select: { teamName: true },
        });

        hallOfFame.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          tournamentDate: tournament.startDate,
          discipline: tournament.discipline,
          category: "BIGGEST_CATCH",
          position: 1,
          userId: biggestCatch.user.id,
          userName: `${biggestCatch.user.firstName} ${biggestCatch.user.lastName}`,
          userAvatar: biggestCatch.user.avatar,
          teamName: registration?.teamName || null,
          value: parseFloat(biggestCatch.weight.toString()),
          valueLabel: `${biggestCatch.weight} kg`,
        });
      }
    }

    return hallOfFame.slice(0, limit);
  }

  /**
   * Ottiene la leaderboard di un torneo
   */
  private static async getTournamentLeaderboard(
    tournamentId: string,
    limit: number = 10
  ) {
    const results = await prisma.$queryRaw<
      Array<{
        userId: string;
        firstName: string;
        lastName: string;
        avatar: string | null;
        teamName: string | null;
        totalPoints: number;
        totalCatches: number;
      }>
    >`
      SELECT
        u.id as userId,
        u.firstName,
        u.lastName,
        u.avatar,
        r.teamName,
        COALESCE(SUM(c.points), 0) as totalPoints,
        COUNT(c.id) as totalCatches
      FROM users u
      JOIN registrations r ON r.userId = u.id AND r.tournamentId = ${tournamentId}
      LEFT JOIN catches c ON c.userId = u.id AND c.tournamentId = ${tournamentId} AND c.status = 'APPROVED'
      GROUP BY u.id, u.firstName, u.lastName, u.avatar, r.teamName
      ORDER BY totalPoints DESC
      LIMIT ${limit}
    `;

    return results.map((r, index) => ({
      position: index + 1,
      userId: r.userId,
      userName: `${r.firstName} ${r.lastName}`,
      userAvatar: r.avatar,
      teamName: r.teamName,
      totalPoints: Number(r.totalPoints),
      totalCatches: Number(r.totalCatches),
    }));
  }

  // ==============================================================================
  // PARTICIPANT HISTORY
  // ==============================================================================

  /**
   * Ottiene lo storico tornei di un partecipante
   */
  static async getParticipantHistory(
    userId: string,
    tenantId?: string
  ): Promise<ParticipantHistory[]> {
    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        userId,
        status: "CONFIRMED",
        ...(tenantId && {
          tournament: { tenantId },
        }),
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true,
            discipline: true,
            status: true,
          },
        },
      },
      orderBy: {
        tournament: { startDate: "desc" },
      },
    });

    const history: ParticipantHistory[] = [];

    for (const reg of registrations) {
      // Get catches for this tournament
      const catches = await prisma.catch.findMany({
        where: {
          userId,
          tournamentId: reg.tournament.id,
          status: "APPROVED",
        },
        select: {
          weight: true,
          points: true,
        },
      });

      const totalWeight = catches.reduce(
        (sum, c) => sum + (c.weight ? parseFloat(c.weight.toString()) : 0),
        0
      );
      const totalPoints = catches.reduce(
        (sum, c) => sum + (c.points ? parseFloat(c.points.toString()) : 0),
        0
      );
      const biggestCatch =
        catches.length > 0
          ? Math.max(...catches.map((c) => (c.weight ? parseFloat(c.weight.toString()) : 0)))
          : null;

      // Get position (if tournament completed)
      let position: number | null = null;
      if (reg.tournament.status === "COMPLETED") {
        const leaderboard = await this.getTournamentLeaderboard(reg.tournament.id, 100);
        const entry = leaderboard.find((e) => e.userId === userId);
        position = entry?.position || null;
      }

      history.push({
        tournamentId: reg.tournament.id,
        tournamentName: reg.tournament.name,
        date: reg.tournament.startDate,
        discipline: reg.tournament.discipline,
        status: reg.tournament.status,
        position,
        points: totalPoints,
        catches: catches.length,
        totalWeight,
        biggestCatch,
        teamName: reg.teamName,
      });
    }

    return history;
  }

  /**
   * Ottiene le statistiche aggregate di un partecipante
   */
  static async getParticipantStats(
    userId: string,
    tenantId?: string
  ): Promise<ParticipantStats> {
    const history = await this.getParticipantHistory(userId, tenantId);

    const completedTournaments = history.filter((h) => h.status === "COMPLETED");
    const positions = completedTournaments
      .map((h) => h.position)
      .filter((p): p is number => p !== null);

    // Calculate favorite boat (most used)
    const boatCounts = history.reduce((acc, h) => {
      if (h.teamName) {
        acc[h.teamName] = (acc[h.teamName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const favoriteBoat =
      Object.entries(boatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Calculate favorite discipline
    const disciplineCounts = history.reduce((acc, h) => {
      acc[h.discipline] = (acc[h.discipline] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteDiscipline =
      Object.entries(disciplineCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      totalTournaments: history.length,
      totalCatches: history.reduce((sum, h) => sum + h.catches, 0),
      totalWeight: history.reduce((sum, h) => sum + h.totalWeight, 0),
      averagePosition:
        positions.length > 0
          ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
          : null,
      bestPosition: positions.length > 0 ? Math.min(...positions) : null,
      wins: positions.filter((p) => p === 1).length,
      podiums: positions.filter((p) => p <= 3).length,
      biggestCatch: history.reduce((max, h) => {
        if (h.biggestCatch && (!max || h.biggestCatch > max)) {
          return h.biggestCatch;
        }
        return max;
      }, null as number | null),
      favoriteBoat,
      favoriteDiscipline,
    };
  }

  // ==============================================================================
  // TOURNAMENT ARCHIVE
  // ==============================================================================

  /**
   * Ottiene l'archivio tornei completati
   */
  static async getTournamentArchive(
    tenantId: string,
    options?: {
      year?: number;
      discipline?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const { year, discipline, page = 1, limit = 20 } = options || {};

    const where = {
      tenantId,
      status: "COMPLETED" as const,
      ...(discipline && { discipline: discipline as TournamentDiscipline }),
      ...(year && {
        startDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      }),
    };

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          discipline: true,
          startDate: true,
          endDate: true,
          location: true,
          _count: {
            select: {
              registrations: true,
              catches: { where: { status: "APPROVED" } },
            },
          },
        },
        orderBy: { startDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tournament.count({ where }),
    ]);

    // Enhance with winner info
    const enhanced = await Promise.all(
      tournaments.map(async (t) => {
        const leaderboard = await this.getTournamentLeaderboard(t.id, 1);
        return {
          ...t,
          winner: leaderboard[0] || null,
        };
      })
    );

    return {
      tournaments: enhanced,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ottiene i record storici per disciplina
   */
  static async getRecords(
    tenantId: string,
    options?: { discipline?: string }
  ) {
    const { discipline } = options || {};

    // Biggest catch ever
    const biggestCatch = await prisma.catch.findFirst({
      where: {
        status: "APPROVED",
        tournament: {
          tenantId,
          ...(discipline && { discipline: discipline as TournamentDiscipline }),
        },
      },
      orderBy: { weight: "desc" },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        tournament: {
          select: { id: true, name: true, discipline: true, startDate: true },
        },
      },
    });

    // Most catches in a tournament - using aggregation approach
    const mostCatchesResult = await prisma.catch.groupBy({
      by: ["userId", "tournamentId"],
      where: {
        status: "APPROVED",
        tournament: {
          tenantId,
          ...(discipline && { discipline: discipline as TournamentDiscipline }),
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    });

    let mostCatchesData = null;
    if (mostCatchesResult.length > 0) {
      const top = mostCatchesResult[0];
      const [user, tournament] = await Promise.all([
        prisma.user.findUnique({
          where: { id: top.userId },
          select: { id: true, firstName: true, lastName: true, avatar: true },
        }),
        prisma.tournament.findUnique({
          where: { id: top.tournamentId },
          select: { id: true, name: true },
        }),
      ]);

      if (user && tournament) {
        mostCatchesData = {
          record: top._count.id,
          unit: "catture",
          user: {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            avatar: user.avatar,
          },
          tournament: {
            id: tournament.id,
            name: tournament.name,
          },
        };
      }
    }

    // Most points in a tournament
    const mostPointsResult = await prisma.catch.groupBy({
      by: ["userId", "tournamentId"],
      where: {
        status: "APPROVED",
        points: { not: null },
        tournament: {
          tenantId,
          ...(discipline && { discipline: discipline as TournamentDiscipline }),
        },
      },
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
      take: 1,
    });

    let mostPointsData = null;
    if (mostPointsResult.length > 0) {
      const top = mostPointsResult[0];
      const [user, tournament] = await Promise.all([
        prisma.user.findUnique({
          where: { id: top.userId },
          select: { id: true, firstName: true, lastName: true, avatar: true },
        }),
        prisma.tournament.findUnique({
          where: { id: top.tournamentId },
          select: { id: true, name: true },
        }),
      ]);

      if (user && tournament && top._sum.points) {
        mostPointsData = {
          record: Number(top._sum.points),
          unit: "punti",
          user: {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            avatar: user.avatar,
          },
          tournament: {
            id: tournament.id,
            name: tournament.name,
          },
        };
      }
    }

    // Most wins
    const participantsWithWins = await this.getTopWinners(tenantId, discipline, 1);

    return {
      biggestCatch: biggestCatch
        ? {
            record: parseFloat(biggestCatch.weight?.toString() || "0"),
            unit: "kg",
            user: {
              id: biggestCatch.user.id,
              name: `${biggestCatch.user.firstName} ${biggestCatch.user.lastName}`,
              avatar: biggestCatch.user.avatar,
            },
            tournament: {
              id: biggestCatch.tournament.id,
              name: biggestCatch.tournament.name,
              date: biggestCatch.tournament.startDate,
            },
          }
        : null,
      mostCatches: mostCatchesData,
      mostPoints: mostPointsData,
      mostWins: participantsWithWins[0] || null,
    };
  }

  /**
   * Ottiene i partecipanti con piu vittorie
   */
  static async getTopWinners(
    tenantId: string,
    discipline?: string,
    limit: number = 10
  ) {
    // This requires getting leaderboards from all completed tournaments
    const tournaments = await prisma.tournament.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
        ...(discipline && { discipline: discipline as TournamentDiscipline }),
      },
      select: { id: true },
    });

    const winCounts: Record<string, { userId: string; name: string; avatar: string | null; wins: number }> = {};

    for (const tournament of tournaments) {
      const leaderboard = await this.getTournamentLeaderboard(tournament.id, 1);
      if (leaderboard[0]) {
        const winner = leaderboard[0];
        if (!winCounts[winner.userId]) {
          winCounts[winner.userId] = {
            userId: winner.userId,
            name: winner.userName,
            avatar: winner.userAvatar,
            wins: 0,
          };
        }
        winCounts[winner.userId].wins++;
      }
    }

    return Object.values(winCounts)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, limit);
  }

  /**
   * Ottiene gli anni disponibili nell'archivio
   */
  static async getAvailableYears(tenantId: string): Promise<number[]> {
    const tournaments = await prisma.tournament.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
      },
      select: {
        startDate: true,
      },
      orderBy: { startDate: "desc" },
    });

    const years = [
      ...new Set(tournaments.map((t) => new Date(t.startDate).getFullYear())),
    ];

    return years.sort((a, b) => b - a);
  }
}
