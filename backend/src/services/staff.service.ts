/**
 * =============================================================================
 * STAFF SERVICE - Tournament Staff Management
 * =============================================================================
 * Service per la gestione dello staff del torneo (giudici, direttori, ispettori)
 *
 * Features:
 * - Assegnazione staff a tornei
 * - Gestione ruoli (DIRECTOR, JUDGE, INSPECTOR, SCORER)
 * - Verifica permessi
 * =============================================================================
 */

import prisma from "../lib/prisma";
import { TournamentStaffRole } from "@prisma/client";

interface CreateStaffData {
  tournamentId: string;
  userId: string;
  role: TournamentStaffRole;
  notes?: string;
}

interface StaffFilters {
  tournamentId?: string;
  userId?: string;
  role?: TournamentStaffRole;
}

export class StaffService {
  /**
   * Assign a staff member to a tournament
   */
  static async assign(data: CreateStaffData) {
    // Verify tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: data.tournamentId },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Verify user exists and has appropriate global role
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is already assigned with this role
    const existing = await prisma.tournamentStaff.findUnique({
      where: {
        tournamentId_userId_role: {
          tournamentId: data.tournamentId,
          userId: data.userId,
          role: data.role,
        },
      },
    });

    if (existing) {
      throw new Error("User is already assigned with this role");
    }

    // Create staff assignment
    const staff = await prisma.tournamentStaff.create({
      data: {
        tournamentId: data.tournamentId,
        userId: data.userId,
        role: data.role,
        notes: data.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return staff;
  }

  /**
   * Remove a staff member from a tournament
   */
  static async remove(staffId: string) {
    const staff = await prisma.tournamentStaff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      throw new Error("Staff assignment not found");
    }

    await prisma.tournamentStaff.delete({
      where: { id: staffId },
    });

    return { success: true };
  }

  /**
   * Get staff for a tournament
   */
  static async getByTournament(tournamentId: string) {
    const staff = await prisma.tournamentStaff.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    return staff;
  }

  /**
   * Get all tournaments where a user is staff
   */
  static async getTournamentsByUser(userId: string) {
    const assignments = await prisma.tournamentStaff.findMany({
      where: { userId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return assignments;
  }

  /**
   * Check if a user has a specific role in a tournament
   */
  static async hasRole(
    userId: string,
    tournamentId: string,
    role: TournamentStaffRole
  ): Promise<boolean> {
    const assignment = await prisma.tournamentStaff.findUnique({
      where: {
        tournamentId_userId_role: {
          tournamentId,
          userId,
          role,
        },
      },
    });

    return !!assignment;
  }

  /**
   * Check if a user is any type of staff for a tournament
   */
  static async isStaff(userId: string, tournamentId: string): Promise<boolean> {
    const count = await prisma.tournamentStaff.count({
      where: {
        tournamentId,
        userId,
      },
    });

    return count > 0;
  }

  /**
   * Get available users that can be assigned as staff
   * (Users with JUDGE, ORGANIZER, or TENANT_ADMIN roles)
   */
  static async getAvailableStaff(tournamentId: string, tenantId: string) {
    // Get already assigned staff for this tournament
    const assignedUserIds = await prisma.tournamentStaff.findMany({
      where: { tournamentId },
      select: { userId: true },
    });

    const excludeIds = assignedUserIds.map((s) => s.userId);

    // Get users with appropriate roles who belong to the tenant
    const availableUsers = await prisma.user.findMany({
      where: {
        tenantId,
        role: {
          in: ["SUPER_ADMIN", "TENANT_ADMIN", "ORGANIZER", "JUDGE"],
        },
        id: {
          notIn: excludeIds,
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return availableUsers;
  }

  /**
   * Update staff notes
   */
  static async updateNotes(staffId: string, notes: string) {
    const staff = await prisma.tournamentStaff.update({
      where: { id: staffId },
      data: { notes },
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

    return staff;
  }
}

export default StaffService;
