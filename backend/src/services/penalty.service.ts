/**
 * =============================================================================
 * PENALTY SERVICE
 * =============================================================================
 * Gestione penalità e squalifiche per tornei
 * Include appello, calcolo impatto su classifiche, storico decisioni
 * =============================================================================
 */

import { PrismaClient, PenaltyType, PenaltyStatus } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePenaltyInput {
  tournamentId: string;
  teamId?: string;
  userId?: string;
  type: PenaltyType;
  points: number;
  reason: string;
  evidence?: string;
  evidencePhotos?: string[];
  issuedById: string;
}

export interface UpdatePenaltyInput {
  type?: PenaltyType;
  points?: number;
  reason?: string;
  evidence?: string;
  evidencePhotos?: string[];
  status?: PenaltyStatus;
}

export interface AppealInput {
  appealReason: string;
}

export interface AppealDecisionInput {
  decision: "UPHELD" | "OVERTURNED";
  decisionReason: string;
  decidedById: string;
}

export interface PenaltyFilters {
  tournamentId: string;
  teamId?: string;
  userId?: string;
  type?: PenaltyType;
  status?: PenaltyStatus;
}

// ============================================================================
// PENALTY SERVICE
// ============================================================================

export class PenaltyService {
  /**
   * Crea una nuova penalità
   */
  static async create(input: CreatePenaltyInput) {
    // Verifica che il torneo esista
    const tournament = await prisma.tournament.findUnique({
      where: { id: input.tournamentId },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Se teamId specificato, verifica che esista
    if (input.teamId) {
      const team = await prisma.team.findUnique({
        where: { id: input.teamId },
      });
      if (!team) {
        throw new Error("Team not found");
      }
    }

    const penalty = await prisma.penalty.create({
      data: {
        tournamentId: input.tournamentId,
        teamId: input.teamId,
        userId: input.userId,
        type: input.type,
        points: input.points,
        reason: input.reason,
        evidence: input.evidence,
        evidencePhotos: input.evidencePhotos
          ? JSON.stringify(input.evidencePhotos)
          : null,
        issuedById: input.issuedById,
        status: PenaltyStatus.ACTIVE,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            boatName: true,
            boatNumber: true,
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

    // Se è una squalifica, potremmo dover aggiornare lo stato del team
    if (input.type === PenaltyType.DISQUALIFICATION) {
      // TODO: Implementare logica squalifica (rimozione da classifica, etc.)
      console.log(`Team ${input.teamId} disqualified from tournament ${input.tournamentId}`);
    }

    return penalty;
  }

  /**
   * Ottieni tutte le penalità di un torneo
   */
  static async getByTournament(
    tournamentId: string,
    filters?: Partial<PenaltyFilters>
  ) {
    const where: any = { tournamentId };

    if (filters?.teamId) where.teamId = filters.teamId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;

    const penalties = await prisma.penalty.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            boatName: true,
            boatNumber: true,
            clubName: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    return penalties;
  }

  /**
   * Ottieni dettaglio singola penalità
   */
  static async getById(penaltyId: string) {
    const penalty = await prisma.penalty.findUnique({
      where: { id: penaltyId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            boatName: true,
            boatNumber: true,
            clubName: true,
            captain: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!penalty) {
      throw new Error("Penalty not found");
    }

    return penalty;
  }

  /**
   * Aggiorna una penalità
   */
  static async update(penaltyId: string, input: UpdatePenaltyInput) {
    const existing = await prisma.penalty.findUnique({
      where: { id: penaltyId },
    });

    if (!existing) {
      throw new Error("Penalty not found");
    }

    // Non si possono modificare penalità in appello o già decise
    if (existing.status === PenaltyStatus.APPEALED) {
      throw new Error("Cannot modify penalty while under appeal");
    }

    const penalty = await prisma.penalty.update({
      where: { id: penaltyId },
      data: {
        ...input,
        evidencePhotos: input.evidencePhotos
          ? JSON.stringify(input.evidencePhotos)
          : undefined,
      },
      include: {
        team: true,
      },
    });

    return penalty;
  }

  /**
   * Elimina una penalità (solo se ACTIVE)
   */
  static async delete(penaltyId: string) {
    const penalty = await prisma.penalty.findUnique({
      where: { id: penaltyId },
    });

    if (!penalty) {
      throw new Error("Penalty not found");
    }

    if (penalty.status !== PenaltyStatus.ACTIVE) {
      throw new Error("Can only delete active penalties");
    }

    await prisma.penalty.delete({
      where: { id: penaltyId },
    });

    return { success: true };
  }

  /**
   * Presenta appello contro una penalità
   */
  static async submitAppeal(penaltyId: string, input: AppealInput) {
    const penalty = await prisma.penalty.findUnique({
      where: { id: penaltyId },
    });

    if (!penalty) {
      throw new Error("Penalty not found");
    }

    if (penalty.status !== PenaltyStatus.ACTIVE) {
      throw new Error("Can only appeal active penalties");
    }

    const updated = await prisma.penalty.update({
      where: { id: penaltyId },
      data: {
        status: PenaltyStatus.APPEALED,
        appealedAt: new Date(),
        appealReason: input.appealReason,
      },
      include: {
        team: true,
      },
    });

    return updated;
  }

  /**
   * Decidi su un appello
   */
  static async decideAppeal(penaltyId: string, input: AppealDecisionInput) {
    const penalty = await prisma.penalty.findUnique({
      where: { id: penaltyId },
    });

    if (!penalty) {
      throw new Error("Penalty not found");
    }

    if (penalty.status !== PenaltyStatus.APPEALED) {
      throw new Error("Penalty is not under appeal");
    }

    const newStatus =
      input.decision === "UPHELD"
        ? PenaltyStatus.UPHELD
        : PenaltyStatus.OVERTURNED;

    const updated = await prisma.penalty.update({
      where: { id: penaltyId },
      data: {
        status: newStatus,
        appealDecision: input.decisionReason,
        appealDecidedBy: input.decidedById,
        appealDecidedAt: new Date(),
        // Se appello accolto, azzera i punti penalità
        points: input.decision === "OVERTURNED" ? 0 : penalty.points,
      },
      include: {
        team: true,
      },
    });

    return updated;
  }

  /**
   * Calcola totale punti penalità per un team in un torneo
   */
  static async getTeamPenaltyPoints(tournamentId: string, teamId: string) {
    const penalties = await prisma.penalty.findMany({
      where: {
        tournamentId,
        teamId,
        status: {
          in: [PenaltyStatus.ACTIVE, PenaltyStatus.UPHELD],
        },
      },
      select: {
        points: true,
        type: true,
      },
    });

    const totalPoints = penalties.reduce((sum, p) => sum + p.points, 0);
    const isDisqualified = penalties.some(
      (p) => p.type === PenaltyType.DISQUALIFICATION
    );

    return {
      totalPoints,
      penaltyCount: penalties.length,
      isDisqualified,
    };
  }

  /**
   * Ottieni riepilogo penalità per tutti i team di un torneo
   */
  static async getTournamentPenaltySummary(tournamentId: string) {
    const penalties = await prisma.penalty.findMany({
      where: {
        tournamentId,
        status: {
          in: [PenaltyStatus.ACTIVE, PenaltyStatus.UPHELD],
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            boatNumber: true,
          },
        },
      },
    });

    // Raggruppa per team
    const summary = new Map<
      string,
      {
        teamId: string;
        teamName: string;
        boatNumber: number | null;
        totalPoints: number;
        penaltyCount: number;
        isDisqualified: boolean;
        penalties: typeof penalties;
      }
    >();

    for (const penalty of penalties) {
      if (!penalty.teamId) continue;

      const existing = summary.get(penalty.teamId);
      if (existing) {
        existing.totalPoints += penalty.points;
        existing.penaltyCount += 1;
        existing.isDisqualified =
          existing.isDisqualified ||
          penalty.type === PenaltyType.DISQUALIFICATION;
        existing.penalties.push(penalty);
      } else {
        summary.set(penalty.teamId, {
          teamId: penalty.teamId,
          teamName: penalty.team?.name || "Unknown",
          boatNumber: penalty.team?.boatNumber || null,
          totalPoints: penalty.points,
          penaltyCount: 1,
          isDisqualified: penalty.type === PenaltyType.DISQUALIFICATION,
          penalties: [penalty],
        });
      }
    }

    return Array.from(summary.values()).sort(
      (a, b) => b.totalPoints - a.totalPoints
    );
  }

  /**
   * Ottieni statistiche penalità per un torneo
   */
  static async getTournamentPenaltyStats(tournamentId: string) {
    const penalties = await prisma.penalty.findMany({
      where: { tournamentId },
    });

    const stats = {
      total: penalties.length,
      active: penalties.filter((p) => p.status === PenaltyStatus.ACTIVE).length,
      appealed: penalties.filter((p) => p.status === PenaltyStatus.APPEALED)
        .length,
      upheld: penalties.filter((p) => p.status === PenaltyStatus.UPHELD).length,
      overturned: penalties.filter((p) => p.status === PenaltyStatus.OVERTURNED)
        .length,
      byType: {} as Record<string, number>,
      totalPointsDeducted: 0,
      disqualifications: 0,
    };

    for (const penalty of penalties) {
      // Conta per tipo
      stats.byType[penalty.type] = (stats.byType[penalty.type] || 0) + 1;

      // Somma punti (solo per penalità attive/confermate)
      if (
        penalty.status === PenaltyStatus.ACTIVE ||
        penalty.status === PenaltyStatus.UPHELD
      ) {
        stats.totalPointsDeducted += penalty.points;
      }

      // Conta squalifiche
      if (
        penalty.type === PenaltyType.DISQUALIFICATION &&
        (penalty.status === PenaltyStatus.ACTIVE ||
          penalty.status === PenaltyStatus.UPHELD)
      ) {
        stats.disqualifications += 1;
      }
    }

    return stats;
  }

  /**
   * Lista tipi di penalità con descrizioni
   */
  static getPenaltyTypes() {
    return [
      {
        type: PenaltyType.WARNING,
        label: "Ammonizione",
        description: "Avvertimento formale senza detrazione punti",
        defaultPoints: 0,
      },
      {
        type: PenaltyType.LATE_ARRIVAL,
        label: "Ritardo Partenza",
        description: "Ritardo all'orario di partenza della gara",
        defaultPoints: 10,
      },
      {
        type: PenaltyType.ZONE_VIOLATION,
        label: "Violazione Zona",
        description: "Pesca fuori dalla zona consentita",
        defaultPoints: 25,
      },
      {
        type: PenaltyType.EQUIPMENT_VIOLATION,
        label: "Attrezzatura Non Conforme",
        description: "Utilizzo di attrezzatura non regolamentare",
        defaultPoints: 15,
      },
      {
        type: PenaltyType.CATCH_VIOLATION,
        label: "Cattura Non Conforme",
        description: "Cattura sottomisura o specie non ammessa",
        defaultPoints: 20,
      },
      {
        type: PenaltyType.SAFETY_VIOLATION,
        label: "Violazione Sicurezza",
        description: "Mancato rispetto norme di sicurezza",
        defaultPoints: 30,
      },
      {
        type: PenaltyType.UNSPORTSMANLIKE,
        label: "Comportamento Antisportivo",
        description: "Condotta non conforme allo spirito sportivo",
        defaultPoints: 50,
      },
      {
        type: PenaltyType.RULE_VIOLATION,
        label: "Violazione Regolamento",
        description: "Altra violazione del regolamento di gara",
        defaultPoints: 20,
      },
      {
        type: PenaltyType.DISQUALIFICATION,
        label: "Squalifica",
        description: "Esclusione dalla gara per grave infrazione",
        defaultPoints: 0,
        isTerminal: true,
      },
    ];
  }
}

export { PenaltyType, PenaltyStatus };
