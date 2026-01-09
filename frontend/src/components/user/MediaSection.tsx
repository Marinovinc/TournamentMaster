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

import { useState, useEffect } from "react";
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
            <p className="text-sm text-muted-foreground">
              Il caricamento media sara disponibile prossimamente
            </p>
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
