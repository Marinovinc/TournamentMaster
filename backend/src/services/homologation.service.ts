/**
 * =============================================================================
 * HOMOLOGATION SERVICE
 * =============================================================================
 * Gestione omologazione FIPSAS per tornei ufficiali
 * Include: tracking stato, checklist conformita, documenti, export federale
 * =============================================================================
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Enum di stato (deve corrispondere al Prisma schema)
export enum HomologationStatus {
  NOT_REQUIRED = "NOT_REQUIRED",
  PENDING = "PENDING",
  READY_TO_SUBMIT = "READY_TO_SUBMIT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  CORRECTIONS_REQUIRED = "CORRECTIONS_REQUIRED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// Checklist item per conformita FIPSAS
export interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  required: boolean;
  checked: boolean;
  notes?: string;
  checkedAt?: string;
  checkedBy?: string;
}

// Categorie checklist FIPSAS
export const FIPSAS_CHECKLIST_TEMPLATE: ChecklistItem[] = [
  // Documentazione
  {
    id: "doc_regolamento",
    category: "Documentazione",
    description: "Regolamento gara approvato",
    required: true,
    checked: false,
  },
  {
    id: "doc_iscrizioni",
    category: "Documentazione",
    description: "Lista iscrizioni con tessere FIPSAS verificate",
    required: true,
    checked: false,
  },
  {
    id: "doc_assicurazione",
    category: "Documentazione",
    description: "Polizza assicurativa RC evento",
    required: true,
    checked: false,
  },
  {
    id: "doc_autorizzazioni",
    category: "Documentazione",
    description: "Autorizzazioni enti locali (Capitaneria, Comune)",
    required: true,
    checked: false,
  },
  {
    id: "doc_piano_sicurezza",
    category: "Documentazione",
    description: "Piano sicurezza con mezzi di soccorso",
    required: true,
    checked: false,
  },

  // Organizzazione
  {
    id: "org_direttore_gara",
    category: "Organizzazione",
    description: "Direttore di gara designato e qualificato",
    required: true,
    checked: false,
  },
  {
    id: "org_giudici",
    category: "Organizzazione",
    description: "Giudici di gara qualificati (min. 2)",
    required: true,
    checked: false,
  },
  {
    id: "org_segreteria",
    category: "Organizzazione",
    description: "Segreteria gara operativa",
    required: true,
    checked: false,
  },
  {
    id: "org_comunicazioni",
    category: "Organizzazione",
    description: "Sistema comunicazioni radio attivo",
    required: true,
    checked: false,
  },

  // Logistica
  {
    id: "log_zona_gara",
    category: "Logistica",
    description: "Zone di pesca delimitate e segnalate",
    required: true,
    checked: false,
  },
  {
    id: "log_partenza",
    category: "Logistica",
    description: "Area partenza/arrivo definita",
    required: true,
    checked: false,
  },
  {
    id: "log_pesatura",
    category: "Logistica",
    description: "Stazione pesatura con bilance certificate",
    required: true,
    checked: false,
  },
  {
    id: "log_premiazione",
    category: "Logistica",
    description: "Area premiazione allestita",
    required: false,
    checked: false,
  },

  // Sicurezza
  {
    id: "sic_mezzi_soccorso",
    category: "Sicurezza",
    description: "Mezzi di soccorso marittimo presenti",
    required: true,
    checked: false,
  },
  {
    id: "sic_primo_soccorso",
    category: "Sicurezza",
    description: "Kit primo soccorso disponibile",
    required: true,
    checked: false,
  },
  {
    id: "sic_meteo",
    category: "Sicurezza",
    description: "Previsioni meteo verificate (condizioni idonee)",
    required: true,
    checked: false,
  },
  {
    id: "sic_briefing",
    category: "Sicurezza",
    description: "Briefing sicurezza programmato",
    required: true,
    checked: false,
  },

  // Attrezzature
  {
    id: "att_bilance",
    category: "Attrezzature",
    description: "Bilance certificate e tarate",
    required: true,
    checked: false,
  },
  {
    id: "att_misuratori",
    category: "Attrezzature",
    description: "Misuratori lunghezza disponibili",
    required: false,
    checked: false,
  },
  {
    id: "att_contenitori",
    category: "Attrezzature",
    description: "Contenitori per pesatura igienizzati",
    required: true,
    checked: false,
  },
];

// Status labels per UI
export const STATUS_LABELS: Record<HomologationStatus, string> = {
  [HomologationStatus.NOT_REQUIRED]: "Non Richiesta",
  [HomologationStatus.PENDING]: "In Preparazione",
  [HomologationStatus.READY_TO_SUBMIT]: "Pronto per Invio",
  [HomologationStatus.SUBMITTED]: "Inviato",
  [HomologationStatus.UNDER_REVIEW]: "In Revisione",
  [HomologationStatus.CORRECTIONS_REQUIRED]: "Correzioni Richieste",
  [HomologationStatus.APPROVED]: "Approvato",
  [HomologationStatus.REJECTED]: "Respinto",
};

export class HomologationService {
  /**
   * Ottieni o crea record omologazione per un torneo
   */
  static async getOrCreate(tournamentId: string) {
    let homologation = await prisma.tournamentHomologation.findUnique({
      where: { tournamentId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            discipline: true,
            level: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
      },
    });

    if (!homologation) {
      // Crea nuovo record con checklist template
      homologation = await prisma.tournamentHomologation.create({
        data: {
          tournamentId,
          status: "NOT_REQUIRED",
          complianceChecklist: JSON.stringify(FIPSAS_CHECKLIST_TEMPLATE),
        },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              discipline: true,
              level: true,
              startDate: true,
              endDate: true,
              location: true,
            },
          },
        },
      });
    }

    return {
      ...homologation,
      complianceChecklist: homologation.complianceChecklist
        ? JSON.parse(homologation.complianceChecklist)
        : FIPSAS_CHECKLIST_TEMPLATE,
      documents: homologation.documents
        ? JSON.parse(homologation.documents)
        : [],
    };
  }

  /**
   * Ottieni dettaglio omologazione
   */
  static async getById(tournamentId: string) {
    const homologation = await this.getOrCreate(tournamentId);
    return homologation;
  }

  /**
   * Avvia processo omologazione
   */
  static async startProcess(tournamentId: string, userId: string) {
    const homologation = await this.getOrCreate(tournamentId);

    if (homologation.status !== "NOT_REQUIRED") {
      throw new Error("Processo omologazione gia avviato");
    }

    return prisma.tournamentHomologation.update({
      where: { id: homologation.id },
      data: {
        status: "PENDING",
        complianceChecklist: JSON.stringify(FIPSAS_CHECKLIST_TEMPLATE),
      },
    });
  }

  /**
   * Aggiorna checklist conformita
   */
  static async updateChecklist(
    tournamentId: string,
    checklistItemId: string,
    checked: boolean,
    notes: string | undefined,
    userId: string
  ) {
    const homologation = await this.getOrCreate(tournamentId);
    const checklist: ChecklistItem[] = homologation.complianceChecklist;

    const itemIndex = checklist.findIndex((item) => item.id === checklistItemId);
    if (itemIndex === -1) {
      throw new Error("Checklist item non trovato");
    }

    checklist[itemIndex] = {
      ...checklist[itemIndex],
      checked,
      notes,
      checkedAt: checked ? new Date().toISOString() : undefined,
      checkedBy: checked ? userId : undefined,
    };

    // Verifica se tutti i required sono completati
    const allRequiredComplete = checklist
      .filter((item) => item.required)
      .every((item) => item.checked);

    const newStatus = allRequiredComplete ? "READY_TO_SUBMIT" : "PENDING";

    return prisma.tournamentHomologation.update({
      where: { id: homologation.id },
      data: {
        complianceChecklist: JSON.stringify(checklist),
        status: homologation.status === "PENDING" ? newStatus : homologation.status,
      },
    });
  }

  /**
   * Aggiorna intero stato checklist
   */
  static async updateFullChecklist(
    tournamentId: string,
    checklist: ChecklistItem[],
    userId: string
  ) {
    const homologation = await this.getOrCreate(tournamentId);

    const allRequiredComplete = checklist
      .filter((item) => item.required)
      .every((item) => item.checked);

    const newStatus = allRequiredComplete ? "READY_TO_SUBMIT" : "PENDING";

    return prisma.tournamentHomologation.update({
      where: { id: homologation.id },
      data: {
        complianceChecklist: JSON.stringify(checklist),
        status:
          homologation.status === "PENDING" || homologation.status === "READY_TO_SUBMIT"
            ? newStatus
            : homologation.status,
      },
    });
  }

  /**
   * Aggiungi documento
   */
  static async addDocument(
    tournamentId: string,
    document: { name: string; url: string; type: string }
  ) {
    const homologation = await this.getOrCreate(tournamentId);
    const documents = homologation.documents || [];

    documents.push({
      ...document,
      id: `doc_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    });

    return prisma.tournamentHomologation.update({
      where: { id: homologation.id },
      data: {
        documents: JSON.stringify(documents),
      },
    });
  }

  /**
   * Rimuovi documento
   */
  static async removeDocument(tournamentId: string, documentId: string) {
    const homologation = await this.getOrCreate(tournamentId);
    const documents = (homologation.documents || []).filter(
      (doc: { id: string }) => doc.id !== documentId
    );

    return prisma.tournamentHomologation.update({
      where: { id: homologation.id },
      data: {
        documents: JSON.stringify(documents),
      },
    });
  }

  /**
   * Invia per revisione
   */
  static async submit(tournamentId: string, userId: string) {
    const homologation = await this.getOrCreate(tournamentId);

    if (homologation.status !== "READY_TO_SUBMIT") {
      throw new Error("Omologazione non pronta per invio");
    }

    return prisma.tournamentHomologation.update({
      where: { id: homologation.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        submittedById: userId,
      },
    });
  }

  /**
   * Avvia revisione (admin federale)
   */
  static async startReview(tournamentId: string, reviewerId: string) {
    const homologation = await this.getOrCreate(tournamentId);

    if (homologation.status !== "SUBMITTED") {
      throw new Error("Omologazione non in stato inviato");
    }

    return prisma.tournamentHomologation.update({
      where: { id: homologation.id },
      data: {
        status: "UNDER_REVIEW",
        reviewedById: reviewerId,
      },
    });
  }

  /**
   * Richiedi correzioni
   */
  static async requestCorrections(
    tournamentId: string,
    correctionRequests: string,
    reviewerId: string
  ) {
    const homologation = await this.getOrCreate(tournamentId);

    return prisma.tournamentHomologation.update({
      where: { id: homologation.id },
      data: {
        status: "CORRECTIONS_NEEDED",
        correctionRequests,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Approva omologazione
   */
  static async approve(
    tournamentId: string,
    data: {
      fipsasEventCode?: string;
      homologationNumber?: string;
      reviewerNotes?: string;
    },
    reviewerId: string
  ) {
    const homologation = await this.getOrCreate(tournamentId);

    return prisma.tournamentHomologation.update({
      where: { id: homologation.id },
      data: {
        status: "HOMOLOGATED",
        fipsasEventCode: data.fipsasEventCode,
        homologationNumber: data.homologationNumber,
        reviewerNotes: data.reviewerNotes,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        homologatedAt: new Date(),
      },
    });
  }

  /**
   * Respingi omologazione
   */
  static async reject(
    tournamentId: string,
    reviewerNotes: string,
    reviewerId: string
  ) {
    const homologation = await this.getOrCreate(tournamentId);

    return prisma.tournamentHomologation.update({
      where: { id: homologation.id },
      data: {
        status: "REJECTED",
        reviewerNotes,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Calcola percentuale completamento checklist
   */
  static getChecklistProgress(checklist: ChecklistItem[]) {
    const required = checklist.filter((item) => item.required);
    const requiredComplete = required.filter((item) => item.checked);
    const optional = checklist.filter((item) => !item.required);
    const optionalComplete = optional.filter((item) => item.checked);

    return {
      requiredTotal: required.length,
      requiredComplete: requiredComplete.length,
      requiredPercent:
        required.length > 0
          ? Math.round((requiredComplete.length / required.length) * 100)
          : 100,
      optionalTotal: optional.length,
      optionalComplete: optionalComplete.length,
      totalPercent:
        checklist.length > 0
          ? Math.round(
              ((requiredComplete.length + optionalComplete.length) / checklist.length) *
                100
            )
          : 100,
      isReady: required.every((item) => item.checked),
    };
  }

  /**
   * Ottieni statistiche omologazioni per tenant
   */
  static async getStatsByTenant(tenantId: string) {
    const tournaments = await prisma.tournament.findMany({
      where: { tenantId },
      include: {
        homologation: true,
      },
    });

    const stats = {
      total: tournaments.length,
      notRequired: 0,
      pending: 0,
      readyToSubmit: 0,
      submitted: 0,
      underReview: 0,
      correctionsRequired: 0,
      approved: 0,
      rejected: 0,
    };

    tournaments.forEach((t) => {
      const status = t.homologation?.status || "NOT_REQUIRED";
      switch (status) {
        case "NOT_REQUIRED":
          stats.notRequired++;
          break;
        case "PENDING":
          stats.pending++;
          break;
        case "READY_TO_SUBMIT":
          stats.readyToSubmit++;
          break;
        case "SUBMITTED":
          stats.submitted++;
          break;
        case "UNDER_REVIEW":
          stats.underReview++;
          break;
        case "CORRECTIONS_NEEDED":
          stats.correctionsRequired++;
          break;
        case "HOMOLOGATED":
          stats.approved++;
          break;
        case "REJECTED":
          stats.rejected++;
          break;
      }
    });

    return stats;
  }

  /**
   * Genera report omologazione in formato FIPSAS
   */
  static async generateFipsasReport(tournamentId: string) {
    const homologation = await this.getOrCreate(tournamentId);
    const tournament = homologation.tournament;

    // Genera report strutturato per FIPSAS
    return {
      header: {
        tipo: "RICHIESTA_OMOLOGAZIONE",
        codiceEvento: homologation.fipsasEventCode,
        numeroOmologazione: homologation.homologationNumber,
        dataGenerazione: new Date().toISOString(),
      },
      evento: {
        nome: tournament.name,
        disciplina: tournament.discipline,
        livello: tournament.level,
        dataInizio: tournament.startDate,
        dataFine: tournament.endDate,
        localita: tournament.location,
      },
      stato: {
        corrente: homologation.status,
        dataInvio: homologation.submittedAt,
        dataRevisione: homologation.reviewedAt,
        dataOmologazione: homologation.homologatedAt,
      },
      checklist: {
        items: homologation.complianceChecklist,
        progress: this.getChecklistProgress(homologation.complianceChecklist),
      },
      documenti: homologation.documents,
      note: {
        revisore: homologation.reviewerNotes,
        correzioni: homologation.correctionRequests,
      },
    };
  }

  /**
   * Ottieni lista stati disponibili
   */
  static getStatusList() {
    return Object.entries(STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
    }));
  }

  /**
   * Ottieni template checklist
   */
  static getChecklistTemplate() {
    return FIPSAS_CHECKLIST_TEMPLATE;
  }
}

export default HomologationService;
