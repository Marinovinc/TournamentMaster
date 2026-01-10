/**
 * =============================================================================
 * PDF Service - Generazione documenti PDF per tornei
 * =============================================================================
 * Gestisce:
 * - PDF Assegnazioni Giudici di Bordo
 * - PDF Classifica Torneo (FIPSAS compliant)
 * - PDF Certificati e Attestati
 */

import PDFDocument from "pdfkit";
import prisma from "../lib/prisma";
import { TournamentStaffRole } from "@prisma/client";

// =============================================================================
// TYPES
// =============================================================================

export interface JudgeAssignment {
  judgeName: string;
  judgePhone: string | null;
  judgeClub: string | null;      // Associazione di provenienza del giudice
  teamName: string;
  boatName: string;
  boatNumber: number | null;
  captainName: string;
  captainPhone: string | null;
  teamClub: string | null;       // Societa di provenienza della squadra
}

export interface TournamentPDFData {
  id: string;
  name: string;
  discipline: string;
  location: string;
  startDate: Date;
  endDate: Date;
  tenantName: string;
  tenantLogo: string | null;
}

// =============================================================================
// PDF SERVICE CLASS
// =============================================================================

export class PDFService {
  /**
   * Helper per scaricare immagine da URL e convertirla in Buffer
   */
  private static async fetchImageBuffer(url: string): Promise<Buffer | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }

  /**
   * Genera PDF Assegnazioni Giudici di Bordo
   */
  static async generateJudgeAssignmentsPDF(
    tournamentId: string,
    _tenantId?: string // tenantId opzionale - l'accesso è già controllato dalla route
  ): Promise<Buffer> {
    // Recupera dati torneo senza filtro tenant
    // L'accesso è già verificato dalla route (authenticate + authorize)
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tenant: {
          select: { name: true, logo: true, primaryColor: true },
        },
        organizer: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!tournament) {
      throw new Error("Torneo non trovato");
    }

    // Recupera team con ispettori assegnati
    const teams = await prisma.team.findMany({
      where: { tournamentId },
      include: {
        captain: {
          select: { firstName: true, lastName: true, phone: true },
        },
      },
      orderBy: { boatNumber: "asc" },
    });

    // Recupera staff giudici del torneo
    const judges = await prisma.tournamentStaff.findMany({
      where: {
        tournamentId,
        role: { in: [TournamentStaffRole.JUDGE, TournamentStaffRole.INSPECTOR] },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            tenant: { select: { name: true } },
          },
        },
      },
    });

    // Costruisci lista assegnazioni
    const assignments: JudgeAssignment[] = teams.map((team) => {
      // Cerca se c'e un giudice assegnato a questo team (via inspectorId)
      const assignedJudge = team.inspectorId
        ? judges.find((j) => j.userId === team.inspectorId)
        : null;

      return {
        judgeName: team.inspectorName ||
          (assignedJudge ? `${assignedJudge.user.firstName} ${assignedJudge.user.lastName}` : "Da assegnare"),
        judgePhone: assignedJudge?.user.phone || null,
        judgeClub: team.inspectorClub || assignedJudge?.user.tenant?.name || null,
        teamName: team.name,
        boatName: team.boatName,
        boatNumber: team.boatNumber,
        captainName: `${team.captain.firstName} ${team.captain.lastName}`,
        captainPhone: team.captain.phone,
        teamClub: team.clubName,
      };
    });

    // Scarica logo se disponibile
    let logoBuffer: Buffer | null = null;
    if (tournament.tenant.logo) {
      logoBuffer = await this.fetchImageBuffer(tournament.tenant.logo);
    }

    // Genera PDF
    return this.buildJudgeAssignmentsPDF(
      {
        id: tournament.id,
        name: tournament.name,
        discipline: tournament.discipline,
        location: tournament.location,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        tenantName: tournament.tenant.name,
        tenantLogo: tournament.tenant.logo,
      },
      assignments,
      `${tournament.organizer.firstName} ${tournament.organizer.lastName}`,
      tournament.tenant.primaryColor || "#0066CC",
      logoBuffer
    );
  }

  /**
   * Genera PDF Assegnazioni Giudici PUBBLICO (senza autenticazione)
   * Recupera il tenant direttamente dal torneo
   */
  static async generatePublicJudgeAssignmentsPDF(
    tournamentId: string
  ): Promise<Buffer> {
    // Recupera torneo senza filtro tenant
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tenant: {
          select: { id: true, name: true, logo: true, primaryColor: true },
        },
        organizer: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!tournament) {
      throw new Error("Torneo non trovato");
    }

    // Recupera team con ispettori assegnati
    const teams = await prisma.team.findMany({
      where: { tournamentId },
      include: {
        captain: {
          select: { firstName: true, lastName: true, phone: true },
        },
      },
      orderBy: { boatNumber: "asc" },
    });

    // Recupera staff giudici del torneo
    const judges = await prisma.tournamentStaff.findMany({
      where: {
        tournamentId,
        role: { in: [TournamentStaffRole.JUDGE, TournamentStaffRole.INSPECTOR] },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            tenant: { select: { name: true } },
          },
        },
      },
    });

    // Costruisci lista assegnazioni
    const assignments: JudgeAssignment[] = teams.map((team) => {
      const assignedJudge = team.inspectorId
        ? judges.find((j) => j.userId === team.inspectorId)
        : null;

      return {
        judgeName: team.inspectorName ||
          (assignedJudge ? `${assignedJudge.user.firstName} ${assignedJudge.user.lastName}` : "Da assegnare"),
        judgePhone: assignedJudge?.user.phone || null,
        judgeClub: team.inspectorClub || assignedJudge?.user.tenant?.name || null,
        teamName: team.name,
        boatName: team.boatName,
        boatNumber: team.boatNumber,
        captainName: `${team.captain.firstName} ${team.captain.lastName}`,
        captainPhone: team.captain.phone,
        teamClub: team.clubName,
      };
    });

    // Scarica logo se disponibile
    let logoBuffer: Buffer | null = null;
    if (tournament.tenant.logo) {
      logoBuffer = await this.fetchImageBuffer(tournament.tenant.logo);
    }

    // Genera PDF
    return this.buildJudgeAssignmentsPDF(
      {
        id: tournament.id,
        name: tournament.name,
        discipline: tournament.discipline,
        location: tournament.location,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        tenantName: tournament.tenant.name,
        tenantLogo: tournament.tenant.logo,
      },
      assignments,
      `${tournament.organizer.firstName} ${tournament.organizer.lastName}`,
      tournament.tenant.primaryColor || "#0066CC",
      logoBuffer
    );
  }

  /**
   * Costruisce il documento PDF
   */
  private static buildJudgeAssignmentsPDF(
    tournament: TournamentPDFData,
    assignments: JudgeAssignment[],
    organizerName: string,
    primaryColor: string,
    logoBuffer: Buffer | null = null
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      // Crea documento A4 landscape per tabella piu ampia
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 50, bottom: 50, left: 40, right: 40 },
        info: {
          Title: `Assegnazioni Giudici - ${tournament.name}`,
          Author: tournament.tenantName,
          Subject: "Assegnazioni Giudici di Bordo",
          Keywords: "torneo, pesca, giudici, assegnazioni",
        },
      });

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header con banner
      this.drawHeader(doc, tournament, primaryColor, logoBuffer);

      // Tabella assegnazioni
      this.drawAssignmentsTable(doc, assignments, primaryColor);

      // Footer
      this.drawFooter(doc, organizerName, tournament);

      doc.end();
    });
  }

  /**
   * Disegna header del documento con banner colorato e logo
   */
  private static drawHeader(
    doc: PDFKit.PDFDocument,
    tournament: TournamentPDFData,
    primaryColor: string,
    logoBuffer: Buffer | null = null
  ): void {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const bannerHeight = 60;
    const bannerY = doc.page.margins.top;
    const logoSize = 50;
    const logoPadding = 5;

    // === BANNER COLORATO ===
    doc.fillColor(primaryColor);
    doc.rect(
      doc.page.margins.left,
      bannerY,
      pageWidth,
      bannerHeight
    ).fill();

    // Logo a sinistra (se disponibile)
    let textStartX = doc.page.margins.left + 15;
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, doc.page.margins.left + logoPadding, bannerY + logoPadding, {
          width: logoSize,
          height: logoSize,
          fit: [logoSize, logoSize],
        });
        textStartX = doc.page.margins.left + logoSize + logoPadding * 3;
      } catch {
        // Se il logo non carica, continua senza
      }
    }

    // Nome associazione nel banner (bianco)
    doc
      .fontSize(18)
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .text(
        tournament.tenantName.toUpperCase(),
        textStartX,
        bannerY + 20,
        { width: pageWidth - (textStartX - doc.page.margins.left) - 15, align: "left" }
      );

    // Muovi cursore sotto il banner
    doc.y = bannerY + bannerHeight + 15;
    doc.x = doc.page.margins.left;

    // Titolo documento
    doc
      .fontSize(20)
      .fillColor("#000000")
      .font("Helvetica-Bold")
      .text("ASSEGNAZIONI GIUDICI DI BORDO", { align: "center" });

    doc.moveDown(0.5);

    // Nome torneo
    doc
      .fontSize(16)
      .fillColor(primaryColor)
      .font("Helvetica")
      .text(tournament.name, { align: "center" });

    doc.moveDown(0.3);

    // Info torneo
    const startDate = tournament.startDate.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const endDate = tournament.endDate.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    doc
      .fontSize(11)
      .fillColor("#666666")
      .text(`${tournament.discipline} - ${tournament.location}`, { align: "center" });

    doc
      .fontSize(10)
      .text(`${startDate} - ${endDate}`, { align: "center" });

    doc.moveDown(1);

    // Linea separatrice
    doc
      .strokeColor(primaryColor)
      .lineWidth(2)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();

    doc.moveDown(0.5);
  }

  /**
   * Disegna tabella assegnazioni
   */
  private static drawAssignmentsTable(
    doc: PDFKit.PDFDocument,
    assignments: JudgeAssignment[],
    primaryColor: string
  ): void {
    const startX = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Definizione colonne (in landscape A4 abbiamo ~760px disponibili)
    const columns = [
      { header: "N.", width: 30 },
      { header: "Barca", width: 50 },
      { header: "Nome Barca", width: 100 },
      { header: "Squadra", width: 110 },
      { header: "Capitano", width: 100 },
      { header: "Tel. Capitano", width: 85 },
      { header: "Giudice Assegnato", width: 110 },
      { header: "Societa Giudice", width: 90 },
      { header: "Tel. Giudice", width: 85 },
    ];

    const rowHeight = 22;
    const headerHeight = 28;
    let currentY = doc.y;

    // Header tabella
    doc.fillColor(primaryColor);
    doc.rect(startX, currentY, pageWidth, headerHeight).fill();

    doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold");

    let xPos = startX + 5;
    columns.forEach((col) => {
      doc.text(col.header, xPos, currentY + 8, {
        width: col.width - 10,
        align: "left",
        lineBreak: false,
      });
      xPos += col.width;
    });

    currentY += headerHeight;

    // Righe dati
    doc.font("Helvetica").fontSize(9);

    assignments.forEach((assignment, index) => {
      // Controlla se serve nuova pagina
      if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 60) {
        doc.addPage();
        currentY = doc.page.margins.top;

        // Ridisegna header tabella
        doc.fillColor(primaryColor);
        doc.rect(startX, currentY, pageWidth, headerHeight).fill();

        doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold");
        let xPos = startX + 5;
        columns.forEach((col) => {
          doc.text(col.header, xPos, currentY + 8, {
            width: col.width - 10,
            align: "left",
            lineBreak: false,
          });
          xPos += col.width;
        });
        currentY += headerHeight;
        doc.font("Helvetica").fontSize(9);
      }

      // Sfondo alternato
      if (index % 2 === 0) {
        doc.fillColor("#F8F9FA");
        doc.rect(startX, currentY, pageWidth, rowHeight).fill();
      }

      // Bordi riga
      doc.strokeColor("#DEE2E6").lineWidth(0.5);
      doc.rect(startX, currentY, pageWidth, rowHeight).stroke();

      // Dati riga
      doc.fillColor("#000000");
      xPos = startX + 5;

      const rowData = [
        (index + 1).toString(),
        assignment.boatNumber?.toString() || "-",
        assignment.boatName,
        assignment.teamName,
        assignment.captainName,
        assignment.captainPhone || "-",
        assignment.judgeName,
        assignment.judgeClub || "-",
        assignment.judgePhone || "-",
      ];

      rowData.forEach((data, colIndex) => {
        // Tronca testo se troppo lungo
        const maxWidth = columns[colIndex].width - 10;
        let displayText = data;
        while (doc.widthOfString(displayText) > maxWidth && displayText.length > 3) {
          displayText = displayText.slice(0, -4) + "...";
        }

        doc.text(displayText, xPos, currentY + 6, {
          width: maxWidth,
          align: "left",
          lineBreak: false,
        });
        xPos += columns[colIndex].width;
      });

      currentY += rowHeight;
    });

    // Sync doc.y per elementi successivi
    doc.y = currentY;

    // Statistiche riepilogative
    doc.moveDown(1);
    currentY = doc.y;

    const assignedCount = assignments.filter((a) => a.judgeName !== "Da assegnare").length;
    const pendingCount = assignments.length - assignedCount;

    doc
      .fontSize(10)
      .fillColor("#000000")
      .text(`Totale Barche: ${assignments.length}`, startX, currentY);

    doc.text(`Giudici Assegnati: ${assignedCount}`, startX + 150, currentY);

    if (pendingCount > 0) {
      doc
        .fillColor("#DC3545")
        .text(`Da Assegnare: ${pendingCount}`, startX + 320, currentY);
    }
  }

  /**
   * Disegna footer del documento
   */
  private static drawFooter(
    doc: PDFKit.PDFDocument,
    organizerName: string,
    tournament: TournamentPDFData
  ): void {
    const pageHeight = doc.page.height;
    const marginBottom = doc.page.margins.bottom;
    const footerY = pageHeight - marginBottom - 40;

    // Linea separatrice
    doc
      .strokeColor("#CCCCCC")
      .lineWidth(0.5)
      .moveTo(doc.page.margins.left, footerY)
      .lineTo(doc.page.width - doc.page.margins.right, footerY)
      .stroke();

    // Data stampa
    const printDate = new Date().toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    doc
      .fontSize(8)
      .fillColor("#666666")
      .text(`Stampato il: ${printDate}`, doc.page.margins.left, footerY + 10);

    // Firma organizzatore
    doc.text(
      `Direttore di Gara: ${organizerName}`,
      doc.page.margins.left,
      footerY + 22
    );

    // Spazio firma
    doc.text(
      "Firma: _______________________________",
      doc.page.width - doc.page.margins.right - 200,
      footerY + 22
    );

    // Logo/Nome associazione
    doc.text(
      tournament.tenantName,
      doc.page.width - doc.page.margins.right - 150,
      footerY + 10,
      { align: "right", width: 150 }
    );
  }

  /**
   * Genera PDF vuoto per test
   */
  static async generateTestPDF(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument();

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(20).text("PDF Test - TournamentMaster", 100, 100);
      doc.end();
    });
  }

  // =============================================================================
  // LEADERBOARD PDF - Classifica Torneo FIPSAS
  // =============================================================================

  /**
   * Genera PDF Classifica Torneo (FIPSAS compliant)
   */
  static async generateLeaderboardPDF(
    tournamentId: string,
    _tenantId?: string // tenantId opzionale - l'accesso è già controllato dalla route
  ): Promise<Buffer> {
    // Recupera dati torneo senza filtro tenant
    // L'accesso è già verificato dalla route (authenticate + authorize)
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tenant: {
          select: { name: true, logo: true, primaryColor: true },
        },
        organizer: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!tournament) {
      throw new Error("Torneo non trovato");
    }

    // Recupera team con statistiche basate su Strike
    const teams = await prisma.team.findMany({
      where: { tournamentId },
      include: {
        captain: {
          select: { firstName: true, lastName: true },
        },
        strikes: true,
      },
      orderBy: { boatNumber: "asc" },
    });

    // Recupera catture approvate del torneo per calcolare pesi
    const catches = await prisma.catch.findMany({
      where: { tournamentId, status: "APPROVED" },
      select: {
        id: true,
        weight: true,
        length: true,
        rodNumber: true,
        caughtAt: true,
        points: true,
        userId: true,
        species: { select: { commonNameIt: true, pointsMultiplier: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Mappa catture per userId (per associarle ai team tramite membri)
    const teamMembers = await prisma.teamMember.findMany({
      where: { team: { tournamentId } },
      select: { userId: true, teamId: true },
    });

    const userToTeamMap = new Map<string, string>();
    teamMembers.forEach((m) => {
      if (m.userId) userToTeamMap.set(m.userId, m.teamId);
    });

    // Aggiungi anche i capitani alla mappa
    teams.forEach((t) => userToTeamMap.set(t.captainId, t.id));

    // Fallback: cerca teamName dalle registrazioni per utenti non mappati via TeamMember
    const registrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId, status: "CONFIRMED" },
      select: { userId: true, teamName: true, boatName: true },
    });
    const userToRegTeamName = new Map<string, string>();
    registrations.forEach((r) => {
      if (r.teamName) userToRegTeamName.set(r.userId, r.teamName);
      else if (r.boatName) userToRegTeamName.set(r.userId, r.boatName);
    });

    // Raggruppa catture per team
    const catchesByTeam = new Map<string, typeof catches>();
    catches.forEach((c) => {
      const teamId = userToTeamMap.get(c.userId);
      if (teamId) {
        if (!catchesByTeam.has(teamId)) catchesByTeam.set(teamId, []);
        catchesByTeam.get(teamId)!.push(c);
      }
    });

    // Interfacce locali
    interface LeaderboardRow {
      rank: number;
      teamName: string;
      boatName: string;
      boatNumber: number | null;
      captainName: string;
      clubName: string | null;
      catchCount: number;
      releasedCount: number;
      lostCount: number;
      totalWeight: number;
      biggestCatch: number | null;
      totalPoints: number;
    }

    interface CatchDetail {
      rank: number;
      teamName: string;
      boatName: string;
      anglerName: string;
      rodNumber: number | null;
      speciesName: string;
      weight: number;
      length: number | null;
      caughtAt: Date;
      points: number;
    }

    // Calcola statistiche per team
    const leaderboard: LeaderboardRow[] = teams.map((team) => {
      const teamCatches = catchesByTeam.get(team.id) || [];
      const strikes = team.strikes || [];

      const catchCount = strikes.filter((s) => s.result === "CATCH").length;
      const releasedCount = strikes.filter((s) => s.result === "RELEASED").length;
      const lostCount = strikes.filter((s) => s.result === "LOST").length;
      const totalWeight = teamCatches.reduce((sum, c) => sum + Number(c.weight), 0);
      const biggestCatch = teamCatches.length > 0
        ? Math.max(...teamCatches.map((c) => Number(c.weight)))
        : null;

      // Calcolo punti FIPSAS: peso * moltiplicatore specie
      const totalPoints = teamCatches.reduce((sum, c) => {
        const multiplier = c.species?.pointsMultiplier ? Number(c.species.pointsMultiplier) : 1;
        return sum + (Number(c.weight) * multiplier * 100);
      }, 0);

      return {
        rank: 0,
        teamName: team.name,
        boatName: team.boatName,
        boatNumber: team.boatNumber,
        captainName: `${team.captain.firstName} ${team.captain.lastName}`,
        clubName: team.clubName,
        catchCount,
        releasedCount,
        lostCount,
        totalWeight,
        biggestCatch,
        totalPoints,
      };
    });

    // Ordina per punteggio (decrescente), poi per peso (decrescente)
    leaderboard.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.totalWeight - a.totalWeight;
    });

    // Assegna ranking
    leaderboard.forEach((row, index) => {
      row.rank = index + 1;
    });

    // Prepara dettaglio catture con nome team e barca
    const teamIdToName = new Map<string, string>();
    const teamIdToBoatName = new Map<string, string>();
    teams.forEach((t) => {
      teamIdToName.set(t.id, t.name);
      if (t.boatName) teamIdToBoatName.set(t.id, t.boatName);
    });

    const catchDetails: CatchDetail[] = catches
      .sort((a, b) => Number(b.weight) - Number(a.weight))
      .map((c, index) => {
        const teamId = userToTeamMap.get(c.userId);
        const userName = `${c.user.firstName} ${c.user.lastName}`;
        let teamName: string;
        let boatName = "-";
        if (teamId && teamIdToName.has(teamId)) {
          teamName = teamIdToName.get(teamId)!;
          boatName = teamIdToBoatName.get(teamId) || "-";
        } else if (userToRegTeamName.has(c.userId)) {
          teamName = userToRegTeamName.get(c.userId)!;
        } else {
          teamName = userName;
        }
        return {
          rank: index + 1,
          teamName,
          boatName,
          anglerName: userName,
          rodNumber: c.rodNumber,
          speciesName: c.species?.commonNameIt || "Sconosciuta",
          weight: Number(c.weight),
          length: c.length ? Number(c.length) : null,
          caughtAt: c.caughtAt,
          points: Number(c.weight) * (c.species?.pointsMultiplier ? Number(c.species.pointsMultiplier) : 1) * 100,
        };
      });

    // Scarica logo se disponibile
    let logoBuffer: Buffer | null = null;
    if (tournament.tenant.logo) {
      logoBuffer = await this.fetchImageBuffer(tournament.tenant.logo);
    }

    // Genera PDF
    return this.buildLeaderboardPDF(
      {
        id: tournament.id,
        name: tournament.name,
        discipline: tournament.discipline,
        location: tournament.location,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        tenantName: tournament.tenant.name,
        tenantLogo: tournament.tenant.logo,
      },
      leaderboard,
      catchDetails,
      `${tournament.organizer.firstName} ${tournament.organizer.lastName}`,
      tournament.tenant.primaryColor || "#0066CC",
      logoBuffer
    );
  }

  /**
   * Costruisce il documento PDF Classifica
   */
  private static buildLeaderboardPDF(
    tournament: TournamentPDFData,
    leaderboard: any[],
    catchDetails: any[],
    organizerName: string,
    primaryColor: string,
    logoBuffer: Buffer | null = null
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 40, bottom: 40, left: 30, right: 30 },
        info: {
          Title: `Classifica Ufficiale - ${tournament.name}`,
          Author: tournament.tenantName,
          Subject: "Classifica Torneo di Pesca FIPSAS",
        },
      });

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // === PAGINA 1: CLASSIFICA SQUADRE ===
      this.drawLeaderboardHeader(doc, tournament, primaryColor, "CLASSIFICA UFFICIALE", logoBuffer);
      this.drawLeaderboardTable(doc, leaderboard, catchDetails, primaryColor);
      this.drawLeaderboardFooter(doc, organizerName, tournament);

      // === PAGINA 2: DETTAGLIO CATTURE ===
      if (catchDetails.length > 0) {
        doc.addPage();
        this.drawLeaderboardHeader(doc, tournament, primaryColor, "DETTAGLIO CATTURE", logoBuffer);
        this.drawCatchesTable(doc, catchDetails, primaryColor);
        this.drawLeaderboardFooter(doc, organizerName, tournament);
      }

      doc.end();
    });
  }

  private static drawLeaderboardHeader(
    doc: PDFKit.PDFDocument,
    tournament: TournamentPDFData,
    primaryColor: string,
    title: string,
    logoBuffer: Buffer | null = null
  ): void {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const bannerHeight = 60;
    const bannerY = doc.page.margins.top;
    const logoSize = 50;
    const logoPadding = 5;

    // === BANNER COLORATO ===
    doc.fillColor(primaryColor);
    doc.rect(
      doc.page.margins.left,
      bannerY,
      pageWidth,
      bannerHeight
    ).fill();

    // Logo a sinistra (se disponibile)
    let textStartX = doc.page.margins.left + 15;
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, doc.page.margins.left + logoPadding, bannerY + logoPadding, {
          width: logoSize,
          height: logoSize,
          fit: [logoSize, logoSize],
        });
        textStartX = doc.page.margins.left + logoSize + logoPadding * 3;
      } catch {
        // Se il logo non carica, continua senza
      }
    }

    // Nome associazione nel banner (bianco)
    doc
      .fontSize(18)
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .text(
        tournament.tenantName.toUpperCase(),
        textStartX,
        bannerY + 20,
        { width: pageWidth - (textStartX - doc.page.margins.left) - 15, align: "left" }
      );

    // Muovi cursore sotto il banner
    doc.y = bannerY + bannerHeight + 15;
    doc.x = doc.page.margins.left;

    // Titolo documento
    doc.fontSize(22).fillColor("#000000").font("Helvetica-Bold").text(title, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(16).fillColor(primaryColor).font("Helvetica").text(tournament.name, { align: "center" });
    doc.moveDown(0.2);

    const startDate = tournament.startDate.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    const endDate = tournament.endDate.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

    doc.font("Helvetica").fontSize(10).fillColor("#666666")
      .text(`${tournament.discipline} - ${tournament.location} | ${startDate} - ${endDate}`, { align: "center" });
    doc.moveDown(0.5);

    doc.strokeColor(primaryColor).lineWidth(2)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();
    doc.moveDown(0.4);
  }

  private static drawLeaderboardTable(doc: PDFKit.PDFDocument, leaderboard: any[], catchDetails: any[], primaryColor: string): void {
    const startX = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const columns = [
      { header: "Pos", width: 35 }, { header: "Squadra", width: 120 }, { header: "Barca", width: 90 },
      { header: "N.", width: 30 }, { header: "Capitano", width: 95 }, { header: "Società", width: 85 },
      { header: "Catture", width: 50 }, { header: "Rilasci", width: 45 }, { header: "Persi", width: 40 },
      { header: "Peso Tot.", width: 60 }, { header: "Max Peso", width: 55 }, { header: "Punti", width: 55 },
    ];

    const rowHeight = 20;
    const headerHeight = 26;
    let currentY = doc.y;

    // Funzione per disegnare header tabella
    const drawTableHeader = () => {
      doc.fillColor(primaryColor).rect(startX, currentY, pageWidth, headerHeight).fill();
      doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");
      let xPos = startX + 3;
      columns.forEach((col) => {
        doc.text(col.header, xPos, currentY + 8, { width: col.width - 6, align: "center" });
        xPos += col.width;
      });
      currentY += headerHeight;
      doc.font("Helvetica").fontSize(8);
    };

    // Header iniziale
    drawTableHeader();

    // Righe con paginazione
    leaderboard.forEach((row, index) => {
      // Controlla se serve nuova pagina
      if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 60) {
        doc.addPage();
        currentY = doc.page.margins.top;
        drawTableHeader();
      }

      // Sfondo podio
      if (index === 0) doc.fillColor("#FFD700").rect(startX, currentY, pageWidth, rowHeight).fill();
      else if (index === 1) doc.fillColor("#C0C0C0").rect(startX, currentY, pageWidth, rowHeight).fill();
      else if (index === 2) doc.fillColor("#CD7F32").rect(startX, currentY, pageWidth, rowHeight).fill();
      else if (index % 2 === 1) doc.fillColor("#F8F9FA").rect(startX, currentY, pageWidth, rowHeight).fill();

      doc.strokeColor("#DEE2E6").lineWidth(0.5).rect(startX, currentY, pageWidth, rowHeight).stroke();
      doc.fillColor(index < 3 ? "#000000" : "#333333");
      let xPos = startX + 3;

      const rowData = [
        row.rank.toString(), row.teamName || "-", row.boatName || "-", row.boatNumber?.toString() || "-",
        row.captainName || "-", row.clubName || "-", row.catchCount.toString(), row.releasedCount.toString(),
        row.lostCount.toString(), `${row.totalWeight.toFixed(2)} kg`,
        row.biggestCatch ? `${row.biggestCatch.toFixed(2)} kg` : "-", row.totalPoints.toFixed(0),
      ];

      rowData.forEach((data, colIndex) => {
        doc.text(data.slice(0, 20), xPos, currentY + 6, { width: columns[colIndex].width - 6, align: "center", lineBreak: false });
        xPos += columns[colIndex].width;
      });
      currentY += rowHeight;
    });

    // Sincronizza doc.y con currentY per il testo successivo
    doc.y = currentY;

    // Riepilogo - usa dati catture se leaderboard è vuota
    doc.moveDown(0.8);
    let totalCatches: number;
    let totalWeight: number;
    let totalParticipants: number;

    if (leaderboard.length > 0) {
      totalCatches = leaderboard.reduce((sum: number, r: any) => sum + r.catchCount, 0);
      totalWeight = leaderboard.reduce((sum: number, r: any) => sum + r.totalWeight, 0);
      totalParticipants = leaderboard.length;
    } else {
      // Fallback: calcola da catchDetails
      totalCatches = catchDetails.length;
      totalWeight = catchDetails.reduce((sum: number, c: any) => sum + c.weight, 0);
      // Conta partecipanti unici per anglerName
      const uniqueAnglers = new Set(catchDetails.map((c: any) => c.anglerName));
      totalParticipants = uniqueAnglers.size;
    }

    const summaryText = `Partecipanti: ${totalParticipants}  |  Catture: ${totalCatches}  |  Peso totale: ${totalWeight.toFixed(2)} kg`;
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000")
      .text(summaryText, startX, doc.y, { width: pageWidth, align: "center", lineBreak: false });
  }

  private static drawCatchesTable(doc: PDFKit.PDFDocument, catches: any[], primaryColor: string): void {
    const startX = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const columns = [
      { header: "Pos", width: 28 }, { header: "Squadra", width: 100 }, { header: "Barca", width: 85 },
      { header: "Angler", width: 95 }, { header: "Canna", width: 38 }, { header: "Specie", width: 80 },
      { header: "Peso", width: 45 }, { header: "Lung.", width: 42 }, { header: "Ora", width: 42 }, { header: "Punti", width: 50 },
    ];

    const rowHeight = 18;
    const headerHeight = 24;
    let currentY = doc.y;

    // Funzione per disegnare header tabella catture
    const drawTableHeader = () => {
      doc.fillColor(primaryColor).rect(startX, currentY, pageWidth, headerHeight).fill();
      doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold");
      let xPos = startX + 5;
      columns.forEach((col) => {
        doc.text(col.header, xPos, currentY + 7, { width: col.width - 10, align: "center", lineBreak: false });
        xPos += col.width;
      });
      currentY += headerHeight;
      doc.font("Helvetica").fontSize(9);
    };

    // Header iniziale
    drawTableHeader();

    // Mostra TUTTE le catture con paginazione corretta
    catches.forEach((c, index) => {
      // Controlla se serve nuova pagina PRIMA di disegnare
      if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 60) {
        doc.addPage();
        currentY = doc.page.margins.top;
        drawTableHeader();
      }

      // Sfondo podio/alternato
      if (index === 0) doc.fillColor("#FFD700").rect(startX, currentY, pageWidth, rowHeight).fill();
      else if (index === 1) doc.fillColor("#C0C0C0").rect(startX, currentY, pageWidth, rowHeight).fill();
      else if (index === 2) doc.fillColor("#CD7F32").rect(startX, currentY, pageWidth, rowHeight).fill();
      else if (index % 2 === 1) doc.fillColor("#F8F9FA").rect(startX, currentY, pageWidth, rowHeight).fill();

      doc.strokeColor("#DEE2E6").lineWidth(0.5).rect(startX, currentY, pageWidth, rowHeight).stroke();
      doc.fillColor("#000000");
      let xPos = startX + 5;

      const catchTime = c.caughtAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      const rowData = [
        (index + 1).toString(),
        (c.teamName || "N/A").slice(0, 16),
        (c.boatName || "-").slice(0, 14),
        (c.anglerName || "N/A").slice(0, 15),
        c.rodNumber ? c.rodNumber.toString() : "-",
        (c.speciesName || "N/A").slice(0, 12),
        c.weight.toFixed(2),
        c.length ? c.length.toFixed(1) : "-",
        catchTime,
        c.points.toFixed(0)
      ];

      rowData.forEach((data, colIndex) => {
        doc.text(data, xPos, currentY + 5, { width: columns[colIndex].width - 10, align: "center", lineBreak: false });
        xPos += columns[colIndex].width;
      });
      currentY += rowHeight;
    });

    // Sync doc.y per elementi successivi
    doc.y = currentY;
  }

  private static drawLeaderboardFooter(doc: PDFKit.PDFDocument, organizerName: string, tournament: TournamentPDFData): void {
    const footerY = doc.page.height - doc.page.margins.bottom - 35;
    doc.strokeColor("#CCCCCC").lineWidth(0.5).moveTo(doc.page.margins.left, footerY).lineTo(doc.page.width - doc.page.margins.right, footerY).stroke();
    const printDate = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    doc.fontSize(8).fillColor("#666666").text(`Stampato il: ${printDate}`, doc.page.margins.left, footerY + 8);
    doc.text(`Direttore di Gara: ${organizerName}   Firma: _______________`, doc.page.margins.left + 200, footerY + 8);
    doc.text(`${tournament.tenantName} - Classifica Ufficiale FIPSAS`, doc.page.width - doc.page.margins.right - 250, footerY + 8, { align: "right", width: 250 });
  }

  /**
   * Genera PDF Classifica Pubblico per tornei COMPLETED
   * Non richiede autenticazione ma solo per tornei completati
   * Usa LeaderboardEntry per tornei con classifica pre-calcolata
   */
  static async generatePublicLeaderboardPDF(tournamentId: string): Promise<Buffer> {
    // Recupera torneo senza filtro tenant
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tenant: {
          select: { id: true, name: true, logo: true, primaryColor: true },
        },
        organizer: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!tournament) {
      throw new Error("Torneo non trovato");
    }

    if (tournament.status !== "COMPLETED") {
      throw new Error("PDF disponibile solo per tornei completati");
    }

    // Recupera classifica da LeaderboardEntry (per tornei completati)
    const leaderboardEntries = await prisma.leaderboardEntry.findMany({
      where: { tournamentId },
      orderBy: { rank: "asc" },
    });

    // Se ci sono LeaderboardEntry, usa quelli (TUTTI i partecipanti)
    if (leaderboardEntries.length > 0) {
      // Recupera teams per mappatura boatName, boatNumber e clubName nella classifica
      const teams = await prisma.team.findMany({
        where: { tournamentId },
        select: { id: true, name: true, boatName: true, boatNumber: true, clubName: true, captainId: true },
      });

      // Costruisci TUTTE le mappe necessarie dalla query teams
      // Per la classifica (by teamName)
      const teamNameToBoatName = new Map<string, string>();
      const teamNameToBoatNumber = new Map<string, number>();
      const teamNameToClubName = new Map<string, string>();
      // Per catchDetails (by teamId)
      const teamIdToName = new Map<string, string>();
      const teamIdToBoatName = new Map<string, string>();

      teams.forEach((t) => {
        // Mappe by teamName (per classifica)
        teamNameToBoatName.set(t.name, t.boatName || "-");
        if (t.boatNumber) teamNameToBoatNumber.set(t.name, t.boatNumber);
        if (t.clubName) teamNameToClubName.set(t.name, t.clubName);
        // Mappe by teamId (per catchDetails)
        teamIdToName.set(t.id, t.name);
        if (t.boatName) teamIdToBoatName.set(t.id, t.boatName);
      });

      // Aggrega leaderboardEntries per TEAM (non per singolo angler)
      // I dati in leaderboard_entries sono per angler, dobbiamo aggregare per teamName
      const teamAggregates = new Map<string, {
        teamName: string;
        captainName: string;
        catchCount: number;
        totalWeight: number;
        totalPoints: number;
        biggestCatch: number | null;
      }>();

      leaderboardEntries.forEach((entry) => {
        const teamName = entry.teamName || entry.participantName || "N/A";
        const existing = teamAggregates.get(teamName);

        if (existing) {
          // Aggrega: somma catchCount, totalWeight, totalPoints
          existing.catchCount += entry.catchCount;
          existing.totalWeight += Number(entry.totalWeight);
          existing.totalPoints += Number(entry.totalPoints);
          // biggestCatch: prendi il massimo
          if (entry.biggestCatch) {
            const newBiggest = Number(entry.biggestCatch);
            if (!existing.biggestCatch || newBiggest > existing.biggestCatch) {
              existing.biggestCatch = newBiggest;
            }
          }
        } else {
          // Primo angler del team - crea entry
          teamAggregates.set(teamName, {
            teamName,
            captainName: entry.participantName || "N/A",
            catchCount: entry.catchCount,
            totalWeight: Number(entry.totalWeight),
            totalPoints: Number(entry.totalPoints),
            biggestCatch: entry.biggestCatch ? Number(entry.biggestCatch) : null,
          });
        }
      });

      // Converti in array, ordina per totalPoints decrescente, assegna rank
      const leaderboard = Array.from(teamAggregates.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((team, index) => ({
          rank: index + 1,
          teamName: team.teamName,
          boatName: teamNameToBoatName.get(team.teamName) || "-",
          boatNumber: teamNameToBoatNumber.get(team.teamName) || null,
          captainName: team.captainName,
          clubName: teamNameToClubName.get(team.teamName) || null,
          catchCount: team.catchCount,
          releasedCount: 0,
          lostCount: 0,
          totalWeight: team.totalWeight,
          biggestCatch: team.biggestCatch,
          totalPoints: team.totalPoints,
        }));

      // Recupera catture per dettaglio
      const catches = await prisma.catch.findMany({
        where: { tournamentId, status: "APPROVED" },
        select: {
          id: true,
          weight: true,
          length: true,
          rodNumber: true,
          caughtAt: true,
          userId: true,
          species: { select: { commonNameIt: true, pointsMultiplier: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { weight: "desc" },
      });

      // Recupera membri per mappatura userId -> teamId (teams già recuperati sopra)
      const teamMembers = await prisma.teamMember.findMany({
        where: { team: { tournamentId } },
        select: { userId: true, teamId: true },
      });

      // Costruisci mappa userId -> teamId
      const userToTeamMap = new Map<string, string>();
      teamMembers.forEach((m) => {
        if (m.userId) userToTeamMap.set(m.userId, m.teamId);
      });
      teams.forEach((t) => userToTeamMap.set(t.captainId, t.id));

      // teamIdToName e teamIdToBoatName già costruite sopra

      const catchDetails = catches.map((c, index) => {
        const teamId = userToTeamMap.get(c.userId);
        const userName = `${c.user.firstName} ${c.user.lastName}`;
        let teamName = userName;
        let boatName = "-";
        if (teamId && teamIdToName.has(teamId)) {
          teamName = teamIdToName.get(teamId)!;
          boatName = teamIdToBoatName.get(teamId) || "-";
        }
        return {
          rank: index + 1,
          teamName,
          boatName,
          anglerName: userName,
          rodNumber: c.rodNumber,
          speciesName: c.species?.commonNameIt || "Sconosciuta",
          weight: Number(c.weight),
          length: c.length ? Number(c.length) : null,
          caughtAt: c.caughtAt,
          points: Number(c.weight) * (c.species?.pointsMultiplier ? Number(c.species.pointsMultiplier) : 1) * 100,
        };
      });

      // Scarica logo se disponibile
      let logoBuffer: Buffer | null = null;
      if (tournament.tenant.logo) {
        logoBuffer = await this.fetchImageBuffer(tournament.tenant.logo);
      }

      return this.buildLeaderboardPDF(
        {
          id: tournament.id,
          name: tournament.name,
          discipline: tournament.discipline,
          location: tournament.location,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          tenantName: tournament.tenant.name,
          tenantLogo: tournament.tenant.logo,
        },
        leaderboard,
        catchDetails,
        `${tournament.organizer.firstName} ${tournament.organizer.lastName}`,
        tournament.tenant.primaryColor || "#0066CC",
        logoBuffer
      );
    }

    // Fallback: usa il metodo esistente con Teams
    return this.generateLeaderboardPDF(tournamentId, tournament.tenantId);
  }
}

export default PDFService;
