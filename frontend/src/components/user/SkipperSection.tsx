/**
 * =============================================================================
 * SKIPPER SECTION - Skipper Profile Management
 * =============================================================================
 * Gestione profilo skipper con:
 * - Disponibilita come skipper
 * - Patente nautica e dettagli
 * - Esperienza e specializzazioni
 * - Tariffa e area servizio
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Navigation,
  Loader2,
  Save,
  CheckCircle,
  XCircle,
  Award,
  Clock,
  MapPin,
  Ship,
  CreditCard,
  Calendar,
  Shield,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Types
interface SkipperProfile {
  id: string;
  isAvailable: boolean;
  licenseType: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  yearsOfExperience: number;
  canOperateTypes?: string[];
  maxBoatLength?: number;
  specializations?: string[];
  hourlyRate?: number;
  availabilityNotes?: string;
  serviceArea?: string;
  isVerified: boolean;
}

interface SkipperSectionProps {
  primaryColor?: string;
}

// Labels
const licenseTypeLabels: Record<string, string> = {
  NONE: "Nessuna patente",
  ENTRO_12_MIGLIA: "Entro 12 miglia",
  SENZA_LIMITI: "Senza limiti",
  SHIP_MASTER: "Comandante",
};

const boatTypesOptions = [
  { value: "FISHING_BOAT", label: "Peschereccio" },
  { value: "MOTOR_YACHT", label: "Yacht a motore" },
  { value: "SAILING_YACHT", label: "Yacht a vela" },
  { value: "RIB", label: "Gommone" },
  { value: "CENTER_CONSOLE", label: "Open" },
  { value: "CABIN_CRUISER", label: "Cabinato" },
  { value: "SPORT_FISHING", label: "Sportivo" },
];

const specializationsOptions = [
  { value: "BIG_GAME", label: "Big Game" },
  { value: "DRIFTING", label: "Drifting" },
  { value: "TRAINA_COSTIERA", label: "Traina Costiera" },
  { value: "BOLENTINO", label: "Bolentino" },
  { value: "VERTICAL_JIGGING", label: "Vertical Jigging" },
  { value: "EGING", label: "Eging" },
  { value: "SHORE", label: "Shore" },
];

export default function SkipperSection({ primaryColor = "#0066CC" }: SkipperSectionProps) {
  const { token } = useAuth();

  // State
  const [profile, setProfile] = useState<SkipperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [form, setForm] = useState({
    isAvailable: false,
    licenseType: "NONE",
    licenseNumber: "",
    licenseExpiry: "",
    yearsOfExperience: "0",
    canOperateTypes: [] as string[],
    maxBoatLength: "",
    specializations: [] as string[],
    hourlyRate: "",
    availabilityNotes: "",
    serviceArea: "",
  });

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      if (!token) return;

      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/skippers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Errore nel caricamento");

        const data = await res.json();
        if (data.data) {
          setProfile(data.data);
          setForm({
            isAvailable: data.data.isAvailable || false,
            licenseType: data.data.licenseType || "NONE",
            licenseNumber: data.data.licenseNumber || "",
            licenseExpiry: data.data.licenseExpiry?.split("T")[0] || "",
            yearsOfExperience: data.data.yearsOfExperience?.toString() || "0",
            canOperateTypes: data.data.canOperateTypes || [],
            maxBoatLength: data.data.maxBoatLength?.toString() || "",
            specializations: data.data.specializations || [],
            hourlyRate: data.data.hourlyRate?.toString() || "",
            availabilityNotes: data.data.availabilityNotes || "",
            serviceArea: data.data.serviceArea || "",
          });
        }
      } catch (err) {
        console.error("Error fetching skipper profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [token]);

  // Update form with change tracking
  const updateForm = (updates: Partial<typeof form>) => {
    setForm({ ...form, ...updates });
    setHasChanges(true);
  };

  // Toggle array value
  const toggleArrayValue = (field: "canOperateTypes" | "specializations", value: string) => {
    const current = form[field];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateForm({ [field]: updated });
  };

  // Save profile
  const handleSave = async () => {
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/skippers/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          yearsOfExperience: parseInt(form.yearsOfExperience) || 0,
          maxBoatLength: form.maxBoatLength ? parseFloat(form.maxBoatLength) : null,
          hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null,
          licenseExpiry: form.licenseExpiry || null,
        }),
      });

      if (!res.ok) throw new Error("Errore nel salvataggio");

      const data = await res.json();
      setProfile(data.data);
      setHasChanges(false);
    } catch (err) {
      console.error("Error saving skipper profile:", err);
      alert("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Navigation className="h-5 w-5" style={{ color: primaryColor }} />
          Profilo Skipper
        </h3>
        {profile?.isVerified && (
          <Badge className="bg-green-500 text-white">
            <Shield className="h-3 w-3 mr-1" />
            Verificato
          </Badge>
        )}
      </div>

      {/* Availability Toggle Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  form.isAvailable ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                {form.isAvailable ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-semibold text-lg">
                  {form.isAvailable ? "Disponibile come Skipper" : "Non Disponibile"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {form.isAvailable
                    ? "Il tuo profilo e visibile agli organizzatori"
                    : "Attiva per renderti visibile agli organizzatori"}
                </p>
              </div>
            </div>
            <Switch
              checked={form.isAvailable}
              onCheckedChange={(c) => updateForm({ isAvailable: c })}
            />
          </div>
        </CardContent>
      </Card>

      {/* License & Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" style={{ color: primaryColor }} />
            Patente e Esperienza
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* License Type */}
            <div className="space-y-2">
              <Label>Tipo Patente</Label>
              <Select
                value={form.licenseType}
                onValueChange={(v) => updateForm({ licenseType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(licenseTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* License Number */}
            {form.licenseType !== "NONE" && (
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">Numero Patente</Label>
                <Input
                  id="licenseNumber"
                  value={form.licenseNumber}
                  onChange={(e) => updateForm({ licenseNumber: e.target.value })}
                  placeholder="N. patente"
                />
              </div>
            )}

            {/* License Expiry */}
            {form.licenseType !== "NONE" && (
              <div className="space-y-2">
                <Label htmlFor="licenseExpiry">Scadenza Patente</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={form.licenseExpiry}
                  onChange={(e) => updateForm({ licenseExpiry: e.target.value })}
                />
              </div>
            )}

            {/* Years of Experience */}
            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience">Anni di Esperienza</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                min="0"
                max="70"
                value={form.yearsOfExperience}
                onChange={(e) => updateForm({ yearsOfExperience: e.target.value })}
              />
            </div>

            {/* Max Boat Length */}
            <div className="space-y-2">
              <Label htmlFor="maxBoatLength">Lunghezza Max Barca (m)</Label>
              <Input
                id="maxBoatLength"
                type="number"
                step="0.5"
                value={form.maxBoatLength}
                onChange={(e) => updateForm({ maxBoatLength: e.target.value })}
                placeholder="Es: 15"
              />
            </div>
          </div>

          {/* Boat Types */}
          <div className="space-y-2">
            <Label>Tipi di Barche</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Seleziona i tipi di barche che sei in grado di condurre
            </p>
            <div className="flex flex-wrap gap-2">
              {boatTypesOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant={form.canOperateTypes.includes(option.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayValue("canOperateTypes", option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specializations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Ship className="h-4 w-4" style={{ color: primaryColor }} />
            Specializzazioni
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Seleziona le tecniche di pesca in cui sei specializzato
          </p>
          <div className="flex flex-wrap gap-2">
            {specializationsOptions.map((option) => (
              <Badge
                key={option.value}
                variant={form.specializations.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayValue("specializations", option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" style={{ color: primaryColor }} />
            Dettagli Servizio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hourly Rate */}
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Tariffa Oraria (EUR)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="5"
                value={form.hourlyRate}
                onChange={(e) => updateForm({ hourlyRate: e.target.value })}
                placeholder="Es: 50"
              />
            </div>

            {/* Service Area */}
            <div className="space-y-2">
              <Label htmlFor="serviceArea">Area di Servizio</Label>
              <Input
                id="serviceArea"
                value={form.serviceArea}
                onChange={(e) => updateForm({ serviceArea: e.target.value })}
                placeholder="Es: Golfo di Napoli, Ischia"
              />
            </div>
          </div>

          {/* Availability Notes */}
          <div className="space-y-2">
            <Label htmlFor="availabilityNotes">Note Disponibilita</Label>
            <Textarea
              id="availabilityNotes"
              value={form.availabilityNotes}
              onChange={(e) => updateForm({ availabilityNotes: e.target.value })}
              placeholder="Es: Disponibile nei weekend, preferenza per uscite giornaliere..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salva Profilo
        </Button>
      </div>
    </div>
  );
}
