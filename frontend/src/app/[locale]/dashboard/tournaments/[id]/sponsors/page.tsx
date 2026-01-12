"use client";

/**
 * =============================================================================
 * SPONSORS MANAGEMENT PAGE
 * =============================================================================
 * Gestione sponsor torneo - Fase 5: Sponsorship
 * Include: lista sponsor, associazione a torneo, gestione tier
 * =============================================================================
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Plus,
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  Trash2,
  Edit,
  ExternalLink,
  Crown,
  Medal,
  Award,
  Heart,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/media";

// Types
interface Sponsor {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  tier: SponsorTier;
  isActive: boolean;
  displayOrder: number;
}

interface TournamentSponsor {
  id: string;
  tournamentId: string;
  sponsorId: string;
  tier: SponsorTier | null;
  customMessage: string | null;
  displayOrder: number;
  sponsor: Sponsor;
}

type SponsorTier = "PLATINUM" | "GOLD" | "SILVER" | "BRONZE" | "SUPPORTER";

// Tier configuration
const tierConfig: Record<SponsorTier, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  PLATINUM: {
    label: "Platinum",
    color: "text-purple-700",
    icon: <Crown className="h-4 w-4" />,
    bgColor: "bg-gradient-to-r from-purple-100 to-purple-50 border-purple-200"
  },
  GOLD: {
    label: "Gold",
    color: "text-yellow-700",
    icon: <Star className="h-4 w-4" />,
    bgColor: "bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-200"
  },
  SILVER: {
    label: "Silver",
    color: "text-gray-600",
    icon: <Medal className="h-4 w-4" />,
    bgColor: "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200"
  },
  BRONZE: {
    label: "Bronze",
    color: "text-orange-700",
    icon: <Award className="h-4 w-4" />,
    bgColor: "bg-gradient-to-r from-orange-100 to-orange-50 border-orange-200"
  },
  SUPPORTER: {
    label: "Supporter",
    color: "text-blue-600",
    icon: <Heart className="h-4 w-4" />,
    bgColor: "bg-gradient-to-r from-blue-50 to-white border-blue-100"
  },
};

export default function SponsorsPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  // State
  const [tournamentSponsors, setTournamentSponsors] = useState<TournamentSponsor[]>([]);
  const [availableSponsors, setAvailableSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<TournamentSponsor | null>(null);

  // Form state for adding existing sponsor
  const [addFormData, setAddFormData] = useState({
    sponsorId: "",
    tier: "BRONZE" as SponsorTier,
    customMessage: "",
  });

  // Form state for creating new sponsor
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    logo: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
    tier: "BRONZE" as SponsorTier,
  });

  // Form state for editing tier
  const [editFormData, setEditFormData] = useState({
    tier: "BRONZE" as SponsorTier,
    customMessage: "",
    displayOrder: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load tournament sponsors
      const sponsorsRes = await api<TournamentSponsor[]>(
        `/api/sponsors/tournament/${tournamentId}`
      );
      if (sponsorsRes.success && sponsorsRes.data) {
        setTournamentSponsors(sponsorsRes.data);
      }

      // Load available sponsors (from tenant)
      const availableRes = await api<Sponsor[]>("/api/sponsors");
      if (availableRes.success && availableRes.data) {
        setAvailableSponsors(availableRes.data);
      }
    } catch (err) {
      console.error("Error loading sponsors:", err);
      setError("Errore nel caricamento degli sponsor");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get sponsors not already added to tournament
  const unassignedSponsors = availableSponsors.filter(
    (s) => !tournamentSponsors.some((ts) => ts.sponsorId === s.id)
  );

  // Filter sponsors
  const filteredSponsors = tournamentSponsors.filter((ts) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        ts.sponsor.name.toLowerCase().includes(search) ||
        ts.sponsor.description?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Group sponsors by tier
  const sponsorsByTier = filteredSponsors.reduce((acc, ts) => {
    const tier = ts.tier || ts.sponsor.tier;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(ts);
    return acc;
  }, {} as Record<SponsorTier, TournamentSponsor[]>);

  // Add existing sponsor to tournament
  const handleAddSponsor = async () => {
    if (!addFormData.sponsorId) return;
    try {
      setSubmitting(true);
      const res = await api(`/api/sponsors/tournament/${tournamentId}/${addFormData.sponsorId}`, {
        method: "POST",
        body: {
          tier: addFormData.tier,
          customMessage: addFormData.customMessage || undefined,
        },
      });

      if (res.success) {
        setShowAddDialog(false);
        setAddFormData({ sponsorId: "", tier: "BRONZE", customMessage: "" });
        loadData();
      } else {
        alert(res.message || "Errore nell'aggiunta dello sponsor");
      }
    } catch (err) {
      console.error("Error adding sponsor:", err);
      alert("Errore nell'aggiunta dello sponsor");
    } finally {
      setSubmitting(false);
    }
  };

  // Create new sponsor
  const handleCreateSponsor = async () => {
    if (!createFormData.name) return;
    try {
      setSubmitting(true);
      const res = await api<Sponsor>("/api/sponsors", {
        method: "POST",
        body: createFormData,
      });

      if (res.success && res.data) {
        // Auto-add to tournament
        await api(`/api/sponsors/tournament/${tournamentId}/${res.data.id}`, {
          method: "POST",
          body: { tier: createFormData.tier },
        });

        setShowCreateDialog(false);
        setCreateFormData({
          name: "",
          description: "",
          logo: "",
          website: "",
          contactEmail: "",
          contactPhone: "",
          tier: "BRONZE",
        });
        loadData();
      } else {
        alert(res.message || "Errore nella creazione dello sponsor");
      }
    } catch (err) {
      console.error("Error creating sponsor:", err);
      alert("Errore nella creazione dello sponsor");
    } finally {
      setSubmitting(false);
    }
  };

  // Update sponsor tier/message
  const handleUpdateSponsor = async () => {
    if (!selectedSponsor) return;
    try {
      setSubmitting(true);
      const res = await api(
        `/api/sponsors/tournament/${tournamentId}/${selectedSponsor.sponsorId}`,
        {
          method: "PUT",
          body: {
            tier: editFormData.tier,
            customMessage: editFormData.customMessage || undefined,
            displayOrder: editFormData.displayOrder,
          },
        }
      );

      if (res.success) {
        setShowEditDialog(false);
        setSelectedSponsor(null);
        loadData();
      } else {
        alert(res.message || "Errore nell'aggiornamento dello sponsor");
      }
    } catch (err) {
      console.error("Error updating sponsor:", err);
      alert("Errore nell'aggiornamento dello sponsor");
    } finally {
      setSubmitting(false);
    }
  };

  // Remove sponsor from tournament
  const handleRemoveSponsor = async (sponsorId: string) => {
    if (!confirm("Rimuovere questo sponsor dal torneo?")) return;
    try {
      const res = await api(`/api/sponsors/tournament/${tournamentId}/${sponsorId}`, {
        method: "DELETE",
      });
      if (res.success) {
        loadData();
      } else {
        alert(res.message || "Errore nella rimozione dello sponsor");
      }
    } catch (err) {
      console.error("Error removing sponsor:", err);
      alert("Errore nella rimozione dello sponsor");
    }
  };

  // Open edit dialog
  const openEditDialog = (ts: TournamentSponsor) => {
    setSelectedSponsor(ts);
    setEditFormData({
      tier: ts.tier || ts.sponsor.tier,
      customMessage: ts.customMessage || "",
      displayOrder: ts.displayOrder,
    });
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/it/dashboard/tournaments/${tournamentId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna al torneo
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-purple-600" />
              Gestione Sponsor
            </h1>
            <p className="text-gray-500">Sponsor e partner del torneo</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Esistente
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Sponsor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(Object.keys(tierConfig) as SponsorTier[]).map((tier) => (
          <Card key={tier} className={tierConfig[tier].bgColor}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <span className={tierConfig[tier].color}>{tierConfig[tier].icon}</span>
                <span className="text-sm font-medium">{tierConfig[tier].label}</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {sponsorsByTier[tier]?.length || 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      {tournamentSponsors.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca sponsor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sponsors by Tier */}
      {tournamentSponsors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nessuno sponsor ancora
            </h3>
            <p className="text-gray-500 mb-4">
              Aggiungi sponsor al torneo per mostrarli qui
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Sponsor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(Object.keys(tierConfig) as SponsorTier[]).map((tier) => {
            const sponsors = sponsorsByTier[tier];
            if (!sponsors || sponsors.length === 0) return null;

            return (
              <Card key={tier}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className={tierConfig[tier].color}>
                      {tierConfig[tier].icon}
                    </span>
                    {tierConfig[tier].label} Sponsors
                    <Badge variant="outline" className="ml-2">
                      {sponsors.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sponsors.map((ts) => (
                      <div
                        key={ts.id}
                        className={`p-4 rounded-lg border ${tierConfig[tier].bgColor}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {ts.sponsor.logo ? (
                              <img
                                src={ts.sponsor.logo}
                                alt={ts.sponsor.name}
                                className="w-12 h-12 object-contain rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold">{ts.sponsor.name}</h4>
                              {ts.customMessage && (
                                <p className="text-xs text-gray-500 italic">
                                  {ts.customMessage}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(ts)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleRemoveSponsor(ts.sponsorId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {ts.sponsor.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {ts.sponsor.description}
                          </p>
                        )}

                        <div className="flex gap-2 mt-3">
                          {ts.sponsor.website && (
                            <a
                              href={ts.sponsor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Globe className="h-3 w-3" />
                              Website
                            </a>
                          )}
                          {ts.sponsor.contactEmail && (
                            <a
                              href={`mailto:${ts.sponsor.contactEmail}`}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Mail className="h-3 w-3" />
                              Email
                            </a>
                          )}
                          {ts.sponsor.contactPhone && (
                            <a
                              href={`tel:${ts.sponsor.contactPhone}`}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Phone className="h-3 w-3" />
                              Tel
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Existing Sponsor Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Aggiungi Sponsor Esistente</DialogTitle>
            <DialogDescription>
              Seleziona uno sponsor dal tuo elenco
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Sponsor *</Label>
              <Select
                value={addFormData.sponsorId}
                onValueChange={(v) => setAddFormData({ ...addFormData, sponsorId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona sponsor" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedSponsors.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      Nessuno sponsor disponibile
                    </div>
                  ) : (
                    unassignedSponsors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <span className={tierConfig[s.tier].color}>
                            {tierConfig[s.tier].icon}
                          </span>
                          {s.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tier per questo Torneo</Label>
              <Select
                value={addFormData.tier}
                onValueChange={(v) => setAddFormData({ ...addFormData, tier: v as SponsorTier })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(tierConfig) as SponsorTier[]).map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      <div className="flex items-center gap-2">
                        <span className={tierConfig[tier].color}>
                          {tierConfig[tier].icon}
                        </span>
                        {tierConfig[tier].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Messaggio Personalizzato</Label>
              <Input
                placeholder="Es: Main Sponsor 2024"
                value={addFormData.customMessage}
                onChange={(e) => setAddFormData({ ...addFormData, customMessage: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleAddSponsor}
              disabled={!addFormData.sponsorId || submitting}
            >
              {submitting ? "Aggiunta..." : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Sponsor Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuovo Sponsor</DialogTitle>
            <DialogDescription>
              Crea un nuovo sponsor e aggiungilo al torneo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Nome *</Label>
              <Input
                placeholder="Nome azienda/sponsor"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrizione</Label>
              <Textarea
                placeholder="Breve descrizione dello sponsor..."
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input
                placeholder="https://..."
                value={createFormData.logo}
                onChange={(e) => setCreateFormData({ ...createFormData, logo: e.target.value })}
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                placeholder="https://www.example.com"
                value={createFormData.website}
                onChange={(e) => setCreateFormData({ ...createFormData, website: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email Contatto</Label>
                <Input
                  type="email"
                  placeholder="info@example.com"
                  value={createFormData.contactEmail}
                  onChange={(e) => setCreateFormData({ ...createFormData, contactEmail: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefono</Label>
                <Input
                  placeholder="+39 ..."
                  value={createFormData.contactPhone}
                  onChange={(e) => setCreateFormData({ ...createFormData, contactPhone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Tier</Label>
              <Select
                value={createFormData.tier}
                onValueChange={(v) => setCreateFormData({ ...createFormData, tier: v as SponsorTier })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(tierConfig) as SponsorTier[]).map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      <div className="flex items-center gap-2">
                        <span className={tierConfig[tier].color}>
                          {tierConfig[tier].icon}
                        </span>
                        {tierConfig[tier].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleCreateSponsor}
              disabled={!createFormData.name || submitting}
            >
              {submitting ? "Creazione..." : "Crea e Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sponsor Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Sponsor</DialogTitle>
            <DialogDescription>
              {selectedSponsor?.sponsor.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tier per questo Torneo</Label>
              <Select
                value={editFormData.tier}
                onValueChange={(v) => setEditFormData({ ...editFormData, tier: v as SponsorTier })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(tierConfig) as SponsorTier[]).map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      <div className="flex items-center gap-2">
                        <span className={tierConfig[tier].color}>
                          {tierConfig[tier].icon}
                        </span>
                        {tierConfig[tier].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Messaggio Personalizzato</Label>
              <Input
                placeholder="Es: Main Sponsor 2024"
                value={editFormData.customMessage}
                onChange={(e) => setEditFormData({ ...editFormData, customMessage: e.target.value })}
              />
            </div>
            <div>
              <Label>Ordine Visualizzazione</Label>
              <Input
                type="number"
                min="0"
                value={editFormData.displayOrder}
                onChange={(e) => setEditFormData({ ...editFormData, displayOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleUpdateSponsor} disabled={submitting}>
              {submitting ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
