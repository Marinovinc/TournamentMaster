/**
 * =============================================================================
 * EQUIPMENT SECTION - User Fishing Equipment Management
 * =============================================================================
 * Catalogo attrezzature pesca con:
 * - Lista attrezzature con filtri per tipo
 * - Creazione/modifica via dialog
 * - Tracciamento condizione e valore
 * - Mobile-first design
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

interface EquipmentSectionProps {
  primaryColor?: string;
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

export default function EquipmentSection({ primaryColor = "#0066CC" }: EquipmentSectionProps) {
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

  // Fetch equipment
  useEffect(() => {
    async function fetchEquipment() {
      if (!token) return;

      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/equipment`, {
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
  }, [token]);

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
        <Button onClick={handleAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi
        </Button>
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
              Non hai ancora registrato nessuna attrezzatura
            </p>
            <Button onClick={handleAddNew} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi la tua prima attrezzatura
            </Button>
          </CardContent>
        </Card>
      ) : filteredEquipment.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nessuna attrezzatura di questo tipo
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((item) => (
            <Card key={item.id} className="overflow-hidden">
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
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
}
