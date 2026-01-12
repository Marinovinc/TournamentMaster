/**
 * =============================================================================
 * JUDGE DASHBOARD - CATCH VALIDATION
 * =============================================================================
 * Dashboard per giudici e admin per validare le catture
 *
 * Features:
 * - Lista catture pendenti
 * - Filtri per torneo/stato
 * - Approvazione/Rifiuto con note
 * - Preview foto e dati GPS
 * =============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { HelpGuide } from "@/components/HelpGuide";
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Weight,
  Ruler,
  Calendar,
  User,
  Fish,
  AlertTriangle,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Video,
  Image,
  History,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/media";

interface Tournament {
  id: string;
  name: string;
  status: string;
}

interface CatchMedia {
  id: string;
  type: "PHOTO" | "VIDEO";
  path: string;
  filename: string;
  mimeType?: string;
  size?: number;
  thumbnailPath?: string;
  duration?: number;
  isPrimary: boolean;
  caption?: string;
  displayOrder: number;
}

interface Catch {
  id: string;
  weight: number;
  length?: number;
  latitude: number;
  longitude: number;
  gpsAccuracy?: number;
  photoPath: string;
  videoPath?: string;
  caughtAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isInsideZone: boolean;
  notes?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  points?: number;
  // Multi-media support
  media?: CatchMedia[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tournament: {
    id: string;
    name: string;
  };
  species?: {
    id: string;
    commonNameIt: string;
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function JudgeDashboardPage() {
  const { token, hasRole } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string || "it";
  const isHistoryMode = searchParams.get("mode") === "history";
  
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(isHistoryMode ? "ALL" : "PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("ALL");

  // Dialog state
  const [selectedCatch, setSelectedCatch] = useState<Catch | null>(null);
  const [dialogMode, setDialogMode] = useState<"view" | "approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Sorting state
  type SortColumn = "user" | "tournament" | "species" | "weight" | "caughtAt" | "status";
  type SortDirection = "asc" | "desc";
  const [sortColumn, setSortColumn] = useState<SortColumn>("caughtAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Check authorization
  const canValidate = hasRole("SUPER_ADMIN", "TENANT_ADMIN", "ORGANIZER", "JUDGE");

  // Fetch tournaments list
  useEffect(() => {
    const fetchTournaments = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/tournaments?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data) {
          // Filter to show only ONGOING and recently COMPLETED tournaments
          const relevantTournaments = (data.data.tournaments || data.data || [])
            .filter((t: Tournament) =>
              t.status === "ONGOING" || t.status === "COMPLETED"
            );
          setTournaments(relevantTournaments);
        }
      } catch (error) {
        console.error("Failed to fetch tournaments:", error);
        // Demo tournaments
        setTournaments([
          { id: "t1", name: "Trofeo Ischia Big Game 2024", status: "ONGOING" },
          { id: "t2", name: "Coppa Inverno Ischia 2024", status: "ONGOING" },
        ]);
      }
    };
    fetchTournaments();
  }, [token]);

  useEffect(() => {
    fetchCatches();
  }, [token, statusFilter, selectedTournamentId]);

  const fetchCatches = async () => {
    if (!token) return;

    setLoading(true);
    try {
      let url: string;
      const params = new URLSearchParams();

      // If a specific tournament is selected and status is PENDING, use the tournament-specific endpoint
      if (selectedTournamentId && selectedTournamentId !== "ALL" && statusFilter === "PENDING") {
        url = `${API_URL}/api/catches/tournament/${selectedTournamentId}/pending`;
        params.append("limit", "50");
      } else {
        // Use general endpoint with filters
        url = `${API_URL}/api/catches`;
        if (statusFilter && statusFilter !== "ALL") {
          params.append("status", statusFilter);
        }
        if (selectedTournamentId && selectedTournamentId !== "ALL") {
          params.append("tournamentId", selectedTournamentId);
        }
        params.append("limit", "50");
      }

      const res = await fetch(`${url}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        setCatches(data.data?.catches || data.data || []);
      } else {
        // If API fails, show demo data filtered by tournament
        let demoCatches = getDemoCatches();
        if (selectedTournamentId && selectedTournamentId !== "ALL") {
          demoCatches = demoCatches.filter(c => c.tournament.id === selectedTournamentId);
        }
        setCatches(demoCatches);
      }
    } catch (error) {
      console.error("Failed to fetch catches:", error);
      // Show demo data on error, filtered by tournament
      let demoCatches = getDemoCatches();
      if (selectedTournamentId && selectedTournamentId !== "ALL") {
        demoCatches = demoCatches.filter(c => c.tournament.id === selectedTournamentId);
      }
      setCatches(demoCatches);
    } finally {
      setLoading(false);
    }
  };

  // Demo data for when API is not available
  // Photos: foto reali dalla collezione utente in /public/demo/
  const getDemoCatches = (): Catch[] => [
    {
      id: "catch-1",
      weight: 127.5,
      length: 210,
      latitude: 40.72,
      longitude: 13.90,
      gpsAccuracy: 5.0,
      // Aguglia Imperiale - foto reale
      photoPath: "/demo/catch1.jpg",
      caughtAt: new Date().toISOString(),
      status: "PENDING",
      isInsideZone: true,
      user: { id: "u1", firstName: "Giuseppe", lastName: "Marino", email: "g.marino@demo.it" },
      tournament: { id: "t1", name: "Trofeo Ischia Big Game 2024" },
      species: { id: "s1", commonNameIt: "Aguglia Imperiale" },
    },
    {
      id: "catch-2",
      weight: 32.8,
      length: 115,
      latitude: 40.73,
      longitude: 13.88,
      gpsAccuracy: 3.0,
      // Tonno - foto reale
      photoPath: "/demo/catch2.jpg",
      caughtAt: new Date(Date.now() - 3600000).toISOString(),
      status: "PENDING",
      isInsideZone: true,
      user: { id: "u2", firstName: "Marco", lastName: "De Luca", email: "m.deluca@demo.it" },
      tournament: { id: "t1", name: "Trofeo Ischia Big Game 2024" },
      species: { id: "s2", commonNameIt: "Tonno" },
    },
    {
      id: "catch-3",
      weight: 18.5,
      length: 95,
      latitude: 40.71,
      longitude: 13.91,
      gpsAccuracy: 8.0,
      // Totano - foto reale
      photoPath: "/demo/catch3.jpg",
      caughtAt: new Date(Date.now() - 7200000).toISOString(),
      status: "PENDING",
      isInsideZone: false,
      notes: "Cattura ai limiti della zona di gara",
      user: { id: "u3", firstName: "Roberto", lastName: "Colombo", email: "r.colombo@demo.it" },
      tournament: { id: "t2", name: "Coppa Inverno Ischia 2024" },
      species: { id: "s3", commonNameIt: "Totano" },
    },
    {
      id: "catch-4",
      weight: 52.3,
      length: 165,
      latitude: 40.74,
      longitude: 13.89,
      gpsAccuracy: 4.0,
      // Foto reale con video
      photoPath: "/demo/catch4.jpg",
      videoPath: "/demo/catch4_video.mp4",
      caughtAt: new Date(Date.now() - 10800000).toISOString(),
      status: "PENDING",
      isInsideZone: true,
      notes: "Video della cattura allegato",
      user: { id: "u4", firstName: "Antonio", lastName: "Ferrara", email: "a.ferrara@demo.it" },
      tournament: { id: "t1", name: "Trofeo Ischia Big Game 2024" },
      species: { id: "s4", commonNameIt: "Ricciola" },
    },
    {
      id: "catch-5",
      weight: 68.0,
      length: 175,
      latitude: 40.70,
      longitude: 13.92,
      gpsAccuracy: 6.0,
      // Foto reale
      photoPath: "/demo/catch5.jpg",
      caughtAt: new Date(Date.now() - 14400000).toISOString(),
      status: "PENDING",
      isInsideZone: true,
      user: { id: "u5", firstName: "Salvatore", lastName: "Esposito", email: "s.esposito@demo.it" },
      tournament: { id: "t2", name: "Coppa Inverno Ischia 2024" },
      species: { id: "s5", commonNameIt: "Pesce spada" },
    },
  ];

  const handleApprove = async () => {
    if (!selectedCatch) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/catches/${selectedCatch.id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reviewNotes }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cattura approvata con successo!");
        setCatches(prev =>
          prev.map(c =>
            c.id === selectedCatch.id ? { ...c, status: "APPROVED" as const, reviewNotes } : c
          )
        );
        closeDialog();
      } else {
        toast.error(data.message || "Errore durante l'approvazione");
      }
    } catch (error) {
      // Demo mode - simulate success
      toast.success("Cattura approvata! (demo mode)");
      setCatches(prev =>
        prev.map(c =>
          c.id === selectedCatch.id ? { ...c, status: "APPROVED" as const, reviewNotes } : c
        )
      );
      closeDialog();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCatch || !reviewNotes.trim()) {
      toast.error("Inserisci una motivazione per il rifiuto");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/catches/${selectedCatch.id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reviewNotes }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cattura rifiutata");
        setCatches(prev =>
          prev.map(c =>
            c.id === selectedCatch.id ? { ...c, status: "REJECTED" as const, reviewNotes } : c
          )
        );
        closeDialog();
      } else {
        toast.error(data.message || "Errore durante il rifiuto");
      }
    } catch (error) {
      // Demo mode - simulate success
      toast.success("Cattura rifiutata (demo mode)");
      setCatches(prev =>
        prev.map(c =>
          c.id === selectedCatch.id ? { ...c, status: "REJECTED" as const, reviewNotes } : c
        )
      );
      closeDialog();
    } finally {
      setActionLoading(false);
    }
  };

  const openDialog = (catchItem: Catch, mode: "view" | "approve" | "reject") => {
    setSelectedCatch(catchItem);
    setDialogMode(mode);
    setReviewNotes("");
  };

  const closeDialog = () => {
    setSelectedCatch(null);
    setDialogMode(null);
    setReviewNotes("");
    setShowVideo(false);
    setCurrentMediaIndex(0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />In Attesa</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approvata</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rifiutata</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle column sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Sort icon component
  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortDirection === "asc"
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  // Filter and sort catches
  const filteredCatches = catches
    .filter(c => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        c.user.firstName.toLowerCase().includes(query) ||
        c.user.lastName.toLowerCase().includes(query) ||
        c.tournament.name.toLowerCase().includes(query) ||
        c.species?.commonNameIt.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case "user":
          comparison = `${a.user.lastName} ${a.user.firstName}`.localeCompare(`${b.user.lastName} ${b.user.firstName}`);
          break;
        case "tournament":
          comparison = a.tournament.name.localeCompare(b.tournament.name);
          break;
        case "species":
          comparison = (a.species?.commonNameIt || "").localeCompare(b.species?.commonNameIt || "");
          break;
        case "weight":
          comparison = Number(a.weight) - Number(b.weight);
          break;
        case "caughtAt":
          comparison = new Date(a.caughtAt).getTime() - new Date(b.caughtAt).getTime();
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const pendingCount = catches.filter(c => c.status === "PENDING").length;

  if (!canValidate) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Accesso Non Autorizzato</h2>
          <p className="text-muted-foreground">
            Non hai i permessi per accedere a questa sezione.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {isHistoryMode ? (
                <><History className="h-8 w-8 text-blue-500" /> Storico Catture</>
              ) : (
                <>Validazione Catture</>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isHistoryMode
                ? "Archivio catture validate dei tornei completati"
                : `${pendingCount} catture in attesa di validazione${
                    selectedTournamentId !== "ALL"
                      ? ` per ${tournaments.find(t => t.id === selectedTournamentId)?.name || "torneo selezionato"}`
                      : ""
                  }`}
            </p>
          </div>
          <HelpGuide pageKey="judge" position="inline" isAdmin={true} />
        </div>
        <Button onClick={fetchCatches} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per pescatore, specie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Tournament Filter */}
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger className="w-[280px]">
                <Fish className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Seleziona torneo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tutti i tornei</SelectItem>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-2">
                      {t.name}
                      {t.status === "ONGOING" && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                          In Corso
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtra per stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tutti gli stati</SelectItem>
                <SelectItem value="PENDING">In Attesa</SelectItem>
                <SelectItem value="APPROVED">Approvate</SelectItem>
                <SelectItem value="REJECTED">Rifiutate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Catches Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCatches.length === 0 ? (
            <div className="text-center p-12">
              <Fish className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessuna cattura trovata</h3>
              <p className="text-muted-foreground">
                Non ci sono catture che corrispondono ai filtri selezionati.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("user")}
                  >
                    <span className="flex items-center">Pescatore<SortIcon column="user" /></span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("tournament")}
                  >
                    <span className="flex items-center">Torneo<SortIcon column="tournament" /></span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("species")}
                  >
                    <span className="flex items-center">Specie<SortIcon column="species" /></span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("weight")}
                  >
                    <span className="flex items-center">Peso<SortIcon column="weight" /></span>
                  </TableHead>
                  <TableHead>GPS</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("caughtAt")}
                  >
                    <span className="flex items-center">Data<SortIcon column="caughtAt" /></span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("status")}
                  >
                    <span className="flex items-center">Stato<SortIcon column="status" /></span>
                  </TableHead>
                  <TableHead>Validato da</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCatches.map((catchItem) => (
                  <TableRow key={catchItem.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                          {catchItem.user.firstName[0]}{catchItem.user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {catchItem.user.firstName} {catchItem.user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {catchItem.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{catchItem.tournament.name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {catchItem.species?.commonNameIt || "N/A"}
                        </span>
                        {/* Media count indicator */}
                        {catchItem.media && catchItem.media.length > 0 ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                            {catchItem.media.filter(m => m.type === "PHOTO").length > 0 && (
                              <><Image className="h-3 w-3 mr-0.5" />{catchItem.media.filter(m => m.type === "PHOTO").length}</>
                            )}
                            {catchItem.media.filter(m => m.type === "VIDEO").length > 0 && (
                              <><Video className="h-3 w-3 ml-1 mr-0.5" />{catchItem.media.filter(m => m.type === "VIDEO").length}</>
                            )}
                          </Badge>
                        ) : catchItem.videoPath && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                            <Video className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Weight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-semibold">{catchItem.weight} kg</span>
                      </div>
                      {catchItem.length && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Ruler className="h-3 w-3" />
                          {catchItem.length} cm
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {catchItem.isInsideZone ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            In Zona
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Fuori Zona
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(catchItem.caughtAt)}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(catchItem.status)}</TableCell>
                    <TableCell>
                      {catchItem.reviewer ? (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {catchItem.reviewer.firstName} {catchItem.reviewer.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(catchItem, "view")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {catchItem.status === "PENDING" && !isHistoryMode && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => openDialog(catchItem, "approve")}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDialog(catchItem, "reject")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View/Action Dialog */}
      <Dialog open={!!dialogMode} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "view" && "Dettagli Cattura"}
              {dialogMode === "approve" && "Approva Cattura"}
              {dialogMode === "reject" && "Rifiuta Cattura"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "view" && "Visualizza tutti i dettagli della cattura"}
              {dialogMode === "approve" && "Conferma l'approvazione di questa cattura"}
              {dialogMode === "reject" && "Specifica il motivo del rifiuto"}
            </DialogDescription>
          </DialogHeader>

          {selectedCatch && (
            <div className="space-y-4">
              {/* Multi-Media Gallery */}
              {(() => {
                // Build media list from either media[] or legacy photoPath/videoPath
                const mediaList: CatchMedia[] = selectedCatch.media && selectedCatch.media.length > 0
                  ? [...selectedCatch.media].sort((a, b) => a.displayOrder - b.displayOrder)
                  : [
                      // Legacy: single photo + optional video
                      { id: "legacy-photo", type: "PHOTO" as const, path: selectedCatch.photoPath, filename: "photo.jpg", isPrimary: true, displayOrder: 0 },
                      ...(selectedCatch.videoPath ? [{ id: "legacy-video", type: "VIDEO" as const, path: selectedCatch.videoPath, filename: "video.mp4", isPrimary: false, displayOrder: 1 }] : [])
                    ];

                const currentMedia = mediaList[currentMediaIndex] || mediaList[0];
                const hasMultipleMedia = mediaList.length > 1;

                return (
                  <>
                    {/* Media Thumbnails Strip */}
                    {hasMultipleMedia && (
                      <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                        {mediaList.map((media, index) => (
                          <button
                            key={media.id}
                            onClick={() => setCurrentMediaIndex(index)}
                            className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              index === currentMediaIndex
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-transparent hover:border-muted-foreground/30"
                            }`}
                          >
                            {media.type === "VIDEO" ? (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <Play className="h-6 w-6 text-white" />
                              </div>
                            ) : (
                              <img
                                src={getMediaUrl(media.path)}
                                alt={`Media ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                            <div className="absolute bottom-0.5 right-0.5">
                              <Badge className="h-4 px-1 text-[10px] bg-black/70 text-white">
                                {media.type === "VIDEO" ? <Video className="h-2.5 w-2.5" /> : <Image className="h-2.5 w-2.5" />}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Main Media Display */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      {currentMedia.type === "VIDEO" ? (
                        <video
                          key={currentMedia.id}
                          src={getMediaUrl(currentMedia.path)}
                          className="w-full h-full object-contain bg-black"
                          controls
                          autoPlay
                          title="Video cattura"
                        />
                      ) : (
                        <img
                          src={getMediaUrl(currentMedia.path)}
                          alt={`Cattura di ${selectedCatch.species?.commonNameIt || "pesce"}`}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Navigation Arrows */}
                      {hasMultipleMedia && (
                        <>
                          <button
                            onClick={() => setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : mediaList.length - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setCurrentMediaIndex(prev => prev < mediaList.length - 1 ? prev + 1 : 0)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}

                      {/* Info Badge */}
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        {hasMultipleMedia && (
                          <Badge className="bg-black/70 text-white">
                            {currentMediaIndex + 1} / {mediaList.length}
                          </Badge>
                        )}
                        <Badge className="bg-black/70 text-white">
                          {selectedCatch.weight} kg
                        </Badge>
                      </div>

                      {/* Media Type Label */}
                      <div className="absolute top-2 left-2">
                        <Badge className={currentMedia.type === "VIDEO" ? "bg-blue-600 text-white" : "bg-green-600 text-white"}>
                          {currentMedia.type === "VIDEO" ? <><Video className="h-3 w-3 mr-1" />Video</> : <><Image className="h-3 w-3 mr-1" />Foto</>}
                        </Badge>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Catch Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Pescatore</label>
                  <p className="font-medium">
                    {selectedCatch.user.firstName} {selectedCatch.user.lastName}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Torneo</label>
                  <p className="font-medium">{selectedCatch.tournament.name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Specie</label>
                  <p className="font-medium">{selectedCatch.species?.commonNameIt || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Peso</label>
                  <p className="font-medium text-lg">{selectedCatch.weight} kg</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Lunghezza</label>
                  <p className="font-medium">{selectedCatch.length || "N/A"} cm</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Data/Ora</label>
                  <p className="font-medium">{formatDate(selectedCatch.caughtAt)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Coordinate GPS</label>
                  <p className="font-mono text-sm">
                    {parseFloat(String(selectedCatch.latitude)).toFixed(4)}, {parseFloat(String(selectedCatch.longitude)).toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Precisione: ±{selectedCatch.gpsAccuracy || "N/A"}m
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Zona</label>
                  {selectedCatch.isInsideZone ? (
                    <Badge className="bg-green-100 text-green-700">Dentro la zona autorizzata</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">FUORI dalla zona autorizzata</Badge>
                  )}
                </div>
              </div>

              {/* Notes from fisher */}
              {selectedCatch.notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <label className="text-sm text-muted-foreground">Note del pescatore</label>
                  <p className="mt-1">{selectedCatch.notes}</p>
                </div>
              )}

              {/* Reviewer info (for approved/rejected catches) */}
              {selectedCatch.reviewer && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="text-sm text-blue-700 font-medium">Validato da</label>
                  <p className="mt-1 font-medium">
                    {selectedCatch.reviewer.firstName} {selectedCatch.reviewer.lastName}
                  </p>
                  {selectedCatch.reviewedAt && (
                    <p className="text-xs text-blue-600 mt-1">
                      {formatDate(selectedCatch.reviewedAt)}
                    </p>
                  )}
                  {selectedCatch.reviewNotes && (
                    <p className="mt-2 text-sm text-blue-800">
                      {selectedCatch.reviewNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Review Notes Input */}
              {(dialogMode === "approve" || dialogMode === "reject") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Note di validazione
                    {dialogMode === "reject" && <span className="text-red-500">*</span>}
                  </label>
                  <Textarea
                    placeholder={
                      dialogMode === "approve"
                        ? "Note opzionali per il pescatore..."
                        : "Specifica il motivo del rifiuto (obbligatorio)..."
                    }
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {dialogMode === "view" ? "Chiudi" : "Annulla"}
            </Button>
            {dialogMode === "approve" && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? "Approvazione..." : "Approva Cattura"}
              </Button>
            )}
            {dialogMode === "reject" && (
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading || !reviewNotes.trim()}
              >
                {actionLoading ? "Rifiuto..." : "Rifiuta Cattura"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
