import * as turf from "@turf/turf";
import { Feature, Polygon, MultiPolygon, Point } from "geojson";
import { CatchValidationResult, FishingZone, GPSCoordinates } from "../types";

/**
 * GPS Validation Service
 * Uses Turf.js for geospatial calculations
 */
export class GPSService {
  /**
   * Validate if a catch location is inside any of the fishing zones
   */
  static validateCatchLocation(
    coordinates: GPSCoordinates,
    fishingZones: { geoJson: string; name: string }[]
  ): CatchValidationResult {
    const errors: string[] = [];
    let isInsideZone = false;
    let minDistanceFromZone: number | undefined;

    // Validate coordinates
    if (!this.isValidCoordinate(coordinates)) {
      return {
        isValid: false,
        isInsideZone: false,
        gpsAccuracy: coordinates.accuracy || 0,
        errors: ["Invalid GPS coordinates"],
      };
    }

    // Create point from coordinates
    const point = turf.point([coordinates.longitude, coordinates.latitude]);

    // Check each fishing zone
    for (const zone of fishingZones) {
      try {
        const zoneGeoJson = JSON.parse(zone.geoJson) as FishingZone;
        const polygon = this.createPolygonFeature(zoneGeoJson);

        if (polygon) {
          // Check if point is inside polygon
          if (turf.booleanPointInPolygon(point, polygon)) {
            isInsideZone = true;
            break;
          }

          // Calculate distance from zone boundary
          const distance = this.calculateDistanceFromZone(point, polygon);
          if (minDistanceFromZone === undefined || distance < minDistanceFromZone) {
            minDistanceFromZone = distance;
          }
        }
      } catch (error) {
        console.error(`Error parsing fishing zone ${zone.name}:`, error);
      }
    }

    if (!isInsideZone) {
      errors.push(`Catch is outside all fishing zones. Nearest zone: ${minDistanceFromZone?.toFixed(0)}m away`);
    }

    // Check GPS accuracy (warn if > 50m)
    if (coordinates.accuracy && coordinates.accuracy > 50) {
      errors.push(`GPS accuracy is low: ${coordinates.accuracy.toFixed(0)}m`);
    }

    return {
      isValid: isInsideZone && errors.length === 0,
      isInsideZone,
      gpsAccuracy: coordinates.accuracy || 0,
      distanceFromZone: minDistanceFromZone,
      errors,
    };
  }

  /**
   * Check if coordinates are valid
   */
  static isValidCoordinate(coords: GPSCoordinates): boolean {
    const { latitude, longitude } = coords;
    return (
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /**
   * Calculate distance in meters between two coordinates
   */
  static calculateDistance(
    from: GPSCoordinates,
    to: GPSCoordinates
  ): number {
    const fromPoint = turf.point([from.longitude, from.latitude]);
    const toPoint = turf.point([to.longitude, to.latitude]);
    return turf.distance(fromPoint, toPoint, { units: "meters" });
  }

  /**
   * Calculate the bounding box for a GeoJSON polygon
   * Returns { minLat, maxLat, minLng, maxLng }
   */
  static calculateBoundingBox(geoJson: FishingZone): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    const polygon = this.createPolygonFeature(geoJson);
    if (!polygon) {
      throw new Error("Invalid GeoJSON");
    }

    const bbox = turf.bbox(polygon);
    return {
      minLng: bbox[0],
      minLat: bbox[1],
      maxLng: bbox[2],
      maxLat: bbox[3],
    };
  }

  /**
   * Create a Turf.js polygon feature from GeoJSON
   */
  private static createPolygonFeature(
    geoJson: FishingZone
  ): Feature<Polygon | MultiPolygon> | null {
    try {
      if (geoJson.type === "Polygon") {
        return turf.polygon(geoJson.coordinates);
      } else if (geoJson.type === "MultiPolygon") {
        return turf.multiPolygon(geoJson.coordinates);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Calculate distance from a point to the nearest edge of a polygon
   */
  private static calculateDistanceFromZone(
    point: Feature<Point>,
    polygon: Feature<Polygon | MultiPolygon>
  ): number {
    // Get the boundary of the polygon
    const boundary = turf.polygonToLine(polygon);

    // Find the nearest point on the boundary
    const nearest = turf.nearestPointOnLine(
      boundary as Feature<any>,
      point
    );

    // Calculate distance in meters
    return turf.distance(point, nearest, { units: "meters" });
  }

  /**
   * Generate a circular fishing zone (useful for simple tournaments)
   */
  static createCircularZone(
    center: GPSCoordinates,
    radiusKm: number
  ): FishingZone {
    const centerPoint = turf.point([center.longitude, center.latitude]);
    const circle = turf.circle(centerPoint, radiusKm, {
      steps: 64,
      units: "kilometers",
    });

    return {
      type: "Polygon",
      coordinates: circle.geometry.coordinates,
    };
  }

  /**
   * Check if a point is within a certain distance (buffer) of a zone
   * Useful for "near miss" validation
   */
  static isWithinBuffer(
    coordinates: GPSCoordinates,
    geoJson: FishingZone,
    bufferMeters: number
  ): boolean {
    const point = turf.point([coordinates.longitude, coordinates.latitude]);
    const polygon = this.createPolygonFeature(geoJson);

    if (!polygon) return false;

    // Create a buffer around the polygon
    const buffered = turf.buffer(polygon, bufferMeters, { units: "meters" });

    return turf.booleanPointInPolygon(point, buffered as Feature<Polygon>);
  }

  /**
   * Calculate the area of a fishing zone in square kilometers
   */
  static calculateZoneArea(geoJson: FishingZone): number {
    const polygon = this.createPolygonFeature(geoJson);
    if (!polygon) return 0;

    return turf.area(polygon) / 1_000_000; // Convert m² to km²
  }

  /**
   * Validate GeoJSON format
   */
  static isValidGeoJson(geoJsonString: string): boolean {
    try {
      const geoJson = JSON.parse(geoJsonString);
      return (
        geoJson.type === "Polygon" ||
        geoJson.type === "MultiPolygon"
      ) && Array.isArray(geoJson.coordinates);
    } catch {
      return false;
    }
  }
}

export default GPSService;
