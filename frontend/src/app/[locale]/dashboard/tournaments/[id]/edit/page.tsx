/**
 * =============================================================================
 * TOURNAMENT EDIT PAGE
 * =============================================================================
 * Pagina modifica dettagli torneo
 * Permette di modificare tutti i campi del torneo
 * =============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Trophy } from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  discipline: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationOpens: string;
  registrationCloses: string;
  location: string;
  locationLat: string | null;
  locationLng: string | null;
  registrationFee: string;
  maxParticipants: number | null;
  minParticipants: number | null;
  minWeight: string | null;
  maxCatchesPerDay: number | null;
  pointsPerKg: string | null;
  bonusPoints: number | null;
  bannerImage: string | null;
}

const disciplines = [
  { value: "BIG_GAME", label: "Big Game" },
  { value: "DRIFTING", label: "Drifting" },
  { value: "TRAINA_COSTIERA", label: "Traina Costiera" },
  { value: "BOLENTINO", label: "Bolentino" },
  { value: "EGING", label: "Eging" },
  { value: "VERTICAL_JIGGING", label: "Vertical Jigging" },
  { value: "SHORE", label: "Pesca da Riva" },
  { value: "SOCIAL", label: "Evento Sociale" },
];

export default function TournamentEditPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const locale = (params.locale as string) || "it";
  const tournamentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Tournament>>({});

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchTournament = async () => {
      if (!token || !tournamentId) return;

      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const t = data.data;
          setFormData({
            name: t.name,
            description: t.description || "",
            discipline: t.discipline,
            startDate: t.startDate?.slice(0, 16) || "",
            endDate: t.endDate?.slice(0, 16) || "",
            registrationOpens: t.registrationOpens?.slice(0, 16) || "",
            registrationCloses: t.registrationCloses?.slice(0, 16) || "",
            location: t.location,
            locationLat: t.locationLat || "",
            locationLng: t.locationLng || "",
            registrationFee: t.registrationFee || "0",
            maxParticipants: t.maxParticipants,
            minParticipants: t.minParticipants,
            minWeight: t.minWeight || "",
            maxCatchesPerDay: t.maxCatchesPerDay,
            pointsPerKg: t.pointsPerKg || "",
            bonusPoints: t.bonusPoints || 0,
          });
        } else {
          setError("Torneo non trovato");
        }
      } catch (err) {
        setError("Errore nel caricamento");
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [token, tournamentId, API_URL]);

  const handleChange = (field: keyof Tournament, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          discipline: formData.discipline,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
          registrationOpens: formData.registrationOpens ? new Date(formData.registrationOpens).toISOString() : undefined,
          registrationCloses: formData.registrationCloses ? new Date(formData.registrationCloses).toISOString() : undefined,
          location: formData.location,
          locationLat: formData.locationLat ? parseFloat(formData.locationLat as string) : null,
          locationLng: formData.locationLng ? parseFloat(formData.locationLng as string) : null,
          registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee as string) : 0,
          maxParticipants: formData.maxParticipants || null,
          minParticipants: formData.minParticipants || null,
          minWeight: formData.minWeight ? parseFloat(formData.minWeight as string) : null,
          maxCatchesPerDay: formData.maxCatchesPerDay || null,
          pointsPerKg: formData.pointsPerKg ? parseFloat(formData.pointsPerKg as string) : null,
          bonusPoints: formData.bonusPoints || 0,
        }),
      });

      if (res.ok) {
        router.push(`/${locale}/dashboard/tournaments/${tournamentId}`);
      } else {
        const err = await res.json();
        setError(err.message || "Errore nel salvataggio");
      }
    } catch (err) {
      setError("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Torna indietro
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/dashboard/tournaments/${tournamentId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna al torneo
        </Link>
        <h1 className="text-2xl font-bold">Modifica Torneo</h1>
        <p className="text-muted-foreground">Aggiorna i dettagli del torneo</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Torneo *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discipline">Disciplina *</Label>
                <Select
                  value={formData.discipline}
                  onValueChange={(v) => handleChange("discipline", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplines.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Luogo *</Label>
                <Input
                  id="location"
                  value={formData.location || ""}
                  onChange={(e) => handleChange("location", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationLat">Latitudine</Label>
                <Input
                  id="locationLat"
                  type="number"
                  step="0.0001"
                  value={formData.locationLat || ""}
                  onChange={(e) => handleChange("locationLat", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationLng">Longitudine</Label>
                <Input
                  id="locationLng"
                  type="number"
                  step="0.0001"
                  value={formData.locationLng || ""}
                  onChange={(e) => handleChange("locationLng", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Date e Orari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data/Ora Inizio *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate || ""}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data/Ora Fine *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate || ""}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationOpens">Apertura Iscrizioni</Label>
                <Input
                  id="registrationOpens"
                  type="datetime-local"
                  value={formData.registrationOpens || ""}
                  onChange={(e) => handleChange("registrationOpens", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationCloses">Chiusura Iscrizioni</Label>
                <Input
                  id="registrationCloses"
                  type="datetime-local"
                  value={formData.registrationCloses || ""}
                  onChange={(e) => handleChange("registrationCloses", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Iscrizioni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationFee">Quota Iscrizione (EUR)</Label>
                <Input
                  id="registrationFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.registrationFee || ""}
                  onChange={(e) => handleChange("registrationFee", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minParticipants">Min Partecipanti</Label>
                <Input
                  id="minParticipants"
                  type="number"
                  min="1"
                  value={formData.minParticipants || ""}
                  onChange={(e) => handleChange("minParticipants", parseInt(e.target.value) || null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Max Partecipanti</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  value={formData.maxParticipants || ""}
                  onChange={(e) => handleChange("maxParticipants", parseInt(e.target.value) || null)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Regolamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minWeight">Peso Minimo (kg)</Label>
                <Input
                  id="minWeight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.minWeight || ""}
                  onChange={(e) => handleChange("minWeight", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCatchesPerDay">Max Catture/Giorno</Label>
                <Input
                  id="maxCatchesPerDay"
                  type="number"
                  min="1"
                  value={formData.maxCatchesPerDay || ""}
                  onChange={(e) => handleChange("maxCatchesPerDay", parseInt(e.target.value) || null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointsPerKg">Punti per Kg</Label>
                <Input
                  id="pointsPerKg"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.pointsPerKg || ""}
                  onChange={(e) => handleChange("pointsPerKg", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonusPoints">Punti Bonus</Label>
                <Input
                  id="bonusPoints"
                  type="number"
                  min="0"
                  value={formData.bonusPoints || ""}
                  onChange={(e) => handleChange("bonusPoints", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annulla
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salva Modifiche
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
