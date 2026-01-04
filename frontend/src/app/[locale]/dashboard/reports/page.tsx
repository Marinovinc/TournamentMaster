"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart3,
  Trophy,
  Users,
  Fish,
  Target,
  Download,
  Calendar,
  TrendingUp,
  Award,
  Anchor,
  Building2,
  Globe,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Chart colors
const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];
const STATUS_COLORS = {
  ONGOING: "#22c55e",
  COMPLETED: "#3b82f6",
  DRAFT: "#6b7280",
  PUBLISHED: "#f59e0b",
  CANCELLED: "#ef4444",
};

// =============================================================================
// TYPES
// =============================================================================

interface Tournament {
  id: string;
  name: string;
  status: string;
  discipline?: string;
  location?: string | null;
  startDate: string;
  endDate: string;
  _count?: {
    teams: number;
    catches: number;
    strikes: number;
    registrations: number;
  };
}

interface TeamStats {
  id: string;
  name: string;
  boatName: string;
  boatNumber: number | null;
  totalStrikes: number;
  totalRods: number;
  catches: number;
  lost: number;
  released: number;
}

interface TournamentStats {
  totalTeams: number;
  totalStrikes: number;
  totalCatches: number;
  avgStrikesPerTeam: number;
  topTeams: TeamStats[];
}

interface AssociationOverview {
  totalTournaments: number;
  activeTournaments: number;
  completedTournaments: number;
  draftTournaments: number;
  totalTeams: number;
  totalParticipants: number;
  totalCatches: number;
  approvedCatches: number;
  totalStrikes: number;
  avgTeamsPerTournament: number;
  avgCatchesPerTournament: number;
}

interface PlatformOverview {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalUsers: number;
  usersByRole: { role: string; count: number }[];
  totalTournaments: number;
  tournamentsByStatus: { status: string; count: number }[];
  totalTeams: number;
  totalCatches: number;
  totalStrikes: number;
}

interface TournamentDetailedReport {
  tournament: any;
  stats: {
    totalTeams: number;
    totalCatches: number;
    approvedCatches: number;
    pendingCatches: number;
    rejectedCatches: number;
    totalStrikes: number;
    totalWeight: number;
    biggestCatch: number;
  };
  leaderboard: any[];
  teamRankings: any[];
  catchDistribution: {
    bySpecies: { species: string; count: number }[];
    byStatus: { status: string; count: number }[];
  };
}

interface TenantComparison {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  tournaments: number;
  activeTournaments: number;
  users: number;
  teams: number;
  catches: number;
  lastTournamentDate: string | null;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ReportsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { user, hasRole } = useAuth();

  const isSuperAdmin = hasRole("SUPER_ADMIN");
  const canViewAssociationReports = hasRole("TENANT_ADMIN", "PRESIDENT", "ORGANIZER", "JUDGE") || isSuperAdmin;

  const [activeTab, setActiveTab] = useState<string>(isSuperAdmin ? "platform" : "association");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Association data
  const [associationOverview, setAssociationOverview] = useState<AssociationOverview | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [tournamentStats, setTournamentStats] = useState<TournamentStats | null>(null);
  const [tournamentDetailedReport, setTournamentDetailedReport] = useState<TournamentDetailedReport | null>(null);
  const [teamRankings, setTeamRankings] = useState<TeamStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Platform data (Super Admin only)
  const [platformOverview, setPlatformOverview] = useState<PlatformOverview | null>(null);
  const [tenantsComparison, setTenantsComparison] = useState<TenantComparison[]>([]);

  // Selected tenant for Super Admin viewing association reports
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Fetch tenants list when Super Admin accesses association tab
  useEffect(() => {
    if (activeTab === "association" && isSuperAdmin && tenantsComparison.length === 0) {
      fetchTenantsForSelection();
    }
  }, [activeTab, isSuperAdmin]);

  // Fetch association data (when tenant is selected or for non-super-admin)
  useEffect(() => {
    if (activeTab === "association" && canViewAssociationReports) {
      // Super Admin needs to select a tenant first
      if (isSuperAdmin && !selectedTenantId) {
        setLoading(false);
        return;
      }
      fetchAssociationData();
    }
  }, [activeTab, canViewAssociationReports, selectedTenantId]);

