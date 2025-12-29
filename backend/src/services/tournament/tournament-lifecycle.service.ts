/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/services/tournament.service.ts (righe 334-368, 549-615)
 * Data refactoring: 2025-12-29
 * Motivo: Separazione operazioni lifecycle per manutenibilita
 *
 * Contiene:
 * - publish() - Pubblicare torneo (DRAFT -> PUBLISHED)
 * - start() - Avviare torneo (PUBLISHED -> ONGOING)
 * - complete() - Completare torneo (ONGOING -> COMPLETED)
 *
 * State Machine:
 * DRAFT -> PUBLISHED -> ONGOING -> COMPLETED
 *                \-> CANCELLED
 * =============================================================================
 */

import prisma from "../../lib/prisma";
import { TournamentStatus } from "../../types";

/**
 * Operazioni di lifecycle per i tornei
 */
export class TournamentLifecycleService {
  /**
   * Publish tournament (change status from DRAFT to PUBLISHED)
   */
  static async publish(id: string, userId: string) {
    const existing = await prisma.tournament.findUnique({
      where: { id },
      include: {
        fishingZones: true,
      },
    });

    if (!existing) {
      throw new Error("Tournament not found");
    }

    if (existing.organizerId !== userId) {
      throw new Error("Only the organizer can publish this tournament");
    }

    if (existing.status !== TournamentStatus.DRAFT) {
      throw new Error("Only draft tournaments can be published");
    }

    // Validate tournament has at least one fishing zone
    if (existing.fishingZones.length === 0) {
      throw new Error("Tournament must have at least one fishing zone");
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.PUBLISHED },
    });

    return tournament;
  }

  /**
   * Start tournament (change status to ONGOING)
   */
  static async start(id: string, userId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (tournament.organizerId !== userId) {
      throw new Error("Only the organizer can start this tournament");
    }

    if (tournament.status !== TournamentStatus.PUBLISHED) {
      throw new Error("Only published tournaments can be started");
    }

    // Check minimum participants
    if (
      tournament.minParticipants &&
      tournament._count.registrations < tournament.minParticipants
    ) {
      throw new Error(
        `Minimum ${tournament.minParticipants} participants required`
      );
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.ONGOING },
    });

    return updated;
  }

  /**
   * Complete tournament
   */
  static async complete(id: string, userId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (tournament.organizerId !== userId) {
      throw new Error("Only the organizer can complete this tournament");
    }

    if (tournament.status !== TournamentStatus.ONGOING) {
      throw new Error("Only ongoing tournaments can be completed");
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.COMPLETED },
    });

    return updated;
  }

  /**
   * Cancel tournament (any state except COMPLETED -> CANCELLED)
   */
  static async cancel(id: string, userId: string, reason?: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (tournament.organizerId !== userId) {
      throw new Error("Only the organizer can cancel this tournament");
    }

    if (tournament.status === TournamentStatus.COMPLETED) {
      throw new Error("Cannot cancel a completed tournament");
    }

    if (tournament.status === TournamentStatus.CANCELLED) {
      throw new Error("Tournament is already cancelled");
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.CANCELLED },
    });

    return updated;
  }
}
