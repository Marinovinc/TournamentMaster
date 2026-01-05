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

    const canManage = await TournamentLifecycleService.canManageTournament(existing, userId);
    if (!canManage) {
      throw new Error("You don't have permission to publish this tournament");
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
   * Check if user can manage tournament (organizer or admin)
   */
  private static async canManageTournament(
    tournament: { organizerId: string; tenantId: string },
    userId: string
  ): Promise<boolean> {
    // Organizer can always manage
    if (tournament.organizerId === userId) {
      return true;
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, tenantId: true },
    });

    if (!user) return false;

    // SUPER_ADMIN can manage any tournament
    if (user.role === "SUPER_ADMIN") {
      return true;
    }

    // TENANT_ADMIN can manage tournaments in their tenant
    if (user.role === "TENANT_ADMIN" && user.tenantId === tournament.tenantId) {
      return true;
    }

    return false;
  }

  /**
   * Open registration (PUBLISHED -> REGISTRATION_OPEN)
   */
  static async openRegistration(id: string, userId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const canManage = await TournamentLifecycleService.canManageTournament(tournament, userId);
    if (!canManage) {
      throw new Error("You don't have permission to manage this tournament");
    }

    if (tournament.status !== TournamentStatus.PUBLISHED) {
      throw new Error("Only published tournaments can open registration");
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.REGISTRATION_OPEN },
    });

    return updated;
  }

  /**
   * Close registration (REGISTRATION_OPEN -> REGISTRATION_CLOSED)
   */
  static async closeRegistration(id: string, userId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const canManage = await TournamentLifecycleService.canManageTournament(tournament, userId);
    if (!canManage) {
      throw new Error("You don't have permission to manage this tournament");
    }

    if (tournament.status !== TournamentStatus.REGISTRATION_OPEN) {
      throw new Error("Only tournaments with open registration can be closed");
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.REGISTRATION_CLOSED },
    });

    return updated;
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

    const canManage = await TournamentLifecycleService.canManageTournament(tournament, userId);
    if (!canManage) {
      throw new Error("You don't have permission to start this tournament");
    }

    if (tournament.status !== TournamentStatus.REGISTRATION_CLOSED) {
      throw new Error("Only tournaments with closed registration can be started");
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

    const canManage = await TournamentLifecycleService.canManageTournament(tournament, userId);
    if (!canManage) {
      throw new Error("You don't have permission to complete this tournament");
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

    const canManage = await TournamentLifecycleService.canManageTournament(tournament, userId);
    if (!canManage) {
      throw new Error("You don't have permission to cancel this tournament");
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
