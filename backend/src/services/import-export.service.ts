/**
 * =============================================================================
 * IMPORT/EXPORT SERVICE
 * =============================================================================
 * Gestione import/export dati in formato CSV, Excel e JSON
 * Supporto integrazione FIPSAS
 * =============================================================================
 */

import * as XLSX from "xlsx";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../lib/prisma";

// Types for import/export
interface ImportResult {
  success: boolean;
  imported: number;
  errors: ImportError[];
  warnings: string[];
}

interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

interface ParticipantImportRow {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  fipsasNumber?: string;
  teamName?: string;
  boatName?: string;
}

interface ExportOptions {
  format: "xlsx" | "csv" | "json";
  includeDetails?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export class ImportExportService {
  // ==========================================================================
  // PARTICIPANT IMPORT
  // ==========================================================================

  /**
   * Import partecipanti da file Excel/CSV
   */
  static async importParticipants(
    tournamentId: string,
    fileBuffer: Buffer,
    fileType: "xlsx" | "csv",
    tenantId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
      warnings: [],
    };

    try {
      // Parse file
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<ParticipantImportRow>(sheet);

      if (rows.length === 0) {
        result.success = false;
        result.errors.push({
          row: 0,
          field: "file",
          value: "",
          message: "Il file non contiene dati",
        });
        return result;
      }

      // Verify tournament exists
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
      });

      if (!tournament) {
        result.success = false;
        result.errors.push({
          row: 0,
          field: "tournamentId",
          value: tournamentId,
          message: "Torneo non trovato",
        });
        return result;
      }

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +2 because Excel is 1-indexed and has header

