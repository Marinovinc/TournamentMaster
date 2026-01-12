/**
 * =============================================================================
 * TOURNAMENT PARTICIPANTS PAGE
 * =============================================================================
 * Gestione partecipanti del torneo
 * - Lista iscritti con filtri e ricerca
 * - Stato iscrizione (confermato, in attesa, cancellato)
 * - Info team, barca, club
 * - Azioni: conferma, cancella, modifica
 * =============================================================================
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Users,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Ship,
  Building2,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Download,
  Plus,
  RefreshCw,
  Trophy,
  Hash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";

interface Participant {
  id: string;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "REFUNDED";
  registeredAt: string;
  confirmedAt: string | null;
  teamName: string | null;
  boatName: string | null;
  boatLength: number | null;
  boatNumber: number | null;
  clubName: string | null;
  clubCode: string | null;
  amountPaid: number | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  registrationFee: number;
}

type SortColumn = "boatNumber" | "name" | "team" | "club" | "status" | "registeredAt";
type SortDirection = "asc" | "desc";

export default function ParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isAdmin } = useAuth();
  const locale = (params.locale as string) || "it";
  const tournamentId = params.id as string;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortColumn, setSortColumn] = useState<SortColumn>("boatNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch tournament and participants
  useEffect(() => {
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

          // Activate Tournament Mode
          const tournamentModeData = {
            id: tournamentData.data.id,
            name: tournamentData.data.name,
            status: tournamentData.data.status,
          };
          localStorage.setItem("activeTournament", JSON.stringify(tournamentModeData));
          window.dispatchEvent(new Event("tournamentChanged"));
        }

        // Fetch participants
        const participantsRes = await fetch(`${API_URL}/api/tournaments/${tournamentId}/participants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (participantsRes.ok) {
          const participantsData = await participantsRes.json();
          setParticipants(participantsData.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, tournamentId, API_URL]);

  // Status badge
  const getStatusBadge = (status: Participant["status"]) => {
    const config: Record<Participant["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      CONFIRMED: { label: "Confermato", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      PENDING_PAYMENT: { label: "In Attesa", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      CANCELLED: { label: "Cancellato", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
      REFUNDED: { label: "Rimborsato", variant: "outline", icon: <RefreshCw className="h-3 w-3" /> },
    };

    const { label, variant, icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {label}
      </Badge>
    );
  };

  // Sorting
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

  // Filter and sort participants
  const filteredParticipants = useMemo(() => {
    let result = participants.filter((p) => {
      const fullName = `${p.user.firstName} ${p.user.lastName}`.toLowerCase();
      const searchLower = searchQuery.toLowerCase();

      const matchesSearch =
        fullName.includes(searchLower) ||
        p.teamName?.toLowerCase().includes(searchLower) ||
        p.boatName?.toLowerCase().includes(searchLower) ||
        p.user.email.toLowerCase().includes(searchLower) ||
        p.clubName?.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case "boatNumber":
          comparison = (a.boatNumber || 999) - (b.boatNumber || 999);
          break;
        case "name":
          comparison = `${a.user.firstName} ${a.user.lastName}`.localeCompare(
            `${b.user.firstName} ${b.user.lastName}`
          );
          break;
        case "team":
          comparison = (a.teamName || "").localeCompare(b.teamName || "");
          break;
        case "club":
          comparison = (a.clubName || "").localeCompare(b.clubName || "");
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "registeredAt":
          comparison = new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [participants, searchQuery, statusFilter, sortColumn, sortDirection]);

  // Stats
  const stats = useMemo(() => {
    const confirmed = participants.filter(p => p.status === "CONFIRMED").length;
    const pending = participants.filter(p => p.status === "PENDING_PAYMENT").length;
    const cancelled = participants.filter(p => p.status === "CANCELLED" || p.status === "REFUNDED").length;
    const totalPaid = participants
      .filter(p => p.status === "CONFIRMED")
      .reduce((sum, p) => {
        const amount = typeof p.amountPaid === "number" ? p.amountPaid : parseFloat(p.amountPaid as unknown as string) || 0;
        return sum + amount;
      }, 0);

    return { confirmed, pending, cancelled, total: participants.length, totalPaid: Number(totalPaid) || 0 };
  }, [participants]);

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Confirm registration
  const handleConfirmRegistration = async () => {
    if (!selectedParticipant) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/tournaments/${tournamentId}/registrations/${selectedParticipant.id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setParticipants(participants.map(p =>
          p.id === selectedParticipant.id
            ? { ...p, status: "CONFIRMED" as const, confirmedAt: new Date().toISOString() }
            : p
        ));
        setConfirmDialogOpen(false);
      } else {
        const data = await res.json();
        alert(`Errore: ${data.message}`);
      }
    } catch (error) {
      console.error("Error confirming registration:", error);
      alert("Errore di rete");
    } finally {
      setActionLoading(false);
      setSelectedParticipant(null);
    }
  };

  // Cancel registration
  const handleCancelRegistration = async () => {
    if (!selectedParticipant) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/tournaments/${tournamentId}/registrations/${selectedParticipant.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setParticipants(participants.map(p =>
          p.id === selectedParticipant.id
            ? { ...p, status: "CANCELLED" as const }
            : p
        ));
        setCancelDialogOpen(false);
      } else {
        const data = await res.json();
        alert(`Errore: ${data.message}`);
      }
    } catch (error) {
      console.error("Error cancelling registration:", error);
      alert("Errore di rete");
    } finally {
      setActionLoading(false);
      setSelectedParticipant(null);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["#", "Nome", "Cognome", "Email", "Telefono", "Team", "Barca", "Lunghezza", "Club", "Stato", "Data Iscrizione"];
    const rows = filteredParticipants.map(p => [
      p.boatNumber || "",
      p.user.firstName,
      p.user.lastName,
      p.user.email,
      p.user.phone || "",
      p.teamName || "",
      p.boatName || "",
      p.boatLength || "",
      p.clubName || "",
      p.status,
      new Date(p.registeredAt).toISOString().split("T")[0],
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `partecipanti_${tournament?.name?.replace(/\s+/g, "_") || "torneo"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/dashboard/tournaments/${tournamentId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna a {tournament?.name || "Torneo"}
          </Link>
          <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Users className="h-7 w-7" />
            Partecipanti
          </h1>
          <HelpGuide pageKey="tournamentParticipants" position="inline" isAdmin={true} />
        </div>
        <p className="text-muted-foreground mt-1">
            Gestisci le iscrizioni al torneo
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Esporta CSV
          </Button>
          {isAdmin && (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Totale Iscritti</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confermati</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">In Attesa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPaid.toFixed(0)}€</p>
                <p className="text-xs text-muted-foreground">Incassato</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Lista Partecipanti</CardTitle>
              <CardDescription>
                {filteredParticipants.length} partecipanti trovati
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca partecipanti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtra per stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tutti gli stati</SelectItem>
                  <SelectItem value="CONFIRMED">Confermati</SelectItem>
                  <SelectItem value="PENDING_PAYMENT">In Attesa</SelectItem>
                  <SelectItem value="CANCELLED">Cancellati</SelectItem>
                  <SelectItem value="REFUNDED">Rimborsati</SelectItem>
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
                  <TableHead className="w-[60px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("boatNumber")}
                      className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                    >
                      #
                      {getSortIcon("boatNumber")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                    >
                      Partecipante
                      {getSortIcon("name")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("team")}
                      className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                    >
                      Team / Barca
                      {getSortIcon("team")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("club")}
                      className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                    >
                      Club
                      {getSortIcon("club")}
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
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("registeredAt")}
                      className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                    >
                      Data Iscrizione
                      {getSortIcon("registeredAt")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8" />
                        <p>Nessun partecipante trovato</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParticipants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        {participant.boatNumber ? (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {participant.boatNumber}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {participant.user.firstName} {participant.user.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {participant.user.email}
                          </span>
                          {participant.user.phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {participant.user.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {participant.teamName && (
                            <span className="font-medium">{participant.teamName}</span>
                          )}
                          {participant.boatName && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Ship className="h-3 w-3" />
                              {participant.boatName}
                              {participant.boatLength && ` (${participant.boatLength}m)`}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {participant.clubName ? (
                          <div className="flex flex-col">
                            <span className="text-sm">{participant.clubName}</span>
                            {participant.clubCode && (
                              <span className="text-xs text-muted-foreground">
                                {participant.clubCode}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(participant.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(participant.registeredAt)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Dettagli
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {participant.status === "PENDING_PAYMENT" && (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => {
                                  setSelectedParticipant(participant);
                                  setConfirmDialogOpen(true);
                                }}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Conferma Iscrizione
                              </DropdownMenuItem>
                            )}
                            {participant.status !== "CANCELLED" && participant.status !== "REFUNDED" && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedParticipant(participant);
                                  setCancelDialogOpen(true);
                                }}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Cancella Iscrizione
                              </DropdownMenuItem>
                            )}
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

      {/* Confirm Registration Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Iscrizione</DialogTitle>
            <DialogDescription>
              Confermare l&apos;iscrizione di{" "}
              <strong>
                {selectedParticipant?.user.firstName} {selectedParticipant?.user.lastName}
              </strong>
              {selectedParticipant?.teamName && (
                <> ({selectedParticipant.teamName})</>
              )}
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleConfirmRegistration} disabled={actionLoading}>
              {actionLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Registration Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancella Iscrizione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler cancellare l&apos;iscrizione di{" "}
              <strong>
                {selectedParticipant?.user.firstName} {selectedParticipant?.user.lastName}
              </strong>
              ?
              {selectedParticipant?.status === "CONFIRMED" && (
                <span className="block mt-2 text-amber-600">
                  Il partecipante ha gia pagato. Considera un rimborso.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelRegistration}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Cancella Iscrizione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
