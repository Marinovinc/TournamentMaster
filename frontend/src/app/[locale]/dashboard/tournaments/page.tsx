/**
 * =============================================================================
 * TOURNAMENTS MANAGEMENT PAGE
 * =============================================================================
 * Gestione completa tornei di pesca sportiva
 * =============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Ban,
  Send,
  PlayCircle,
  XCircle,
  Users,
  Download,
  FileText,
} from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";

// Types
interface Tournament {
  id: string;
  name: string;
  description?: string;
  discipline: string;
  status: "DRAFT" | "PUBLISHED" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "ONGOING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate: string;
  registrationOpens: string;
  registrationCloses: string;
  location: string;
  maxParticipants?: number;
  registrationFee?: number;
  participantCount?: number;
  bannerImage?: string;
  _count?: {
    teams: number;
  };
}

export default function TournamentsPage() {
  const { user, token, isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string || "it";

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discipline: "BIG_GAME",
    startDate: "",
    endDate: "",
    registrationOpens: "",
    registrationCloses: "",
    location: "",
    maxParticipants: "",
    registrationFee: "",
    bannerImage: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch tournaments
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/tournaments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setTournaments(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch tournaments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, API_URL]);

  // Status badge helper
  const getStatusBadge = (status: Tournament["status"]) => {
    const variants: Record<Tournament["status"], { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      DRAFT: { variant: "secondary", icon: <Edit className="h-3 w-3" /> },
      PUBLISHED: { variant: "outline", icon: <Eye className="h-3 w-3" /> },
      REGISTRATION_OPEN: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      REGISTRATION_CLOSED: { variant: "outline", icon: <Ban className="h-3 w-3" /> },
      ONGOING: { variant: "default", icon: <Trophy className="h-3 w-3" /> },
      ACTIVE: { variant: "default", icon: <Trophy className="h-3 w-3" /> },
      COMPLETED: { variant: "secondary", icon: <CheckCircle className="h-3 w-3" /> },
      CANCELLED: { variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
    };

    const labels: Record<Tournament["status"], string> = {
      DRAFT: "Bozza",
      PUBLISHED: "Pubblicato",
      REGISTRATION_OPEN: "Iscrizioni Aperte",
      REGISTRATION_CLOSED: "Iscrizioni Chiuse",
      ONGOING: "In Corso",
      ACTIVE: "Attivo",
      COMPLETED: "Completato",
      CANCELLED: "Annullato",
    };

    const { variant, icon } = variants[status];
    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {labels[status]}
      </Badge>
    );
  };

  // Filter tournaments
  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle create tournament
  const handleCreateTournament = async () => {
    if (!formData.name || !formData.location || !formData.startDate || !formData.endDate) {
      alert("Nome, luogo e date sono obbligatori");
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tournaments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
          registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTournaments([data.data, ...tournaments]);
        setCreateDialogOpen(false);
        resetForm();
      } else {
        alert(`Errore: ${data.message || "Creazione torneo fallita"}`);
      }
    } catch (error) {
      console.error("Error creating tournament:", error);
      alert("Errore di rete durante la creazione del torneo");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update tournament
  const handleUpdateTournament = async () => {
    if (!selectedTournament) return;

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tournaments/${selectedTournament.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
          registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTournaments(tournaments.map((t) =>
          t.id === selectedTournament.id ? data.data : t
        ));
        setEditDialogOpen(false);
        setSelectedTournament(null);
        resetForm();
      } else {
        alert(`Errore: ${data.message || "Aggiornamento torneo fallito"}`);
      }
    } catch (error) {
      console.error("Error updating tournament:", error);
      alert("Errore di rete");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete tournament
  const handleDeleteTournament = async () => {
    if (!selectedTournament) return;

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tournaments/${selectedTournament.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setTournaments(tournaments.filter((t) => t.id !== selectedTournament.id));
      } else {
        const data = await response.json();
        alert(`Errore: ${data.message || "Eliminazione fallita"}`);
      }
    } catch (error) {
      console.error("Error deleting tournament:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTournament(null);
      setFormLoading(false);
    }
  };

  // Handle change status
  const handleChangeStatus = async (tournament: Tournament, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      DRAFT: "Bozza",
      PUBLISHED: "Pubblicato",
      REGISTRATION_OPEN: "Iscrizioni Aperte",
      REGISTRATION_CLOSED: "Iscrizioni Chiuse",
      ONGOING: "In Corso",
      COMPLETED: "Completato",
      CANCELLED: "Annullato",
    };

    const confirm_msg = `Vuoi cambiare lo stato del torneo "${tournament.name}" a "${statusLabels[newStatus]}"?`;
    if (!confirm(confirm_msg)) return;

    try {
      const response = await fetch(`${API_URL}/api/tournaments/${tournament.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (response.ok) {
        setTournaments(tournaments.map((t) =>
          t.id === tournament.id ? { ...t, status: newStatus as Tournament["status"] } : t
        ));
      } else {
        alert(`Errore: ${data.message || "Cambio stato fallito"}`);
      }
    } catch (error) {
      console.error("Error changing status:", error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      discipline: "BIG_GAME",
      startDate: "",
      endDate: "",
      registrationOpens: "",
      registrationCloses: "",
      location: "",
      maxParticipants: "",
      registrationFee: "",
      bannerImage: "",
    });
  };

  // Open edit dialog
  const openEditDialog = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description || "",
      discipline: tournament.discipline,
      startDate: tournament.startDate?.split("T")[0] || "",
      endDate: tournament.endDate?.split("T")[0] || "",
      registrationOpens: tournament.registrationOpens?.split("T")[0] || "",
      registrationCloses: tournament.registrationCloses?.split("T")[0] || "",
      location: tournament.location,
      maxParticipants: tournament.maxParticipants?.toString() || "",
      registrationFee: tournament.registrationFee?.toString() || "",
      bannerImage: tournament.bannerImage || "",
    });
    setEditDialogOpen(true);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Discipline labels
  const disciplineLabels: Record<string, string> = {
    BIG_GAME: "Big Game",
    DRIFTING: "Drifting",
    TRAINA_COSTIERA: "Traina Costiera",
    BOLENTINO: "Bolentino",
    EGING: "Eging",
    VERTICAL_JIGGING: "Vertical Jigging",
    SHORE: "Shore",
    SOCIAL: "Sociale",
    FLY_FISHING: "Pesca a Mosca",
    BOTTOM_FISHING: "Pesca a Fondo",
  };

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
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8" />
              Gestione Tornei
            </h1>
            <p className="text-muted-foreground mt-1">
              Crea, modifica e gestisci i tornei di pesca
            </p>
          </div>
          <HelpGuide pageKey="tournaments" position="inline" />
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo Torneo
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Tornei</CardTitle>
              <CardDescription>
                {filteredTournaments.length} tornei trovati
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca tornei..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtra per stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tutti gli stati</SelectItem>
                  <SelectItem value="DRAFT">Bozza</SelectItem>
                  <SelectItem value="PUBLISHED">Pubblicato</SelectItem>
                  <SelectItem value="REGISTRATION_OPEN">Iscrizioni Aperte</SelectItem>
                  <SelectItem value="REGISTRATION_CLOSED">Iscrizioni Chiuse</SelectItem>
                  <SelectItem value="ONGOING">In Corso</SelectItem>
                  <SelectItem value="COMPLETED">Completato</SelectItem>
                  <SelectItem value="CANCELLED">Annullato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Torneo</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTournaments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Trophy className="h-8 w-8" />
                        <p>Nessun torneo trovato</p>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCreateDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Crea il primo torneo
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTournaments.map((tournament) => (
                    <TableRow key={tournament.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{tournament.name}</span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {tournament.location}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {disciplineLabels[tournament.discipline] || tournament.discipline}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{tournament._count?.teams || tournament.participantCount || 0}</span>
                          {tournament.maxParticipants && (
                            <span className="text-muted-foreground">/{tournament.maxParticipants}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tournament.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/${locale}/tournaments/${tournament.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizza
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(tournament)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* Status change options */}
                            {tournament.status === "DRAFT" && (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => handleChangeStatus(tournament, "PUBLISHED")}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Pubblica
                              </DropdownMenuItem>
                            )}
                            {tournament.status === "PUBLISHED" && (
                              <DropdownMenuItem
                                className="text-blue-600"
                                onClick={() => handleChangeStatus(tournament, "REGISTRATION_OPEN")}
                              >
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Apri Iscrizioni
                              </DropdownMenuItem>
                            )}
                            {tournament.status === "REGISTRATION_OPEN" && (
                              <DropdownMenuItem
                                className="text-yellow-600"
                                onClick={() => handleChangeStatus(tournament, "REGISTRATION_CLOSED")}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Chiudi Iscrizioni
                              </DropdownMenuItem>
                            )}
                            {tournament.status === "REGISTRATION_CLOSED" && (
                              <DropdownMenuItem
                                className="text-blue-600"
                                onClick={() => handleChangeStatus(tournament, "ONGOING")}
                              >
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Avvia Torneo
                              </DropdownMenuItem>
                            )}
                            {(tournament.status === "ONGOING" || tournament.status === "ACTIVE") && (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => handleChangeStatus(tournament, "COMPLETED")}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Completa Torneo
                              </DropdownMenuItem>
                            )}
                            {/* PDF Export for ONGOING/COMPLETED tournaments */}
                            {(tournament.status === "ONGOING" || tournament.status === "ACTIVE" || tournament.status === "COMPLETED") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => window.open(`${API_URL}/api/reports/export/pdf/leaderboard/${tournament.id}/preview`, '_blank')}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Anteprima Classifica PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `${API_URL}/api/reports/export/pdf/leaderboard/${tournament.id}`;
                                    link.download = `classifica_${tournament.name.replace(/s+/g, '_')}.pdf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Scarica Classifica PDF
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedTournament(tournament);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Tournament Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crea Nuovo Torneo</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli del nuovo torneo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Torneo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Es. Gran Premio Mediterraneo 2025"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione del torneo..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discipline">Disciplina *</Label>
                <Select
                  value={formData.discipline}
                  onValueChange={(value) => setFormData({ ...formData, discipline: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BIG_GAME">Big Game</SelectItem>
                    <SelectItem value="DRIFTING">Drifting</SelectItem>
                    <SelectItem value="TRAINA_COSTIERA">Traina Costiera</SelectItem>
                    <SelectItem value="BOLENTINO">Bolentino</SelectItem>
                    <SelectItem value="EGING">Eging</SelectItem>
                    <SelectItem value="VERTICAL_JIGGING">Vertical Jigging</SelectItem>
                    <SelectItem value="SHORE">Shore</SelectItem>
                    <SelectItem value="SOCIAL">Sociale</SelectItem>
                    <SelectItem value="FLY_FISHING">Pesca a Mosca</SelectItem>
                    <SelectItem value="BOTTOM_FISHING">Pesca a Fondo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Luogo *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Es. Ischia, Italia"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Data Inizio *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Data Fine *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="registrationOpens">Apertura Iscrizioni</Label>
                <Input
                  id="registrationOpens"
                  type="date"
                  value={formData.registrationOpens}
                  onChange={(e) => setFormData({ ...formData, registrationOpens: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="registrationCloses">Chiusura Iscrizioni</Label>
                <Input
                  id="registrationCloses"
                  type="date"
                  value={formData.registrationCloses}
                  onChange={(e) => setFormData({ ...formData, registrationCloses: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="maxParticipants">Max Partecipanti</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  placeholder="Es. 100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="registrationFee">Quota Iscrizione (EUR)</Label>
                <Input
                  id="registrationFee"
                  type="number"
                  step="0.01"
                  value={formData.registrationFee}
                  onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                  placeholder="Es. 150.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleCreateTournament}
              disabled={formLoading || !formData.name || !formData.location || !formData.startDate}
            >
              {formLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Crea Torneo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tournament Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Torneo</DialogTitle>
            <DialogDescription>
              Modifica i dettagli del torneo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome Torneo *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descrizione</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-discipline">Disciplina *</Label>
                <Select
                  value={formData.discipline}
                  onValueChange={(value) => setFormData({ ...formData, discipline: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BIG_GAME">Big Game</SelectItem>
                    <SelectItem value="DRIFTING">Drifting</SelectItem>
                    <SelectItem value="TRAINA_COSTIERA">Traina Costiera</SelectItem>
                    <SelectItem value="BOLENTINO">Bolentino</SelectItem>
                    <SelectItem value="EGING">Eging</SelectItem>
                    <SelectItem value="VERTICAL_JIGGING">Vertical Jigging</SelectItem>
                    <SelectItem value="SHORE">Shore</SelectItem>
                    <SelectItem value="SOCIAL">Sociale</SelectItem>
                    <SelectItem value="FLY_FISHING">Pesca a Mosca</SelectItem>
                    <SelectItem value="BOTTOM_FISHING">Pesca a Fondo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Luogo *</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-startDate">Data Inizio *</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-endDate">Data Fine *</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-registrationOpens">Apertura Iscrizioni</Label>
                <Input
                  id="edit-registrationOpens"
                  type="date"
                  value={formData.registrationOpens}
                  onChange={(e) => setFormData({ ...formData, registrationOpens: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-registrationCloses">Chiusura Iscrizioni</Label>
                <Input
                  id="edit-registrationCloses"
                  type="date"
                  value={formData.registrationCloses}
                  onChange={(e) => setFormData({ ...formData, registrationCloses: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-maxParticipants">Max Partecipanti</Label>
                <Input
                  id="edit-maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-registrationFee">Quota Iscrizione (EUR)</Label>
                <Input
                  id="edit-registrationFee"
                  type="number"
                  step="0.01"
                  value={formData.registrationFee}
                  onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleUpdateTournament} disabled={formLoading || !formData.name || !formData.location}>
              {formLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il torneo &quot;{selectedTournament?.name}&quot;?
              Questa azione non puo essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDeleteTournament} disabled={formLoading}>
              {formLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
