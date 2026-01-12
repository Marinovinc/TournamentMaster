/**
 * =============================================================================
 * BOATS SECTION - User Personal Fleet Management
 * =============================================================================
 * Gestione barche personali dell'utente con:
 * - Lista barche con card responsive
 * - Creazione/modifica barca via dialog
 * - Disponibilita per gare/tornei
 * - Mobile-first design
 * =============================================================================
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { getMediaUrl } from "@/lib/media";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Anchor,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Ship,
  MapPin,
  Users,
  Gauge,
  Calendar,
  CheckCircle,
  XCircle,
  Camera,
  Video,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Types
interface Boat {
  id: string;
  name: string;
  type: string;
  lengthMeters: number;
  beamMeters?: number;
  photo?: string;
  homePort?: string;
  seats?: number;
  year?: number;
  make?: string;
  model?: string;
  engineType: string;
  enginePower?: number;
  engineMake?: string;
  registrationNumber?: string;
  flagState?: string;
  insuranceExpiry?: string;
  revisionExpiry?: string;
  isAvailableForRaces: boolean;
  availabilityNotes?: string;
  createdAt: string;
}


interface BoatMedia {
  id: string;
  type: "PHOTO" | "VIDEO";
  filename: string;
  path: string;
  thumbnailPath?: string;
  title?: string;
  createdAt: string;
}
interface BoatsSectionProps {
  primaryColor?: string;
  viewUserId?: string; // Admin viewing another user's boats
  readOnly?: boolean;  // Admin view is read-only
}

// Labels
const boatTypeLabels: Record<string, string> = {
  FISHING_BOAT: "Peschereccio",
  SAILING_YACHT: "Yacht a vela",
  MOTOR_YACHT: "Yacht a motore",
  RIB: "Gommone",
  CENTER_CONSOLE: "Open",
  CABIN_CRUISER: "Cabinato",
  SPORT_FISHING: "Sportivo da pesca",
  OTHER: "Altro",
};

const engineTypeLabels: Record<string, string> = {
  OUTBOARD: "Fuoribordo",
  INBOARD: "Entrobordo",
  STERN_DRIVE: "Entrofuoribordo",
  SAIL: "Vela",
  HYBRID: "Ibrido",
  NONE: "Nessuno",
};

const defaultBoatForm = {
  name: "",
  type: "OTHER",
  lengthMeters: "",
  beamMeters: "",
  homePort: "",
  seats: "4",
  year: "",
  make: "",
  model: "",
  engineType: "OUTBOARD",
  enginePower: "",
  engineMake: "",
  registrationNumber: "",
  flagState: "",
  isAvailableForRaces: true,
  availabilityNotes: "",
};

export default function BoatsSection({ primaryColor = "#0066CC", viewUserId, readOnly = false }: BoatsSectionProps) {
  const { token } = useAuth();

  // State
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [form, setForm] = useState(defaultBoatForm);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Media gallery state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaDialogBoat, setMediaDialogBoat] = useState<Boat | null>(null);
  const [boatMedia, setBoatMedia] = useState<BoatMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [viewingMedia, setViewingMedia] = useState<BoatMedia | null>(null);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);

  // Media inline per ogni barca
  const [boatMediaMap, setBoatMediaMap] = useState<Record<string, BoatMedia[]>>({});

  // Fetch boats
  useEffect(() => {
    async function fetchBoats() {
      if (!token) return;

      setLoading(true);
      try {
        const userIdParam = viewUserId ? `?userId=${viewUserId}` : "";
        const res = await fetch(`${API_URL}/api/boats${userIdParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Errore nel caricamento");

        const data = await res.json();
        setBoats(data.data || []);
      } catch (err) {
        console.error("Error fetching boats:", err);
        setError("Impossibile caricare le barche");
      } finally {
        setLoading(false);
      }
    }

    fetchBoats();
  }, [token, viewUserId]);

  // Fetch media for all boats (inline display)
  useEffect(() => {
    async function fetchAllBoatMedia() {
      if (!token || boats.length === 0) return;

      const mediaMap: Record<string, BoatMedia[]> = {};

      await Promise.all(
        boats.map(async (boat) => {
          try {
            const res = await fetch(`${API_URL}/api/user-media?boatId=${boat.id}&limit=4`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.data && data.data.length > 0) {
                mediaMap[boat.id] = data.data;
              }
            }
          } catch (err) {
            console.error(`Error fetching media for boat ${boat.id}:`, err);
          }
        })
      );

      setBoatMediaMap(mediaMap);
    }

    fetchAllBoatMedia();
  }, [token, boats]);

  // Open dialog for new boat
  const handleAddNew = () => {
    setEditingBoat(null);
    setForm(defaultBoatForm);
    setIsDialogOpen(true);
  };

  // Open dialog for edit
  const handleEdit = (boat: Boat) => {
    setEditingBoat(boat);
    setForm({
      name: boat.name,
      type: boat.type,
      lengthMeters: boat.lengthMeters?.toString() || "",
      beamMeters: boat.beamMeters?.toString() || "",
      homePort: boat.homePort || "",
      seats: boat.seats?.toString() || "4",
      year: boat.year?.toString() || "",
      make: boat.make || "",
      model: boat.model || "",
      engineType: boat.engineType,
      enginePower: boat.enginePower?.toString() || "",
      engineMake: boat.engineMake || "",
      registrationNumber: boat.registrationNumber || "",
      flagState: boat.flagState || "",
      isAvailableForRaces: boat.isAvailableForRaces,
      availabilityNotes: boat.availabilityNotes || "",
    });
    setIsDialogOpen(true);
  };

  // Save boat
  const handleSave = async () => {
    if (!token || !form.name || !form.lengthMeters) return;

    setSaving(true);
    try {
      const url = editingBoat
        ? `${API_URL}/api/boats/${editingBoat.id}`
        : `${API_URL}/api/boats`;
      const method = editingBoat ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Errore nel salvataggio");

      const data = await res.json();

      if (editingBoat) {
        setBoats(boats.map((b) => (b.id === editingBoat.id ? data.data : b)));
      } else {
        setBoats([data.data, ...boats]);
      }

      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error saving boat:", err);
      alert("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  // Delete boat
  const handleDelete = async () => {
    if (!token || !deleteId) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/boats/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Errore nell'eliminazione");

      setBoats(boats.filter((b) => b.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting boat:", err);
      alert("Errore durante l'eliminazione");
    } finally {
      setDeleting(false);
    }
  };

  // Open media gallery for a boat
  const handleOpenMediaGallery = async (boat: Boat) => {
    setMediaDialogBoat(boat);
    setLoadingMedia(true);
    try {
      const res = await fetch(`${API_URL}/api/user-media?boatId=${boat.id}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBoatMedia(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching boat media:", err);
    } finally {
      setLoadingMedia(false);
    }
  };

  // Handle file selection for boat media
  const handleMediaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };

  // Handle drag and drop for boat media
  const handleMediaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
      setUploadFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setUploadPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setUploadPreview(null);
      }
    }
  };

  // Upload media for boat
  const handleUploadBoatMedia = async () => {
    if (!uploadFile || !token || !mediaDialogBoat) return;
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", "BOAT");
      formData.append("boatId", mediaDialogBoat.id);
      formData.append("isPublic", "false");

      const res = await fetch(`${API_URL}/api/user-media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setBoatMedia([data.data, ...boatMedia]);
        setUploadFile(null);
        setUploadPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error uploading boat media:", err);
    } finally {
      setUploadingMedia(false);
    }
  };

  // Delete boat media
  const handleDeleteBoatMedia = async (mediaId: string) => {
    if (!token) return;
    setDeletingMediaId(mediaId);
    try {
      const res = await fetch(`${API_URL}/api/user-media/${mediaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBoatMedia(boatMedia.filter(m => m.id !== mediaId));
        if (viewingMedia?.id === mediaId) setViewingMedia(null);
      }
    } catch (err) {
      console.error("Error deleting boat media:", err);
    } finally {
      setDeletingMediaId(null);
    }
  };

  // Close media dialog
  const handleCloseMediaDialog = () => {
    setMediaDialogBoat(null);
    setBoatMedia([]);
    setUploadFile(null);
    setUploadPreview(null);
    setViewingMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Anchor className="h-5 w-5" style={{ color: primaryColor }} />
          Le Mie Barche
        </h3>
        {!readOnly && (
          <Button onClick={handleAddNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Barca
          </Button>
        )}
      </div>

      {/* Boats Grid */}
      {boats.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ship className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-4">
              {readOnly ? "Questo utente non ha registrato barche" : "Non hai ancora registrato nessuna barca"}
            </p>
            {!readOnly && (
              <Button onClick={handleAddNew} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Registra la tua prima barca
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {boats.map((boat) => (
            <div key={boat.id} className="flex gap-4 items-start">
              {/* Card Info */}
              <Card className="flex-1 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{boat.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {boatTypeLabels[boat.type] || boat.type}
                        {boat.make && boat.model && ` - ${boat.make} ${boat.model}`}
                      </p>
                    </div>
                    <Badge
                      variant={boat.isAvailableForRaces ? "default" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      {boat.isAvailableForRaces ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Disponibile
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          Non disponibile
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Ship className="h-4 w-4" />
                      <span>{boat.lengthMeters}m</span>
                      {boat.beamMeters && <span>x {boat.beamMeters}m</span>}
                    </div>
                    {boat.homePort && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{boat.homePort}</span>
                      </div>
                    )}
                    {boat.seats && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{boat.seats} posti</span>
                      </div>
                    )}
                    {boat.enginePower && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Gauge className="h-4 w-4" />
                        <span>{boat.enginePower} HP</span>
                      </div>
                    )}
                    {boat.year && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{boat.year}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenMediaGallery(boat)}
                    >
                      <Camera className="h-4 w-4" />
                      {boatMediaMap[boat.id]?.length ? (
                        <span className="ml-1 text-xs">{boatMediaMap[boat.id].length}</span>
                      ) : null}
                    </Button>
                    {!readOnly && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(boat)}
                          className="flex-1"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Modifica
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(boat.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Media Panel - affiancato alla card */}
              <div className="w-48 flex-shrink-0">
                {boatMediaMap[boat.id] && boatMediaMap[boat.id].length > 0 ? (
                  <div className="grid grid-cols-2 gap-1">
                    {boatMediaMap[boat.id].slice(0, 4).map((media) => (
                      <div
                        key={media.id}
                        className="relative aspect-square rounded overflow-hidden bg-muted cursor-pointer group"
                        onClick={() => {
                          setMediaDialogBoat(boat);
                          setViewingMedia(media);
                        }}
                      >
                        {media.thumbnailPath || media.path ? (
                          <img
                            src={getMediaUrl(media.thumbnailPath || media.path)}
                            alt={media.title || media.filename}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {media.type === "VIDEO" ? (
                              <Video className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        {media.type === "VIDEO" && (
                          <div className="absolute top-0.5 left-0.5">
                            <Video className="h-3 w-3 text-white drop-shadow-md" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-24 rounded border-2 border-dashed border-muted flex items-center justify-center">
                    <p className="text-xs text-muted-foreground text-center px-2">Nessun media</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBoat ? "Modifica Barca" : "Nuova Barca"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Nome */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome Barca *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Es: Blue Marlin"
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(boatTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lunghezza */}
            <div className="space-y-2">
              <Label htmlFor="lengthMeters">Lunghezza (m) *</Label>
              <Input
                id="lengthMeters"
                type="number"
                step="0.1"
                value={form.lengthMeters}
                onChange={(e) => setForm({ ...form, lengthMeters: e.target.value })}
                placeholder="Es: 8.5"
              />
            </div>

            {/* Larghezza */}
            <div className="space-y-2">
              <Label htmlFor="beamMeters">Larghezza (m)</Label>
              <Input
                id="beamMeters"
                type="number"
                step="0.1"
                value={form.beamMeters}
                onChange={(e) => setForm({ ...form, beamMeters: e.target.value })}
                placeholder="Es: 2.8"
              />
            </div>

            {/* Porto */}
            <div className="space-y-2">
              <Label htmlFor="homePort">Porto Base</Label>
              <Input
                id="homePort"
                value={form.homePort}
                onChange={(e) => setForm({ ...form, homePort: e.target.value })}
                placeholder="Es: Ischia Porto"
              />
            </div>

            {/* Posti */}
            <div className="space-y-2">
              <Label htmlFor="seats">Posti</Label>
              <Input
                id="seats"
                type="number"
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: e.target.value })}
              />
            </div>

            {/* Anno */}
            <div className="space-y-2">
              <Label htmlFor="year">Anno</Label>
              <Input
                id="year"
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder="Es: 2020"
              />
            </div>

            {/* Marca */}
            <div className="space-y-2">
              <Label htmlFor="make">Marca</Label>
              <Input
                id="make"
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                placeholder="Es: Ranieri"
              />
            </div>

            {/* Modello */}
            <div className="space-y-2">
              <Label htmlFor="model">Modello</Label>
              <Input
                id="model"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Es: Voyager 23"
              />
            </div>

            {/* Tipo Motore */}
            <div className="space-y-2">
              <Label>Tipo Motore</Label>
              <Select
                value={form.engineType}
                onValueChange={(v) => setForm({ ...form, engineType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(engineTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Potenza */}
            <div className="space-y-2">
              <Label htmlFor="enginePower">Potenza (HP)</Label>
              <Input
                id="enginePower"
                type="number"
                value={form.enginePower}
                onChange={(e) => setForm({ ...form, enginePower: e.target.value })}
                placeholder="Es: 200"
              />
            </div>

            {/* Disponibilita */}
            <div className="md:col-span-2 flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-base">Disponibile per gare/tornei</Label>
                <p className="text-sm text-muted-foreground">
                  Rendi visibile la tua barca agli organizzatori
                </p>
              </div>
              <Switch
                checked={form.isAvailableForRaces}
                onCheckedChange={(c) => setForm({ ...form, isAvailableForRaces: c })}
              />
            </div>

            {/* Note Disponibilita */}
            {form.isAvailableForRaces && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="availabilityNotes">Note Disponibilita</Label>
                <Textarea
                  id="availabilityNotes"
                  value={form.availabilityNotes}
                  onChange={(e) => setForm({ ...form, availabilityNotes: e.target.value })}
                  placeholder="Es: Disponibile nei weekend, max 4 persone per gare offshore..."
                  rows={2}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name || !form.lengthMeters}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingBoat ? "Salva Modifiche" : "Aggiungi Barca"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Sei sicuro di voler eliminare questa barca? L'azione non puo essere annullata.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    

      {/* Media Gallery Dialog */}
      <Dialog open={!!mediaDialogBoat} onOpenChange={() => handleCloseMediaDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Media di {mediaDialogBoat?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Zone */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleMediaDrop}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'hover:border-primary'}`}
              >
                {uploadPreview ? (
                  <div className="space-y-2">
                    <img src={uploadPreview} alt="Preview" className="max-h-32 mx-auto rounded" />
                    <p className="text-sm">{uploadFile?.name}</p>
                  </div>
                ) : uploadFile ? (
                  <div className="space-y-2">
                    <Video className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">{uploadFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clicca o trascina foto/video della barca
                    </p>
                  </div>
                )}
              </div>
              {uploadFile && (
                <Button
                  onClick={handleUploadBoatMedia}
                  disabled={uploadingMedia}
                  className="w-full mt-2"
                  size="sm"
                >
                  {uploadingMedia && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Carica
                </Button>
              )}
            </div>

            {/* Media Grid */}
            {loadingMedia ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : boatMedia.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Camera className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Nessun media per questa barca</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {boatMedia.map((item) => (
                  <div
                    key={item.id}
                    className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden bg-muted"
                    onClick={() => setViewingMedia(item)}
                  >
                    {item.thumbnailPath || item.path ? (
                      <img
                        src={item.thumbnailPath || item.path}
                        alt={item.title || item.filename}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.type === "VIDEO" ? (
                          <Video className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    {item.type === "VIDEO" && (
                      <div className="absolute top-1 left-1">
                        <Badge className="bg-black/60 text-white text-xs px-1 py-0">
                          <Video className="h-3 w-3" />
                        </Badge>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Single Media Dialog */}
      <Dialog open={!!viewingMedia} onOpenChange={() => setViewingMedia(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewingMedia?.title || viewingMedia?.filename}</DialogTitle>
          </DialogHeader>
          {viewingMedia && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {viewingMedia.type === "VIDEO" ? (
                  <video
                    src={getMediaUrl(viewingMedia.path)}
                    controls
                    autoPlay
                    playsInline
                    className="max-w-full max-h-[60vh] rounded-lg"
                  />
                ) : (
                  <img
                    src={getMediaUrl(viewingMedia.path)}
                    alt={viewingMedia.title || viewingMedia.filename}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg cursor-pointer hover:opacity-90"
                    onClick={() => window.open(getMediaUrl(viewingMedia.path), '_blank')}
                    title="Clicca per aprire in formato originale"
                  />
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDeleteBoatMedia(viewingMedia.id)}
                  disabled={deletingMediaId === viewingMedia.id}
                >
                  {deletingMediaId === viewingMedia.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