  // Fetch platform data (Super Admin only)
  useEffect(() => {
    if (activeTab === "platform" && isSuperAdmin) {
      fetchPlatformData();
    }
  }, [activeTab, isSuperAdmin]);

  const fetchTenantsForSelection = async () => {
    try {
      const token = getToken();
      const tenantsRes = await fetch(`${API_URL}/api/reports/platform/tenants?sortBy=tournaments&order=desc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        if (tenantsData.success) {
          setTenantsComparison(tenantsData.data);
        }
      }
    } catch (err) {
      console.error("Error fetching tenants:", err);
    }
  };

  // Fetch tournament stats when selected
  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentStats(selectedTournament);
    }
  }, [selectedTournament]);

  const fetchAssociationData = async () => {
    setLoading(true);
    setError(null);
    setAssociationOverview(null);
    setTournaments([]);
    setSelectedTournament("");
    setTournamentStats(null);
    setTeamRankings([]);

    try {
      const token = getToken();

      // Build query string with tenantId for Super Admin
      const tenantQuery = isSuperAdmin && selectedTenantId ? `?tenantId=${selectedTenantId}` : "";

      // Fetch overview from API
      const overviewRes = await fetch(`${API_URL}/api/reports/association/overview${tenantQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        if (overviewData.success) {
          setAssociationOverview(overviewData.data);
        }
      }

      // Fetch tournaments from tenant-scoped API
      const tournamentsQuery = isSuperAdmin && selectedTenantId
        ? `?tenantId=${selectedTenantId}&limit=100`
        : "?limit=100";
      const tournamentsRes = await fetch(`${API_URL}/api/reports/association/tournaments${tournamentsQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tournamentsData = await tournamentsRes.json();
      if (tournamentsData.success) {
        setTournaments(tournamentsData.data);
        // Auto-select first completed or ongoing tournament
        const defaultTournament = tournamentsData.data.find(
          (t: Tournament) => t.status === "ONGOING" || t.status === "COMPLETED"
        );
        if (defaultTournament) {
          setSelectedTournament(defaultTournament.id);
        }
      }
    } catch (err) {
      console.error("Error fetching association data:", err);
      setError("Errore nel caricamento dei dati dell'associazione");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();

      // Fetch platform overview
      const overviewRes = await fetch(`${API_URL}/api/reports/platform/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        if (overviewData.success) {
          setPlatformOverview(overviewData.data);
        }
      }

      // Fetch tenants comparison
      const tenantsRes = await fetch(`${API_URL}/api/reports/platform/tenants?sortBy=tournaments&order=desc`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        if (tenantsData.success) {
          setTenantsComparison(tenantsData.data);
        }
      }
    } catch (err) {
      console.error("Error fetching platform data:", err);
      setError("Errore nel caricamento dei dati della piattaforma");
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentStats = async (tournamentId: string) => {
    setLoadingStats(true);
    setTournamentDetailedReport(null);
    try {
      const token = getToken();
      const tenantParam = isSuperAdmin && selectedTenantId ? `?tenantId=${selectedTenantId}` : "";

      // Fetch detailed tournament report from API
      const reportRes = await fetch(
        `${API_URL}/api/reports/association/tournaments/${tournamentId}${tenantParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const reportData = await reportRes.json();

      if (reportData.success && reportData.data) {
        setTournamentDetailedReport(reportData.data);
      }

      // Fetch teams for this tournament
      const teamsRes = await fetch(`${API_URL}/api/teams/tournament/${tournamentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teamsData = await teamsRes.json();

      // Fetch strikes for this tournament
      const strikesRes = await fetch(`${API_URL}/api/strikes?tournamentId=${tournamentId}&limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const strikesData = await strikesRes.json();

      if (teamsData.success && strikesData.success) {
        const teams = teamsData.data || [];
        const strikes = strikesData.data || [];

        // Calculate team stats
        const teamStatsMap = new Map<string, TeamStats>();

        teams.forEach((team: any) => {
          teamStatsMap.set(team.id, {
            id: team.id,
            name: team.name,
            boatName: team.boatName,
            boatNumber: team.boatNumber,
            totalStrikes: 0,
            totalRods: 0,
            catches: 0,
            lost: 0,
            released: 0,
          });
        });

        strikes.forEach((strike: any) => {
          const teamStat = teamStatsMap.get(strike.teamId);
          if (teamStat) {
            teamStat.totalStrikes++;
            teamStat.totalRods += strike.rodCount || 0;
            if (strike.result === "CATCH") teamStat.catches++;
            if (strike.result === "LOST") teamStat.lost++;
            if (strike.result === "RELEASED") teamStat.released++;
          }
        });

        const teamStatsArray = Array.from(teamStatsMap.values());

        // Sort by catches (primary) and total strikes (secondary)
        teamStatsArray.sort((a, b) => {
          if (b.catches !== a.catches) return b.catches - a.catches;
          return b.totalStrikes - a.totalStrikes;
        });

        const totalCatches = teamStatsArray.reduce((sum, t) => sum + t.catches, 0);
        const avgStrikes = teams.length > 0
          ? Math.round(strikes.length / teams.length * 10) / 10
          : 0;

        setTournamentStats({
          totalTeams: teams.length,
          totalStrikes: strikes.length,
          totalCatches,
          avgStrikesPerTeam: avgStrikes,
          topTeams: teamStatsArray.slice(0, 5),
        });

        setTeamRankings(teamStatsArray);
      }
    } catch (error) {
      console.error("Error fetching tournament stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const exportToCsv = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/reports/export/csv/tournament/${selectedTournament}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report_torneo_${selectedTournament.slice(0, 8)}_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        // Fallback: export from local data
        exportLocalCsv();
      }
    } catch {
      // Fallback: export from local data
      exportLocalCsv();
    }
  };

  const exportLocalCsv = () => {
    if (!teamRankings.length) return;

    const tournament = tournaments.find(t => t.id === selectedTournament);
    const headers = ["Posizione", "Team", "Barca", "N. Barca", "Strike", "Catture", "Persi", "Rilasciati"];
    const rows = teamRankings.map((team, index) => [
      index + 1,
      team.name,
      team.boatName,
      team.boatNumber || "-",
      team.totalStrikes,
      team.catches,
      team.lost,
      team.released,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report_${tournament?.name || "tournament"}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONGOING": return "bg-green-500";
      case "COMPLETED": return "bg-blue-500";
      case "DRAFT": return "bg-gray-500";
      default: return "bg-yellow-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report e Statistiche</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin
              ? "Analisi globale della piattaforma e delle associazioni"
              : "Analisi delle performance dei tornei e delle squadre"
            }
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs for Super Admin */}
      {isSuperAdmin ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="platform" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Piattaforma
            </TabsTrigger>
            <TabsTrigger value="association" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Associazione
            </TabsTrigger>
          </TabsList>

          <TabsContent value="platform">
            <PlatformReportsContent
              overview={platformOverview}
              tenants={tenantsComparison}
            />
          </TabsContent>

          <TabsContent value="association">
            {/* Tenant Selector for Super Admin */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Seleziona Associazione
                </CardTitle>
                <CardDescription>
                  Seleziona un'associazione per visualizzare i report dettagliati
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                  <SelectTrigger className="w-[350px]">
                    <SelectValue placeholder="Seleziona associazione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsComparison.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        <div className="flex items-center gap-2">
                          <span>{tenant.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({tenant.tournaments} tornei, {tenant.catches} catture)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedTenantId ? (
              <AssociationReportsContent
                overview={associationOverview}
                tournaments={tournaments}
                selectedTournament={selectedTournament}
                setSelectedTournament={setSelectedTournament}
                tournamentStats={tournamentStats}
                teamRankings={teamRankings}
                loadingStats={loadingStats}
                exportToCsv={exportToCsv}
                getStatusColor={getStatusColor}
                tournamentDetailedReport={tournamentDetailedReport}
              />
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Seleziona un'associazione dal menu sopra per visualizzare i report.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        // Non-admin users see only association reports
        <AssociationReportsContent
          overview={associationOverview}
          tournaments={tournaments}
          selectedTournament={selectedTournament}
          setSelectedTournament={setSelectedTournament}
          tournamentStats={tournamentStats}
          teamRankings={teamRankings}
          loadingStats={loadingStats}
          exportToCsv={exportToCsv}
          getStatusColor={getStatusColor}
          tournamentDetailedReport={tournamentDetailedReport}
        />
      )}
    </div>
  );
}

// =============================================================================
// PLATFORM REPORTS (Super Admin)
// =============================================================================

interface PlatformReportsContentProps {
  overview: PlatformOverview | null;
  tenants: TenantComparison[];
}

function PlatformReportsContent({ overview, tenants }: PlatformReportsContentProps) {
  if (!overview) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Caricamento dati piattaforma in corso...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Associazioni</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              {overview.activeTenants} attive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tornei Totali</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalTournaments}</div>
            <p className="text-xs text-muted-foreground">
              {overview.tournamentsByStatus.find(s => s.status === "ONGOING")?.count || 0} in corso, {overview.tournamentsByStatus.find(s => s.status === "COMPLETED")?.count || 0} completati
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Su tutte le associazioni
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Strike / Catture</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalStrikes} / {overview.totalCatches}</div>
            <p className="text-xs text-muted-foreground">
              {overview.totalTeams} team registrati
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Comparison Table */}
      {tenants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Confronto Associazioni
            </CardTitle>
            <CardDescription>
              Performance comparata di tutte le associazioni sulla piattaforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Associazione</TableHead>
                  <TableHead className="text-center">Tornei</TableHead>
                  <TableHead className="text-center">Attivi</TableHead>
                  <TableHead className="text-center">Utenti</TableHead>
                  <TableHead className="text-center">Team</TableHead>
                  <TableHead className="text-center">Catture</TableHead>
                  <TableHead className="text-center">Stato</TableHead>
                  <TableHead>Data Registrazione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="text-center">{tenant.tournaments}</TableCell>
                    <TableCell className="text-center">{tenant.activeTournaments}</TableCell>
                    <TableCell className="text-center">{tenant.users}</TableCell>
                    <TableCell className="text-center">{tenant.teams}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 font-semibold">{tenant.catches}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={tenant.isActive ? "default" : "secondary"}>
                        {tenant.isActive ? "Attivo" : "Inattivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString("it-IT")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// ASSOCIATION REPORTS
// =============================================================================

interface AssociationReportsContentProps {
  overview: AssociationOverview | null;
  tournaments: Tournament[];
  selectedTournament: string;
  setSelectedTournament: (id: string) => void;
  tournamentStats: TournamentStats | null;
  teamRankings: TeamStats[];
  loadingStats: boolean;
  exportToCsv: () => void;
  getStatusColor: (status: string) => string;
  tournamentDetailedReport: TournamentDetailedReport | null;
}

function AssociationReportsContent({
  overview,
  tournaments,
  selectedTournament,
  setSelectedTournament,
  tournamentStats,
  teamRankings,
  loadingStats,
  exportToCsv,
  getStatusColor,
  tournamentDetailedReport,
}: AssociationReportsContentProps) {
  return (
    <div className="space-y-6">
      {/* Global Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tornei Totali</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalTournaments || tournaments.length}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.activeTournaments || 0} in corso, {overview?.completedTournaments || 0} completati
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Registrati</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalTeams || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.totalParticipants || 0} partecipanti
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Strike Totali</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalStrikes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Media {overview?.avgTeamsPerTournament?.toFixed(1) || 0} team/torneo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catture Totali</CardTitle>
            <Fish className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalCatches || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.approvedCatches || 0} approvate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {overview && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Tournament Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tornei per Stato
              </CardTitle>
              <CardDescription>Distribuzione tornei dell'associazione</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    { name: "In Corso", value: overview.activeTournaments, fill: STATUS_COLORS.ONGOING },
                    { name: "Completati", value: overview.completedTournaments, fill: STATUS_COLORS.COMPLETED },
                    { name: "Bozza", value: overview.draftTournaments, fill: STATUS_COLORS.DRAFT },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" name="Tornei" radius={[4, 4, 0, 0]}>
                    {[
                      { name: "In Corso", fill: STATUS_COLORS.ONGOING },
                      { name: "Completati", fill: STATUS_COLORS.COMPLETED },
                      { name: "Bozza", fill: STATUS_COLORS.DRAFT },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Catches Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fish className="h-5 w-5" />
                Catture
              </CardTitle>
              <CardDescription>
                {overview.totalCatches} catture totali, {overview.approvedCatches} approvate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Approvate", value: overview.approvedCatches },
                      { name: "In Attesa", value: overview.totalCatches - overview.approvedCatches },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tournament Cards Grid - Show all ONGOING and COMPLETED tournaments */}
      {(() => {
        const activeTournaments = tournaments.filter(
          t => t.status === "ONGOING" || t.status === "COMPLETED"
        );

        if (activeTournaments.length === 0) {
          return (
            <Card>
              <CardContent className="py-10 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nessun torneo terminato o in corso.
                </p>
                <p className="text-sm text-muted-foreground">
                  Le statistiche appariranno quando ci saranno tornei attivi o completati.
                </p>
              </CardContent>
            </Card>
          );
        }

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Tornei ({activeTournaments.length})
              </h2>
              <div className="flex items-center gap-3">
                {/* Dropdown for quick selection */}
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Seleziona torneo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTournaments.map((tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(tournament.status)}`} />
                          {tournament.name}
                          <span className="text-muted-foreground text-xs">
                            ({tournament._count?.catches || 0} catture)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTournament && (
                  <Button variant="outline" onClick={exportToCsv} disabled={!teamRankings.length}>
                    <Download className="h-4 w-4 mr-2" />
                    Esporta CSV
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeTournaments.map((tournament) => {
                const isSelected = selectedTournament === tournament.id;
                const stats = tournament._count || { teams: 0, catches: 0, strikes: 0, registrations: 0 };

                return (
                  <Card
                    key={tournament.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? "ring-2 ring-primary shadow-md" : ""
                    }`}
                    onClick={() => setSelectedTournament(tournament.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{tournament.name}</CardTitle>
                        <Badge className={getStatusColor(tournament.status)}>
                          {tournament.status === "ONGOING" ? "In Corso" : "Completato"}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(tournament.startDate).toLocaleDateString("it-IT")} - {new Date(tournament.endDate).toLocaleDateString("it-IT")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/50 rounded-lg p-2">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <Anchor className="h-3 w-3" />
                            <span className="text-xs">Team</span>
                          </div>
                          <p className="text-xl font-bold">{stats.teams}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <Target className="h-3 w-3" />
                            <span className="text-xs">Strike</span>
                          </div>
                          <p className="text-xl font-bold">{stats.strikes}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <Fish className="h-3 w-3" />
                            <span className="text-xs">Catture</span>
                          </div>
                          <p className="text-xl font-bold text-green-600">{stats.catches}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t text-center">
                          <span className="text-sm text-primary font-medium">
                            ▼ Dettagli sotto
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Tournament Stats */}
      {selectedTournament && (
        <>
          {loadingStats ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : tournamentStats ? (
            <>
              {/* Tournament Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Iscritti</CardTitle>
                    <Anchor className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tournamentStats.totalTeams}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Strike Registrati</CardTitle>
                    <Target className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tournamentStats.totalStrikes}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Catture Totali</CardTitle>
                    <Fish className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tournamentStats.totalCatches}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Media Strike/Team</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tournamentStats.avgStrikesPerTeam}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Weight Statistics from Detailed Report */}
              {tournamentDetailedReport && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Peso Totale Catture</CardTitle>
                      <Fish className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {tournamentDetailedReport.stats.totalWeight.toFixed(2)} kg
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Solo catture approvate
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Cattura Maggiore</CardTitle>
                      <Award className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {tournamentDetailedReport.stats.biggestCatch.toFixed(2)} kg
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Record del torneo
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Catch Distribution Charts from Detailed Report */}
              {tournamentDetailedReport && (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Catches by Status Pie Chart */}
                  {tournamentDetailedReport.catchDistribution.byStatus.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Fish className="h-5 w-5" />
                          Distribuzione Catture per Stato
                        </CardTitle>
                        <CardDescription>
                          Approvate, in attesa e rifiutate
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={tournamentDetailedReport.catchDistribution.byStatus.map(item => ({
                                name: item.status === "APPROVED" ? "Approvate" :
                                      item.status === "PENDING" ? "In Attesa" :
                                      item.status === "REJECTED" ? "Rifiutate" : item.status,
                                value: item.count,
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {tournamentDetailedReport.catchDistribution.byStatus.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={index === 0 ? "#22c55e" : index === 1 ? "#f59e0b" : "#ef4444"}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Catches by Species Bar Chart */}
                  {tournamentDetailedReport.catchDistribution.bySpecies.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Catture per Specie
                        </CardTitle>
                        <CardDescription>
                          Distribuzione delle catture approvate
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart
                            data={tournamentDetailedReport.catchDistribution.bySpecies.map(item => ({
                              name: item.species.length > 12 ? item.species.substring(0, 12) + "..." : item.species,
                              Catture: item.count,
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              height={60}
                              className="text-xs"
                            />
                            <YAxis allowDecimals={false} className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            <Bar dataKey="Catture" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Team Performance Chart */}
              {tournamentStats.topTeams.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Team
                    </CardTitle>
                    <CardDescription>
                      Catture, persi e rilasciati per team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={tournamentStats.topTeams.map(team => ({
                          name: team.name.length > 15 ? team.name.substring(0, 15) + "..." : team.name,
                          Catture: team.catches,
                          Persi: team.lost,
                          Rilasciati: team.released,
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          className="text-xs"
                        />
                        <YAxis allowDecimals={false} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Catture" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Persi" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Rilasciati" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Top 5 Teams */}
              {tournamentStats.topTeams.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Top 5 Team
                    </CardTitle>
                    <CardDescription>
                      Classifica basata su catture e strike
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {tournamentStats.topTeams.map((team, index) => (
                        <div
                          key={team.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? "bg-yellow-500 text-white" :
                              index === 1 ? "bg-gray-400 text-white" :
                              index === 2 ? "bg-amber-700 text-white" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{team.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {team.boatName} {team.boatNumber ? `#${team.boatNumber}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-6 text-right">
                            <div>
                              <p className="text-sm text-muted-foreground">Strike</p>
                              <p className="font-semibold">{team.totalStrikes}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Catture</p>
                              <p className="font-semibold text-green-600">{team.catches}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Persi</p>
                              <p className="font-semibold text-red-600">{team.lost}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Full Rankings Table */}
              {teamRankings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Classifica Completa</CardTitle>
                    <CardDescription>
                      Tutti i team partecipanti ordinati per performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Pos.</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>Barca</TableHead>
                          <TableHead className="text-center">N. Barca</TableHead>
                          <TableHead className="text-center">Strike</TableHead>
                          <TableHead className="text-center">Canne</TableHead>
                          <TableHead className="text-center">Catture</TableHead>
                          <TableHead className="text-center">Persi</TableHead>
                          <TableHead className="text-center">Rilasciati</TableHead>
                          <TableHead className="text-center">Efficienza</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamRankings.map((team, index) => {
                          const efficiency = team.totalStrikes > 0
                            ? Math.round((team.catches / team.totalStrikes) * 100)
                            : 0;
                          return (
                            <TableRow key={team.id}>
                              <TableCell>
                                <Badge variant={index < 3 ? "default" : "secondary"}>
                                  {index + 1}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{team.name}</TableCell>
                              <TableCell>{team.boatName}</TableCell>
                              <TableCell className="text-center">
                                {team.boatNumber || "-"}
                              </TableCell>
                              <TableCell className="text-center">{team.totalStrikes}</TableCell>
                              <TableCell className="text-center">{team.totalRods}</TableCell>
                              <TableCell className="text-center">
                                <span className="text-green-600 font-semibold">{team.catches}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-red-600">{team.lost}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-blue-600">{team.released}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={efficiency >= 50 ? "default" : "secondary"}>
                                  {efficiency}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {teamRankings.length === 0 && (
                <Card>
                  <CardContent className="py-10 text-center">
                    <Fish className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nessun dato disponibile per questo torneo.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      I dati appariranno quando verranno registrati strike durante la gara.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </>
      )}

      {/* Message when no tournament selected and there are active tournaments */}
      {!selectedTournament && tournaments.some(t => t.status === "ONGOING" || t.status === "COMPLETED") && (
        <Card>
          <CardContent className="py-6 text-center">
            <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">
              Clicca su un torneo sopra per vedere le statistiche dettagliate
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
