/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/components/native/CatchCamera.tsx
 * Creato: 2025-12-30
 * Descrizione: Componente per scattare foto catture con guida posizionamento
 *
 * Features:
 * - Overlay con guida per posizionare il pesce
 * - Cattura foto con metadati GPS
 * - Preview e conferma prima dell'invio
 * - Funziona offline (salva localmente)
 * =============================================================================
 */

"use client";

import { useState, useCallback } from "react";
import { Camera, CameraResultType, CameraSource, Photo } from "@capacitor/camera";
import { Geolocation, Position } from "@capacitor/geolocation";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera as CameraIcon, MapPin, Check, X, Loader2, Fish } from "lucide-react";

interface CatchPhoto {
  dataUrl: string;
  latitude: number | null;
  longitude: number | null;
  timestamp: Date;
  savedLocally: boolean;
}

interface CatchCameraProps {
  onPhotoTaken: (photo: CatchPhoto) => void;
  onCancel?: () => void;
  tournamentId?: string;
}

export function CatchCamera({ onPhotoTaken, onCancel, tournamentId }: CatchCameraProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [preview, setPreview] = useState<CatchPhoto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(async (): Promise<Position | null> => {
    try {
      setIsGettingLocation(true);
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      return position;
    } catch (err) {
      console.warn("Could not get location:", err);
      return null;
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      setIsCapturing(true);
      setError(null);

      // Cattura foto
      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: true,
        correctOrientation: true,
      });

      if (!photo.dataUrl) {
        throw new Error("Foto non catturata");
      }

      // Ottieni posizione GPS
      const position = await getLocation();

      const catchPhoto: CatchPhoto = {
        dataUrl: photo.dataUrl,
        latitude: position?.coords.latitude ?? null,
        longitude: position?.coords.longitude ?? null,
        timestamp: new Date(),
        savedLocally: false,
      };

      setPreview(catchPhoto);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Errore durante la cattura";
      setError(message);
      console.error("Camera error:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [getLocation]);

  const confirmPhoto = useCallback(async () => {
    if (!preview) return;

    try {
      // Salva localmente per offline mode
      const fileName = `catch_${tournamentId || "unknown"}_${Date.now()}.jpg`;
      await Filesystem.writeFile({
        path: `catches/${fileName}`,
        data: preview.dataUrl.split(",")[1], // Rimuovi prefix base64
        directory: Directory.Data,
        recursive: true,
      });

      onPhotoTaken({ ...preview, savedLocally: true });
      setPreview(null);
    } catch (err) {
      console.warn("Could not save locally:", err);
      // Invia comunque anche se non salvato localmente
      onPhotoTaken(preview);
      setPreview(null);
    }
  }, [preview, tournamentId, onPhotoTaken]);

  const retakePhoto = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  // Preview della foto scattata
  if (preview) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fish className="h-5 w-5" />
            Conferma Cattura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative rounded-lg overflow-hidden">
            <img
              src={preview.dataUrl}
              alt="Cattura"
              className="w-full h-auto"
            />
            {preview.latitude && preview.longitude && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {preview.latitude.toFixed(4)}, {preview.longitude.toFixed(4)}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={retakePhoto}
            >
              <X className="h-4 w-4 mr-2" />
              Riprova
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={confirmPhoto}
            >
              <Check className="h-4 w-4 mr-2" />
              Conferma
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Schermata di cattura
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CameraIcon className="h-5 w-5" />
          Fotografa Cattura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Guida posizionamento */}
        <div className="relative bg-muted rounded-lg aspect-[4/3] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-4 border-2 border-dashed border-primary/50 rounded-lg" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/4 border-2 border-primary rounded-full opacity-30" />
          <div className="text-center p-4">
            <Fish className="h-16 w-16 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Posiziona il pesce orizzontalmente<br />
              al centro dell&apos;inquadratura
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Annulla
            </Button>
          )}
          <Button
            onClick={takePhoto}
            disabled={isCapturing || isGettingLocation}
            className="flex-1 bg-primary"
          >
            {isCapturing || isGettingLocation ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isGettingLocation ? "GPS..." : "Cattura..."}
              </>
            ) : (
              <>
                <CameraIcon className="h-4 w-4 mr-2" />
                Scatta Foto
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          La posizione GPS verra aggiunta automaticamente alla foto
        </p>
      </CardContent>
    </Card>
  );
}
