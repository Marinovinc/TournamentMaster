/**
 * =============================================================================
 * TEAMS/BOATS MANAGEMENT PAGE
 * =============================================================================
 * Gestione barche ed equipaggio per tornei di pesca
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
  Ship,
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  UserPlus,
  Shield,
  Anchor,
  Trophy,
} from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";

// Types
interface Team {
  id: string;
  name: string;
  boatName: string;
  boatNumber?: number;
  clubName?: string;
  clubCode?: string;
  inspectorId?: string;
  inspectorName?: string;
  inspectorClub?: string;
  captain?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  members?: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string;
    };
  }>;
  tournament?: {
    id: string;
    name: string;
    level?: string;
  };
  _count?: {
    strikes: number;
  };
  createdAt: string;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  level?: string;
}

export default function TeamsPage() {
  const { user, token, isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string || "it";

  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tournamentFilter, setTournamentFilter] = useState<string>("ALL");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inspectorDialogOpen, setInspectorDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    boatName: "",
    tournamentId: "",
    clubName: "",
    clubCode: "",
    boatNumber: "",
    inspectorName: "",
    inspectorClub: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Fetch teams
        const teamsRes = await fetch(`${API_URL}/api/teams`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData.data || []);
        }

        // Fetch tournaments for filter
        const tournamentsRes = await fetch(`${API_URL}/api/tournaments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (tournamentsRes.ok) {
          const tournamentsData = await tournamentsRes.json();
          setTournaments(tournamentsData.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, API_URL]);

  // Filter teams
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.boatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.captain?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.captain?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTournament = tournamentFilter === "ALL" || team.tournament?.id === tournamentFilter;
    return matchesSearch && matchesTournament;
  });

  // Handle create team
  const handleCreateTeam = async () => {
    if (!formData.name || !formData.boatName || !formData.tournamentId) {
      alert("Nome team, nome barca e torneo sono obbligatori");
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          boatName: formData.boatName,
          tournamentId: formData.tournamentId,
          clubName: formData.clubName || undefined,
          clubCode: formData.clubCode || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTeams([data.data, ...teams]);
        setCreateDialogOpen(false);
        resetForm();
      } else {
        alert(`Errore: ${data.message || "Creazione team fallita"}`);
      }
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Errore di rete durante la creazione del team");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update team
  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/teams/${selectedTeam.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          boatName: formData.boatName,
          clubName: formData.clubName || undefined,
          clubCode: formData.clubCode || undefined,
          boatNumber: formData.boatNumber ? parseInt(formData.boatNumber) : undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTeams(teams.map((t) => (t.id === selectedTeam.id ? data.data : t)));
        setEditDialogOpen(false);
        setSelectedTeam(null);
        resetForm();
      } else {
        alert(`Errore: ${data.message || "Aggiornamento team fallito"}`);
      }
    } catch (error) {
      console.error("Error updating team:", error);
      alert("Errore di rete durante l'aggiornamento");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle assign inspector
  const handleAssignInspector = async () => {
    if (!selectedTeam) return;

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/teams/${selectedTeam.id}/inspector`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inspectorName: formData.inspectorName || null,
          inspectorClub: formData.inspectorClub || null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTeams(teams.map((t) => (t.id === selectedTeam.id ? { ...t, ...data.data } : t)));
        setInspectorDialogOpen(false);
        setSelectedTeam(null);
        resetForm();
      } else {
        alert(`Errore: ${data.message || "Assegnazione ispettore fallita"}`);
      }
    } catch (error) {
      console.error("Error assigning inspector:", error);
      alert("Errore di rete");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete team
  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/teams/${selectedTeam.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setTeams(teams.filter((t) => t.id !== selectedTeam.id));
      } else {
        const data = await response.json();
        alert(`Errore: ${data.message || "Eliminazione fallita"}`);
      }
    } catch (error) {
      console.error("Error deleting team:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTeam(null);
      setFormLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      boatName: "",
      tournamentId: "",
      clubName: "",
      clubCode: "",
      boatNumber: "",
      inspectorName: "",
      inspectorClub: "",
    });
  };

  // Open edit dialog
  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      boatName: team.boatName,
      tournamentId: team.tournament?.id || "",
      clubName: team.clubName || "",
      clubCode: team.clubCode || "",
      boatNumber: team.boatNumber?.toString() || "",
      inspectorName: team.inspectorName || "",
      inspectorClub: team.inspectorClub || "",
    });
    setEditDialogOpen(true);
  };

  // Open inspector dialog
  const openInspectorDialog = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      ...formData,
      inspectorName: team.inspectorName || "",
      inspectorClub: team.inspectorClub || "",
    });
    setInspectorDialogOpen(true);
  };

  // Get tournament level badge
  const getLevelBadge = (level?: string) => {
    if (!level) return null;
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      CLUB: "outline",
      PROVINCIAL: "secondary",
      REGIONAL: "secondary",
      NATIONAL: "default",
      INTERNATIONAL: "default",
    };
    const labels: Record<string, string> = {
      CLUB: "Sociale",
      PROVINCIAL: "Provinciale",
      REGIONAL: "Regionale",
      NATIONAL: "Nazionale",
      INTERNATIONAL: "Internazionale",
    };
    return <Badge variant={variants[level] || "outline"}>{labels[level] || level}</Badge>;
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
              <Ship className="h-8 w-8" />
              Gestione Barche/Team
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestisci barche, equipaggio e ispettori per i tornei
            </p>
          </div>
          <HelpGuide pageKey="teams" position="inline" isAdmin={isAdmin} />
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo Team
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Team Registrati</CardTitle>
              <CardDescription>
                {filteredTeams.length} team trovati
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca team o barca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[200px]"
                />
              </div>
              <Select value={tournamentFilter} onValueChange={setTournamentFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtra per torneo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tutti i tornei</SelectItem>
                  {tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
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
                  <TableHead>N.</TableHead>
                  <TableHead>Team / Barca</TableHead>
                  <TableHead>Capitano</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Ispettore</TableHead>
                  <TableHead>Torneo</TableHead>
                  <TableHead>Strike</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Ship className="h-8 w-8" />
                        <p>Nessun team trovato</p>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCreateDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Crea il primo team
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {team.boatNumber || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{team.name}</span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Anchor className="h-3 w-3" />
                            {team.boatName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {team.captain ? (
                          <span>
                            {team.captain.firstName} {team.captain.lastName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {team.clubName ? (
                          <div className="flex flex-col">
                            <span className="text-sm">{team.clubName}</span>
                            {team.clubCode && (
                              <span className="text-xs text-muted-foreground">{team.clubCode}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {team.inspectorName ? (
                          <div className="flex flex-col">
                            <span className="text-sm flex items-center gap-1">
                              <Shield className="h-3 w-3 text-blue-500" />
                              {team.inspectorName}
                            </span>
                            {team.inspectorClub && (
                              <span className="text-xs text-muted-foreground">{team.inspectorClub}</span>
                            )}
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => openInspectorDialog(team)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Assegna
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{team.tournament?.name || "-"}</span>
                          {getLevelBadge(team.tournament?.level)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {team._count?.strikes || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(team)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openInspectorDialog(team)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Assegna Ispettore
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedTeam(team);
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

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crea Nuovo Team</DialogTitle>
            <DialogDescription>
              Inserisci i dati del team e della barca
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tournamentId">Torneo *</Label>
              <Select
                value={formData.tournamentId}
                onValueChange={(value) => setFormData({ ...formData, tournamentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona torneo" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Team *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Es. Team Ischia"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="boatName">Nome Barca *</Label>
              <Input
                id="boatName"
                value={formData.boatName}
                onChange={(e) => setFormData({ ...formData, boatName: e.target.value })}
                placeholder="Es. Blue Marlin"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="clubName">Nome Club</Label>
                <Input
                  id="clubName"
                  value={formData.clubName}
                  onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                  placeholder="Es. Ischia Fishing Club"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clubCode">Codice Club</Label>
                <Input
                  id="clubCode"
                  value={formData.clubCode}
                  onChange={(e) => setFormData({ ...formData, clubCode: e.target.value })}
                  placeholder="Es. IFC001"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={formLoading || !formData.name || !formData.boatName || !formData.tournamentId}
            >
              {formLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Crea Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Team</DialogTitle>
            <DialogDescription>
              Modifica i dati del team
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome Team *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-boatName">Nome Barca *</Label>
              <Input
                id="edit-boatName"
                value={formData.boatName}
                onChange={(e) => setFormData({ ...formData, boatName: e.target.value })}
              />
            </div>
            {isAdmin && (
              <div className="grid gap-2">
                <Label htmlFor="edit-boatNumber">Numero Barca (assegnato dall&apos;organizzazione)</Label>
                <Input
                  id="edit-boatNumber"
                  type="number"
                  value={formData.boatNumber}
                  onChange={(e) => setFormData({ ...formData, boatNumber: e.target.value })}
                  placeholder="Es. 12"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-clubName">Nome Club</Label>
                <Input
                  id="edit-clubName"
                  value={formData.clubName}
                  onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-clubCode">Codice Club</Label>
                <Input
                  id="edit-clubCode"
                  value={formData.clubCode}
                  onChange={(e) => setFormData({ ...formData, clubCode: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleUpdateTeam} disabled={formLoading || !formData.name || !formData.boatName}>
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

      {/* Assign Inspector Dialog */}
      <Dialog open={inspectorDialogOpen} onOpenChange={setInspectorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assegna Ispettore</DialogTitle>
            <DialogDescription>
              L&apos;ispettore di bordo monitora e verifica le catture durante la gara.
              Spesso proviene da un team/club diverso per garantire imparzialita.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="inspectorName">Nome Ispettore</Label>
              <Input
                id="inspectorName"
                value={formData.inspectorName}
                onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
                placeholder="Es. Mario Rossi"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inspectorClub">Club Ispettore</Label>
              <Input
                id="inspectorClub"
                value={formData.inspectorClub}
                onChange={(e) => setFormData({ ...formData, inspectorClub: e.target.value })}
                placeholder="Es. Napoli Fishing Club"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInspectorDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleAssignInspector} disabled={formLoading}>
              {formLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Assegna
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
              Sei sicuro di voler eliminare il team &quot;{selectedTeam?.name}&quot;?
              Questa azione non puo essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeam} disabled={formLoading}>
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
