/**
 * =============================================================================
 * useUpload Hook - Gestione upload foto/video catture
 * =============================================================================
 * Hook React per caricare media su Cloudinary con stato di caricamento
 * =============================================================================
 */

"use client";

import { useState, useCallback } from "react";
import { uploadCatchPhoto, uploadCatchVideo, deleteUploadedFile } from "@/lib/api";

export interface UploadedMedia {
  url: string;
  thumbnailUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

interface UseUploadReturn {
  // Stato
  isUploading: boolean;
  uploadProgress: number; // 0-100
  error: string | null;
  uploadedMedia: UploadedMedia | null;

  // Azioni
  uploadPhoto: (base64DataUrl: string, tournamentId?: string) => Promise<UploadedMedia | null>;
  uploadVideo: (videoBlob: Blob, tournamentId?: string) => Promise<UploadedMedia | null>;
  deleteMedia: (publicId: string, type?: "image" | "video") => Promise<boolean>;
  reset: () => void;
}

export function useUpload(): UseUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    setUploadedMedia(null);
  }, []);

  const uploadPhoto = useCallback(async (
    base64DataUrl: string,
    tournamentId?: string
  ): Promise<UploadedMedia | null> => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(10);

      // Simula progresso durante upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadCatchPhoto(base64DataUrl, tournamentId);

      clearInterval(progressInterval);

      if (!result.success || !result.data) {
        setError(result.message || "Upload fallito");
        setUploadProgress(0);
        return null;
      }

      setUploadProgress(100);
      setUploadedMedia(result.data);
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore upload";
      setError(message);
      setUploadProgress(0);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadVideo = useCallback(async (
    videoBlob: Blob,
    tournamentId?: string
  ): Promise<UploadedMedia | null> => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(10);

      // Progresso simulato per video (upload piu' lungo)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const result = await uploadCatchVideo(videoBlob, tournamentId);

      clearInterval(progressInterval);

      if (!result.success || !result.data) {
        setError(result.message || "Upload video fallito");
        setUploadProgress(0);
        return null;
      }

      setUploadProgress(100);
      setUploadedMedia(result.data);
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore upload video";
      setError(message);
      setUploadProgress(0);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const deleteMedia = useCallback(async (
    publicId: string,
    type: "image" | "video" = "image"
  ): Promise<boolean> => {
    try {
      const result = await deleteUploadedFile(publicId, type);
      if (result.success) {
        setUploadedMedia(null);
      }
      return result.success;
    } catch (err) {
      console.error("Delete error:", err);
      return false;
    }
  }, []);

  return {
    isUploading,
    uploadProgress,
    error,
    uploadedMedia,
    uploadPhoto,
    uploadVideo,
    deleteMedia,
    reset,
  };
}

export default useUpload;
