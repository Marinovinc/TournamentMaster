/**
 * =============================================================================
 * Thumbnail Service - Generazione thumbnail per video locali
 * =============================================================================
 * Genera automaticamente thumbnail dai video usando FFmpeg.
 * Richiede FFmpeg installato sul sistema: choco install ffmpeg
 * =============================================================================
 */

import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

// Estensioni video supportate
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".avi", ".mkv"];

// Directory thumbnails
const THUMBNAILS_DIR = path.join(process.cwd(), "public", "thumbnails");

// Assicurati che la directory thumbnails esista
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

export interface ThumbnailResult {
  success: boolean;
  thumbnailPath?: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  error?: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  format: string;
}

export class ThumbnailService {
  /**
   * Verifica se un file è un video
   */
  static isVideo(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return VIDEO_EXTENSIONS.includes(ext);
  }

  /**
   * Ottiene il mimeType in base all'estensione
   */
  static getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".webm": "video/webm",
      ".avi": "video/x-msvideo",
      ".mkv": "video/x-matroska",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  /**
   * Ottiene i metadati del video
   */
  static getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error("FFprobe error:", err);
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === "video"
        );

        resolve({
          duration: Math.round(metadata.format.duration || 0),
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          codec: videoStream?.codec_name || "unknown",
          format: metadata.format.format_name || "unknown",
        });
      });
    });
  }

  /**
   * Genera thumbnail da un video
   * @param videoPath - Path assoluto del video
   * @param outputFilename - Nome file thumbnail (senza estensione)
   * @param timestamp - Timestamp in secondi da cui estrarre il frame (default: 1s)
   */
  static async generateThumbnail(
    videoPath: string,
    outputFilename: string,
    timestamp: number = 1
  ): Promise<ThumbnailResult> {
    try {
      // Verifica che il file video esista
      if (!fs.existsSync(videoPath)) {
        return {
          success: false,
          error: `Video file not found: ${videoPath}`,
        };
      }

      // Ottieni metadati video
      let metadata: VideoMetadata | null = null;
      try {
        metadata = await this.getVideoMetadata(videoPath);
      } catch (err) {
        console.warn("Could not get video metadata:", err);
      }

      // Genera nome file thumbnail
      const thumbnailFilename = `${outputFilename}.jpg`;
      const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);

      // Genera thumbnail con FFmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timestamp],
            filename: thumbnailFilename,
            folder: THUMBNAILS_DIR,
            size: "480x?", // Larghezza 480px, altezza proporzionale
          })
          .on("end", () => {
            console.log(`Thumbnail generated: ${thumbnailPath}`);
            resolve();
          })
          .on("error", (err) => {
            console.error("FFmpeg error:", err);
            reject(err);
          });
      });

      // Verifica che il thumbnail sia stato creato
      if (!fs.existsSync(thumbnailPath)) {
        return {
          success: false,
          error: "Thumbnail generation failed - file not created",
        };
      }

      return {
        success: true,
        thumbnailPath: `/thumbnails/${thumbnailFilename}`,
        thumbnailUrl: `/thumbnails/${thumbnailFilename}`,
        duration: metadata?.duration,
        width: metadata?.width,
        height: metadata?.height,
      };
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error generating thumbnail",
      };
    }
  }

  /**
   * Genera thumbnail per tutti i video in una directory
   * Utile per batch processing
   */
  static async generateThumbnailsForDirectory(
    sourceDir: string
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    const files = fs.readdirSync(sourceDir);

    for (const file of files) {
      if (!this.isVideo(file)) continue;

      const videoPath = path.join(sourceDir, file);
      const outputName = path.parse(file).name;

      const result = await this.generateThumbnail(videoPath, outputName);

      if (result.success) {
        processed++;
      } else {
        failed++;
        console.error(`Failed to generate thumbnail for ${file}:`, result.error);
      }
    }

    return { processed, failed };
  }

  /**
   * Elimina un thumbnail
   */
  static deleteThumbnail(thumbnailPath: string): boolean {
    try {
      const fullPath = thumbnailPath.startsWith("/")
        ? path.join(process.cwd(), "public", thumbnailPath)
        : thumbnailPath;

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting thumbnail:", error);
      return false;
    }
  }
}

export default ThumbnailService;
