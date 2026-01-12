/**
 * =============================================================================
 * FISHING ZONES MANAGEMENT PAGE
 * =============================================================================
 * Pagina gestione zone di pesca per il torneo
 * Permette di aggiungere, modificare e rimuovere zone di pesca
 * =============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Navigation,
  Search,
} from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";

interface FishingZone {
  id: string;
  name: string;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  radius: number | null;
  isActive: boolean;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
}

export default function ZonesManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const locale = (params.locale as string) || "it";
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [zones, setZones] = useState<FishingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<FishingZone | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<FishingZone | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    latitude: "",
    longitude: "",
    radius: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    fetchData();
  }, [token, tournamentId]);

  const fetchData = async () => {
    if (!token || !tournamentId) return;

    try {
      setLoading(true);

      // Fetch tournament info
      const tournamentRes = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tournamentRes.ok) {
        const tournamentData = await tournamentRes.json();
        setTournament(tournamentData.data);
      }

      // Fetch zones
      const zonesRes = await fetch(`${API_URL}/api/tournaments/${tournamentId}/zones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (zonesRes.ok) {
        const zonesData = await zonesRes.json();
        setZones(zonesData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (zone?: FishingZone) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({
        name: zone.name,
        description: zone.description || "",
        latitude: zone.latitude || "",
        longitude: zone.longitude || "",
        radius: zone.radius?.toString() || "",
      });
    } else {
      setEditingZone(null);
      setFormData({
        name: "",
        description: "",
        latitude: "",
        longitude: "",
        radius: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!token || !formData.name.trim()) return;

    try {
      setSaving(true);
      const url = editingZone
        ? `${API_URL}/api/tournaments/${tournamentId}/zones/${editingZone.id}`
        : `${API_URL}/api/tournaments/${tournamentId}/zones`;

      const res = await fetch(url, {
        method: editingZone ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          radius: formData.radius ? parseInt(formData.radius) : null,
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || "Errore nel salvataggio");
      }
    } catch (err) {
      alert("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !zoneToDelete) return;

    try {
      const res = await fetch(
        `${API_URL}/api/tournaments/${tournamentId}/zones/${zoneToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setDeleteDialogOpen(false);
        setZoneToDelete(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || "Errore nell'eliminazione");
      }
    } catch (err) {
      alert("Errore di rete");
    }
  };

  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/dashboard/tournaments/${tournamentId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna al torneo
          </Link>
          <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Zone di Pesca
          </h1>
          <HelpGuide pageKey="tournamentZones" position="inline" isAdmin={true} />
        </div>
        <p className="text-muted-foreground">
            {tournament?.name} - Gestisci le zone di pesca consentite
          </p>
        </div>

        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Zona
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{zones.length}</p>
              <p className="text-sm text-muted-foreground">Zone Totali</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {zones.filter(z => z.isActive).length}
              </p>
              <p className="text-sm text-muted-foreground">Attive</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {zones.filter(z => z.latitude && z.longitude).length}
              </p>
              <p className="text-sm text-muted-foreground">Con Coordinate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca zone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Zones List */}
      <Card>
        <CardHeader>
          <CardTitle>Elenco Zone</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredZones.length > 0 ? (
            <div className="space-y-3">
              {filteredZones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{zone.name}</p>
                        <Badge variant={zone.isActive ? "default" : "secondary"}>
                          {zone.isActive ? "Attiva" : "Disattiva"}
                        </Badge>
                      </div>
                      {zone.description && (
                        <p className="text-sm text-muted-foreground">{zone.description}</p>
                      )}
                      {zone.latitude && zone.longitude && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Navigation className="h-3 w-3" />
                          {parseFloat(zone.latitude).toFixed(4)}, {parseFloat(zone.longitude).toFixed(4)}
                          {zone.radius && ` • Raggio: ${zone.radius}m`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(zone)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => {
                        setZoneToDelete(zone);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessuna zona di pesca definita</p>
              <Button variant="link" onClick={() => handleOpenDialog()}>
                Aggiungi la prima zona
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingZone ? "Modifica Zona" : "Nuova Zona di Pesca"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Zona *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="es. Zona Nord, Banco dei Coralli..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione opzionale della zona..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitudine</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="40.7128"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitudine</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="13.9456"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Raggio (metri)</Label>
              <Input
                id="radius"
                type="number"
                value={formData.radius}
                onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                placeholder="1000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
              {saving ? "Salvataggio..." : editingZone ? "Salva" : "Crea Zona"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa zona?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare la zona "{zoneToDelete?.name}". Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
