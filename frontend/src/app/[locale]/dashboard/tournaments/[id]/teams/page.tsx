/**
 * =============================================================================
 * TOURNAMENT TEAMS PAGE
 * =============================================================================
 * Gestione barche ed equipaggi del torneo
 * - Lista barche con numero assegnato
 * - Dettaglio equipaggio (capitano + membri)
 * - Assegnazione numero barca
 * - Assegnazione ispettore di bordo
 * =============================================================================
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ArrowLeft,
  Ship,
  Search,
  Users,
  MoreHorizontal,
  Hash,
  User,
  UserCheck,
  Anchor,
  Award,
  Edit,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
  Ruler,
  Building2,
  Phone,
  Mail,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";

interface TeamMember {
  id: string;
  role: "SKIPPER" | "TEAM_LEADER" | "CREW" | "ANGLER" | "GUEST";
  // Registered user (null for external members)
  userId: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  // External member fields
  isExternal: boolean;
  externalName: string | null;
  externalPhone: string | null;
  externalEmail: string | null;
}

interface Team {
  id: string;
  name: string;
  boatName: string;
  boatNumber: number | null;
  clubName: string | null;
  clubCode: string | null;
  // Representing club (for provincial/national tournaments)
  representingClubName: string | null;
  representingClubCode: string | null;
  inspectorId: string | null;
  inspectorName: string | null;
  inspectorClub: string | null;
  createdAt: string;
  captain: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  members: TeamMember[];
  _count?: {
    strikes: number;
  };
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  level: "SOCIAL" | "CLUB" | "PROVINCIAL" | "REGIONAL" | "NATIONAL" | "INTERNATIONAL";
}

export default function TeamsPage() {
  const params = useParams();
  const { token, isAdmin } = useAuth();
  const locale = (params.locale as string) || "it";
  const tournamentId = params.id as string;

  const [teams, setTeams] = useState<Team[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // Dialog states
  const [boatNumberDialogOpen, setBoatNumberDialogOpen] = useState(false);
  const [inspectorDialogOpen, setInspectorDialogOpen] = useState(false);
  const [externalMemberDialogOpen, setExternalMemberDialogOpen] = useState(false);
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [boatNumber, setBoatNumber] = useState("");
  const [inspectorName, setInspectorName] = useState("");
  const [inspectorClub, setInspectorClub] = useState("");
  // External member form state
  const [externalMemberName, setExternalMemberName] = useState("");
  const [externalMemberRole, setExternalMemberRole] = useState<"SKIPPER" | "GUEST">("GUEST");
  const [externalMemberPhone, setExternalMemberPhone] = useState("");
  const [externalMemberEmail, setExternalMemberEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Delete team state
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  // Create team form state
  const [newTeamName, setNewTeamName] = useState("");
  const [newBoatName, setNewBoatName] = useState("");
  const [newCaptainId, setNewCaptainId] = useState("");
  const [captainPopoverOpen, setCaptainPopoverOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([]);
  // Representing club fields (for provincial/regional/national tournaments)
  const [representingClubName, setRepresentingClubName] = useState("");
  const [representingClubCode, setRepresentingClubCode] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch data
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

        // Fetch teams
        const teamsRes = await fetch(`${API_URL}/api/teams/tournament/${tournamentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, tournamentId, API_URL]);

  // Stats
  const stats = useMemo(() => {
    const withBoatNumber = teams.filter(t => t.boatNumber !== null).length;
    const withInspector = teams.filter(t => t.inspectorName !== null).length;
    const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);

    return {
      totalTeams: teams.length,
      withBoatNumber,
      withInspector,
      totalMembers,
    };
  }, [teams]);

  // Filter teams
  const filteredTeams = useMemo(() => {
    if (!searchQuery) return teams;

    const searchLower = searchQuery.toLowerCase();
    return teams.filter(t =>
      t.name.toLowerCase().includes(searchLower) ||
      t.boatName.toLowerCase().includes(searchLower) ||
      `${t.captain.firstName} ${t.captain.lastName}`.toLowerCase().includes(searchLower) ||
      t.clubName?.toLowerCase().includes(searchLower)
    );
  }, [teams, searchQuery]);

  // Toggle team expansion
  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  // Open boat number dialog
  const openBoatNumberDialog = (team: Team) => {
    setSelectedTeam(team);
    setBoatNumber(team.boatNumber?.toString() || "");
    setBoatNumberDialogOpen(true);
  };

  // Open inspector dialog
  const openInspectorDialog = (team: Team) => {
    setSelectedTeam(team);
    setInspectorName(team.inspectorName || "");
    setInspectorClub(team.inspectorClub || "");
    setInspectorDialogOpen(true);
  };

  // Submit boat number
  const handleSubmitBoatNumber = async () => {
    if (!selectedTeam) return;

    const number = parseInt(boatNumber);
    if (isNaN(number) || number < 1) {
      alert("Inserisci un numero valido (>= 1)");
      return;
    }

    // Check if number already used
    const existingTeam = teams.find(t => t.boatNumber === number && t.id !== selectedTeam.id);
    if (existingTeam) {
      alert(`Il numero ${number} è già assegnato a "${existingTeam.name}"`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/teams/${selectedTeam.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ boatNumber: number }),
      });

      if (res.ok) {
        setTeams(teams.map(t =>
          t.id === selectedTeam.id ? { ...t, boatNumber: number } : t
        ));
        setBoatNumberDialogOpen(false);
      } else {
        const data = await res.json();
        alert(`Errore: ${data.message}`);
      }
    } catch (error) {
      console.error("Error updating boat number:", error);
      alert("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit inspector
  const handleSubmitInspector = async () => {
    if (!selectedTeam) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/teams/${selectedTeam.id}/inspector`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inspectorName: inspectorName || null,
          inspectorClub: inspectorClub || null,
        }),
      });

      if (res.ok) {
        setTeams(teams.map(t =>
          t.id === selectedTeam.id
            ? { ...t, inspectorName: inspectorName || null, inspectorClub: inspectorClub || null }
            : t
        ));
        setInspectorDialogOpen(false);
      } else {
        const data = await res.json();
        alert(`Errore: ${data.message}`);
      }
    } catch (error) {
      console.error("Error updating inspector:", error);
      alert("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  // Open external member dialog
  const openExternalMemberDialog = (team: Team) => {
    setSelectedTeam(team);
    setExternalMemberName("");
    setExternalMemberRole("GUEST");
    setExternalMemberPhone("");
    setExternalMemberEmail("");
    setExternalMemberDialogOpen(true);
  };

  // Submit external member
  const handleSubmitExternalMember = async () => {
    if (!selectedTeam) return;

    if (!externalMemberName.trim()) {
      alert("Inserisci il nome del membro esterno");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/teams/${selectedTeam.id}/members/external`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: externalMemberName.trim(),
          role: externalMemberRole,
          phone: externalMemberPhone.trim() || undefined,
          email: externalMemberEmail.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Add new member to the team
        setTeams(teams.map(t =>
          t.id === selectedTeam.id
            ? { ...t, members: [...t.members, data.data] }
            : t
        ));
        setExternalMemberDialogOpen(false);
      } else {
        const data = await res.json();
        alert(`Errore: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding external member:", error);
      alert("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch available users for captain selection (all association members)
  const fetchAvailableUsers = async () => {
    console.log("[DEBUG] fetchAvailableUsers called, token:", token ? "present" : "missing", "tournamentId:", tournamentId);
    try {
      // First try to get all users (requires admin role)
      console.log("[DEBUG] Trying /api/users...");
      const usersRes = await fetch(`${API_URL}/api/users?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("[DEBUG] /api/users response status:", usersRes.status);

      if (usersRes.ok) {
        const data = await usersRes.json();
        console.log("[DEBUG] /api/users data:", data.data?.length, "users");
        setAvailableUsers(data.data || []);
        return;
      }

      // Fallback: try tournament participants (for non-admin users)
      console.log("[DEBUG] Trying /api/tournaments/participants...");
      const participantsRes = await fetch(`${API_URL}/api/tournaments/${tournamentId}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("[DEBUG] /participants response status:", participantsRes.status);

      if (participantsRes.ok) {
        const data = await participantsRes.json();
        console.log("[DEBUG] /participants data:", data.data?.length, "participants");
        // Map participants to the expected format
        const participants = (data.data || []).map((p: any) => ({
          id: p.user?.id || p.userId,
          firstName: p.user?.firstName || p.firstName || "",
          lastName: p.user?.lastName || p.lastName || "",
          email: p.user?.email || p.email || "",
        })).filter((u: any) => u.id); // Filter out any without valid id

        console.log("[DEBUG] Mapped participants:", participants.length);
        setAvailableUsers(participants);
      }
    } catch (error) {
      console.error("[DEBUG] Error fetching users:", error);
    }
  };

  // Open create team dialog
  const openCreateTeamDialog = () => {
    setNewTeamName("");
    setNewBoatName("");
    setNewCaptainId("");
    setRepresentingClubName("");
    setRepresentingClubCode("");
    fetchAvailableUsers();
    setCreateTeamDialogOpen(true);
  };

  // Submit new team
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      alert("Inserisci il nome del team");
      return;
    }
    if (!newBoatName.trim()) {
      alert("Inserisci il nome della barca");
      return;
    }
    if (!newCaptainId) {
      alert("Seleziona un capitano");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTeamName.trim(),
          boatName: newBoatName.trim(),
          tournamentId,
          captainId: newCaptainId,
          ...(representingClubName.trim() && { representingClubName: representingClubName.trim() }),
          ...(representingClubCode.trim() && { representingClubCode: representingClubCode.trim() }),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Refresh teams list
        const teamsRes = await fetch(`${API_URL}/api/teams/tournament/${tournamentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData.data || []);
        }
        setCreateTeamDialogOpen(false);
      } else {
        const data = await res.json();
        alert(`Errore: ${data.message}`);
      }
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete team
  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/teams/${teamToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Remove team from list
        setTeams(teams.filter(t => t.id !== teamToDelete.id));
        setDeleteTeamDialogOpen(false);
        setTeamToDelete(null);
      } else {
        const data = await res.json();
        alert(`Errore: ${data.message}`);
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if external members are allowed for this tournament
  const canAddExternalMembers = tournament?.level === "SOCIAL" || tournament?.level === "CLUB";

  // Get role badge with new CrewRole enum
  const getRoleBadge = (role: string, isExternal?: boolean) => {
    const config: Record<string, { label: string; className: string }> = {
      SKIPPER: { label: "Skipper", className: "bg-blue-100 text-blue-800 border-blue-200" },
      TEAM_LEADER: { label: "Capoequipaggio", className: "bg-green-100 text-green-800 border-green-200" },
      CREW: { label: "Equipaggio", className: "bg-gray-100 text-gray-800 border-gray-200" },
      ANGLER: { label: "Pescatore", className: "bg-orange-100 text-orange-800 border-orange-200" },
      GUEST: { label: "Ospite", className: "bg-purple-100 text-purple-800 border-purple-200" },
      // Legacy support
      CAPTAIN: { label: "Capitano", className: "bg-green-100 text-green-800 border-green-200" },
    };
    const { label, className } = config[role] || { label: role, className: "" };
    return (
      <div className="flex items-center gap-1">
        <Badge variant="outline" className={className}>{label}</Badge>
        {isExternal && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
            Esterno
          </Badge>
        )}
      </div>
    );
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
            <Ship className="h-7 w-7" />
            Barche ed Equipaggi
          </h1>
          <HelpGuide pageKey="tournamentTeams" position="inline" isAdmin={true} />
        </div>
        <p className="text-muted-foreground mt-1">
            Gestisci le barche iscritte e i loro equipaggi
          </p>
        </div>
        <Button onClick={openCreateTeamDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuova Barca
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Ship className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalTeams}</p>
                <p className="text-xs text-muted-foreground">Barche Iscritte</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Hash className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.withBoatNumber}</p>
                <p className="text-xs text-muted-foreground">Numeri Assegnati</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.withInspector}</p>
                <p className="text-xs text-muted-foreground">Ispettori Assegnati</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-muted-foreground">Membri Totali</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Lista Barche</CardTitle>
              <CardDescription>
                {filteredTeams.length} barche trovate
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca barca, team, capitano..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-[280px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredTeams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ship className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nessuna barca trovata</p>
              </div>
            ) : (
              filteredTeams.map((team) => (
                <Collapsible
                  key={team.id}
                  open={expandedTeams.has(team.id)}
                  onOpenChange={() => toggleTeamExpansion(team.id)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          {/* Boat Number */}
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            {team.boatNumber ? (
                              <span className="text-lg font-bold text-primary">{team.boatNumber}</span>
                            ) : (
                              <Hash className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>

                          {/* Team Info */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{team.name}</span>
                              {team.clubCode && (
                                <Badge variant="outline" className="text-xs">
                                  {team.clubCode}
                                </Badge>
                              )}
                              {team.representingClubCode && (
                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {team.representingClubCode}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Ship className="h-3 w-3" />
                                {team.boatName}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {team.captain.firstName} {team.captain.lastName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {team.members.length} membri
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Inspector Badge */}
                          {team.inspectorName ? (
                            <Badge variant="secondary" className="hidden sm:flex gap-1">
                              <Award className="h-3 w-3" />
                              {team.inspectorName}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="hidden sm:flex text-amber-600">
                              Ispettore mancante
                            </Badge>
                          )}

                          {/* Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openBoatNumberDialog(team); }}>
                                <Hash className="h-4 w-4 mr-2" />
                                Assegna Numero
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openInspectorDialog(team); }}>
                                <Award className="h-4 w-4 mr-2" />
                                Assegna Ispettore
                              </DropdownMenuItem>
                              {canAddExternalMembers && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openExternalMemberDialog(team); }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Aggiungi Membro Esterno
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifica
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTeamToDelete(team);
                                  setDeleteTeamDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Elimina Barca
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Expand Arrow */}
                          {expandedTeams.has(team.id) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t bg-muted/30 p-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Team Details */}
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Ship className="h-4 w-4" />
                              Dettagli Barca
                            </h4>
                            <dl className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <dt className="text-muted-foreground">Nome Team:</dt>
                                <dd className="font-medium">{team.name}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-muted-foreground">Nome Barca:</dt>
                                <dd className="font-medium">{team.boatName}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-muted-foreground">Numero Gara:</dt>
                                <dd className="font-medium">
                                  {team.boatNumber || <span className="text-amber-600">Non assegnato</span>}
                                </dd>
                              </div>
                              {team.clubName && (
                                <div className="flex justify-between">
                                  <dt className="text-muted-foreground">Club:</dt>
                                  <dd className="font-medium">{team.clubName}</dd>
                                </div>
                              )}
                              {team.representingClubName && (
                                <div className="flex justify-between">
                                  <dt className="text-muted-foreground">Rappresenta:</dt>
                                  <dd className="font-medium flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {team.representingClubName}
                                    {team.representingClubCode && (
                                      <Badge variant="outline" className="text-xs ml-1">{team.representingClubCode}</Badge>
                                    )}
                                  </dd>
                                </div>
                              )}
                            </dl>

                            <h4 className="font-medium mt-4 mb-3 flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              Ispettore di Bordo
                            </h4>
                            {team.inspectorName ? (
                              <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <dt className="text-muted-foreground">Nome:</dt>
                                  <dd className="font-medium">{team.inspectorName}</dd>
                                </div>
                                {team.inspectorClub && (
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Società:</dt>
                                    <dd className="font-medium">{team.inspectorClub}</dd>
                                  </div>
                                )}
                              </dl>
                            ) : (
                              <p className="text-sm text-amber-600">Nessun ispettore assegnato</p>
                            )}
                          </div>

                          {/* Crew Members */}
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Equipaggio ({team.members.length} membri)
                            </h4>
                            <div className="space-y-2">
                              {team.members.map((member) => {
                                // Get member display name based on internal vs external
                                const memberName = member.isExternal
                                  ? member.externalName || "Membro Esterno"
                                  : member.user
                                    ? `${member.user.firstName} ${member.user.lastName}`
                                    : "Utente Sconosciuto";
                                const memberEmail = member.isExternal
                                  ? member.externalEmail
                                  : member.user?.email;
                                const memberPhone = member.isExternal
                                  ? member.externalPhone
                                  : null;

                                return (
                                  <div
                                    key={member.id}
                                    className="flex items-center justify-between p-2 bg-background rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        member.isExternal ? "bg-amber-100" : "bg-primary/10"
                                      }`}>
                                        <User className={`h-4 w-4 ${
                                          member.isExternal ? "text-amber-600" : "text-primary"
                                        }`} />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">{memberName}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          {memberEmail && (
                                            <span className="flex items-center gap-1">
                                              <Mail className="h-3 w-3" />
                                              {memberEmail}
                                            </span>
                                          )}
                                          {memberPhone && (
                                            <span className="flex items-center gap-1">
                                              <Phone className="h-3 w-3" />
                                              {memberPhone}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {getRoleBadge(member.role, member.isExternal)}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Boat Number Dialog */}
      <Dialog open={boatNumberDialogOpen} onOpenChange={setBoatNumberDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Assegna Numero Barca
            </DialogTitle>
            <DialogDescription>
              {selectedTeam?.name} - {selectedTeam?.boatName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="boatNumber">Numero di Gara</Label>
              <Input
                id="boatNumber"
                type="number"
                min="1"
                value={boatNumber}
                onChange={(e) => setBoatNumber(e.target.value)}
                placeholder="Es: 1, 2, 3..."
              />
              <p className="text-xs text-muted-foreground">
                Numeri già assegnati: {teams.filter(t => t.boatNumber).map(t => t.boatNumber).sort((a, b) => (a || 0) - (b || 0)).join(", ") || "nessuno"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBoatNumberDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSubmitBoatNumber} disabled={submitting}>
              {submitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Assegna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspector Dialog */}
      <Dialog open={inspectorDialogOpen} onOpenChange={setInspectorDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Assegna Ispettore di Bordo
            </DialogTitle>
            <DialogDescription>
              {selectedTeam?.name} - {selectedTeam?.boatName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="inspectorName">Nome Ispettore</Label>
              <Input
                id="inspectorName"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                placeholder="Nome e Cognome"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inspectorClub">Società di Provenienza</Label>
              <Input
                id="inspectorClub"
                value={inspectorClub}
                onChange={(e) => setInspectorClub(e.target.value)}
                placeholder="Es: Circolo Nautico Napoli"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInspectorDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSubmitInspector} disabled={submitting}>
              {submitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* External Member Dialog */}
      <Dialog open={externalMemberDialogOpen} onOpenChange={setExternalMemberDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Aggiungi Membro Esterno
            </DialogTitle>
            <DialogDescription>
              {selectedTeam?.name} - Aggiungi skipper o ospite non registrato
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="externalName">Nome e Cognome *</Label>
              <Input
                id="externalName"
                value={externalMemberName}
                onChange={(e) => setExternalMemberName(e.target.value)}
                placeholder="Es: Mario Rossi"
              />
            </div>

            <div className="grid gap-2">
              <Label>Ruolo *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={externalMemberRole === "SKIPPER" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setExternalMemberRole("SKIPPER")}
                >
                  <Anchor className="h-4 w-4 mr-2" />
                  Skipper
                </Button>
                <Button
                  type="button"
                  variant={externalMemberRole === "GUEST" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setExternalMemberRole("GUEST")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Ospite
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {externalMemberRole === "SKIPPER"
                  ? "Lo skipper conduce la barca durante la gara"
                  : "Gli ospiti possono essere a bordo durante la gara"}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="externalPhone">Telefono (opzionale)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="externalPhone"
                  value={externalMemberPhone}
                  onChange={(e) => setExternalMemberPhone(e.target.value)}
                  placeholder="Es: +39 333 1234567"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="externalEmail">Email (opzionale)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="externalEmail"
                  type="email"
                  value={externalMemberEmail}
                  onChange={(e) => setExternalMemberEmail(e.target.value)}
                  placeholder="Es: mario.rossi@email.com"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExternalMemberDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSubmitExternalMember} disabled={submitting || !externalMemberName.trim()}>
              {submitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={createTeamDialogOpen} onOpenChange={setCreateTeamDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Nuova Barca
            </DialogTitle>
            <DialogDescription>
              Aggiungi una nuova barca al torneo {tournament?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="teamName">Nome Team *</Label>
              <Input
                id="teamName"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Es: Team Ischia Fishing"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="boatName">Nome Barca *</Label>
              <div className="relative">
                <Anchor className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="boatName"
                  value={newBoatName}
                  onChange={(e) => setNewBoatName(e.target.value)}
                  placeholder="Es: Blue Marlin"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Capitano (Capoequipaggio) *</Label>
              <Popover open={captainPopoverOpen} onOpenChange={setCaptainPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={captainPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {newCaptainId
                      ? (() => {
                          const user = availableUsers.find((u) => u.id === newCaptainId);
                          return user ? `${user.firstName} ${user.lastName}` : "Seleziona capitano...";
                        })()
                      : "Seleziona capitano..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cerca per nome o email..." />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>Nessun utente trovato.</CommandEmpty>
                      <CommandGroup heading={`${availableUsers.length} utenti disponibili`}>
                        {availableUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.firstName} ${user.lastName} ${user.email}`}
                            onSelect={() => {
                              setNewCaptainId(user.id);
                              setCaptainPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                newCaptainId === user.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex flex-col">
                              <span>{user.firstName} {user.lastName}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Il capitano sarà automaticamente aggiunto come Capoequipaggio (TEAM_LEADER)
              </p>
            </div>

            {/* Representing Club - only for provincial/regional/national/international tournaments */}
            {tournament && ["PROVINCIAL", "REGIONAL", "NATIONAL", "INTERNATIONAL"].includes(tournament.level) && (
              <div className="border-t pt-4 mt-2">
                <Label className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4" />
                  Associazione Rappresentata (opzionale)
                </Label>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="representingClubName" className="text-sm font-normal">Nome Associazione</Label>
                    <Input
                      id="representingClubName"
                      value={representingClubName}
                      onChange={(e) => setRepresentingClubName(e.target.value)}
                      placeholder="Es: Circolo Nautico Napoli"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="representingClubCode" className="text-sm font-normal">Codice FIPs</Label>
                    <Input
                      id="representingClubCode"
                      value={representingClubCode}
                      onChange={(e) => setRepresentingClubCode(e.target.value)}
                      placeholder="Es: NA001"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per tornei provinciali/nazionali, indica l'associazione che il team rappresenta (se diversa dal club di appartenenza)
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTeamDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={submitting || !newTeamName.trim() || !newBoatName.trim() || !newCaptainId}
            >
              {submitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Crea Barca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <Dialog open={deleteTeamDialogOpen} onOpenChange={setDeleteTeamDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Elimina Barca
            </DialogTitle>
            <DialogDescription>
              Stai per eliminare la barca "{teamToDelete?.boatName}" del team "{teamToDelete?.name}".
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Questa azione rimuovera la barca dal torneo corrente.
              I dati della barca saranno mantenuti nel sistema per poter essere riutilizzati in tornei futuri.
            </p>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Attenzione:</strong> L'equipaggio attuale ({teamToDelete?.members.length || 0} membri) sara dissociato da questa barca.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTeamDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={submitting}
            >
              {submitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
