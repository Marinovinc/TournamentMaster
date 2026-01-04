/**
 * =============================================================================
 * Upload Service - Gestione upload media su Cloudinary
 * =============================================================================
 * Gestisce upload di foto e video delle catture su Cloudinary CDN.
 * Supporta compressione automatica, validazione tipi file, e generazione thumbnail.
 * =============================================================================
 */

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import sharp from "sharp";
import { config } from "../config";
import path from "path";
import fs from "fs";

// Configura Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Tipi MIME consentiti per foto
const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
];

// Tipi MIME consentiti per video
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/webm",
];

// Dimensioni massime
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Dimensioni output foto
const PHOTO_MAX_WIDTH = 1920;
const PHOTO_MAX_HEIGHT = 1920;
const PHOTO_QUALITY = 85;

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  error?: string;
}

export interface UploadOptions {
  tournamentId?: string;
  userId?: string;
  folder?: string;
  generateThumbnail?: boolean;
}

export class UploadService {
  /**
   * Valida il tipo di file foto
   */
  static isValidPhotoType(mimetype: string): boolean {
    return ALLOWED_PHOTO_TYPES.includes(mimetype.toLowerCase());
  }

  /**
   * Valida il tipo di file video
   */
  static isValidVideoType(mimetype: string): boolean {
    return ALLOWED_VIDEO_TYPES.includes(mimetype.toLowerCase());
  }

  /**
   * Valida dimensione file foto
   */
  static isValidPhotoSize(size: number): boolean {
    return size <= MAX_PHOTO_SIZE;
  }

  /**
   * Valida dimensione file video
   */
  static isValidVideoSize(size: number): boolean {
    return size <= MAX_VIDEO_SIZE;
  }

  /**
   * Comprimi e ottimizza foto con Sharp
   */
  static async compressPhoto(buffer: Buffer): Promise<Buffer> {
    try {
      const compressed = await sharp(buffer)
        .resize(PHOTO_MAX_WIDTH, PHOTO_MAX_HEIGHT, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({
          quality: PHOTO_QUALITY,
          progressive: true,
        })
        .toBuffer();

      return compressed;
    } catch (error) {
      console.error("Error compressing photo:", error);
      // Se la compressione fallisce, ritorna l'originale
      return buffer;
    }
  }

  /**
   * Upload foto cattura su Cloudinary
   */
  static async uploadCatchPhoto(
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Validazione tipo file
      if (!this.isValidPhotoType(mimetype)) {
        return {
          success: false,
          error: `Tipo file non supportato: ${mimetype}. Usa JPEG, PNG, HEIC o WebP.`,
        };
      }

      // Validazione dimensione
      if (!this.isValidPhotoSize(fileBuffer.length)) {
        return {
          success: false,
          error: `File troppo grande: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB. Max 10MB.`,
        };
      }

      // Comprimi foto
      const compressedBuffer = await this.compressPhoto(fileBuffer);

      // Genera nome univoco
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const folder = options.folder || "catches";
      const publicId = `${folder}/${options.tournamentId || "general"}/${timestamp}_${randomId}`;

      // Upload su Cloudinary
      const uploadResult = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              public_id: publicId,
              resource_type: "image",
              folder: "tournamentmaster",
              transformation: [
                { quality: "auto:good" },
                { fetch_format: "auto" },
              ],
              tags: [
                "catch",
                options.tournamentId || "no-tournament",
                options.userId || "no-user",
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else if (result) resolve(result);
              else reject(new Error("Upload failed without error"));
            }
          );

          uploadStream.end(compressedBuffer);
        }
      );

      // Genera URL thumbnail
      const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
        width: 300,
        height: 300,
        crop: "fill",
        quality: "auto:low",
        fetch_format: "auto",
      });

      return {
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        thumbnailUrl,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.bytes,
      };
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Errore durante upload foto",
      };
    }
  }

  /**
   * Upload video cattura su Cloudinary
   */
  static async uploadCatchVideo(
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Validazione tipo file
      if (!this.isValidVideoType(mimetype)) {
        return {
          success: false,
          error: `Tipo file non supportato: ${mimetype}. Usa MP4, MOV, AVI o WebM.`,
        };
      }

      // Validazione dimensione
      if (!this.isValidVideoSize(fileBuffer.length)) {
        return {
          success: false,
          error: `File troppo grande: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB. Max 100MB.`,
        };
      }

      // Genera nome univoco
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const folder = options.folder || "catches";
      const publicId = `${folder}/${options.tournamentId || "general"}/${timestamp}_${randomId}`;

      // Upload su Cloudinary
      const uploadResult = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              public_id: publicId,
              resource_type: "video",
              folder: "tournamentmaster",
              eager: [
                // Genera thumbnail dal video
                { width: 300, height: 300, crop: "fill", format: "jpg" },
              ],
              eager_async: true,
              tags: [
                "catch-video",
                options.tournamentId || "no-tournament",
                options.userId || "no-user",
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else if (result) resolve(result);
              else reject(new Error("Upload failed without error"));
            }
          );

          uploadStream.end(fileBuffer);
        }
      );

      // Genera URL thumbnail dal video
      const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
        resource_type: "video",
        width: 300,
        height: 300,
        crop: "fill",
        format: "jpg",
      });

      return {
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        thumbnailUrl,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.bytes,
      };
    } catch (error) {
      console.error("Error uploading video to Cloudinary:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Errore durante upload video",
      };
    }
  }

  /**
   * Elimina file da Cloudinary
   */
  static async deleteFile(
    publicId: string,
    resourceType: "image" | "video" = "image"
  ): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result.result === "ok";
    } catch (error) {
      console.error("Error deleting from Cloudinary:", error);
      return false;
    }
  }

  /**
   * Genera URL firmato per accesso temporaneo
   */
  static generateSignedUrl(
    publicId: string,
    expiresInSeconds: number = 3600
  ): string {
    const timestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return cloudinary.url(publicId, {
      sign_url: true,
      type: "authenticated",
      expires_at: timestamp,
    });
  }
}

export default UploadService;
