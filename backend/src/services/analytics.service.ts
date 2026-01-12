/**
 * =============================================================================
 * ANALYTICS SERVICE
 * =============================================================================
 * Servizio per analytics avanzate e report statistici
 *
 * Features:
 * - Trend temporali catture
 * - Distribuzione specie
 * - Confronto performance partecipanti
 * - Statistiche stagionali
 * - KPI dashboard
 * =============================================================================
 */

import prisma from "../lib/prisma";

// ============================================================================
// INTERFACES
// ============================================================================

interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

interface DistributionItem {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

interface ParticipantPerformance {
  userId: string;
  name: string;
  totalCatches: number;
  approvedCatches: number;
  totalWeight: number;
  averageWeight: number;
  biggestCatch: number;
  points: number;
  rank: number;
}

interface TournamentComparison {
  tournamentId: string;
  name: string;
  date: string;
  participants: number;
  totalCatches: number;
  totalWeight: number;
  avgCatchWeight: number;
}

interface SeasonStats {
  year: number;
  totalTournaments: number;
  totalParticipants: number;
  totalCatches: number;
  totalWeight: number;
  topParticipant: { name: string; points: number } | null;
  mostPopularDiscipline: string | null;
}

interface DashboardKPIs {
  // Current period
  activeTournaments: number;
  totalParticipantsThisMonth: number;
  totalCatchesThisMonth: number;
  totalWeightThisMonth: number;
  // Trends (vs previous period)
  participantsTrend: number;
  catchesTrend: number;
  weightTrend: number;
  // Records
  biggestCatchEver: { weight: number; species: string; participant: string; tournament: string } | null;
  mostActiveTournament: { name: string; catches: number } | null;
}

// ============================================================================
// SERVICE
// ============================================================================

export class AnalyticsService {
  /**
   * Get catches over time for a tournament (hourly/daily breakdown)
   */
  static async getCatchesTimeSeries(
    tournamentId: string,
    granularity: "hourly" | "daily" = "hourly"
  ): Promise<TimeSeriesPoint[]> {
    const catches = await prisma.catch.findMany({
      where: { tournamentId, status: "APPROVED" },
      select: { createdAt: true, weight: true },
      orderBy: { createdAt: "asc" },
    });

    if (catches.length === 0) return [];

    const grouped = new Map<string, { count: number; weight: number }>();

    catches.forEach((c) => {
      const date = new Date(c.createdAt);
      let key: string;

      if (granularity === "hourly") {
        key = `${date.toISOString().split("T")[0]} ${date.getHours().toString().padStart(2, "0")}:00`;
      } else {
        key = date.toISOString().split("T")[0];
      }

      const existing = grouped.get(key) || { count: 0, weight: 0 };
      existing.count++;
      existing.weight += Number(c.weight) || 0;
      grouped.set(key, existing);
    });

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      value: data.count,
      label: `${data.count} catture (${data.weight.toFixed(1)}kg)`,
    }));
  }

  /**
   * Get weight distribution (histogram buckets)
   */
  static async getWeightDistribution(tournamentId: string): Promise<DistributionItem[]> {
    const catches = await prisma.catch.findMany({
      where: { tournamentId, status: "APPROVED" },
      select: { weight: true },
    });

    if (catches.length === 0) return [];

    // Create weight buckets
    const buckets: Record<string, number> = {
      "0-5kg": 0,
      "5-10kg": 0,
      "10-20kg": 0,
      "20-50kg": 0,
      "50-100kg": 0,
      "100kg+": 0,
    };

    const colors: Record<string, string> = {
      "0-5kg": "#94a3b8",
      "5-10kg": "#60a5fa",
      "10-20kg": "#34d399",
      "20-50kg": "#fbbf24",
      "50-100kg": "#f97316",
      "100kg+": "#ef4444",
    };

    catches.forEach((c) => {
      const w = Number(c.weight) || 0;
      if (w < 5) buckets["0-5kg"]++;
      else if (w < 10) buckets["5-10kg"]++;
      else if (w < 20) buckets["10-20kg"]++;
      else if (w < 50) buckets["20-50kg"]++;
      else if (w < 100) buckets["50-100kg"]++;
      else buckets["100kg+"]++;
    });

    const total = catches.length;
    return Object.entries(buckets)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / total) * 100),
        color: colors[name],
      }));
  }

  /**
   * Get species distribution for a tournament
   */
  static async getSpeciesDistribution(tournamentId: string): Promise<DistributionItem[]> {
    const catches = await prisma.catch.findMany({
      where: { tournamentId, status: "APPROVED" },
      select: { species: true, weight: true },
    });

    if (catches.length === 0) return [];

    const speciesMap = new Map<string, { count: number; weight: number }>();

    catches.forEach((c) => {
      const species = c.species?.commonNameIt || "Non specificato";
      const existing = speciesMap.get(species) || { count: 0, weight: 0 };
      existing.count++;
      existing.weight += Number(c.weight) || 0;
      speciesMap.set(species, existing);
    });

    const total = catches.length;
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

    return Array.from(speciesMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data], index) => ({
        name,
        value: data.count,
        percentage: Math.round((data.count / total) * 100),
        color: colors[index % colors.length],
      }));
  }

  /**
   * Get participant performance rankings
   */
  static async getParticipantPerformance(tournamentId: string): Promise<ParticipantPerformance[]> {
    const catches = await prisma.catch.findMany({
      where: { tournamentId, status: "APPROVED" },
      select: {
        userId: true,
        weight: true,
        points: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { pointsPerKg: true },
    });

    const pointsPerKg = Number(tournament?.pointsPerKg) || 100;
    const participantMap = new Map<string, ParticipantPerformance>();

    catches.forEach((c) => {
      const key = c.userId;
      const weight = Number(c.weight) || 0;
      const points = Number(c.points) || weight * pointsPerKg;

      const existing = participantMap.get(key) || {
        userId: c.userId,
        name: `${c.user.firstName} ${c.user.lastName}`,
        totalCatches: 0,
        approvedCatches: 0,
        totalWeight: 0,
        averageWeight: 0,
        biggestCatch: 0,
        points: 0,
        rank: 0,
      };

      existing.totalCatches++;
      existing.approvedCatches++;
      existing.totalWeight += weight;
      existing.points += points;
      if (weight > existing.biggestCatch) {
        existing.biggestCatch = weight;
      }

      participantMap.set(key, existing);
    });

    // Calculate averages and sort by points
    const results = Array.from(participantMap.values())
      .map((p) => ({
        ...p,
        totalWeight: Math.round(p.totalWeight * 100) / 100,
        averageWeight: p.approvedCatches > 0
          ? Math.round((p.totalWeight / p.approvedCatches) * 100) / 100
          : 0,
        biggestCatch: Math.round(p.biggestCatch * 100) / 100,
        points: Math.round(p.points),
      }))
      .sort((a, b) => b.points - a.points);

    // Assign ranks
    results.forEach((p, index) => {
      p.rank = index + 1;
    });

    return results;
  }

  /**
   * Compare multiple tournaments
   */
  static async compareTournaments(
    tenantId: string,
    limit: number = 10
  ): Promise<TournamentComparison[]> {
    const tournaments = await prisma.tournament.findMany({
      where: { tenantId, status: { in: ["COMPLETED", "ONGOING"] } },
      orderBy: { startDate: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        startDate: true,
        _count: { select: { registrations: true, catches: true } },
      },
    });

    const results: TournamentComparison[] = [];

    for (const t of tournaments) {
      const catches = await prisma.catch.findMany({
        where: { tournamentId: t.id, status: "APPROVED" },
        select: { weight: true },
      });

      const totalWeight = catches.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
      const avgWeight = catches.length > 0 ? totalWeight / catches.length : 0;

      results.push({
        tournamentId: t.id,
        name: t.name,
        date: t.startDate.toISOString().split("T")[0],
        participants: t._count.registrations,
        totalCatches: catches.length,
        totalWeight: Math.round(totalWeight * 100) / 100,
        avgCatchWeight: Math.round(avgWeight * 100) / 100,
      });
    }

    return results;
  }

  /**
   * Get season statistics
   */
  static async getSeasonStats(tenantId: string, year?: number): Promise<SeasonStats> {
    const targetYear = year || new Date().getFullYear();
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    const tournaments = await prisma.tournament.findMany({
      where: {
        tenantId,
        startDate: { gte: startOfYear, lte: endOfYear },
      },
      select: {
        id: true,
        discipline: true,
        _count: { select: { registrations: true } },
      },
    });

    // Get all catches for the year
    const tournamentIds = tournaments.map((t) => t.id);
    const catches = await prisma.catch.findMany({
      where: {
        tournamentId: { in: tournamentIds },
        status: "APPROVED",
      },
      select: { weight: true, userId: true, points: true },
    });

    // Calculate participant points
    const participantPoints = new Map<string, number>();
    catches.forEach((c) => {
      const current = participantPoints.get(c.userId) || 0;
      participantPoints.set(c.userId, current + (Number(c.points) || 0));
    });

    // Find top participant
    let topParticipant: { name: string; points: number } | null = null;
    let maxPoints = 0;
    for (const [userId, points] of participantPoints) {
      if (points > maxPoints) {
        maxPoints = points;
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true },
        });
        if (user) {
          topParticipant = {
            name: `${user.firstName} ${user.lastName}`,
            points: Math.round(points),
          };
        }
      }
    }

    // Most popular discipline
    const disciplineCounts = new Map<string, number>();
    tournaments.forEach((t) => {
      const count = disciplineCounts.get(t.discipline) || 0;
      disciplineCounts.set(t.discipline, count + 1);
    });
    let mostPopularDiscipline: string | null = null;
    let maxDisciplineCount = 0;
    for (const [discipline, count] of disciplineCounts) {
      if (count > maxDisciplineCount) {
        maxDisciplineCount = count;
        mostPopularDiscipline = discipline;
      }
    }

    const totalParticipants = tournaments.reduce((sum, t) => sum + t._count.registrations, 0);
    const totalWeight = catches.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

    return {
      year: targetYear,
      totalTournaments: tournaments.length,
      totalParticipants,
      totalCatches: catches.length,
      totalWeight: Math.round(totalWeight * 100) / 100,
      topParticipant,
      mostPopularDiscipline,
    };
  }

  /**
   * Get dashboard KPIs
   */
  static async getDashboardKPIs(tenantId: string): Promise<DashboardKPIs> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Active tournaments
    const activeTournaments = await prisma.tournament.count({
      where: { tenantId, status: "ONGOING" },
    });

    // This month's data
    const thisMonthTournaments = await prisma.tournament.findMany({
      where: {
        tenantId,
        startDate: { gte: startOfMonth },
      },
      select: { id: true },
    });
    const thisMonthIds = thisMonthTournaments.map((t) => t.id);

    const thisMonthRegistrations = await prisma.tournamentRegistration.count({
      where: { tournamentId: { in: thisMonthIds } },
    });

    const thisMonthCatches = await prisma.catch.findMany({
      where: {
        tournamentId: { in: thisMonthIds },
        status: "APPROVED",
      },
      select: { weight: true },
    });

    // Last month's data for comparison
    const lastMonthTournaments = await prisma.tournament.findMany({
      where: {
        tenantId,
        startDate: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      select: { id: true },
    });
    const lastMonthIds = lastMonthTournaments.map((t) => t.id);

    const lastMonthRegistrations = await prisma.tournamentRegistration.count({
      where: { tournamentId: { in: lastMonthIds } },
    });

    const lastMonthCatches = await prisma.catch.findMany({
      where: {
        tournamentId: { in: lastMonthIds },
        status: "APPROVED",
      },
      select: { weight: true },
    });

    // Calculate trends
    const thisMonthWeight = thisMonthCatches.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
    const lastMonthWeight = lastMonthCatches.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

    const participantsTrend = lastMonthRegistrations > 0
      ? Math.round(((thisMonthRegistrations - lastMonthRegistrations) / lastMonthRegistrations) * 100)
      : 0;
    const catchesTrend = lastMonthCatches.length > 0
      ? Math.round(((thisMonthCatches.length - lastMonthCatches.length) / lastMonthCatches.length) * 100)
      : 0;
    const weightTrend = lastMonthWeight > 0
      ? Math.round(((thisMonthWeight - lastMonthWeight) / lastMonthWeight) * 100)
      : 0;

    // Biggest catch ever
    const biggestCatch = await prisma.catch.findFirst({
      where: {
        tournament: { tenantId },
        status: "APPROVED",
      },
      orderBy: { weight: "desc" },
      select: {
        weight: true,
        species: true,
        user: { select: { firstName: true, lastName: true } },
        tournament: { select: { name: true } },
      },
    });

    // Most active tournament
    const mostActive = await prisma.tournament.findFirst({
      where: { tenantId, status: "ONGOING" },
      orderBy: { catches: { _count: "desc" } },
      select: { name: true, _count: { select: { catches: true } } },
    });

    return {
      activeTournaments,
      totalParticipantsThisMonth: thisMonthRegistrations,
      totalCatchesThisMonth: thisMonthCatches.length,
      totalWeightThisMonth: Math.round(thisMonthWeight * 100) / 100,
      participantsTrend,
      catchesTrend,
      weightTrend,
      biggestCatchEver: biggestCatch
        ? {
            weight: Number(biggestCatch.weight),
            species: biggestCatch.species?.commonNameIt || "N/A",
            participant: `${biggestCatch.user.firstName} ${biggestCatch.user.lastName}`,
            tournament: biggestCatch.tournament.name,
          }
        : null,
      mostActiveTournament: mostActive
        ? { name: mostActive.name, catches: mostActive._count.catches }
        : null,
    };
  }

  /**
   * Get hourly activity heatmap data
   */
  static async getActivityHeatmap(tournamentId: string): Promise<{ hour: number; day: string; value: number }[]> {
    const catches = await prisma.catch.findMany({
      where: { tournamentId },
      select: { createdAt: true },
    });

    const heatmap: { hour: number; day: string; value: number }[] = [];
    const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

    // Initialize all slots
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmap.push({ hour, day: dayNames[day], value: 0 });
      }
    }

    // Count catches per slot
    catches.forEach((c) => {
      const date = new Date(c.createdAt);
      const day = date.getDay();
      const hour = date.getHours();
      const index = day * 24 + hour;
      if (heatmap[index]) {
        heatmap[index].value++;
      }
    });

    return heatmap;
  }
}
