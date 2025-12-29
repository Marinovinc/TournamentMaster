/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/services/tournament.service.ts (righe 370-417)
 * Data refactoring: 2025-12-29
 * Motivo: Separazione operazioni zone di pesca per manutenibilita
 *
 * Contiene:
 * - addFishingZone() - Aggiungere zona di pesca
 * - removeFishingZone() - Rimuovere zona di pesca (nuovo)
 * - updateFishingZone() - Aggiornare zona di pesca (nuovo)
 * - getFishingZones() - Lista zone di pesca (nuovo)
 *
 * Dipendenze:
 * - GPSService per validazione GeoJSON
 * =============================================================================
 */

import prisma from "../../lib/prisma";
import { GPSService } from "../gps.service";

/**
 * Data per creare/aggiornare una zona di pesca
 */
export interface FishingZoneData {
  name: string;
  description?: string;
  geoJson: string;
}

/**
 * Operazioni per le zone di pesca dei tornei
 */
export class TournamentZonesService {
  /**
   * Add fishing zone to tournament
   */
  static async addFishingZone(
    tournamentId: string,
    data: FishingZoneData,
    userId: string
  ) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (tournament.organizerId !== userId) {
      throw new Error("Only the organizer can add fishing zones");
    }

    // Validate GeoJSON
    if (!GPSService.isValidGeoJson(data.geoJson)) {
      throw new Error("Invalid GeoJSON format");
    }

    // Calculate bounding box
    const geoJson = JSON.parse(data.geoJson);
    const bbox = GPSService.calculateBoundingBox(geoJson);

    const fishingZone = await prisma.fishingZone.create({
      data: {
        name: data.name,
        description: data.description,
        geoJson: data.geoJson,
        minLat: bbox.minLat,
        maxLat: bbox.maxLat,
        minLng: bbox.minLng,
        maxLng: bbox.maxLng,
        tournamentId,
      },
    });

    return fishingZone;
  }

  /**
   * Get all fishing zones for a tournament
   */
  static async getFishingZones(tournamentId: string) {
    const zones = await prisma.fishingZone.findMany({
      where: { tournamentId },
      orderBy: { name: "asc" },
    });

    return zones;
  }

  /**
   * Update fishing zone
   */
  static async updateFishingZone(
    zoneId: string,
    data: Partial<FishingZoneData>,
    userId: string
  ) {
    const zone = await prisma.fishingZone.findUnique({
      where: { id: zoneId },
      include: { tournament: true },
    });

    if (!zone) {
      throw new Error("Fishing zone not found");
    }

    if (zone.tournament.organizerId !== userId) {
      throw new Error("Only the organizer can update fishing zones");
    }

    const updateData: any = {};

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.geoJson) {
      // Validate GeoJSON
      if (!GPSService.isValidGeoJson(data.geoJson)) {
        throw new Error("Invalid GeoJSON format");
      }

      // Calculate new bounding box
      const geoJson = JSON.parse(data.geoJson);
      const bbox = GPSService.calculateBoundingBox(geoJson);

      updateData.geoJson = data.geoJson;
      updateData.minLat = bbox.minLat;
      updateData.maxLat = bbox.maxLat;
      updateData.minLng = bbox.minLng;
      updateData.maxLng = bbox.maxLng;
    }

    const updated = await prisma.fishingZone.update({
      where: { id: zoneId },
      data: updateData,
    });

    return updated;
  }

  /**
   * Remove fishing zone
   */
  static async removeFishingZone(zoneId: string, userId: string) {
    const zone = await prisma.fishingZone.findUnique({
      where: { id: zoneId },
      include: { tournament: true },
    });

    if (!zone) {
      throw new Error("Fishing zone not found");
    }

    if (zone.tournament.organizerId !== userId) {
      throw new Error("Only the organizer can remove fishing zones");
    }

    await prisma.fishingZone.delete({
      where: { id: zoneId },
    });

    return { deleted: true };
  }
}
