/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/services/tournament.service.ts (righe 419-544)
 * Data refactoring: 2025-12-29
 * Motivo: Separazione operazioni registrazione per manutenibilita
 *
 * Contiene:
 * - registerParticipant() - Registrazione utente a torneo
 * - getParticipants() - Lista partecipanti torneo
 * - cancelRegistration() - Annullare registrazione (nuovo)
 * - confirmRegistration() - Confermare pagamento (nuovo)
 *
 * Dipendenze:
 * - TournamentStatus per controllo stato torneo
 * =============================================================================
 */

import prisma from "../../lib/prisma";
import { TournamentStatus } from "../../types";

/**
 * Data per registrazione partecipante
 */
export interface RegistrationData {
  teamName?: string;
  boatName?: string;
  boatLength?: number;
}

/**
 * Operazioni di registrazione per i tornei
 */
export class TournamentRegistrationService {
  /**
   * Register user for tournament
   */
  static async registerParticipant(
    tournamentId: string,
    userId: string,
    data: RegistrationData
  ) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check tournament status
    if (tournament.status !== TournamentStatus.PUBLISHED) {
      throw new Error("Tournament is not open for registration");
    }

    // Check registration dates
    const now = new Date();
    if (now < tournament.registrationOpens) {
      throw new Error("Registration has not opened yet");
    }
    if (now > tournament.registrationCloses) {
      throw new Error("Registration has closed");
    }

    // Check max participants
    if (
      tournament.maxParticipants &&
      tournament._count.registrations >= tournament.maxParticipants
    ) {
      throw new Error("Tournament is full");
    }

    // Check if already registered
    const existingRegistration = await prisma.tournamentRegistration.findUnique({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
    });

    if (existingRegistration) {
      throw new Error("Already registered for this tournament");
    }

    // Create registration
    const registration = await prisma.tournamentRegistration.create({
      data: {
        userId,
        tournamentId,
        teamName: data.teamName,
        boatName: data.boatName,
        boatLength: data.boatLength,
        // If no fee, auto-confirm
        status:
          Number(tournament.registrationFee) === 0
            ? "CONFIRMED"
            : "PENDING_PAYMENT",
        confirmedAt:
          Number(tournament.registrationFee) === 0 ? new Date() : undefined,
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
            startDate: true,
          },
        },
      },
    });

    return registration;
  }

  /**
   * Get tournament participants
   */
  static async getParticipants(tournamentId: string, status?: string) {
    const where: any = { tournamentId };

    if (status) {
      where.status = status;
    } else {
      where.status = "CONFIRMED";
    }

    const registrations = await prisma.tournamentRegistration.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { registeredAt: "asc" },
    });

    return registrations;
  }

  /**
   * Cancel registration
   */
  static async cancelRegistration(tournamentId: string, userId: string) {
    const registration = await prisma.tournamentRegistration.findUnique({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
      include: {
        tournament: true,
      },
    });

    if (!registration) {
      throw new Error("Registration not found");
    }

    // Can't cancel if tournament already started
    if (registration.tournament.status === TournamentStatus.ONGOING) {
      throw new Error("Cannot cancel registration after tournament has started");
    }

    if (registration.tournament.status === TournamentStatus.COMPLETED) {
      throw new Error("Cannot cancel registration for completed tournament");
    }

    await prisma.tournamentRegistration.delete({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
    });

    return { cancelled: true };
  }

  /**
   * Confirm registration (after payment)
   */
  static async confirmRegistration(
    tournamentId: string,
    userId: string,
    paymentId?: string
  ) {
    const registration = await prisma.tournamentRegistration.findUnique({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
    });

    if (!registration) {
      throw new Error("Registration not found");
    }

    if (registration.status === "CONFIRMED") {
      throw new Error("Registration is already confirmed");
    }

    const updated = await prisma.tournamentRegistration.update({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        paymentId,
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
            startDate: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Record manual payment (cash, bank transfer, etc.)
   * Used by organizers to confirm payments received outside the platform
   */
  static async recordPayment(
    tournamentId: string,
    registrationId: string,
    paymentData: {
      amount: number;
      method: "CASH" | "BANK_TRANSFER" | "OTHER";
      notes?: string;
      receivedBy: string; // userId of the organizer recording the payment
    }
  ) {
    const registration = await prisma.tournamentRegistration.findFirst({
      where: {
        id: registrationId,
        tournamentId,
      },
      include: {
        tournament: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!registration) {
      throw new Error("Registration not found");
    }

    if (registration.status === "CANCELLED" || registration.status === "REFUNDED") {
      throw new Error("Cannot record payment for cancelled or refunded registration");
    }

    // Update registration with payment info
    // Note: payment method and notes are stored in paymentId field as JSON for now
    const paymentInfo = JSON.stringify({
      method: paymentData.method,
      amount: paymentData.amount,
      notes: paymentData.notes,
      recordedAt: new Date().toISOString(),
      recordedBy: paymentData.receivedBy,
    });

    const updated = await prisma.tournamentRegistration.update({
      where: { id: registrationId },
      data: {
        status: "CONFIRMED",
        amountPaid: paymentData.amount,
        confirmedAt: new Date(),
        paymentId: paymentInfo, // Store payment details as JSON
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            registrationFee: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Get all registrations for a tournament (for organizer view)
   * Unlike getParticipants, this returns ALL statuses
   */
  static async getAllRegistrations(tournamentId: string) {
    const registrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { boatNumber: "asc" },
        { registeredAt: "asc" },
      ],
    });

    return registrations;
  }
}
