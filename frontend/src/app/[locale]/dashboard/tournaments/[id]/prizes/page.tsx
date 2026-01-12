"use client";

/**
 * =============================================================================
 * PRIZES MANAGEMENT PAGE
 * =============================================================================
 * Gestione premi torneo - Fase 5: Sponsorship
 * Include: lista premi, upload media (foto/video), assegnazione vincitori
 * =============================================================================
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Plus,
  ArrowLeft,
  Gift,
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  Edit,
  Award,
  Medal,
  Star,
  User,
  X,
  Check,
  Eye,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Building2,
  GripVertical,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, API_BASE_URL } from "@/lib/api";

// Types
interface PrizeMedia {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl: string | null;
  filename: string | null;
  caption: string | null;
  displayOrder: number;
}

interface Sponsor {
  id: string;
  name: string;
  logo: string | null;
}

interface Winner {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

interface Prize {
  id: string;
  name: string;
  description: string | null;
  category: PrizeCategory;
  position: number | null;
  value: number | null;
  valueDescription: string | null;
  sponsorId: string | null;
  sponsor: Sponsor | null;
  winnerId: string | null;
  winner: Winner | null;
  isAwarded: boolean;
  awardedAt: string | null;
  displayOrder: number;
  media: PrizeMedia[];
}

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

type PrizeCategory =
  | "FIRST_PLACE"
  | "SECOND_PLACE"
  | "THIRD_PLACE"
  | "BIGGEST_CATCH"
  | "MOST_CATCHES"
  | "YOUNGEST"
  | "OLDEST"
  | "SPECIAL"
  | "PARTICIPATION";

// Category configuration
const categoryConfig: Record<PrizeCategory, { label: string; icon: React.ReactNode; color: string }> = {
  FIRST_PLACE: { label: "1 Classificato", icon: <Trophy className="h-4 w-4" />, color: "text-yellow-600 bg-yellow-50" },
  SECOND_PLACE: { label: "2 Classificato", icon: <Medal className="h-4 w-4" />, color: "text-gray-500 bg-gray-50" },
  THIRD_PLACE: { label: "3 Classificato", icon: <Award className="h-4 w-4" />, color: "text-orange-600 bg-orange-50" },
  BIGGEST_CATCH: { label: "Cattura Piu Grande", icon: <Star className="h-4 w-4" />, color: "text-blue-600 bg-blue-50" },
  MOST_CATCHES: { label: "Piu Catture", icon: <Star className="h-4 w-4" />, color: "text-green-600 bg-green-50" },
  YOUNGEST: { label: "Piu Giovane", icon: <User className="h-4 w-4" />, color: "text-pink-600 bg-pink-50" },
  OLDEST: { label: "Piu Anziano", icon: <User className="h-4 w-4" />, color: "text-purple-600 bg-purple-50" },
  SPECIAL: { label: "Premio Speciale", icon: <Gift className="h-4 w-4" />, color: "text-indigo-600 bg-indigo-50" },
  PARTICIPATION: { label: "Partecipazione", icon: <Award className="h-4 w-4" />, color: "text-teal-600 bg-teal-50" },
};

export default function PrizesPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [showAwardDialog, setShowAwardDialog] = useState(false);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "SPECIAL" as PrizeCategory,
    position: "",
    value: "",
    valueDescription: "",
    sponsorId: "",
  });

  const [selectedWinnerId, setSelectedWinnerId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load prizes
      const prizesRes = await api<Prize[]>(`/api/sponsors/prizes/tournament/${tournamentId}`);
      if (prizesRes.success && prizesRes.data) {
        setPrizes(prizesRes.data);
      }

      // Load sponsors
      const sponsorsRes = await api<{ sponsor: Sponsor }[]>(`/api/sponsors/tournament/${tournamentId}`);
      if (sponsorsRes.success && sponsorsRes.data) {
        setSponsors(sponsorsRes.data.map(ts => ts.sponsor));
      }

      // Load participants
      const participantsRes = await api<Participant[]>(`/api/tournaments/${tournamentId}/participants`);
      if (participantsRes.success && participantsRes.data) {
        setParticipants(participantsRes.data);
      }
    } catch (err) {
      console.error("Error loading prizes:", err);
      setError("Errore nel caricamento dei premi");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create prize
  const handleCreatePrize = async () => {
    if (!formData.name) return;
    try {
      setSubmitting(true);
      const res = await api("/api/sponsors/prizes", {
        method: "POST",
        body: {
          tournamentId,
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          position: formData.position ? parseInt(formData.position) : undefined,
          value: formData.value ? parseFloat(formData.value) : undefined,
          valueDescription: formData.valueDescription || undefined,
          sponsorId: formData.sponsorId || undefined,
        },
      });

      if (res.success) {
        setShowCreateDialog(false);
        resetForm();
        loadData();
      } else {
        alert(res.message || "Errore nella creazione del premio");
      }
    } catch (err) {
      console.error("Error creating prize:", err);
      alert("Errore nella creazione del premio");
    } finally {
      setSubmitting(false);
    }
  };

  // Update prize
  const handleUpdatePrize = async () => {
    if (!selectedPrize || !formData.name) return;
    try {
      setSubmitting(true);
      const res = await api(`/api/sponsors/prizes/${selectedPrize.id}`, {
        method: "PUT",
        body: {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          position: formData.position ? parseInt(formData.position) : undefined,
          value: formData.value ? parseFloat(formData.value) : undefined,
          valueDescription: formData.valueDescription || undefined,
          sponsorId: formData.sponsorId || null,
        },
      });

      if (res.success) {
        setShowEditDialog(false);
        setSelectedPrize(null);
        resetForm();
        loadData();
      } else {
        alert(res.message || "Errore nell'aggiornamento del premio");
      }
    } catch (err) {
      console.error("Error updating prize:", err);
      alert("Errore nell'aggiornamento del premio");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete prize
  const handleDeletePrize = async (prizeId: string) => {
    if (!confirm("Eliminare questo premio? Tutti i media associati verranno eliminati.")) return;
    try {
      const res = await api(`/api/sponsors/prizes/${prizeId}`, {
        method: "DELETE",
      });
      if (res.success) {
        loadData();
      } else {
        alert(res.message || "Errore nell'eliminazione del premio");
      }
    } catch (err) {
      console.error("Error deleting prize:", err);
      alert("Errore nell'eliminazione del premio");
    }
  };

  // Award prize
  const handleAwardPrize = async () => {
    if (!selectedPrize || !selectedWinnerId) return;
    try {
      setSubmitting(true);
      const res = await api(`/api/sponsors/prizes/${selectedPrize.id}/award`, {
        method: "POST",
        body: { winnerId: selectedWinnerId },
      });

      if (res.success) {
        setShowAwardDialog(false);
        setSelectedPrize(null);
        setSelectedWinnerId("");
        loadData();
      } else {
        alert(res.message || "Errore nell'assegnazione del premio");
      }
    } catch (err) {
      console.error("Error awarding prize:", err);
      alert("Errore nell'assegnazione del premio");
    } finally {
      setSubmitting(false);
    }
  };

  // Unassign prize
  const handleUnassignPrize = async (prizeId: string) => {
    if (!confirm("Rimuovere l'assegnazione di questo premio?")) return;
    try {
      const res = await api(`/api/sponsors/prizes/${prizeId}/award`, {
        method: "DELETE",
      });
      if (res.success) {
        loadData();
      } else {
        alert(res.message || "Errore nella rimozione dell'assegnazione");
      }
    } catch (err) {
      console.error("Error unassigning prize:", err);
      alert("Errore nella rimozione dell'assegnazione");
    }
  };

  // Upload media
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedPrize) return;

    const file = files[0];
    const formDataObj = new FormData();
    formDataObj.append("file", file);

    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/sponsors/prizes/${selectedPrize.id}/media`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataObj,
      });

      const result = await response.json();
      if (result.success) {
        loadData();
        // Refresh selected prize
        const updatedPrize = await api<Prize>(`/api/sponsors/prizes/${selectedPrize.id}`);
        if (updatedPrize.success && updatedPrize.data) {
          setSelectedPrize(updatedPrize.data);
        }
      } else {
        alert(result.message || "Errore nell'upload del file");
      }
    } catch (err) {
      console.error("Error uploading media:", err);
      alert("Errore nell'upload del file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Delete media
  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("Eliminare questo media?")) return;
    try {
      const res = await api(`/api/sponsors/prizes/media/${mediaId}`, {
        method: "DELETE",
      });
      if (res.success && selectedPrize) {
        // Refresh selected prize
        const updatedPrize = await api<Prize>(`/api/sponsors/prizes/${selectedPrize.id}`);
        if (updatedPrize.success && updatedPrize.data) {
          setSelectedPrize(updatedPrize.data);
        }
        loadData();
      } else {
        alert(res.message || "Errore nell'eliminazione del media");
      }
    } catch (err) {
      console.error("Error deleting media:", err);
      alert("Errore nell'eliminazione del media");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "SPECIAL",
      position: "",
      value: "",
      valueDescription: "",
      sponsorId: "",
    });
  };

  // Open edit dialog
  const openEditDialog = (prize: Prize) => {
    setSelectedPrize(prize);
    setFormData({
      name: prize.name,
      description: prize.description || "",
      category: prize.category,
      position: prize.position?.toString() || "",
      value: prize.value?.toString() || "",
      valueDescription: prize.valueDescription || "",
      sponsorId: prize.sponsorId || "",
    });
    setShowEditDialog(true);
  };

  // Open media dialog
  const openMediaDialog = (prize: Prize) => {
    setSelectedPrize(prize);
    setShowMediaDialog(true);
  };

  // Open award dialog
  const openAwardDialog = (prize: Prize) => {
    setSelectedPrize(prize);
    setSelectedWinnerId(prize.winnerId || "");
    setShowAwardDialog(true);
  };

  // Open gallery dialog
  const openGalleryDialog = (prize: Prize, index: number = 0) => {
    setSelectedPrize(prize);
    setGalleryIndex(index);
    setShowGalleryDialog(true);
  };

  // Get media URL with full path
  const getMediaUrl = (url: string) => {
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
  };

  // Group prizes by category
  const prizesByCategory = prizes.reduce((acc, prize) => {
    if (!acc[prize.category]) acc[prize.category] = [];
    acc[prize.category].push(prize);
    return acc;
  }, {} as Record<PrizeCategory, Prize[]>);

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
              <Trophy className="h-6 w-6 text-yellow-600" />
              Gestione Premi
            </h1>
            <p className="text-gray-500">Premi in palio e assegnazioni</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Premio
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Trophy className="h-4 w-4" />
              Premi Totali
            </div>
            <div className="text-2xl font-bold">{prizes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Check className="h-4 w-4 text-green-600" />
              Assegnati
            </div>
            <div className="text-2xl font-bold text-green-600">
              {prizes.filter(p => p.isAwarded).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <DollarSign className="h-4 w-4 text-blue-600" />
              Valore Totale
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {prizes.reduce((sum, p) => sum + (p.value || 0), 0).toLocaleString("it-IT")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ImageIcon className="h-4 w-4 text-purple-600" />
              Media Caricati
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {prizes.reduce((sum, p) => sum + (p.media?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prizes Grid */}
      {prizes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nessun premio ancora
            </h3>
            <p className="text-gray-500 mb-4">
              Aggiungi premi al torneo per mostrarli qui
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Premio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grid">Vista Griglia</TabsTrigger>
            <TabsTrigger value="category">Per Categoria</TabsTrigger>
          </TabsList>

          {/* Grid View */}
          <TabsContent value="grid">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prizes.map((prize) => (
                <Card key={prize.id} className="overflow-hidden">
                  {/* Media Preview */}
                  <div
                    className="relative h-48 bg-gray-100 cursor-pointer group"
                    onClick={() => prize.media?.length > 0 && openGalleryDialog(prize)}
                  >
                    {prize.media && prize.media.length > 0 ? (
                      <>
                        {prize.media[0].type === "video" ? (
                          <video
                            src={getMediaUrl(prize.media[0].url)}
                            className="w-full h-full object-cover"
                            poster={prize.media[0].thumbnailUrl ? getMediaUrl(prize.media[0].thumbnailUrl) : undefined}
                          />
                        ) : (
                          <img
                            src={getMediaUrl(prize.media[0].url)}
                            alt={prize.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {prize.media.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                            +{prize.media.length - 1} altri
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Eye className="h-8 w-8 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Gift className="h-12 w-12 mb-2" />
                        <span className="text-sm">Nessuna immagine</span>
                      </div>
                    )}
                    {/* Category Badge */}
                    <Badge
                      className={`absolute top-2 left-2 ${categoryConfig[prize.category].color}`}
                    >
                      {categoryConfig[prize.category].icon}
                      <span className="ml-1">{categoryConfig[prize.category].label}</span>
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{prize.name}</h3>
                        {prize.sponsor && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {prize.sponsor.name}
                          </p>
                        )}
                      </div>
                      {prize.value && (
                        <Badge variant="outline" className="text-green-600">
                          {prize.value.toLocaleString("it-IT")}
                        </Badge>
                      )}
                    </div>

                    {prize.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {prize.description}
                      </p>
                    )}

                    {/* Winner */}
                    {prize.isAwarded && prize.winner && (
                      <div className="bg-green-50 rounded-lg p-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Assegnato a: {prize.winner.firstName} {prize.winner.lastName}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openMediaDialog(prize)}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Media
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAwardDialog(prize)}
                      >
                        <Award className="h-4 w-4 mr-1" />
                        {prize.isAwarded ? "Modifica" : "Assegna"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(prize)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => handleDeletePrize(prize.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Category View */}
          <TabsContent value="category" className="space-y-6">
            {(Object.keys(categoryConfig) as PrizeCategory[]).map((category) => {
              const categoryPrizes = prizesByCategory[category];
              if (!categoryPrizes || categoryPrizes.length === 0) return null;

              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className={categoryConfig[category].color.split(" ")[0]}>
                        {categoryConfig[category].icon}
                      </span>
                      {categoryConfig[category].label}
                      <Badge variant="outline" className="ml-2">
                        {categoryPrizes.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryPrizes.map((prize) => (
                        <div
                          key={prize.id}
                          className="flex items-center gap-4 p-3 rounded-lg border bg-gray-50/50"
                        >
                          {/* Thumbnail */}
                          <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                            {prize.media && prize.media.length > 0 ? (
                              <img
                                src={getMediaUrl(prize.media[0].thumbnailUrl || prize.media[0].url)}
                                alt={prize.name}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => openGalleryDialog(prize)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Gift className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{prize.name}</h4>
                              {prize.value && (
                                <Badge variant="outline" className="text-green-600">
                                  {prize.value.toLocaleString("it-IT")}
                                </Badge>
                              )}
                            </div>
                            {prize.sponsor && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {prize.sponsor.name}
                              </p>
                            )}
                            {prize.isAwarded && prize.winner && (
                              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                <Check className="h-3 w-3" />
                                Assegnato a: {prize.winner.firstName} {prize.winner.lastName}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openMediaDialog(prize)}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(prize)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                              onClick={() => handleDeletePrize(prize.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      )}

      {/* Create Prize Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuovo Premio</DialogTitle>
            <DialogDescription>
              Crea un nuovo premio per il torneo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Nome Premio *</Label>
              <Input
                placeholder="Es: Trofeo Cattura Piu Grande"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v as PrizeCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(categoryConfig) as PrizeCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        {categoryConfig[cat].icon}
                        {categoryConfig[cat].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrizione</Label>
              <Textarea
                placeholder="Descrizione del premio..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valore Economico</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
              <div>
                <Label>Posizione</Label>
                <Input
                  type="number"
                  placeholder="1, 2, 3..."
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Descrizione Valore</Label>
              <Input
                placeholder="Es: Canna da pesca professionale"
                value={formData.valueDescription}
                onChange={(e) => setFormData({ ...formData, valueDescription: e.target.value })}
              />
            </div>
            {sponsors.length > 0 && (
              <div>
                <Label>Sponsor</Label>
                <Select
                  value={formData.sponsorId}
                  onValueChange={(v) => setFormData({ ...formData, sponsorId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona sponsor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nessuno sponsor</SelectItem>
                    {sponsors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleCreatePrize}
              disabled={!formData.name || submitting}
            >
              {submitting ? "Creazione..." : "Crea Premio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Prize Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifica Premio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Nome Premio *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v as PrizeCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(categoryConfig) as PrizeCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        {categoryConfig[cat].icon}
                        {categoryConfig[cat].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrizione</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valore Economico</Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
              <div>
                <Label>Posizione</Label>
                <Input
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Descrizione Valore</Label>
              <Input
                value={formData.valueDescription}
                onChange={(e) => setFormData({ ...formData, valueDescription: e.target.value })}
              />
            </div>
            {sponsors.length > 0 && (
              <div>
                <Label>Sponsor</Label>
                <Select
                  value={formData.sponsorId}
                  onValueChange={(v) => setFormData({ ...formData, sponsorId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nessuno sponsor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nessuno sponsor</SelectItem>
                    {sponsors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleUpdatePrize}
              disabled={!formData.name || submitting}
            >
              {submitting ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Upload Dialog */}
      <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestione Media - {selectedPrize?.name}</DialogTitle>
            <DialogDescription>
              Carica foto e video del premio (max 50MB per video)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* Upload Button */}
            <div className="mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full h-24 border-dashed"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                    Caricamento in corso...
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span>Clicca per caricare foto o video</span>
                    <span className="text-xs text-gray-400">JPG, PNG, MP4, MOV</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Media Grid */}
            {selectedPrize?.media && selectedPrize.media.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {selectedPrize.media.map((media, index) => (
                  <div
                    key={media.id}
                    className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    {media.type === "video" ? (
                      <>
                        <video
                          src={getMediaUrl(media.url)}
                          className="w-full h-full object-cover"
                          poster={media.thumbnailUrl ? getMediaUrl(media.thumbnailUrl) : undefined}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/50 rounded-full p-2">
                            <Video className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <img
                        src={getMediaUrl(media.url)}
                        alt={media.caption || "Media"}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openGalleryDialog(selectedPrize, index)}
                      />
                    )}
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteMedia(media.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {/* Order Badge */}
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>Nessun media caricato</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowMediaDialog(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award Prize Dialog */}
      <Dialog open={showAwardDialog} onOpenChange={setShowAwardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assegna Premio</DialogTitle>
            <DialogDescription>
              {selectedPrize?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Vincitore</Label>
            <Select
              value={selectedWinnerId}
              onValueChange={setSelectedWinnerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona vincitore" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nessun vincitore</SelectItem>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPrize?.isAwarded && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full text-red-500"
                  onClick={() => {
                    handleUnassignPrize(selectedPrize.id);
                    setShowAwardDialog(false);
                  }}
                >
                  Rimuovi Assegnazione
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAwardDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleAwardPrize}
              disabled={!selectedWinnerId || submitting}
            >
              {submitting ? "Assegnazione..." : "Assegna Premio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery Dialog */}
      <Dialog open={showGalleryDialog} onOpenChange={setShowGalleryDialog}>
        <DialogContent className="max-w-4xl p-0">
          {selectedPrize?.media && selectedPrize.media.length > 0 && (
            <div className="relative">
              {/* Main Media */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                {selectedPrize.media[galleryIndex].type === "video" ? (
                  <video
                    src={getMediaUrl(selectedPrize.media[galleryIndex].url)}
                    className="max-h-full max-w-full"
                    controls
                    autoPlay
                  />
                ) : (
                  <img
                    src={getMediaUrl(selectedPrize.media[galleryIndex].url)}
                    alt={selectedPrize.media[galleryIndex].caption || "Media"}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>

              {/* Navigation */}
              {selectedPrize.media.length > 1 && (
                <>
                  <button
                    onClick={() => setGalleryIndex((galleryIndex - 1 + selectedPrize.media.length) % selectedPrize.media.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setGalleryIndex((galleryIndex + 1) % selectedPrize.media.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowGalleryDialog(false)}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {galleryIndex + 1} / {selectedPrize.media.length}
              </div>

              {/* Caption */}
              {selectedPrize.media[galleryIndex].caption && (
                <div className="absolute bottom-12 left-0 right-0 bg-black/50 text-white text-center py-2 px-4">
                  {selectedPrize.media[galleryIndex].caption}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