        try {
          // Validate required fields
          if (!row.email) {
            result.errors.push({
              row: rowNum,
              field: "email",
              value: "",
              message: "Email obbligatoria",
            });
            continue;
          }

          if (!row.firstName || !row.lastName) {
            result.errors.push({
              row: rowNum,
              field: "name",
              value: `${row.firstName || ""} ${row.lastName || ""}`,
              message: "Nome e cognome obbligatori",
            });
            continue;
          }

          // Check if user exists or create
          let user = await prisma.user.findUnique({
            where: { email: row.email.toLowerCase().trim() },
          });

          if (!user) {
            // Create user with a placeholder password (they will need to reset)
            user = await prisma.user.create({
              data: {
                email: row.email.toLowerCase().trim(),
                passwordHash: "$placeholder$", // Needs password reset
                firstName: row.firstName.trim(),
                lastName: row.lastName.trim(),
                phone: row.phone?.trim() || null,
                fipsasNumber: row.fipsasNumber?.trim() || null,
                tenantId,
                role: "PARTICIPANT",
              },
            });
            result.warnings.push(`Riga ${rowNum}: Nuovo utente creato per ${row.email}`);
          }

          // Check if already registered
          const existingReg = await prisma.tournamentRegistration.findFirst({
            where: {
              userId: user.id,
              tournamentId,
            },
          });

          if (existingReg) {
            result.warnings.push(`Riga ${rowNum}: ${row.email} gia registrato, saltato`);
            continue;
          }

          // Create registration
          await prisma.tournamentRegistration.create({
            data: {
              tournamentId,
              userId: user.id,
              teamName: row.teamName?.trim() || null,
              boatName: row.boatName?.trim() || null,
              status: "CONFIRMED",
            },
          });

          result.imported++;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Errore sconosciuto";
          result.errors.push({
            row: rowNum,
            field: "row",
            value: JSON.stringify(row),
            message,
          });
        }
      }

      if (result.errors.length > 0) {
        result.success = result.imported > 0;
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore lettura file";
      result.success = false;
      result.errors.push({
        row: 0,
        field: "file",
        value: "",
        message,
      });
      return result;
    }
  }

  // ==========================================================================
  // EXPORT FUNCTIONS
  // ==========================================================================

  /**
   * Export partecipanti torneo
   */
  static async exportParticipants(
    tournamentId: string,
    options: ExportOptions
  ): Promise<Buffer> {
    const registrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId },
      include: {
        user: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const data = registrations.map((reg, index) => ({
      "#": index + 1,
      Email: reg.user.email,
      Nome: reg.user.firstName,
      Cognome: reg.user.lastName,
      Telefono: reg.user.phone || "",
      "Tessera FIPSAS": reg.user.fipsasNumber || "",
      Team: reg.teamName || "",
      Barca: reg.boatName || "",
      Stato: reg.status,
      "Data Iscrizione": reg.createdAt.toISOString().split("T")[0],
    }));

    return this.generateFile(data, options.format, "partecipanti");
  }

  /**
   * Export catture torneo
   */
  static async exportCatches(
    tournamentId: string,
    options: ExportOptions
  ): Promise<Buffer> {
    const catches = await prisma.catch.findMany({
      where: { tournamentId },
      include: {
        user: true,
        species: true,
      },
      orderBy: { caughtAt: "asc" },
    });

    const data = catches.map((c, index) => ({
      "#": index + 1,
      Partecipante: `${c.user.firstName} ${c.user.lastName}`,
      Email: c.user.email,
      Specie: c.species?.commonNameIt || "N/D",
      "Peso (kg)": c.weight ? c.weight.toNumber() : "",
      "Lunghezza (cm)": c.length ? c.length.toNumber() : "",
      Punti: c.points ? c.points.toNumber() : 0,
      "Data/Ora": c.caughtAt.toISOString().replace("T", " ").slice(0, 19),
      Stato: c.status,
    }));

    return this.generateFile(data, options.format, "catture");
  }

  /**
   * Export classifica torneo
   */
  static async exportLeaderboard(
    tournamentId: string,
    options: ExportOptions
  ): Promise<Buffer> {
    // Get all catches grouped by user
    const catches = await prisma.catch.findMany({
      where: {
        tournamentId,
        status: "APPROVED",
      },
      include: {
        user: true,
      },
    });

    // Aggregate by user
    const userStats = new Map<
      string,
      {
        user: { firstName: string; lastName: string; email: string };
        totalWeight: number;
        totalPoints: number;
        catchCount: number;
        biggestCatch: number;
      }
    >();

    for (const c of catches) {
      const existing = userStats.get(c.userId) || {
        user: c.user,
        totalWeight: 0,
        totalPoints: 0,
        catchCount: 0,
        biggestCatch: 0,
      };

      const weight = c.weight ? c.weight.toNumber() : 0;
      const points = c.points ? c.points.toNumber() : 0;

      existing.totalWeight += weight;
      existing.totalPoints += points;
      existing.catchCount++;
      if (weight > existing.biggestCatch) {
        existing.biggestCatch = weight;
      }

      userStats.set(c.userId, existing);
    }

    // Sort by points
    const sorted = Array.from(userStats.values()).sort(
      (a, b) => b.totalPoints - a.totalPoints
    );

    const data = sorted.map((s, index) => ({
      Posizione: index + 1,
      Nome: s.user.firstName,
      Cognome: s.user.lastName,
      Email: s.user.email,
      "Punti Totali": s.totalPoints,
      "Peso Totale (kg)": s.totalWeight.toFixed(2),
      "N. Catture": s.catchCount,
      "Cattura Maggiore (kg)": s.biggestCatch.toFixed(2),
    }));

    return this.generateFile(data, options.format, "classifica");
  }

  /**
   * Export completo torneo per FIPSAS
   */
  static async exportFIPSAS(
    tournamentId: string
  ): Promise<Buffer> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tenant: true,
        registrations: {
          include: { user: true },
        },
        catches: {
          where: { status: "APPROVED" },
          include: { user: true, species: true },
        },
      },
    });

    if (!tournament) {
      throw new Error("Torneo non trovato");
    }

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Info Torneo
    const infoData = [
      { Campo: "Nome Torneo", Valore: tournament.name },
      { Campo: "Associazione", Valore: tournament.tenant.name },
      { Campo: "Data Inizio", Valore: tournament.startDate.toISOString().split("T")[0] },
      { Campo: "Data Fine", Valore: tournament.endDate?.toISOString().split("T")[0] || "" },
      { Campo: "Disciplina", Valore: tournament.discipline },
      { Campo: "Localita", Valore: tournament.location || "" },
      { Campo: "N. Partecipanti", Valore: tournament.registrations.length },
      { Campo: "N. Catture Validate", Valore: tournament.catches.length },
    ];
    const infoSheet = XLSX.utils.json_to_sheet(infoData);
    XLSX.utils.book_append_sheet(workbook, infoSheet, "Info Torneo");

    // Sheet 2: Partecipanti
    const partData = tournament.registrations.map((reg, i) => ({
      "#": i + 1,
      Cognome: reg.user.lastName,
      Nome: reg.user.firstName,
      "Tessera FIPSAS": reg.user.fipsasNumber || "",
      Team: reg.teamName || "",
      Barca: reg.boatName || "",
    }));
    const partSheet = XLSX.utils.json_to_sheet(partData);
    XLSX.utils.book_append_sheet(workbook, partSheet, "Partecipanti");

    // Sheet 3: Catture
    const catchData = tournament.catches.map((c, i) => ({
      "#": i + 1,
      Cognome: c.user.lastName,
      Nome: c.user.firstName,
      Specie: c.species?.commonNameIt || "N/D",
      "Peso (kg)": c.weight ? c.weight.toNumber() : "",
      "Lunghezza (cm)": c.length ? c.length.toNumber() : "",
      Moltiplicatore: c.species?.pointsMultiplier ? c.species.pointsMultiplier.toNumber() : 1,
      Punti: c.points ? c.points.toNumber() : 0,
      "Data/Ora": c.caughtAt.toISOString().replace("T", " ").slice(0, 19),
    }));
    const catchSheet = XLSX.utils.json_to_sheet(catchData);
    XLSX.utils.book_append_sheet(workbook, catchSheet, "Catture");

    // Sheet 4: Classifica
    const userStats = new Map<string, {
      user: { firstName: string; lastName: string; fipsasNumber: string | null };
      totalPoints: number;
      catchCount: number
    }>();
    for (const c of tournament.catches) {
      const existing = userStats.get(c.userId) || { user: c.user, totalPoints: 0, catchCount: 0 };
      existing.totalPoints += c.points ? c.points.toNumber() : 0;
      existing.catchCount++;
      userStats.set(c.userId, existing);
    }
    const rankData = Array.from(userStats.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((s, i) => ({
        Posizione: i + 1,
        Cognome: s.user.lastName,
        Nome: s.user.firstName,
        "Tessera FIPSAS": s.user.fipsasNumber || "",
        Punti: s.totalPoints,
        "N. Catture": s.catchCount,
      }));
    const rankSheet = XLSX.utils.json_to_sheet(rankData);
    XLSX.utils.book_append_sheet(workbook, rankSheet, "Classifica");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return Buffer.from(buffer);
  }

  // ==========================================================================
  // TEMPLATE GENERATION
  // ==========================================================================

  /**
   * Genera template per import partecipanti
   */
  static generateParticipantTemplate(): Buffer {
    const data = [
      {
        email: "mario.rossi@email.com",
        firstName: "Mario",
        lastName: "Rossi",
        phone: "+39 333 1234567",
        fipsasNumber: "IT123456",
        teamName: "Team Pescatori",
        boatName: "Sea Hunter",
      },
      {
        email: "luca.bianchi@email.com",
        firstName: "Luca",
        lastName: "Bianchi",
        phone: "+39 333 7654321",
        fipsasNumber: "IT789012",
        teamName: "Team Pescatori",
        boatName: "Sea Hunter",
      },
    ];

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    sheet["!cols"] = [
      { wch: 25 }, // email
      { wch: 15 }, // firstName
      { wch: 15 }, // lastName
      { wch: 18 }, // phone
      { wch: 12 }, // fipsasNumber
      { wch: 20 }, // teamName
      { wch: 15 }, // boatName
    ];

    XLSX.utils.book_append_sheet(workbook, sheet, "Partecipanti");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return Buffer.from(buffer);
  }

  /**
   * Genera template per import catture (semplificato - solo export disponibile)
   */
  static generateCatchTemplate(): Buffer {
    const data = [
      {
        participantEmail: "mario.rossi@email.com",
        species: "Ricciola",
        weight: 12.5,
        length: 95,
        datetime: "2024-06-15 10:30",
      },
      {
        participantEmail: "luca.bianchi@email.com",
        species: "Tonno Rosso",
        weight: 45.2,
        length: 150,
        datetime: "2024-06-15 14:45",
      },
    ];

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    sheet["!cols"] = [
      { wch: 25 }, // participantEmail
      { wch: 15 }, // species
      { wch: 10 }, // weight
      { wch: 10 }, // length
      { wch: 18 }, // datetime
    ];

    XLSX.utils.book_append_sheet(workbook, sheet, "Catture");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return Buffer.from(buffer);
  }

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  private static generateFile(
    data: Record<string, unknown>[],
    format: "xlsx" | "csv" | "json",
    sheetName: string
  ): Buffer {
    if (format === "json") {
      return Buffer.from(JSON.stringify(data, null, 2), "utf-8");
    }

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);

    const bookType = format === "csv" ? "csv" : "xlsx";
    const buffer = XLSX.write(workbook, { type: "buffer", bookType });
    return Buffer.from(buffer);
  }
}
