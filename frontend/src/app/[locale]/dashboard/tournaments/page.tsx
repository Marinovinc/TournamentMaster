/**
 * =============================================================================
 * TOURNAMENTS MANAGEMENT PAGE
 * =============================================================================
 * Gestione completa tornei di pesca sportiva
 * =============================================================================
 */

"use client";

import { useEffect, useState, useMemo } from "react";
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
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings,
  Fish,
  Scale,
  ExternalLink,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { HelpGuide } from "@/components/HelpGuide";
import { SpeciesScoringConfig } from "@/components/SpeciesScoringConfig";
import { getMediaUrl } from "@/lib/media";
import { disciplineLabels } from '@/lib/disciplines';

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
  tenant?: {
    id: string;
    name: string;
  };
  _count?: {
    teams: number;
  };
}

// Sorting types
type SortColumn = "name" | "discipline" | "startDate" | "teams" | "status";
type SortDirection = "asc" | "desc";

export default function TournamentsPage() {
  const { user, token, isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string || "it";

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [tenantFilter, setTenantFilter] = useState<string>("ALL");

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>("startDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Check if in association mode (either user has tenantId or is impersonating)
  const [isInAssociationMode, setIsInAssociationMode] = useState(false);
  
  useEffect(() => {
    const impersonatingTenant = localStorage.getItem("impersonatingTenant");
    setIsInAssociationMode(!!user?.tenantId || !!impersonatingTenant);
  }, [user]);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Tournament Profiles
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Species Scoring for C&R mode
  const [speciesScoring, setSpeciesScoring] = useState<Array<{
    speciesId: string;
    speciesName?: string;
    pointsSmall: number;
    pointsMedium: number;
    pointsLarge: number;
    pointsExtraLarge: number;
    catchReleaseBonus: number;
  }>>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    profileId: "",
    discipline: "BIG_GAME",
    startDate: "",
    endDate: "",
    registrationOpens: "",
    registrationCloses: "",
    location: "",
    maxParticipants: "",
    registrationFee: "",
    bannerImage: "",
    // Catch & Release mode
    gameMode: "TRADITIONAL",
    followsFipsasRules: false,
    fipsasRegulationUrl: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch available tournament profiles when dialog opens
  const fetchProfiles = async () => {
    if (!token) return;
    setLoadingProfiles(true);
    try {
      const response = await fetch(`${API_URL}/api/tournament-profiles/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  // Fetch profiles when create dialog opens
  useEffect(() => {
    if (createDialogOpen) {
      fetchProfiles();
    }
  }, [createDialogOpen, token]);

  // Handle profile selection - auto-fill form fields
  const handleProfileSelect = (profileId: string) => {
    // Handle "none" selection (manual configuration)
    if (profileId === "none") {
      setFormData({
        ...formData,
        profileId: "",
      });
      return;
    }
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      setFormData({
        ...formData,
        profileId: profileId,
        discipline: profile.discipline,
        gameMode: profile.gameMode,
        followsFipsasRules: profile.followsFipsasRules,
        fipsasRegulationUrl: profile.fipsasRegulationUrl || "",
      });
    } else {
      setFormData({ ...formData, profileId: "" });
    }
  };

  // Extract unique tenants for filter
  const tenants = useMemo(() => {
    const tenantMap = new Map<string, { id: string; name: string }>();
    tournaments.forEach((t) => {
      if (t.tenant) {
        tenantMap.set(t.tenant.id, t.tenant);
      }
    });
    return Array.from(tenantMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tournaments]);

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

  // Sorting handlers
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground/50" />;
    }
    return sortDirection === "asc"
      ? <ArrowUp className="ml-1 h-4 w-4" />
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  // Filter and sort tournaments
  const filteredTournaments = useMemo(() => {
    const filtered = tournaments.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchesTenant = tenantFilter === "ALL" || t.tenant?.id === tenantFilter;
      return matchesSearch && matchesStatus && matchesTenant;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "discipline":
          comparison = a.discipline.localeCompare(b.discipline);
          break;
        case "startDate":
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case "teams":
          const teamsA = a._count?.teams || a.participantCount || 0;
          const teamsB = b._count?.teams || b.participantCount || 0;
          comparison = teamsA - teamsB;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [tournaments, searchQuery, statusFilter, tenantFilter, sortColumn, sortDirection]);

  // Helper to convert date string to ISO8601
  const toISO8601 = (dateStr: string, isEndOfDay = false) => {
    if (!dateStr) return undefined;
    const time = isEndOfDay ? "T23:59:59.000Z" : "T00:00:00.000Z";
    return `${dateStr}${time}`;
  };

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
          name: formData.name,
          description: formData.description || undefined,
          profileId: formData.profileId || undefined,
          discipline: formData.discipline,
          location: formData.location,
          startDate: toISO8601(formData.startDate),
          endDate: toISO8601(formData.endDate, true),
          registrationOpens: toISO8601(formData.registrationOpens),
          registrationCloses: toISO8601(formData.registrationCloses, true),
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
          registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : undefined,
          gameMode: formData.gameMode,
          followsFipsasRules: formData.followsFipsasRules,
          fipsasRegulationUrl: formData.followsFipsasRules
            ? "https://www.fipsas.it/pesca-di-superficie/discipline-pesca-di-superficie/mare/big-game/circolare-normativa-big-game"
            : undefined,
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
          name: formData.name,
          description: formData.description || undefined,
          profileId: formData.profileId || undefined,
          discipline: formData.discipline,
          location: formData.location,
          startDate: toISO8601(formData.startDate),
          endDate: toISO8601(formData.endDate, true),
          registrationOpens: toISO8601(formData.registrationOpens),
          registrationCloses: toISO8601(formData.registrationCloses, true),
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
          registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : undefined,
          gameMode: formData.gameMode,
          followsFipsasRules: formData.followsFipsasRules,
          fipsasRegulationUrl: formData.followsFipsasRules
            ? "https://www.fipsas.it/pesca-di-superficie/discipline-pesca-di-superficie/mare/big-game/circolare-normativa-big-game"
            : undefined,
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

  // Handle change status using dedicated lifecycle endpoints
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

    // Map status to endpoint
    const endpointMap: Record<string, string> = {
      PUBLISHED: "publish",
      REGISTRATION_OPEN: "open-registration",
      REGISTRATION_CLOSED: "close-registration",
      ONGOING: "start",
      COMPLETED: "complete",
      CANCELLED: "cancel",
    };

    const endpoint = endpointMap[newStatus];
    if (!endpoint) {
      alert("Operazione non supportata");
      return;
    }

    const confirm_msg = `Vuoi cambiare lo stato del torneo "${tournament.name}" a "${statusLabels[newStatus]}"?`;
    if (!confirm(confirm_msg)) return;

    try {
      const response = await fetch(`${API_URL}/api/tournaments/${tournament.id}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTournaments(tournaments.map((t) =>
          t.id === tournament.id ? { ...t, status: newStatus as Tournament["status"] } : t
        ));
      } else {
        alert(`Errore: ${data.message || data.error || "Cambio stato fallito"}`);
      }
    } catch (error) {
      console.error("Error changing status:", error);
      alert(`Errore di rete: ${error}`);
    }
  };

  // Open authenticated PDF in new tab
  const openAuthenticatedPDF = async (url: string, filename: string) => {
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');

      // Cleanup blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error("Error opening PDF:", error);
      alert(`Errore apertura PDF: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      profileId: "",
      discipline: "BIG_GAME",
      startDate: "",
      endDate: "",
      registrationOpens: "",
      registrationCloses: "",
      location: "",
      maxParticipants: "",
      registrationFee: "",
      bannerImage: "",
      gameMode: "TRADITIONAL",
      followsFipsasRules: false,
      fipsasRegulationUrl: "",
    });
  };

  // Open edit dialog
  const openEditDialog = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description || "",
      profileId: (tournament as any).profileId || "",
      discipline: tournament.discipline,
      startDate: tournament.startDate?.split("T")[0] || "",
      endDate: tournament.endDate?.split("T")[0] || "",
      registrationOpens: tournament.registrationOpens?.split("T")[0] || "",
      registrationCloses: tournament.registrationCloses?.split("T")[0] || "",
      location: tournament.location,
      maxParticipants: tournament.maxParticipants?.toString() || "",
      registrationFee: tournament.registrationFee?.toString() || "",
      bannerImage: tournament.bannerImage || "",
      gameMode: (tournament as any).gameMode || "TRADITIONAL",
      followsFipsasRules: (tournament as any).followsFipsasRules || false,
      fipsasRegulationUrl: (tournament as any).fipsasRegulationUrl || "",
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

  // Open tournament mode - activates sidebar operations/statistics
  const openTournamentMode = (tournament: Tournament) => {
    const tournamentData = {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
    };
    localStorage.setItem("activeTournament", JSON.stringify(tournamentData));
    window.dispatchEvent(new Event("tournamentChanged"));

    // Navigate to appropriate page based on tournament status
    const isCompleted = tournament.status === "COMPLETED";
    if (isCompleted) {
      router.push(`/${locale}/dashboard/strikes?tournamentId=${tournament.id}&mode=history`);
    } else {
      router.push(`/${locale}/dashboard/strikes?tournamentId=${tournament.id}`);
    }
  };

  // Discipline labels
  // disciplineLabels importato da lib/disciplines

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
          <HelpGuide pageKey="admin" position="inline" isAdmin={true} />
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
              {!isInAssociationMode && (
                <Select value={tenantFilter} onValueChange={setTenantFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <SelectValue placeholder="Tutte le associazioni" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tutte le associazioni</SelectItem>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                    >
                      Torneo
                      {getSortIcon("name")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("discipline")}
                      className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                    >
                      Disciplina
                      {getSortIcon("discipline")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("startDate")}
                      className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                    >
                      Date
                      {getSortIcon("startDate")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("teams")}
                      className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                    >
                      Team
                      {getSortIcon("teams")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                    >
                      Stato
                      {getSortIcon("status")}
                    </Button>
                  </TableHead>
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
                            {/* Gestisci - Enter Tournament Management Mode */}
                            <DropdownMenuItem
                              onClick={() => router.push(`/${locale}/dashboard/tournaments/${tournament.id}`)}
                              className="text-primary font-medium"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Gestisci
                            </DropdownMenuItem>
                            {/* Open Tournament Mode - only for ONGOING/ACTIVE/COMPLETED tournaments */}
                            {(tournament.status === "ONGOING" || tournament.status === "ACTIVE" || tournament.status === "COMPLETED") && (
                              <DropdownMenuItem
                                onClick={() => openTournamentMode(tournament)}
                                className={tournament.status === "COMPLETED" ? "text-blue-600" : "text-green-600"}
                              >
                                <Trophy className="h-4 w-4 mr-2" />
                                {tournament.status === "COMPLETED" ? "Statistiche" : "Operazioni Live"}
                              </DropdownMenuItem>
                            )}
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
                                  onClick={() => openAuthenticatedPDF(
                                    `${API_URL}/api/reports/export/pdf/leaderboard/${tournament.id}/preview`,
                                    `classifica_${tournament.name.replace(/\s+/g, '_')}.pdf`
                                  )}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Anteprima Classifica PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openAuthenticatedPDF(
                                    `${API_URL}/api/reports/export/pdf/leaderboard/${tournament.id}`,
                                    `classifica_${tournament.name.replace(/\s+/g, '_')}.pdf`
                                  )}
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
            {/* Profile Selector */}
            <div className="grid gap-2">
              <Label htmlFor="profile">Profilo Torneo (opzionale)</Label>
              <Select
                value={formData.profileId || "none"}
                onValueChange={handleProfileSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingProfiles ? "Caricamento..." : "Seleziona un profilo FIPSAS o personalizzato"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessun profilo (configurazione manuale)</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div className="flex items-center gap-2">
                        <span>{profile.name}</span>
                        {profile.isSystemProfile ? (
                          <Badge variant="secondary" className="text-xs">FIPSAS</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Custom</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.profileId && (
                <p className="text-xs text-muted-foreground">
                  Il profilo precompila disciplina, modalita di gioco e regolamento FIPSAS
                </p>
              )}
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

            {/* Game Mode Section */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Modalita di Gioco</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="gameMode">Tipo Punteggio</Label>
                  <Select
                    value={formData.gameMode}
                    onValueChange={(value) => setFormData({ ...formData, gameMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRADITIONAL">
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          Tradizionale (Peso)
                        </div>
                      </SelectItem>
                      <SelectItem value="CATCH_RELEASE">
                        <div className="flex items-center gap-2">
                          <Fish className="h-4 w-4" />
                          Catch & Release (Taglia)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="followsFipsasRules"
                      checked={formData.followsFipsasRules}
                      onCheckedChange={(checked) => setFormData({ ...formData, followsFipsasRules: checked })}
                    />
                    <Label htmlFor="followsFipsasRules" className="cursor-pointer">
                      Segue regolamento FIPSAS
                    </Label>
                  </div>
                </div>
              </div>
              {formData.followsFipsasRules && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded">
                  <ExternalLink className="h-4 w-4" />
                  <a
                    href="https://www.fipsas.it/pesca-di-superficie/discipline-pesca-di-superficie/mare/big-game/circolare-normativa-big-game"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Regolamento FIPSAS Big Game
                  </a>
                </div>
              )}
              {formData.gameMode === "CATCH_RELEASE" && (
                <p className="text-sm text-muted-foreground">
                  In modalita Catch & Release il punteggio si basa sulla specie e fascia taglia (S/M/L/XL).
                  Video obbligatorio che mostri il rilascio del pesce.
                </p>
              )}
            </div>

            {/* Species Scoring Config for C&R mode */}
            {formData.gameMode === "CATCH_RELEASE" && (
              <SpeciesScoringConfig
                onChange={(scoring) => setSpeciesScoring(scoring)}
                initialScoring={speciesScoring}
              />
            )}
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

            {/* Game Mode Section */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Modalita di Gioco</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-gameMode">Tipo Punteggio</Label>
                  <Select
                    value={formData.gameMode}
                    onValueChange={(value) => setFormData({ ...formData, gameMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRADITIONAL">
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          Tradizionale (Peso)
                        </div>
                      </SelectItem>
                      <SelectItem value="CATCH_RELEASE">
                        <div className="flex items-center gap-2">
                          <Fish className="h-4 w-4" />
                          Catch & Release (Taglia)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-followsFipsasRules"
                      checked={formData.followsFipsasRules}
                      onCheckedChange={(checked) => setFormData({ ...formData, followsFipsasRules: checked })}
                    />
                    <Label htmlFor="edit-followsFipsasRules" className="cursor-pointer">
                      Segue regolamento FIPSAS
                    </Label>
                  </div>
                </div>
              </div>
              {formData.followsFipsasRules && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded">
                  <ExternalLink className="h-4 w-4" />
                  <a
                    href="https://www.fipsas.it/pesca-di-superficie/discipline-pesca-di-superficie/mare/big-game/circolare-normativa-big-game"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Regolamento FIPSAS Big Game
                  </a>
                </div>
              )}
              {formData.gameMode === "CATCH_RELEASE" && (
                <p className="text-sm text-muted-foreground">
                  In modalita Catch & Release il punteggio si basa sulla specie e fascia taglia (S/M/L/XL).
                  Video obbligatorio che mostri il rilascio del pesce.
                </p>
              )}
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
