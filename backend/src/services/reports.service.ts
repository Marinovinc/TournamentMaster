/**
 * =============================================================================
 * Reports Service - Aggregazioni e statistiche per report
 * =============================================================================
 * Gestisce:
 * - Report Associazione (tenant-scoped)
 * - Report Piattaforma (Super Admin - cross-tenant)
 */

import prisma from "../lib/prisma";
import { TournamentStatus, CatchStatus } from "../types";

// =============================================================================
// TYPES
// =============================================================================

export interface AssociationOverview {
  totalTournaments: number;
  activeTournaments: number;
  completedTournaments: number;
  draftTournaments: number;
  totalTeams: number;
  totalParticipants: number;
  totalCatches: number;
  approvedCatches: number;
  totalStrikes: number;
  avgTeamsPerTournament: number;
  avgCatchesPerTournament: number;
}

export interface TournamentFilters {
  status?: TournamentStatus;
  discipline?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface TournamentWithStats {
  id: string;
  name: string;
  status: string;
  discipline: string;
  startDate: Date;
  endDate: Date;
  location: string | null;
  _count: {
    teams: number;
    catches: number;
    strikes: number;
    registrations: number;
  };
}

export interface TournamentDetailedReport {
  tournament: any;
  stats: {
    totalTeams: number;
    totalCatches: number;
    approvedCatches: number;
    pendingCatches: number;
    rejectedCatches: number;
    totalStrikes: number;
    totalWeight: number;
    biggestCatch: number;
  };
  leaderboard: any[];
  teamRankings: any[];
  catchDistribution: {
    bySpecies: { species: string; count: number }[];
    byStatus: { status: string; count: number }[];
  };
}

export interface PlatformOverview {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalUsers: number;
  usersByRole: { role: string; count: number }[];
  totalTournaments: number;
  tournamentsByStatus: { status: string; count: number }[];
  totalTeams: number;
  totalCatches: number;
  totalStrikes: number;
}

export interface TenantStats {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  tournaments: number;
  activeTournaments: number;
  users: number;
  teams: number;
  catches: number;
  lastTournamentDate: Date | null;
}

// =============================================================================
// ASSOCIATION REPORTS (Tenant-scoped)
// =============================================================================

export class ReportsService {
  /**
   * Overview statistiche associazione
   */
  static async getAssociationOverview(tenantId: string): Promise<AssociationOverview> {
    const [
      tournamentStats,
      teamCount,
      participantCount,
      catchStats,
      strikeCount,
    ] = await Promise.all([
      // Tournament counts by status
      prisma.tournament.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { id: true },
      }),
      // Total teams
      prisma.team.count({
        where: { tournament: { tenantId } },
      }),
      // Total confirmed participants
      prisma.tournamentRegistration.count({
        where: {
          tournament: { tenantId },
          status: "CONFIRMED",
        },
      }),
      // Catch stats
      prisma.catch.groupBy({
        by: ["status"],
        where: { tournament: { tenantId } },
        _count: { id: true },
      }),
      // Total strikes
      prisma.strike.count({
        where: { tournament: { tenantId } },
      }),
    ]);

    // Calculate tournament counts
    const totalTournaments = tournamentStats.reduce((sum, t) => sum + t._count.id, 0);
    const activeTournaments = tournamentStats.find(t => t.status === "ONGOING")?._count.id || 0;
    const completedTournaments = tournamentStats.find(t => t.status === "COMPLETED")?._count.id || 0;
    const draftTournaments = tournamentStats.find(t => t.status === "DRAFT")?._count.id || 0;

    // Calculate catch counts
    const totalCatches = catchStats.reduce((sum, c) => sum + c._count.id, 0);
    const approvedCatches = catchStats.find(c => c.status === "APPROVED")?._count.id || 0;

