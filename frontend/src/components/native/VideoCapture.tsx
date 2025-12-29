/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/components/native/VideoCapture.tsx
 * Creato: 2025-12-30
 * Descrizione: Componente per registrare e caricare video delle catture
 *
 * Features:
 * - Registrazione video con limite durata
 * - Compressione prima dell'upload
 * - Upload in background
 * - Coda offline per invio successivo
 * =============================================================================
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Network } from "@capacitor/network";
import { Preferences } from "@capacitor/preferences";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Video, Upload, Wifi, WifiOff, Loader2, Check, Clock } from "lucide-react";

interface VideoUpload {
  id: string;
  filePath: string;
  tournamentId: string;
  catchId?: string;
  status: "pending" | "uploading" | "completed" | "failed";
  progress: number;
  timestamp: Date;
}

interface VideoCaptureProps {
  tournamentId: string;
  catchId?: string;
  onVideoUploaded: (videoUrl: string) => void;
  maxDuration?: number; // in seconds
}

export function VideoCapture({
  tournamentId,
  catchId,
  onVideoUploaded,
  maxDuration = 30,
}: VideoCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Check network status
  const checkNetwork = useCallback(async () => {
    const status = await Network.getStatus();
    setIsOnline(status.connected);
    return status.connected;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const dataUrl = await blobToDataUrl(blob);
        setRecordedVideo(dataUrl);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Chunk every second
      setIsRecording(true);

      // Auto-stop after maxDuration
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
        }
      }, maxDuration * 1000);
    } catch (err) {
      setError("Impossibile accedere alla fotocamera");
      console.error("Recording error:", err);
    }
  }, [maxDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const uploadVideo = useCallback(async () => {
    if (!recordedVideo) return;

    const online = await checkNetwork();

    if (!online) {
      // Save to offline queue
      const uploadData: VideoUpload = {
        id: `video_${Date.now()}`,
        filePath: `videos/catch_${catchId || tournamentId}_${Date.now()}.webm`,
        tournamentId,
        catchId,
        status: "pending",
        progress: 0,
        timestamp: new Date(),
      };

      // Save video locally
      await Filesystem.writeFile({
        path: uploadData.filePath,
        data: recordedVideo.split(",")[1],
        directory: Directory.Data,
        recursive: true,
      });

      // Add to queue
      const queue = await Preferences.get({ key: "videoUploadQueue" });
      const uploads: VideoUpload[] = queue.value ? JSON.parse(queue.value) : [];
      uploads.push(uploadData);
      await Preferences.set({
        key: "videoUploadQueue",
        value: JSON.stringify(uploads),
      });

      setError("Offline - Video salvato per upload successivo");
      setRecordedVideo(null);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simula upload con progress
      const formData = new FormData();
      const blob = await fetch(recordedVideo).then((r) => r.blob());
      formData.append("video", blob, `catch_${catchId || tournamentId}_${Date.now()}.webm`);
      formData.append("tournamentId", tournamentId);
      if (catchId) formData.append("catchId", catchId);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          onVideoUploaded(response.videoUrl);
          setRecordedVideo(null);
        } else {
          throw new Error("Upload failed");
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        setError("Errore durante l'upload");
        setIsUploading(false);
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      xhr.open("POST", `${apiUrl}/api/catches/video`);
      xhr.send(formData);
    } catch (err) {
      setError("Errore durante l'upload");
      setIsUploading(false);
      console.error("Upload error:", err);
    }
  }, [recordedVideo, tournamentId, catchId, checkNetwork, onVideoUploaded]);

  const discardVideo = useCallback(() => {
    setRecordedVideo(null);
    setError(null);
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Cattura
          </span>
          {isOnline ? (
            <Wifi className="h-4 w-4 text-emerald-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-amber-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video preview/recording area */}
        <div className="relative bg-black rounded-lg aspect-video overflow-hidden">
          {recordedVideo ? (
            <video
              src={recordedVideo}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {isRecording && (
            <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-600 text-white px-2 py-1 rounded text-sm animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full" />
              REC
            </div>
          )}
        </div>

        {/* Duration info */}
        <p className="text-xs text-muted-foreground text-center">
          Durata massima: {maxDuration} secondi
        </p>

        {/* Upload progress */}
        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-sm text-center text-muted-foreground">
              Upload: {uploadProgress}%
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-sm rounded-lg flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {!recordedVideo ? (
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex-1 ${isRecording ? "bg-red-600 hover:bg-red-700" : ""}`}
            >
              {isRecording ? (
                <>Stop Registrazione</>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Registra Video
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={discardVideo} className="flex-1">
                Elimina
              </Button>
              <Button
                onClick={uploadVideo}
                disabled={isUploading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Carica
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
