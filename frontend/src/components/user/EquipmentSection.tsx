/**
 * =============================================================================
 * EQUIPMENT SECTION - User Fishing Equipment Management
 * =============================================================================
 * Catalogo attrezzature pesca con:
 * - Lista attrezzature con filtri per tipo
 * - Creazione/modifica via dialog
 * - Tracciamento condizione e valore
 * - Mobile-first design
 * - Media inline nelle card
 * =============================================================================
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { getMediaUrl } from "@/lib/media";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Package,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Sparkles,
  AlertCircle,
  Camera,
  Video,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Types
interface Equipment {
  id: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  quantity: number;
  condition: string;
  description?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  photo?: string;
  createdAt: string;
}

interface EquipmentMedia {
  id: string;
  type: "PHOTO" | "VIDEO";
  filename: string;
  path: string;
  thumbnailPath?: string;
  title?: string;
  createdAt: string;
}

interface EquipmentSectionProps {
  primaryColor?: string;
  viewUserId?: string; // Admin viewing another user's equipment
  readOnly?: boolean;  // Admin view is read-only
}

// Labels
const equipmentTypeLabels: Record<string, string> = {
  ROD: "Canna",
  REEL: "Mulinello",
  TACKLE_BOX: "Cassetta",
  FISHING_LINE: "Lenza",
  LURE: "Esca artificiale",
  HOOK: "Ami",
  NET: "Guadino/Rete",
  GAFF: "Raffio",
  ELECTRONICS: "Elettronica",
  SAFETY_GEAR: "Sicurezza",
  CLOTHING: "Abbigliamento",
  OTHER: "Altro",
};

const conditionLabels: Record<string, { label: string; color: string }> = {
  NEW: { label: "Nuovo", color: "bg-green-500" },
  EXCELLENT: { label: "Eccellente", color: "bg-blue-500" },
  GOOD: { label: "Buono", color: "bg-cyan-500" },
  FAIR: { label: "Discreto", color: "bg-yellow-500" },
  NEEDS_REPAIR: { label: "Da riparare", color: "bg-red-500" },
};

const defaultEquipmentForm = {
  name: "",
  type: "OTHER",
  brand: "",
  model: "",
  quantity: "1",
  condition: "GOOD",
  description: "",
  purchasePrice: "",
};

export default function EquipmentSection({ primaryColor = "#0066CC", viewUserId, readOnly = false }: EquipmentSectionProps) {
  const { token } = useAuth();

  // State
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [form, setForm] = useState(defaultEquipmentForm);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Media gallery state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaDialogEquipment, setMediaDialogEquipment] = useState<Equipment | null>(null);
  const [equipmentMedia, setEquipmentMedia] = useState<EquipmentMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [viewingMedia, setViewingMedia] = useState<EquipmentMedia | null>(null);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);

  // Media inline per ogni equipment
  const [equipmentMediaMap, setEquipmentMediaMap] = useState<Record<string, EquipmentMedia[]>>({});

  // Fetch equipment
  useEffect(() => {
    async function fetchEquipment() {
      if (!token) return;

      setLoading(true);
      try {
        const userIdParam = viewUserId ? `?userId=${viewUserId}` : "";
        const res = await fetch(`${API_URL}/api/equipment${userIdParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Errore nel caricamento");

        const data = await res.json();
        setEquipment(data.data || []);
      } catch (err) {
        console.error("Error fetching equipment:", err);
        setError("Impossibile caricare le attrezzature");
      } finally {
        setLoading(false);
      }
    }

    fetchEquipment();
  }, [token, viewUserId]);

  // Fetch media for all equipment (inline display)
  useEffect(() => {
    async function fetchAllEquipmentMedia() {
      if (!token || equipment.length === 0) return;

      const mediaMap: Record<string, EquipmentMedia[]> = {};

      await Promise.all(
        equipment.map(async (item) => {
          try {
            const userParam = viewUserId ? `&userId=${viewUserId}` : "";
            const res = await fetch(`${API_URL}/api/user-media?equipmentId=${item.id}&limit=4${userParam}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.data && data.data.length > 0) {
                mediaMap[item.id] = data.data;
              }
            }
          } catch (err) {
            console.error(`Error fetching media for equipment ${item.id}:`, err);
          }
        })
      );

      setEquipmentMediaMap(mediaMap);
    }

    fetchAllEquipmentMedia();
  }, [token, equipment, viewUserId]);

  // Filter equipment
  const filteredEquipment =
    filterType === "ALL"
      ? equipment
      : equipment.filter((e) => e.type === filterType);

  // Open dialog for new equipment
  const handleAddNew = () => {
    setEditingItem(null);
    setForm(defaultEquipmentForm);
    setIsDialogOpen(true);
  };

  // Open dialog for edit
  const handleEdit = (item: Equipment) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      type: item.type,
      brand: item.brand || "",
      model: item.model || "",
      quantity: item.quantity?.toString() || "1",
      condition: item.condition,
      description: item.description || "",
      purchasePrice: item.purchasePrice?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  // Save equipment
  const handleSave = async () => {
    if (!token || !form.name) return;

    setSaving(true);
    try {
      const url = editingItem
        ? `${API_URL}/api/equipment/${editingItem.id}`
        : `${API_URL}/api/equipment`;
      const method = editingItem ? "PUT" : "POST";

      // Clean form data - remove empty strings for optional numeric fields
      const cleanedForm = {
        ...form,
        quantity: form.quantity ? parseInt(form.quantity) : 1,
        purchasePrice: form.purchasePrice ? form.purchasePrice : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanedForm),
      });

      if (!res.ok) throw new Error("Errore nel salvataggio");

      const data = await res.json();

      if (editingItem) {
        setEquipment(equipment.map((e) => (e.id === editingItem.id ? data.data : e)));
      } else {
        setEquipment([data.data, ...equipment]);
      }

      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error saving equipment:", err);
      alert("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  // Open media gallery for equipment
  const handleOpenMediaGallery = async (item: Equipment) => {
    setMediaDialogEquipment(item);
    setLoadingMedia(true);
    try {
      const userParam = viewUserId ? `&userId=${viewUserId}` : "";
      const res = await fetch(`${API_URL}/api/user-media?equipmentId=${item.id}&limit=50${userParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEquipmentMedia(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching equipment media:", err);
    } finally {
      setLoadingMedia(false);
    }
  };

  // Handle file selection for equipment media
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

  // Handle drag and drop for equipment media
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

  // Upload media for equipment
  const handleUploadEquipmentMedia = async () => {
    if (!uploadFile || !token || !mediaDialogEquipment) return;
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", "EQUIPMENT");
      formData.append("equipmentId", mediaDialogEquipment.id);
      formData.append("isPublic", "false");

      const res = await fetch(`${API_URL}/api/user-media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setEquipmentMedia([data.data, ...equipmentMedia]);
        // Update inline media map too
        setEquipmentMediaMap(prev => ({
          ...prev,
          [mediaDialogEquipment.id]: [data.data, ...(prev[mediaDialogEquipment.id] || [])].slice(0, 4)
        }));
        setUploadFile(null);
        setUploadPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error uploading equipment media:", err);
    } finally {
      setUploadingMedia(false);
    }
  };

  // Delete equipment media
  const handleDeleteEquipmentMedia = async (mediaId: string) => {
    if (!token) return;
    setDeletingMediaId(mediaId);
    try {
      const res = await fetch(`${API_URL}/api/user-media/${mediaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEquipmentMedia(equipmentMedia.filter(m => m.id !== mediaId));
        // Update inline media map too
        if (mediaDialogEquipment) {
          setEquipmentMediaMap(prev => ({
            ...prev,
            [mediaDialogEquipment.id]: (prev[mediaDialogEquipment.id] || []).filter(m => m.id !== mediaId)
          }));
        }
        if (viewingMedia?.id === mediaId) setViewingMedia(null);
      }
    } catch (err) {
      console.error("Error deleting equipment media:", err);
    } finally {
      setDeletingMediaId(null);
    }
  };

  // Close media dialog
  const handleCloseMediaDialog = () => {
    setMediaDialogEquipment(null);
    setEquipmentMedia([]);
    setUploadFile(null);
    setUploadPreview(null);
    setViewingMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Delete equipment
  const handleDelete = async () => {
    if (!token || !deleteId) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/equipment/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Errore nell'eliminazione");

      setEquipment(equipment.filter((e) => e.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting equipment:", err);
      alert("Errore durante l'eliminazione");
    } finally {
      setDeleting(false);
    }
  };

  // Get type counts
  const typeCounts = equipment.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + e.quantity;
    return acc;
  }, {} as Record<string, number>);

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
          <Package className="h-5 w-5" style={{ color: primaryColor }} />
          La Mia Attrezzatura
          {equipment.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {equipment.reduce((sum, e) => sum + e.quantity, 0)} pezzi
            </Badge>
          )}
        </h3>
        {!readOnly && (
          <Button onClick={handleAddNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi
          </Button>
        )}
      </div>

      {/* Type Filter */}
      {equipment.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterType === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("ALL")}
          >
            Tutti ({equipment.length})
          </Button>
          {Object.entries(typeCounts).map(([type, count]) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
            >
              {equipmentTypeLabels[type] || type} ({count})
            </Button>
          ))}
        </div>
      )}

      {/* Equipment Grid */}
      {equipment.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-4">
              {readOnly ? "Questo utente non ha registrato attrezzature" : "Non hai ancora registrato nessuna attrezzatura"}
            </p>
            {!readOnly && (
              <Button onClick={handleAddNew} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi la tua prima attrezzatura
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filteredEquipment.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nessuna attrezzatura di questo tipo
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEquipment.map((item) => (
            <div key={item.id} className="flex gap-4 items-start">
              {/* Card Info */}
              <Card className="flex-1 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold truncate">{item.name}</h4>
                        {item.quantity > 1 && (
                          <Badge variant="outline" className="text-xs">
                            x{item.quantity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {equipmentTypeLabels[item.type] || item.type}
                      </p>
                    </div>
                    <Badge
                      className={`${conditionLabels[item.condition]?.color || "bg-gray-500"} text-white text-xs`}
                    >
                      {item.condition === "NEW" && <Sparkles className="h-3 w-3 mr-1" />}
                      {item.condition === "NEEDS_REPAIR" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {conditionLabels[item.condition]?.label || item.condition}
                    </Badge>
                  </div>

                  {(item.brand || item.model) && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.brand} {item.model}
                    </p>
                  )}

                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}

                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenMediaGallery(item)}
                    >
                      <Camera className="h-4 w-4" />
                      {equipmentMediaMap[item.id]?.length ? (
                        <span className="ml-1 text-xs">{equipmentMediaMap[item.id].length}</span>
                      ) : null}
                    </Button>
                    {!readOnly && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="flex-1"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Modifica
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(item.id)}
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
                {equipmentMediaMap[item.id] && equipmentMediaMap[item.id].length > 0 ? (
                  <div className="grid grid-cols-2 gap-1">
                    {equipmentMediaMap[item.id].slice(0, 4).map((media) => (
                      <div
                        key={media.id}
                        className="relative aspect-square rounded overflow-hidden bg-muted cursor-pointer group"
                        onClick={() => {
                          setMediaDialogEquipment(item);
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifica Attrezzatura" : "Nuova Attrezzatura"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Es: Shimano Stradic"
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
                  {Object.entries(equipmentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Marca */}
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Es: Shimano"
                />
              </div>

              {/* Modello */}
              <div className="space-y-2">
                <Label htmlFor="model">Modello</Label>
                <Input
                  id="model"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Es: 4000 XG"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Quantita */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantita</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>

              {/* Condizione */}
              <div className="space-y-2">
                <Label>Condizione</Label>
                <Select
                  value={form.condition}
                  onValueChange={(v) => setForm({ ...form, condition: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(conditionLabels).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descrizione */}
            <div className="space-y-2">
              <Label htmlFor="description">Note</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Dettagli aggiuntivi..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingItem ? "Salva" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Sei sicuro di voler eliminare questa attrezzatura?
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

      {/* Media Gallery Dialog */}
      <Dialog open={!!mediaDialogEquipment} onOpenChange={() => handleCloseMediaDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Media di {mediaDialogEquipment?.name}
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
                      Clicca o trascina foto/video della attrezzatura
                    </p>
                  </div>
                )}
              </div>
              {uploadFile && (
                <Button
                  onClick={handleUploadEquipmentMedia}
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
            ) : equipmentMedia.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Camera className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Nessun media per questa attrezzatura</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {equipmentMedia.map((media) => (
                  <div
                    key={media.id}
                    className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden bg-muted"
                    onClick={() => setViewingMedia(media)}
                  >
                    {media.thumbnailPath || media.path ? (
                      <img
                        src={getMediaUrl(media.thumbnailPath || media.path)}
                        alt={media.title || media.filename}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {media.type === "VIDEO" ? (
                          <Video className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    {media.type === "VIDEO" && (
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
                  onClick={() => handleDeleteEquipmentMedia(viewingMedia.id)}
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
