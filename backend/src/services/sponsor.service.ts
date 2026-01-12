/**
 * =============================================================================
 * SPONSOR & PRIZE SERVICE
 * =============================================================================
 * Gestione sponsor, premi e media associati
 * =============================================================================
 */

import { PrismaClient, SponsorTier, PrizeCategory } from "@prisma/client";

const prisma = new PrismaClient();

// ==============================================================================
// SPONSOR CRUD
// ==============================================================================

interface CreateSponsorInput {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  tier?: SponsorTier;
  tenantId?: string;
}

interface UpdateSponsorInput {
  name?: string;
  description?: string;
  logo?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  tier?: SponsorTier;
  isActive?: boolean;
  displayOrder?: number;
}

export class SponsorService {
  /**
   * Crea un nuovo sponsor
   */
  static async create(input: CreateSponsorInput) {
    return prisma.sponsor.create({
      data: input,
    });
  }

  /**
   * Ottiene sponsor per ID
   */
  static async getById(id: string) {
    return prisma.sponsor.findUnique({
      where: { id },
      include: {
        tournaments: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        prizes: {
          select: {
            id: true,
            name: true,
            category: true,
            value: true,
          },
        },
      },
    });
  }

  /**
   * Lista sponsor per tenant
   */
  static async getByTenant(tenantId: string, options?: { activeOnly?: boolean }) {
    return prisma.sponsor.findMany({
      where: {
        tenantId,
        ...(options?.activeOnly && { isActive: true }),
      },
      orderBy: [{ tier: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
    });
  }

  /**
   * Aggiorna sponsor
   */
  static async update(id: string, input: UpdateSponsorInput) {
    return prisma.sponsor.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Elimina sponsor
   */
  static async delete(id: string) {
    return prisma.sponsor.delete({
      where: { id },
    });
  }

  // ==============================================================================
  // TOURNAMENT-SPONSOR ASSOCIATION
  // ==============================================================================

  /**
   * Associa sponsor a torneo
   */
  static async addToTournament(
    tournamentId: string,
    sponsorId: string,
    options?: { tier?: SponsorTier; customMessage?: string; displayOrder?: number }
  ) {
    return prisma.tournamentSponsor.create({
      data: {
        tournamentId,
        sponsorId,
        tier: options?.tier,
        customMessage: options?.customMessage,
        displayOrder: options?.displayOrder ?? 0,
      },
      include: {
        sponsor: true,
      },
    });
  }

  /**
   * Rimuove sponsor da torneo
   */
  static async removeFromTournament(tournamentId: string, sponsorId: string) {
    return prisma.tournamentSponsor.delete({
      where: {
        tournamentId_sponsorId: {
          tournamentId,
          sponsorId,
        },
      },
    });
  }

  /**
   * Ottiene sponsor di un torneo
   */
  static async getTournamentSponsors(tournamentId: string) {
    const sponsors = await prisma.tournamentSponsor.findMany({
      where: { tournamentId },
      include: {
        sponsor: true,
      },
      orderBy: [{ displayOrder: "asc" }],
    });

    // Ordina per tier (PLATINUM > GOLD > SILVER > BRONZE > SUPPORTER)
    const tierOrder = { PLATINUM: 0, GOLD: 1, SILVER: 2, BRONZE: 3, SUPPORTER: 4 };
    return sponsors.sort((a, b) => {
      const tierA = a.tier || a.sponsor.tier;
      const tierB = b.tier || b.sponsor.tier;
      return tierOrder[tierA] - tierOrder[tierB];
    });
  }

  /**
   * Aggiorna associazione sponsor-torneo
   */
  static async updateTournamentSponsor(
    tournamentId: string,
    sponsorId: string,
    input: { tier?: SponsorTier; customMessage?: string; displayOrder?: number }
  ) {
    return prisma.tournamentSponsor.update({
      where: {
        tournamentId_sponsorId: {
          tournamentId,
          sponsorId,
        },
      },
      data: input,
    });
  }
}

// ==============================================================================
// PRIZE SERVICE
// ==============================================================================

interface CreatePrizeInput {
  name: string;
  description?: string;
  category?: PrizeCategory;
  position?: number;
  value?: number;
  valueDescription?: string;
  sponsorId?: string;
  tournamentId: string;
  displayOrder?: number;
}

interface UpdatePrizeInput {
  name?: string;
  description?: string;
  category?: PrizeCategory;
  position?: number;
  value?: number;
  valueDescription?: string;
  sponsorId?: string | null;
  displayOrder?: number;
}

export class PrizeService {
  /**
   * Crea un nuovo premio
   */
  static async create(input: CreatePrizeInput) {
    return prisma.prize.create({
      data: {
        name: input.name,
        description: input.description,
        category: input.category || "SPECIAL",
        position: input.position,
        value: input.value,
        valueDescription: input.valueDescription,
        sponsorId: input.sponsorId,
        tournamentId: input.tournamentId,
        displayOrder: input.displayOrder ?? 0,
      },
      include: {
        sponsor: {
          select: { id: true, name: true, logo: true },
        },
        media: true,
      },
    });
  }

  /**
   * Ottiene premio per ID
   */
  static async getById(id: string) {
    return prisma.prize.findUnique({
      where: { id },
      include: {
        sponsor: {
          select: { id: true, name: true, logo: true },
        },
        winner: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        media: {
          orderBy: { displayOrder: "asc" },
        },
        tournament: {
          select: { id: true, name: true, status: true },
        },
      },
    });
  }

  /**
   * Lista premi di un torneo
   */
  static async getByTournament(tournamentId: string) {
    return prisma.prize.findMany({
      where: { tournamentId },
      include: {
        sponsor: {
          select: { id: true, name: true, logo: true },
        },
        winner: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        media: {
          orderBy: { displayOrder: "asc" },
          take: 1, // Solo prima immagine per lista
        },
      },
      orderBy: [{ category: "asc" }, { position: "asc" }, { displayOrder: "asc" }],
    });
  }

  /**
   * Aggiorna premio
   */
  static async update(id: string, input: UpdatePrizeInput) {
    return prisma.prize.update({
      where: { id },
      data: input,
      include: {
        sponsor: {
          select: { id: true, name: true, logo: true },
        },
        media: true,
      },
    });
  }

  /**
   * Elimina premio
   */
  static async delete(id: string) {
    // Prima elimina i media associati (cascade dovrebbe farlo, ma per sicurezza)
    await prisma.prizeMedia.deleteMany({ where: { prizeId: id } });
    return prisma.prize.delete({ where: { id } });
  }

  /**
   * Assegna premio a vincitore
   */
  static async awardPrize(id: string, winnerId: string) {
    return prisma.prize.update({
      where: { id },
      data: {
        winnerId,
        isAwarded: true,
        awardedAt: new Date(),
      },
      include: {
        winner: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });
  }

  /**
   * Rimuove assegnazione premio
   */
  static async unassignPrize(id: string) {
    return prisma.prize.update({
      where: { id },
      data: {
        winnerId: null,
        isAwarded: false,
        awardedAt: null,
      },
    });
  }

  // ==============================================================================
  // PRIZE MEDIA
  // ==============================================================================

  /**
   * Aggiunge media a premio
   */
  static async addMedia(
    prizeId: string,
    media: {
      type: "image" | "video";
      url: string;
      thumbnailUrl?: string;
      filename?: string;
      mimeType?: string;
      size?: number;
      caption?: string;
    }
  ) {
    // Ottieni il prossimo displayOrder
    const lastMedia = await prisma.prizeMedia.findFirst({
      where: { prizeId },
      orderBy: { displayOrder: "desc" },
    });

    return prisma.prizeMedia.create({
      data: {
        prizeId,
        type: media.type,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        filename: media.filename,
        mimeType: media.mimeType,
        size: media.size,
        caption: media.caption,
        displayOrder: (lastMedia?.displayOrder ?? -1) + 1,
      },
    });
  }

  /**
   * Elimina media
   */
  static async deleteMedia(mediaId: string) {
    return prisma.prizeMedia.delete({ where: { id: mediaId } });
  }

  /**
   * Ottiene media di un premio
   */
  static async getMedia(prizeId: string) {
    return prisma.prizeMedia.findMany({
      where: { prizeId },
      orderBy: { displayOrder: "asc" },
    });
  }

  /**
   * Aggiorna ordine media
   */
  static async updateMediaOrder(prizeId: string, mediaIds: string[]) {
    const updates = mediaIds.map((id, index) =>
      prisma.prizeMedia.update({
        where: { id },
        data: { displayOrder: index },
      })
    );
    return prisma.$transaction(updates);
  }

  /**
   * Aggiorna caption media
   */
  static async updateMediaCaption(mediaId: string, caption: string) {
    return prisma.prizeMedia.update({
      where: { id: mediaId },
      data: { caption },
    });
  }
}
