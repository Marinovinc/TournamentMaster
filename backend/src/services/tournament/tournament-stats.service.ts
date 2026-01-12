/**
 * =============================================================================
 * TOURNAMENT STATS SERVICE
 * =============================================================================
 * Servizio per statistiche e metriche real-time del torneo
 *
 * Contiene:
 * - getStats() - Statistiche complete del torneo
 * - getCatchStats() - Statistiche catture
 * - getRecentActivity() - Attivita recente
 *
 * Dipendenze:
 * - ../../lib/prisma (database)
 * =============================================================================
 */

import prisma from "../../lib/prisma";
import { CatchStatus } from "../../types";

interface TournamentStats {
  totalCatches: number;
  pendingCatches: number;
  approvedCatches: number;
  rejectedCatches: number;
  catchesPerHour: number;
  totalWeight: number;
  averageWeight: number;
  topCatcher: {
    userId: string;
    name: string;
    catches: number;
    weight: number;
  } | null;
  recentActivity: Activity[];
  participantsStats: {
    total: number;
    confirmed: number;
    pending: number;
  };
  inspectorsStats: {
    total: number;
    assigned: number;
    coverage: number;
  };
}

interface Activity {
  id: string;
  type: "catch_submitted" | "catch_approved" | "catch_rejected" | "registration";
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
}

/**
 * Servizio statistiche torneo
 */
export class TournamentStatsService {
  /**
   * Ottiene le statistiche complete di un torneo
   */
  static async getStats(tournamentId: string): Promise<TournamentStats> {
    // Fetch catches data
    const catches = await prisma.catch.findMany({
      where: { tournamentId },
      select: {
        id: true,
        status: true,
        weight: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Calculate catch stats
    const totalCatches = catches.length;
    const pendingCatches = catches.filter(c => c.status === CatchStatus.PENDING).length;
    const approvedCatches = catches.filter(c => c.status === CatchStatus.APPROVED).length;
    const rejectedCatches = catches.filter(c => c.status === CatchStatus.REJECTED).length;

    // Weight calculations (only approved catches)
    const approvedWeights = catches
      .filter(c => c.status === CatchStatus.APPROVED)
      .map(c => Number(c.weight) || 0);
    const totalWeight = approvedWeights.reduce((sum, w) => sum + w, 0);
    const averageWeight = approvedWeights.length > 0 ? totalWeight / approvedWeights.length : 0;

    // Catches per hour (last 24 hours)
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentCatches = catches.filter(c => new Date(c.createdAt) >= last24h);
    const hoursActive = Math.max(1, (now.getTime() - last24h.getTime()) / (60 * 60 * 1000));
    const catchesPerHour = Math.round((recentCatches.length / hoursActive) * 10) / 10;

    // Top catcher
    const catcherStats = new Map<string, { name: string; catches: number; weight: number }>();
    catches
      .filter(c => c.status === CatchStatus.APPROVED)
      .forEach(c => {
        const key = c.userId;
        const existing = catcherStats.get(key) || {
          name: `${c.user.firstName} ${c.user.lastName}`,
          catches: 0,
          weight: 0,
        };
        existing.catches++;
        existing.weight += Number(c.weight) || 0;
        catcherStats.set(key, existing);
      });

    let topCatcher: TournamentStats["topCatcher"] = null;
    let maxWeight = 0;
    catcherStats.forEach((stats, odilUserId) => {
      if (stats.weight > maxWeight) {
        maxWeight = stats.weight;
        topCatcher = {
          userId: odilUserId,
          name: stats.name,
          catches: stats.catches,
          weight: Math.round(stats.weight * 100) / 100,
        };
      }
    });

    // Participants stats
    const registrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId },
      select: { status: true },
    });
    const participantsStats = {
      total: registrations.length,
      confirmed: registrations.filter((r: { status: string }) => r.status === "CONFIRMED").length,
      pending: registrations.filter((r: { status: string }) => r.status === "PENDING").length,
    };

    // Inspectors stats
    const teams = await prisma.team.findMany({
      where: { tournamentId },
      select: { inspectorName: true },
    });
    const inspectorsStats = {
      total: teams.length,
      assigned: teams.filter(t => t.inspectorName).length,
      coverage: teams.length > 0
        ? Math.round((teams.filter(t => t.inspectorName).length / teams.length) * 100)
        : 0,
    };

    // Recent activity (last 10 events)
    const recentActivity = await this.getRecentActivity(tournamentId, 10);

    return {
      totalCatches,
      pendingCatches,
      approvedCatches,
      rejectedCatches,
      catchesPerHour,
      totalWeight: Math.round(totalWeight * 100) / 100,
      averageWeight: Math.round(averageWeight * 100) / 100,
      topCatcher,
      recentActivity,
      participantsStats,
      inspectorsStats,
    };
  }

  /**
   * Ottiene l'attivita recente del torneo
   */
  static async getRecentActivity(tournamentId: string, limit: number = 10): Promise<Activity[]> {
    const activities: Activity[] = [];

    // Recent catches
    const recentCatches = await prisma.catch.findMany({
      where: { tournamentId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        status: true,
        weight: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    recentCatches.forEach(c => {
      const userName = `${c.user.firstName} ${c.user.lastName}`;

      if (c.status === CatchStatus.PENDING) {
        activities.push({
          id: `catch-${c.id}`,
          type: "catch_submitted",
          description: `${userName} ha registrato una cattura di ${c.weight}kg`,
          timestamp: c.createdAt,
          userId: c.user.id,
          userName,
        });
      } else if (c.status === CatchStatus.APPROVED) {
        activities.push({
          id: `catch-${c.id}-approved`,
          type: "catch_approved",
          description: `Cattura di ${userName} (${c.weight}kg) approvata`,
          timestamp: c.updatedAt,
          userId: c.user.id,
          userName,
        });
      } else if (c.status === CatchStatus.REJECTED) {
        activities.push({
          id: `catch-${c.id}-rejected`,
          type: "catch_rejected",
          description: `Cattura di ${userName} rifiutata`,
          timestamp: c.updatedAt,
          userId: c.user.id,
          userName,
        });
      }
    });

    // Recent registrations
    const recentRegistrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        teamName: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    recentRegistrations.forEach((r: any) => {
      const userName = `${r.user.firstName} ${r.user.lastName}`;
      activities.push({
        id: `reg-${r.id}`,
        type: "registration",
        description: r.teamName
          ? `${r.teamName} si e iscritto al torneo`
          : `${userName} si e iscritto al torneo`,
        timestamp: r.createdAt,
        userId: r.user.id,
        userName,
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return activities.slice(0, limit);
  }
}
