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
  parentStaffId?: string; // Per JUDGE_ASSISTANT, ID del giudice principale
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

    // Per JUDGE_ASSISTANT, verifica che parentStaffId sia un giudice valido
    if (data.role === 'JUDGE_ASSISTANT' && data.parentStaffId) {
      const parentStaff = await prisma.tournamentStaff.findFirst({
        where: {
          id: data.parentStaffId,
          tournamentId: data.tournamentId,
          role: 'JUDGE',
        },
      });
      if (!parentStaff) {
        throw new Error('Parent judge not found or is not a judge for this tournament');
      }
    }

    // Create staff assignment
    const staff = await prisma.tournamentStaff.create({
      data: {
        tournamentId: data.tournamentId,
        userId: data.userId,
        role: data.role,
        notes: data.notes,
        parentStaffId: data.parentStaffId,
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
        parentStaff: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        assistants: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
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
   * Restituisce tutti gli associati del tenant (associazione)
   */
  static async getAvailableStaff(tournamentId: string, tenantId: string) {
    // Get already assigned staff for this tournament
    const assignedUserIds = await prisma.tournamentStaff.findMany({
      where: { tournamentId },
      select: { userId: true },
    });

    const excludeIds = assignedUserIds.map((s) => s.userId);

    // Get all users who belong to the tenant (association members)
    const availableUsers = await prisma.user.findMany({
      where: {
        tenantId,
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

  /**
   * Get all judges in a tournament (for assigning assistants)
   */
  static async getJudges(tournamentId: string) {
    const judges = await prisma.tournamentStaff.findMany({
      where: {
        tournamentId,
        role: 'JUDGE',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        assistants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return judges;
  }

  /**
   * Get assistants of a specific judge
   */
  static async getAssistants(judgeStaffId: string) {
    const assistants = await prisma.tournamentStaff.findMany({
      where: {
        parentStaffId: judgeStaffId,
        role: 'JUDGE_ASSISTANT',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return assistants;
  }

  /**
   * Assign an assistant to a judge
   */
  static async assignAssistant(
    tournamentId: string,
    judgeStaffId: string,
    assistantUserId: string,
    notes?: string
  ) {
    // Verify the judge exists and is a JUDGE
    const judge = await prisma.tournamentStaff.findFirst({
      where: {
        id: judgeStaffId,
        tournamentId,
        role: 'JUDGE',
      },
    });

    if (!judge) {
      throw new Error('Judge not found in this tournament');
    }

    // Create assistant assignment
    const assistant = await prisma.tournamentStaff.create({
      data: {
        tournamentId,
        userId: assistantUserId,
        role: 'JUDGE_ASSISTANT',
        parentStaffId: judgeStaffId,
        notes,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        parentStaff: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return assistant;
  }

  /**
   * Remove an assistant from a judge
   */
  static async removeAssistant(assistantStaffId: string) {
    const assistant = await prisma.tournamentStaff.findFirst({
      where: {
        id: assistantStaffId,
        role: 'JUDGE_ASSISTANT',
      },
    });

    if (!assistant) {
      throw new Error('Assistant not found');
    }

    await prisma.tournamentStaff.delete({
      where: { id: assistantStaffId },
    });

    return { success: true };
  }

  /**
   * Reassign an assistant to a different judge
   */
  static async reassignAssistant(
    assistantStaffId: string,
    newJudgeStaffId: string
  ) {
    // Verify assistant exists
    const assistant = await prisma.tournamentStaff.findFirst({
      where: {
        id: assistantStaffId,
        role: 'JUDGE_ASSISTANT',
      },
    });

    if (!assistant) {
      throw new Error('Assistant not found');
    }

    // Verify new judge exists and is in the same tournament
    const newJudge = await prisma.tournamentStaff.findFirst({
      where: {
        id: newJudgeStaffId,
        tournamentId: assistant.tournamentId,
        role: 'JUDGE',
      },
    });

    if (!newJudge) {
      throw new Error('New judge not found in this tournament');
    }

    // Update assignment
    const updated = await prisma.tournamentStaff.update({
      where: { id: assistantStaffId },
      data: { parentStaffId: newJudgeStaffId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        parentStaff: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }
}

export default StaffService;
