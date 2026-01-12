/**
 * =============================================================================
 * ADMIN DASHBOARD PAGE
 * =============================================================================
 * Dashboard amministratore - gestione tornei, utenti, statistiche
 * =============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { getMediaUrl } from "@/lib/media";
import { useAuth } from "@/contexts/AuthContext";
import { HelpGuide } from "@/components/HelpGuide";
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
  Users,
  Fish,
  TrendingUp,
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
  Clock,
  Ban,
  Send,
  PlayCircle,
  XCircle,
  Settings,
} from "lucide-react";

// Types
interface Tenant {
  id: string;
  name: string;
  slug?: string;
}

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
  tenantId?: string;
  tenant?: Tenant;
}

interface AdminStats {
  totalTournaments: number;
  activeTournaments: number;
  totalUsers: number;
  totalCatches: number;
  pendingCatches: number;
  revenueThisMonth: number;
}

// Demo data for when API is not available
const DEMO_TOURNAMENTS: Tournament[] = [
  {
    id: "1",
    name: "Gran Premio Mediterraneo 2025",
    description: "Il torneo di pesca sportiva più importante del Mediterraneo",
    discipline: "BIG_GAME",
    status: "ACTIVE",
    startDate: "2025-07-15",
    endDate: "2025-07-17",
    registrationOpens: "2025-06-01",
    registrationCloses: "2025-07-10",
    location: "Ischia, Italia",
    maxParticipants: 100,
    registrationFee: 150,
    participantCount: 78,
    bannerImage: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
  },
  {
    id: "2",
    name: "Trofeo Estate Costa Azzurra",
    description: "Competizione internazionale sulla Costa Azzurra",
    discipline: "TRAINA_COSTIERA",
    status: "REGISTRATION_OPEN",
    startDate: "2025-08-20",
    endDate: "2025-08-22",
    registrationOpens: "2025-07-01",
    registrationCloses: "2025-08-15",
    location: "Nizza, Francia",
    maxParticipants: 50,
    registrationFee: 200,
    participantCount: 23,
  },
  {
    id: "3",
    name: "Campionato Regionale Toscana",
    description: "Campionato ufficiale della regione Toscana",
    discipline: "SHORE",
    status: "DRAFT",
    startDate: "2025-09-10",
    endDate: "2025-09-12",
    registrationOpens: "2025-08-01",
    registrationCloses: "2025-09-05",
    location: "Livorno, Italia",
    maxParticipants: 80,
    registrationFee: 100,
    participantCount: 0,
  },
  {
    id: "4",
    name: "Trofeo Primavera Sardegna",
    description: "Primo torneo stagionale in Sardegna",
    discipline: "VERTICAL_JIGGING",
    status: "COMPLETED",
    startDate: "2025-04-15",
    endDate: "2025-04-17",
    registrationOpens: "2025-03-01",
    registrationCloses: "2025-04-10",
    location: "Cagliari, Italia",
    maxParticipants: 60,
    registrationFee: 120,
    participantCount: 55,
  },
];

const DEMO_STATS: AdminStats = {
  totalTournaments: 12,
  activeTournaments: 3,
  totalUsers: 1250,
  totalCatches: 3420,
  pendingCatches: 15,
  revenueThisMonth: 8500,
};

export default function AdminDashboardPage() {
  const { user, token, isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string || "it";

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [tenantFilter, setTenantFilter] = useState<string>("ALL");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state for create/edit
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

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setStats(DEMO_STATS);
        setTournaments(DEMO_TOURNAMENTS);
        setLoading(false);
        return;
      }

      try {
        // Fetch tournaments and tenants in parallel
        const [tournamentsRes, tenantsRes] = await Promise.all([
          fetch(`${API_URL}/api/tournaments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/tenants`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (tournamentsRes.ok) {
          const tournamentsData = await tournamentsRes.json();
          setTournaments(tournamentsData.data || []);
        } else {
          // Use demo data on API failure
          setTournaments(DEMO_TOURNAMENTS);
        }

        if (tenantsRes.ok) {
          const tenantsData = await tenantsRes.json();
          setTenants(tenantsData.data || []);
        }

        // For stats, use demo data for now
        setStats(DEMO_STATS);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setStats(DEMO_STATS);
        setTournaments(DEMO_TOURNAMENTS);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, API_URL]);

  // Check admin access
  useEffect(() => {
    if (!isAdmin && !loading) {
      router.push(`/${locale}/dashboard`);
    }
  }, [isAdmin, loading, router, locale]);

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
    const matchesTenant = tenantFilter === "ALL" || t.tenantId === tenantFilter || t.tenant?.id === tenantFilter;
    return matchesSearch && matchesStatus && matchesTenant;
  });

  // Handle create tournament
  const handleCreateTournament = async () => {
    // Avviso per campi opzionali mancanti (non bloccante)
    const warnings: string[] = [];
    if (!formData.maxParticipants) warnings.push("Numero massimo partecipanti");
    if (!formData.registrationFee) warnings.push("Quota iscrizione");

    if (warnings.length > 0) {
      const proceed = confirm(
        `Attenzione: i seguenti campi non sono compilati:\n\n• ${warnings.join('\n• ')}\n\nVuoi procedere comunque?`
      );
      if (!proceed) return;
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
        // Mostra errori di validazione specifici
        let errorMessage = data.message || "Creazione torneo fallita";
        if (data.errors && Array.isArray(data.errors)) {
          const fieldErrors = data.errors.map((e: { path?: string; param?: string; msg: string }) =>
            `• ${e.path || e.param || 'Campo'}: ${e.msg}`
          ).join('\n');
          errorMessage = `${errorMessage}:\n\n${fieldErrors}`;
        }
        alert(errorMessage);
        console.error("Tournament creation error:", data);
      }
    } catch (error) {
      console.error("Error creating tournament:", error);
      // For demo, add locally
      const newTournament: Tournament = {
        id: `demo-${Date.now()}`,
        ...formData,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : undefined,
        status: "DRAFT",
        participantCount: 0,
      };
      setTournaments([newTournament, ...tournaments]);
      setCreateDialogOpen(false);
      resetForm();
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit tournament
  const handleEditTournament = async () => {
    if (!selectedTournament) return;

    // Avviso per campi opzionali mancanti (non bloccante)
    const warnings: string[] = [];
    if (!formData.maxParticipants) warnings.push("Numero massimo partecipanti");
    if (!formData.registrationFee) warnings.push("Quota iscrizione");

    if (warnings.length > 0) {
      const proceed = confirm(
        `Attenzione: i seguenti campi non sono compilati:\n\n• ${warnings.join('\n• ')}\n\nVuoi procedere comunque?`
      );
      if (!proceed) return;
    }

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
        // Mostra errori di validazione specifici
        let errorMessage = data.message || "Modifica torneo fallita";
        if (data.errors && Array.isArray(data.errors)) {
          const fieldErrors = data.errors.map((e: { path?: string; param?: string; msg: string }) =>
            `• ${e.path || e.param || 'Campo'}: ${e.msg}`
          ).join('\n');
          errorMessage = `${errorMessage}:\n\n${fieldErrors}`;
        }
        alert(errorMessage);
        console.error("Tournament update error:", data);
      }
    } catch (error) {
      console.error("Error updating tournament:", error);
      // For demo, update locally
      setTournaments(tournaments.map((t) =>
        t.id === selectedTournament.id
          ? { ...t, ...formData, maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined, registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : undefined }
          : t
      ));
      setEditDialogOpen(false);
      setSelectedTournament(null);
      resetForm();
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setTournaments(tournaments.filter((t) => t.id !== selectedTournament.id));
      } else {
        alert(`Errore: ${data.message || "Eliminazione torneo fallita"}`);
        console.error("Tournament delete error:", data);
      }
    } catch (error) {
      console.error("Error deleting tournament:", error);
      // For demo, remove locally
      setTournaments(tournaments.filter((t) => t.id !== selectedTournament.id));
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTournament(null);
      setFormLoading(false);
    }
  };

  // Handle change tournament status
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

    const confirm_msg = `Vuoi cambiare lo stato del torneo "${tournament.name}" da "${statusLabels[tournament.status] || tournament.status}" a "${statusLabels[newStatus] || newStatus}"?`;
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
        console.error("Status change error:", data);
      }
    } catch (error) {
      console.error("Error changing status:", error);
      setFormLoading(false);
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
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      registrationOpens: tournament.registrationOpens,
      registrationCloses: tournament.registrationCloses,
      location: tournament.location,
      maxParticipants: tournament.maxParticipants?.toString() || "",
      registrationFee: tournament.registrationFee?.toString() || "",
      bannerImage: tournament.bannerImage || "",
    });
    setEditDialogOpen(true);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">Pannello Admin</h1>
            <p className="text-muted-foreground mt-1">
              Gestisci tornei, utenti e monitora le statistiche
            </p>
          </div>
          <HelpGuide pageKey="admin" position="inline" isAdmin={true} />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/dashboard/admin/profiles`)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Profili Torneo
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo Torneo
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tornei Totali</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTournaments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeTournaments || 0} attivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utenti Registrati</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Sulla piattaforma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catture Totali</CardTitle>
            <Fish className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCatches || 0}</div>
            <p className="text-xs text-muted-foreground text-yellow-600">
              {stats?.pendingCatches || 0} da validare
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ricavi Mese</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(stats?.revenueThisMonth || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Da iscrizioni
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tournaments Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Gestione Tornei</CardTitle>
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
                  <SelectItem value="REGISTRATION_OPEN">Iscrizioni Aperte</SelectItem>
                  <SelectItem value="REGISTRATION_CLOSED">Iscrizioni Chiuse</SelectItem>
                  <SelectItem value="ACTIVE">In Corso</SelectItem>
                  <SelectItem value="COMPLETED">Completato</SelectItem>
                  <SelectItem value="CANCELLED">Annullato</SelectItem>
                </SelectContent>
              </Select>
              {tenants.length > 0 && (
                <Select value={tenantFilter} onValueChange={setTenantFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filtra per associazione" />
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Torneo</TableHead>
                  <TableHead>Associazione</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Partecipanti</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTournaments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Trophy className="h-8 w-8" />
                        <p>Nessun torneo trovato</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCreateDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crea il primo torneo
                        </Button>
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
                        <span className="text-sm">
                          {tournament.tenant?.name || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tournament.discipline}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {tournament.participantCount || 0}
                          {tournament.maxParticipants && (
                            <span className="text-muted-foreground">
                              /{tournament.maxParticipants}
                            </span>
                          )}
                        </span>
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
                            {/* Opzioni cambio stato in base allo stato corrente */}
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
                              <>
                                <DropdownMenuItem
                                  className="text-blue-600"
                                  onClick={() => handleChangeStatus(tournament, "REGISTRATION_OPEN")}
                                >
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Apri Iscrizioni
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-orange-600"
                                  onClick={() => handleChangeStatus(tournament, "CANCELLED")}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Annulla Torneo
                                </DropdownMenuItem>
                              </>
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
                    <SelectItem value="SOCIAL">Social</SelectItem>
                    <SelectItem value="FLY_FISHING">Pesca a Mosca</SelectItem>
                    <SelectItem value="BOTTOM_FISHING">Pesca a Fondo</SelectItem>
                    <SelectItem value="BIG_GAME">Big Game</SelectItem>
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
                <Label htmlFor="registrationOpens">Apertura Iscrizioni *</Label>
                <Input
                  id="registrationOpens"
                  type="date"
                  value={formData.registrationOpens}
                  onChange={(e) => setFormData({ ...formData, registrationOpens: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="registrationCloses">Chiusura Iscrizioni *</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="bannerImage">URL Immagine Banner</Label>
              <Input
                id="bannerImage"
                value={formData.bannerImage}
                onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreateTournament} disabled={formLoading || !formData.name || !formData.location}>
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
                    <SelectItem value="SOCIAL">Social</SelectItem>
                    <SelectItem value="FLY_FISHING">Pesca a Mosca</SelectItem>
                    <SelectItem value="BOTTOM_FISHING">Pesca a Fondo</SelectItem>
                    <SelectItem value="BIG_GAME">Big Game</SelectItem>
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
                <Label htmlFor="edit-registrationOpens">Apertura Iscrizioni *</Label>
                <Input
                  id="edit-registrationOpens"
                  type="date"
                  value={formData.registrationOpens}
                  onChange={(e) => setFormData({ ...formData, registrationOpens: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-registrationCloses">Chiusura Iscrizioni *</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="edit-bannerImage">URL Immagine Banner</Label>
              <Input
                id="edit-bannerImage"
                value={formData.bannerImage}
                onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleEditTournament} disabled={formLoading || !formData.name || !formData.location}>
              {formLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Salva Modifiche
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
              Questa azione non può essere annullata.
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
