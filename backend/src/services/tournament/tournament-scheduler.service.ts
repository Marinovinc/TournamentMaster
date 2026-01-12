/**
 * =============================================================================
 * TOURNAMENT SCHEDULER SERVICE
 * =============================================================================
 * Servizio per transizioni automatiche di stato basate su date
 *
 * Controlla ogni 5 minuti:
 * 1. PUBLISHED + now >= registrationOpens -> REGISTRATION_OPEN
 * 2. REGISTRATION_OPEN + now >= registrationCloses -> REGISTRATION_CLOSED
 * 3. REGISTRATION_CLOSED + now >= startDate -> ONGOING
 * 4. ONGOING + now >= endDate -> COMPLETED (solo se tutte catture validate)
 *
 * IMPORTANTE: Solo tornei con autoTransition = true (default)
 * =============================================================================
 */

import prisma from "../../lib/prisma";
import { TournamentStatus, CatchStatus } from "../../types";

// Intervallo di controllo in millisecondi (5 minuti)
const CHECK_INTERVAL = 5 * 60 * 1000;

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Servizio scheduler per transizioni automatiche
 */
export class TournamentSchedulerService {
  /**
   * Avvia lo scheduler
   */
  static start(): void {
    if (schedulerInterval) {
      console.log("[Scheduler] Already running, skipping start");
      return;
    }

    console.log("[Scheduler] Starting tournament auto-transition scheduler");
    console.log(`[Scheduler] Check interval: ${CHECK_INTERVAL / 1000}s`);

    // Esegui immediatamente al primo avvio
    this.checkAndTransition();

    // Poi esegui ogni CHECK_INTERVAL
    schedulerInterval = setInterval(() => {
      this.checkAndTransition();
    }, CHECK_INTERVAL);
  }

  /**
   * Ferma lo scheduler
   */
  static stop(): void {
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
      schedulerInterval = null;
      console.log("[Scheduler] Stopped");
    }
  }

  /**
   * Controlla tutti i tornei e applica transizioni necessarie
   */
  static async checkAndTransition(): Promise<void> {
    const now = new Date();
    console.log(`[Scheduler] Checking transitions at ${now.toISOString()}`);

    try {
      // 1. PUBLISHED -> REGISTRATION_OPEN
      await this.transitionPublishedToRegistrationOpen(now);

      // 2. REGISTRATION_OPEN -> REGISTRATION_CLOSED
      await this.transitionRegistrationOpenToClosed(now);

      // 3. REGISTRATION_CLOSED -> ONGOING
      await this.transitionRegistrationClosedToOngoing(now);

      // 4. ONGOING -> COMPLETED
      await this.transitionOngoingToCompleted(now);
    } catch (error) {
      console.error("[Scheduler] Error during transition check:", error);
    }
  }

  /**
   * PUBLISHED -> REGISTRATION_OPEN quando now >= registrationOpens
   */
  private static async transitionPublishedToRegistrationOpen(now: Date): Promise<void> {
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: TournamentStatus.PUBLISHED,
        registrationOpens: { lte: now },
      },
      select: { id: true, name: true },
    });

    for (const t of tournaments) {
      try {
        await prisma.tournament.update({
          where: { id: t.id },
          data: { status: TournamentStatus.REGISTRATION_OPEN },
        });
        console.log(`[Scheduler] ${t.name}: PUBLISHED -> REGISTRATION_OPEN`);
      } catch (err) {
        console.error(`[Scheduler] Failed to transition ${t.name}:`, err);
      }
    }
  }

  /**
   * REGISTRATION_OPEN -> REGISTRATION_CLOSED quando now >= registrationCloses
   */
  private static async transitionRegistrationOpenToClosed(now: Date): Promise<void> {
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: TournamentStatus.REGISTRATION_OPEN,
        registrationCloses: { lte: now },
      },
      select: { id: true, name: true },
    });

    for (const t of tournaments) {
      try {
        await prisma.tournament.update({
          where: { id: t.id },
          data: { status: TournamentStatus.REGISTRATION_CLOSED },
        });
        console.log(`[Scheduler] ${t.name}: REGISTRATION_OPEN -> REGISTRATION_CLOSED`);
      } catch (err) {
        console.error(`[Scheduler] Failed to transition ${t.name}:`, err);
      }
    }
  }

  /**
   * REGISTRATION_CLOSED -> ONGOING quando now >= startDate
   */
  private static async transitionRegistrationClosedToOngoing(now: Date): Promise<void> {
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: TournamentStatus.REGISTRATION_CLOSED,
        startDate: { lte: now },
      },
      select: { id: true, name: true },
    });

    for (const t of tournaments) {
      try {
        await prisma.tournament.update({
          where: { id: t.id },
          data: { status: TournamentStatus.ONGOING },
        });
        console.log(`[Scheduler] ${t.name}: REGISTRATION_CLOSED -> ONGOING`);
      } catch (err) {
        console.error(`[Scheduler] Failed to transition ${t.name}:`, err);
      }
    }
  }

  /**
   * ONGOING -> COMPLETED quando now >= endDate E tutte le catture sono validate
   */
  private static async transitionOngoingToCompleted(now: Date): Promise<void> {
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: TournamentStatus.ONGOING,
        endDate: { lte: now },
      },
      select: { id: true, name: true },
    });

    for (const t of tournaments) {
      try {
        // Verifica se ci sono catture pending
        const pendingCount = await prisma.catch.count({
          where: {
            tournamentId: t.id,
            status: CatchStatus.PENDING,
          },
        });

        if (pendingCount > 0) {
          console.log(`[Scheduler] ${t.name}: Cannot complete - ${pendingCount} pending catches`);
          continue;
        }

        await prisma.tournament.update({
          where: { id: t.id },
          data: { status: TournamentStatus.COMPLETED },
        });
        console.log(`[Scheduler] ${t.name}: ONGOING -> COMPLETED`);
      } catch (err) {
        console.error(`[Scheduler] Failed to transition ${t.name}:`, err);
      }
    }
  }

  /**
   * Forza un controllo immediato (utile per testing)
   */
  static async forceCheck(): Promise<void> {
    console.log("[Scheduler] Force check requested");
    await this.checkAndTransition();
  }
}
