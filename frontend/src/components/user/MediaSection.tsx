/**
 * =============================================================================
 * MEDIA SECTION - User Photos & Videos
 * =============================================================================
 * Galleria media utente con:
 * - Grid responsive foto/video
 * - Upload con categorizzazione
 * - Filtri per categoria
 * - Visualizzazione dettaglio
 * =============================================================================
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Video,
  Plus,
  Loader2,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  MapPin,
  X,
  Upload,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Types
interface UserMedia {
  id: string;
  type: "PHOTO" | "VIDEO";
  category: string;
  filename: string;
  path: string;
  thumbnailPath?: string;
  title?: string;
  description?: string;
  tags?: string[];
  width?: number;
  height?: number;
  duration?: number;
  takenAt?: string;
  locationName?: string;
  isPublic: boolean;
  createdAt: string;
  boat?: { id: string; name: string };
  equipment?: { id: string; name: string };
  tournament?: { id: string; name: string };
}

interface MediaSectionProps {
  primaryColor?: string;
}

// Labels
const categoryLabels: Record<string, string> = {
  FISHING_ACTIVITY: "Attivita di Pesca",
  RACE: "Gara",
  TOURNAMENT: "Torneo",
  BOAT: "Barca",
  EQUIPMENT: "Attrezzatura",
  CATCH: "Cattura",
  OTHER: "Altro",
};

// Format date
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MediaSection({ primaryColor = "#0066CC" }: MediaSectionProps) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [media, setMedia] = useState<UserMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  // View dialog
  const [viewingMedia, setViewingMedia] = useState<UserMedia | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState("OTHER");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadIsPublic, setUploadIsPublic] = useState(false);

  // Fetch media
  useEffect(() => {
    async function fetchMedia() {
      if (!token) return;

      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/user-media?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Errore nel caricamento");

        const data = await res.json();
        setMedia(data.data || []);
      } catch (err) {
        console.error("Error fetching media:", err);
        setError("Impossibile caricare i media");
      } finally {
        setLoading(false);
      }
    }

    fetchMedia();
  }, [token]);

  // Filter media
  const filteredMedia = media.filter((m) => {
    if (filterType !== "ALL" && m.type !== filterType) return false;
    if (filterCategory !== "ALL" && m.category !== filterCategory) return false;
    return true;
  });

  // Get counts
  const photosCount = media.filter((m) => m.type === "PHOTO").length;
  const videosCount = media.filter((m) => m.type === "VIDEO").length;

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];

      // Validate file type
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        setUploadError("Tipo file non supportato. Usa JPG, PNG, GIF, MP4, MOV o WebM.");
        return;
      }

      setUploadFile(file);
      setUploadError(null);

      // Create preview for images only (videos are too large)
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadPreview(null);
      }
    }
  };

  // Reset upload form
  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadCategory("OTHER");
    setUploadTitle("");
    setUploadDescription("");
    setUploadIsPublic(false);
    setUploadError(null);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload media
  const handleUpload = async () => {
    setUploadError(null);

    if (!uploadFile) {
      setUploadError("Seleziona un file da caricare");
      return;
    }

    if (!token) {
      setUploadError("Sessione scaduta - effettua nuovamente il login");
      return;
    }

    console.log("Upload debug:", { hasFile: !!uploadFile, category: uploadCategory });

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", uploadCategory);
      if (uploadTitle) formData.append("title", uploadTitle);
      if (uploadDescription) formData.append("description", uploadDescription);
      formData.append("isPublic", String(uploadIsPublic));

      const res = await fetch(`${API_URL}/api/user-media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Errore nel caricamento");
      }

      const data = await res.json();
      setMedia([data.data, ...media]);
      setUploadOpen(false);
      resetUploadForm();
    } catch (err) {
      console.error("Error uploading:", err);
      setUploadError(err instanceof Error ? err.message : "Errore durante il caricamento");
    } finally {
      setUploading(false);
    }
  };

  // Delete media
  const handleDelete = async () => {
    if (!token || !deleteId) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/user-media/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Errore nell'eliminazione");

      setMedia(media.filter((m) => m.id !== deleteId));
      setDeleteId(null);
      if (viewingMedia?.id === deleteId) {
        setViewingMedia(null);
      }
    } catch (err) {
      console.error("Error deleting media:", err);
      alert("Errore durante l'eliminazione");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="h-5 w-5" style={{ color: primaryColor }} />
          I Miei Media
          <Badge variant="secondary" className="ml-2">
            {photosCount} foto, {videosCount} video
          </Badge>
        </h3>
        <Button
          size="sm"
          onClick={() => setUploadOpen(true)}
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Carica Media
        </Button>
      </div>

      {/* Filters */}
      {media.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* Type Filter */}
          <div className="flex gap-1">
            <Button
              variant={filterType === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("ALL")}
            >
              Tutti
            </Button>
            <Button
              variant={filterType === "PHOTO" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("PHOTO")}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Foto
            </Button>
            <Button
              variant={filterType === "VIDEO" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("VIDEO")}
            >
              <Video className="h-4 w-4 mr-1" />
              Video
            </Button>
          </div>

          {/* Category Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tutte le categorie</SelectItem>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Media Grid */}
      {media.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-4">
              Non hai ancora caricato nessun media
            </p>
            <Button
              onClick={() => setUploadOpen(true)}
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Carica il tuo primo media
            </Button>
          </CardContent>
        </Card>
      ) : filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nessun media trovato con i filtri selezionati
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden bg-muted"
              onClick={() => setViewingMedia(item)}
            >
              {/* Thumbnail */}
              {item.thumbnailPath || item.path ? (
                <img
                  src={item.thumbnailPath || item.path}
                  alt={item.title || item.filename}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {item.type === "VIDEO" ? (
                    <Video className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

              {/* Type Badge */}
              <div className="absolute top-2 left-2">
                {item.type === "VIDEO" && (
                  <Badge className="bg-black/60 text-white text-xs">
                    <Video className="h-3 w-3 mr-1" />
                    Video
                  </Badge>
                )}
              </div>

              {/* Visibility */}
              <div className="absolute top-2 right-2">
                {item.isPublic ? (
                  <Eye className="h-4 w-4 text-white drop-shadow" />
                ) : (
                  <EyeOff className="h-4 w-4 text-white/60 drop-shadow" />
                )}
              </div>

              {/* Title on hover */}
              {item.title && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{item.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(open) => {
        setUploadOpen(open);
        if (!open) resetUploadForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Carica Media
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Input */}
            <div>
              <Label>File</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'hover:border-primary'}`}
              >
                {uploadPreview ? (
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    className="max-h-40 mx-auto rounded"
                  />
                ) : uploadFile ? (
                  <div className="space-y-2">
                    <Video className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">{uploadFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clicca o trascina foto/video qui
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max 100MB - JPG, PNG, GIF, MP4, MOV, WebM
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <Label>Categoria</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label>Titolo (opzionale)</Label>
              <Input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Es: Cattura record 2024"
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label>Descrizione (opzionale)</Label>
              <Textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Descrivi il tuo media..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Public toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Visibilita pubblica</Label>
                <p className="text-xs text-muted-foreground">
                  Rendi visibile a tutti i membri
                </p>
              </div>
              <Switch
                checked={uploadIsPublic}
                onCheckedChange={setUploadIsPublic}
              />
            </div>
          </div>

          {uploadError && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {uploadError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
              style={{ backgroundColor: primaryColor }}
            >
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Carica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingMedia} onOpenChange={() => setViewingMedia(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewingMedia?.title || viewingMedia?.filename}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingMedia(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {viewingMedia && (
            <div className="space-y-4">
              {/* Media Display */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                {viewingMedia.type === "VIDEO" ? (
                  <video
                    src={viewingMedia.path}
                    controls
                    className="max-w-full max-h-full"
                  />
                ) : (
                  <img
                    src={viewingMedia.path}
                    alt={viewingMedia.title || viewingMedia.filename}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Categoria</p>
                  <Badge variant="outline">
                    {categoryLabels[viewingMedia.category] || viewingMedia.category}
                  </Badge>
                </div>

                <div>
                  <p className="text-muted-foreground">Visibilita</p>
                  <Badge variant={viewingMedia.isPublic ? "default" : "secondary"}>
                    {viewingMedia.isPublic ? "Pubblico" : "Privato"}
                  </Badge>
                </div>

                {viewingMedia.takenAt && (
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Scattata il
                    </p>
                    <p>{formatDate(viewingMedia.takenAt)}</p>
                  </div>
                )}

                {viewingMedia.locationName && (
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Luogo
                    </p>
                    <p>{viewingMedia.locationName}</p>
                  </div>
                )}

                {viewingMedia.boat && (
                  <div>
                    <p className="text-muted-foreground">Barca</p>
                    <p>{viewingMedia.boat.name}</p>
                  </div>
                )}

                {viewingMedia.tournament && (
                  <div>
                    <p className="text-muted-foreground">Torneo</p>
                    <p>{viewingMedia.tournament.name}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {viewingMedia.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrizione</p>
                  <p className="text-sm">{viewingMedia.description}</p>
                </div>
              )}

              {/* Tags */}
              {viewingMedia.tags && viewingMedia.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {viewingMedia.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    setDeleteId(viewingMedia.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Sei sicuro di voler eliminare questo media? L'azione non puo essere annullata.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