    return {
      totalTournaments,
      activeTournaments,
      completedTournaments,
      draftTournaments,
      totalTeams: teamCount,
      totalParticipants: participantCount,
      totalCatches,
      approvedCatches,
      totalStrikes: strikeCount,
      avgTeamsPerTournament: totalTournaments > 0 ? Math.round(teamCount / totalTournaments * 10) / 10 : 0,
      avgCatchesPerTournament: totalTournaments > 0 ? Math.round(totalCatches / totalTournaments * 10) / 10 : 0,
    };
  }

  /**
   * Lista tornei con statistiche per associazione
   */
  static async getAssociationTournaments(
    tenantId: string,
    filters: TournamentFilters
  ): Promise<{ data: TournamentWithStats[]; pagination: any; summary: any }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.discipline) where.discipline = filters.discipline;
    if (filters.from) where.startDate = { gte: filters.from };
    if (filters.to) where.endDate = { ...where.endDate, lte: filters.to };

    const [tournaments, total, statusSummary, disciplineSummary] = await Promise.all([
      prisma.tournament.findMany({
        where,
        include: {
          _count: {
            select: {
              teams: true,
              catches: true,
              strikes: true,
              registrations: true,
            },
          },
        },
        orderBy: { startDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.tournament.count({ where }),
      prisma.tournament.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { id: true },
      }),
      prisma.tournament.groupBy({
        by: ["discipline"],
        where: { tenantId },
        _count: { id: true },
      }),
    ]);

    return {
      data: tournaments as TournamentWithStats[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        total,
        byStatus: Object.fromEntries(statusSummary.map(s => [s.status, s._count.id])),
        byDiscipline: Object.fromEntries(disciplineSummary.map(d => [d.discipline, d._count.id])),
      },
    };
  }

  /**
   * Report dettagliato singolo torneo
   */
  static async getTournamentDetailedReport(
    tournamentId: string,
    tenantId: string
  ): Promise<TournamentDetailedReport | null> {
    // Verify tournament belongs to tenant
    const tournament = await prisma.tournament.findFirst({
      where: { id: tournamentId, tenantId },
      include: {
        organizer: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!tournament) return null;

    const [
      teamCount,
      catchStats,
      strikeCount,
      catchAggregates,
      leaderboard,
      teamRankings,
      catchesBySpecies,
      catchesByStatus,
    ] = await Promise.all([
      // Teams
      prisma.team.count({ where: { tournamentId } }),
      // Catches by status
      prisma.catch.groupBy({
        by: ["status"],
        where: { tournamentId },
        _count: { id: true },
      }),
      // Strikes
      prisma.strike.count({ where: { tournamentId } }),
      // Catch aggregates
      prisma.catch.aggregate({
        where: { tournamentId, status: CatchStatus.APPROVED },
        _sum: { weight: true },
        _max: { weight: true },
      }),
      // Leaderboard top 10
      prisma.leaderboardEntry.findMany({
        where: { tournamentId },
        orderBy: { rank: "asc" },
        take: 10,
      }),
      // Team rankings by catches
      prisma.team.findMany({
        where: { tournamentId },
        include: {
          _count: {
            select: { strikes: true },
          },
          captain: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: {
          strikes: { _count: "desc" },
        },
        take: 10,
      }),
      // Catches by species
      prisma.catch.groupBy({
        by: ["speciesId"],
        where: { tournamentId, status: CatchStatus.APPROVED },
        _count: { id: true },
      }),
      // Catches by status
      prisma.catch.groupBy({
        by: ["status"],
        where: { tournamentId },
        _count: { id: true },
      }),
    ]);

    // Get species names
    const speciesIds = catchesBySpecies.map(c => c.speciesId).filter(Boolean) as string[];
    const species = speciesIds.length > 0
      ? await prisma.species.findMany({
          where: { id: { in: speciesIds } },
          select: { id: true, commonNameIt: true },
        })
      : [];
    const speciesMap = new Map(species.map(s => [s.id, s.commonNameIt]));

    const totalCatches = catchStats.reduce((sum, c) => sum + c._count.id, 0);

    return {
      tournament,
      stats: {
        totalTeams: teamCount,
        totalCatches,
        approvedCatches: catchStats.find(c => c.status === "APPROVED")?._count.id || 0,
        pendingCatches: catchStats.find(c => c.status === "PENDING")?._count.id || 0,
        rejectedCatches: catchStats.find(c => c.status === "REJECTED")?._count.id || 0,
        totalStrikes: strikeCount,
        totalWeight: Number(catchAggregates._sum.weight || 0),
        biggestCatch: Number(catchAggregates._max.weight || 0),
      },
      leaderboard,
      teamRankings: teamRankings.map(t => ({
        id: t.id,
        name: t.name,
        boatName: t.boatName,
        captain: t.captain ? `${t.captain.firstName} ${t.captain.lastName}` : null,
        strikes: t._count.strikes,
      })),
      catchDistribution: {
        bySpecies: catchesBySpecies.map(c => ({
          species: speciesMap.get(c.speciesId!) || "Sconosciuta",
          count: c._count.id,
        })),
        byStatus: catchesByStatus.map(c => ({
          status: c.status,
          count: c._count.id,
        })),
      },
    };
  }

  // =============================================================================
  // PLATFORM REPORTS (Super Admin - cross-tenant)
  // =============================================================================

  /**
   * Overview statistiche piattaforma
   */
  static async getPlatformOverview(): Promise<PlatformOverview> {
    const [
      tenantStats,
      usersByRole,
      tournamentsByStatus,
      teamCount,
      catchCount,
      strikeCount,
    ] = await Promise.all([
      // Tenant counts
      prisma.tenant.groupBy({
        by: ["isActive"],
        _count: { id: true },
      }),
      // Users by role
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      // Tournaments by status
      prisma.tournament.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      // Total teams
      prisma.team.count(),
      // Total catches
      prisma.catch.count(),
      // Total strikes
      prisma.strike.count(),
    ]);

    const activeTenants = tenantStats.find(t => t.isActive === true)?._count.id || 0;
    const inactiveTenants = tenantStats.find(t => t.isActive === false)?._count.id || 0;
    const totalUsers = usersByRole.reduce((sum, u) => sum + u._count.id, 0);
    const totalTournaments = tournamentsByStatus.reduce((sum, t) => sum + t._count.id, 0);

    return {
      totalTenants: activeTenants + inactiveTenants,
      activeTenants,
      inactiveTenants,
      totalUsers,
      usersByRole: usersByRole.map(u => ({ role: u.role, count: u._count.id })),
      totalTournaments,
      tournamentsByStatus: tournamentsByStatus.map(t => ({ status: t.status, count: t._count.id })),
      totalTeams: teamCount,
      totalCatches: catchCount,
      totalStrikes: strikeCount,
    };
  }

  /**
   * Statistiche per tenant (comparazione)
   */
  static async getTenantsComparison(
    sortBy: string = "tournaments",
    order: "asc" | "desc" = "desc"
  ): Promise<TenantStats[]> {
    // Get all tenants with counts
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            tournaments: true,
          },
        },
        tournaments: {
          select: {
            id: true,
            status: true,
            startDate: true,
            _count: {
              select: {
                teams: true,
                catches: true,
              },
            },
          },
          orderBy: { startDate: "desc" },
        },
      },
    });

    // Calculate stats for each tenant
    const tenantStats: TenantStats[] = tenants.map(tenant => {
      const activeTournaments = tenant.tournaments.filter(t => t.status === "ONGOING").length;
      const teams = tenant.tournaments.reduce((sum, t) => sum + t._count.teams, 0);
      const catches = tenant.tournaments.reduce((sum, t) => sum + t._count.catches, 0);
      const lastTournament = tenant.tournaments[0];

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt,
        tournaments: tenant._count.tournaments,
        activeTournaments,
        users: tenant._count.users,
        teams,
        catches,
        lastTournamentDate: lastTournament?.startDate || null,
      };
    });

    // Sort
    const sortKey = sortBy as keyof TenantStats;
    tenantStats.sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      if (order === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });

    return tenantStats;
  }

  // =============================================================================
  // EXPORT HELPERS
  // =============================================================================

  /**
   * Genera dati per export CSV
   */
  static async getExportData(
    type: "overview" | "tournament",
    tenantId: string,
    tournamentId?: string
  ): Promise<any[]> {
    if (type === "overview") {
      const { data } = await this.getAssociationTournaments(tenantId, { limit: 1000 });
      return data.map(t => ({
        Nome: t.name,
        Disciplina: t.discipline,
        Stato: t.status,
        "Data Inizio": t.startDate,
        "Data Fine": t.endDate,
        Location: t.location || "",
        Teams: t._count.teams,
        Catture: t._count.catches,
        Strike: t._count.strikes,
        Iscrizioni: t._count.registrations,
      }));
    }

    if (type === "tournament" && tournamentId) {
      const report = await this.getTournamentDetailedReport(tournamentId, tenantId);
      if (!report) return [];

      return report.leaderboard.map((entry, index) => ({
        Posizione: entry.rank || index + 1,
        Partecipante: entry.participantName,
        Squadra: entry.teamName || "",
        "Punti Totali": entry.totalPoints,
        "Peso Totale (kg)": entry.totalWeight,
        "N. Catture": entry.catchCount,
        "Cattura Maggiore (kg)": entry.biggestCatch || "",
      }));
    }

    return [];
  }
}

export default ReportsService;
