/**
 * =============================================================================
 * TOURNAMENT MANAGEMENT PAGE
 * =============================================================================
 * Pagina di gestione torneo nella dashboard
 * Attiva automaticamente la Tournament Mode per mostrare sidebar gestionale
 * =============================================================================
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Fish,
  Euro,
  Clock,
  Ship,
  UserCheck,
  Zap,
  CheckCircle,
  Settings,
  Play,
  Pause,
  Ban,
  Edit,
  Circle,
  AlertCircle,
  ListChecks,
  ChevronRight,
  TrendingUp,
  Scale,
  Activity,
  RefreshCw,
  MessageSquare,
  Gavel,
  Shield,
  BarChart3,
  Building2,
  Gift,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { HelpGuide } from "@/components/HelpGuide";
import { toast } from "sonner";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  discipline: string;
  status: string;
  startDate: string;
  endDate: string;
  location: string;
  registrationFee: string;
  maxParticipants: number | null;
  minParticipants: number | null;
  minWeight: string | null;
  maxCatchesPerDay: number | null;
  pointsPerKg: string | null;
  tenant: { id: string; name: string; slug: string };
  organizer: { id: string; firstName: string; lastName: string };
  _count: { registrations: number; catches: number };
  registrations?: Array<{
    id: string;
    teamName: string | null;
    boatName: string | null;
    status: string;
    user: { id: string; firstName: string; lastName: string; email: string };
  }>;
}

interface TournamentStats {
  totalCatches: number;
  pendingCatches: number;
  approvedCatches: number;
  rejectedCatches: number;
  catchesPerHour: number;
  totalWeight: number;
  averageWeight: number;
  topCatcher: {
    userId: string;
    name: string;
    catches: number;
    weight: number;
  } | null;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    userName?: string;
  }>;
  participantsStats: {
    total: number;
    confirmed: number;
    pending: number;
  };
  inspectorsStats: {
    total: number;
    assigned: number;
    coverage: number;
  };
}

const disciplineLabels: Record<string, string> = {
  BIG_GAME: "Big Game",
  DRIFTING: "Drifting",
  TRAINA_COSTIERA: "Traina Costiera",
  BOLENTINO: "Bolentino",
  EGING: "Eging",
  VERTICAL_JIGGING: "Vertical Jigging",
  SHORE: "Pesca da Riva",
  SOCIAL: "Evento Sociale",
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: "Bozza", color: "text-gray-700", bgColor: "bg-gray-100" },
  PUBLISHED: { label: "Pubblicato", color: "text-blue-700", bgColor: "bg-blue-100" },
  REGISTRATION_OPEN: { label: "Iscrizioni Aperte", color: "text-green-700", bgColor: "bg-green-100" },
  REGISTRATION_CLOSED: { label: "Iscrizioni Chiuse", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  ONGOING: { label: "In Corso", color: "text-red-700", bgColor: "bg-red-100" },
  COMPLETED: { label: "Completato", color: "text-purple-700", bgColor: "bg-purple-100" },
  CANCELLED: { label: "Annullato", color: "text-gray-500", bgColor: "bg-gray-200" },
};

// Checklist per fase - cosa fare in ogni stato del torneo
interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  warning?: boolean;
  link?: string;
}

function getChecklistForPhase(tournament: Tournament, locale: string): ChecklistItem[] {
  const basePath = `/${locale}/dashboard/tournaments/${tournament.id}`;

  switch (tournament.status) {
    case "DRAFT":
      return [
        {
          id: "basic-info",
          label: "Informazioni base compilate",
          completed: !!tournament.name && !!tournament.startDate && !!tournament.endDate,
          link: `${basePath}/edit`,
        },
        {
          id: "location",
          label: "Luogo definito",
          completed: !!tournament.location && tournament.location !== "",
          link: `${basePath}/edit`,
        },
        {
          id: "fee",
          label: "Quota iscrizione impostata",
          completed: tournament.registrationFee !== null && parseFloat(tournament.registrationFee) > 0,
          link: `${basePath}/edit`,
        },
        {
          id: "zones",
          label: "Zone di pesca definite",
          completed: false, // Verificato lato server se ci sono zone
          link: `${basePath}/zones`,
        },
      ];

    case "PUBLISHED":
      return [
        {
          id: "announcement",
          label: "Torneo pubblicato e visibile",
          completed: true,
        },
        {
          id: "share",
          label: "Link condiviso con potenziali partecipanti",
          completed: false, // Non tracciabile automaticamente
        },
      ];

    case "REGISTRATION_OPEN":
      return [
        {
          id: "min-participants",
          label: "Minimo partecipanti raggiunto",
          completed: tournament.minParticipants
            ? tournament._count.registrations >= tournament.minParticipants
            : tournament._count.registrations > 0,
          warning: tournament.minParticipants
            ? tournament._count.registrations < tournament.minParticipants
            : false,
          link: `${basePath}/participants`,
        },
        {
          id: "inspectors",
          label: "Ispettori da assegnare",
          completed: false, // Verificato dal backend
          link: `${basePath}/judges`,
        },
        {
          id: "staff",
          label: "Staff/Giudici di gara da assegnare",
          completed: false, // Verificato dal backend
          link: `${basePath}/staff`,
        },
      ];

    case "REGISTRATION_CLOSED":
      return [
        {
          id: "inspectors-assigned",
          label: "Tutti gli ispettori assegnati",
          completed: false, // Da verificare
          link: `${basePath}/judges`,
        },
        {
          id: "staff-assigned",
          label: "Giudici di gara assegnati",
          completed: false, // Da verificare
          link: `${basePath}/staff`,
        },
        {
          id: "ready-start",
          label: "Pronto per iniziare",
          completed: tournament._count.registrations > 0,
          link: `${basePath}/settings`,
        },
      ];

    case "ONGOING":
      return [
        {
          id: "catches-monitoring",
          label: "Monitoraggio catture attivo",
          completed: true,
          link: `/${locale}/dashboard/judge?tournamentId=${tournament.id}`,
        },
        {
          id: "pending-catches",
          label: "Catture da validare",
          completed: false, // Mostrato come warning se ci sono pending
          warning: true, // Sempre warning durante ONGOING
          link: `/${locale}/dashboard/judge?tournamentId=${tournament.id}`,
        },
      ];

    case "COMPLETED":
      return [
        {
          id: "all-validated",
          label: "Tutte le catture validate",
          completed: true, // Assumiamo completato se siamo in COMPLETED
        },
        {
          id: "final-ranking",
          label: "Classifica finale disponibile",
          completed: true,
          link: `${basePath}/settings`, // Per scaricare PDF
        },
        {
          id: "export-data",
          label: "Esporta dati torneo",
          completed: false,
          link: `${basePath}/settings`,
        },
      ];

    default:
      return [];
  }
}

export default function TournamentManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const locale = (params.locale as string) || "it";
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const previousStatusRef = useRef<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Notifica cambio stato
  useEffect(() => {
    if (tournament && previousStatusRef.current !== null && tournament.status !== previousStatusRef.current) {
      const newStatus = statusConfig[tournament.status];
      const oldStatus = statusConfig[previousStatusRef.current];
      toast.success(
        `Stato cambiato: ${oldStatus?.label || previousStatusRef.current} → ${newStatus?.label || tournament.status}`,
        {
          description: `Il torneo "${tournament.name}" ha cambiato stato`,
          duration: 5000,
        }
      );
    }
    if (tournament) {
      previousStatusRef.current = tournament.status;
    }
  }, [tournament?.status]);

  // Fetch tournament data
  useEffect(() => {
    const fetchTournament = async () => {
      if (!token || !tournamentId) return;

      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Torneo non trovato");
        }

        const data = await response.json();
        setTournament(data.data);

        // Activate Tournament Mode
        const tournamentData = {
          id: data.data.id,
          name: data.data.name,
          status: data.data.status,
        };
        localStorage.setItem("activeTournament", JSON.stringify(tournamentData));
        window.dispatchEvent(new Event("tournamentChanged"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore nel caricamento");
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [token, tournamentId, API_URL]);

  // Fetch stats for ONGOING/COMPLETED tournaments
  const fetchStats = async () => {
    if (!token || !tournamentId || !tournament) return;
    if (!["ONGOING", "COMPLETED"].includes(tournament.status)) return;

    try {
      setStatsLoading(true);
      const res = await fetch(`${API_URL}/api/tournaments/${tournamentId}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch stats when tournament is loaded and is ONGOING/COMPLETED
  useEffect(() => {
    if (tournament && ["ONGOING", "COMPLETED"].includes(tournament.status)) {
      fetchStats();
    }
  }, [tournament?.id, tournament?.status]);

  // Cleanup on unmount - don't remove tournament mode as user might navigate to sub-pages
  // Tournament mode is exited via the sidebar button

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Torneo non trovato</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push(`/${locale}/dashboard/tournaments`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna ai tornei
        </Button>
      </div>
    );
  }

  const status = statusConfig[tournament.status] || statusConfig.DRAFT;
  const isOngoing = tournament.status === "ONGOING";
  const isCompleted = tournament.status === "COMPLETED";
  const canManage = ["DRAFT", "PUBLISHED", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "ONGOING"].includes(tournament.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/dashboard/tournaments`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna ai tornei
          </Link>
          <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            {tournament.name}
            {isOngoing && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium animate-pulse">
                <Clock className="h-3 w-3" />
                LIVE
              </span>
            )}
          </h1>
          <HelpGuide pageKey="tournamentManagement" position="inline" isAdmin={true} />
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
            <span className="flex items-center gap-1">
              <Fish className="h-4 w-4" />
              {disciplineLabels[tournament.discipline] || tournament.discipline}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {tournament.location}
            </span>
          </div>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Modifica
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tournament._count.registrations}</p>
                <p className="text-xs text-muted-foreground">
                  {tournament.maxParticipants ? `/ ${tournament.maxParticipants}` : ""} Iscritti
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Fish className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tournament._count.catches}</p>
                <p className="text-xs text-muted-foreground">Catture</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold">{formatDate(tournament.startDate)}</p>
                <p className="text-xs text-muted-foreground">Data Inizio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Euro className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{parseFloat(tournament.registrationFee).toFixed(0)}€</p>
                <p className="text-xs text-muted-foreground">Quota</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Checklist */}
      {tournament.status !== "CANCELLED" && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Checklist Fase: {statusConfig[tournament.status]?.label || tournament.status}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {(() => {
                  const items = getChecklistForPhase(tournament, locale);
                  const completed = items.filter(i => i.completed).length;
                  return `${completed}/${items.length} completati`;
                })()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress bar */}
            {(() => {
              const items = getChecklistForPhase(tournament, locale);
              const completed = items.filter(i => i.completed).length;
              const percentage = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
              return (
                <div className="space-y-1">
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{percentage}% completato</p>
                </div>
              );
            })()}

            {/* Checklist items */}
            <div className="space-y-2">
              {getChecklistForPhase(tournament, locale).map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    item.completed
                      ? "bg-green-50 dark:bg-green-950/20"
                      : item.warning
                      ? "bg-amber-50 dark:bg-amber-950/20"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : item.warning ? (
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className={item.completed ? "text-green-700 dark:text-green-400" : ""}>
                      {item.label}
                    </span>
                  </div>
                  {item.link && !item.completed && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={item.link}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Next action suggestion */}
            {tournament.status === "DRAFT" && (
              <div className="pt-2 border-t">
                <Button size="sm" asChild>
                  <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/settings`}>
                    <Play className="h-4 w-4 mr-2" />
                    Pubblica Torneo
                  </Link>
                </Button>
              </div>
            )}
            {tournament.status === "PUBLISHED" && (
              <div className="pt-2 border-t">
                <Button size="sm" asChild>
                  <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/settings`}>
                    <Play className="h-4 w-4 mr-2" />
                    Apri Iscrizioni
                  </Link>
                </Button>
              </div>
            )}
            {tournament.status === "REGISTRATION_CLOSED" && (
              <div className="pt-2 border-t">
                <Button size="sm" asChild>
                  <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/settings`}>
                    <Play className="h-4 w-4 mr-2" />
                    Avvia Torneo
                  </Link>
                </Button>
              </div>
            )}
            {tournament.status === "ONGOING" && (
              <div className="pt-2 border-t">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/${locale}/dashboard/judge?tournamentId=${tournament.id}`}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valida Catture
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {tournament.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Descrizione</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{tournament.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Real-time Metrics - Only for ONGOING/COMPLETED */}
      {(isOngoing || isCompleted) && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Metriche {isOngoing && "Live"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchStats}
                disabled={statsLoading}
              >
                <RefreshCw className={`h-4 w-4 ${statsLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-6">
                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.totalCatches}</p>
                    <p className="text-xs text-muted-foreground">Catture Totali</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{stats.pendingCatches}</p>
                    <p className="text-xs text-muted-foreground">Da Validare</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.approvedCatches}</p>
                    <p className="text-xs text-muted-foreground">Approvate</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{stats.rejectedCatches}</p>
                    <p className="text-xs text-muted-foreground">Rifiutate</p>
                  </div>
                </div>

                {/* Weight and Trend Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Scale className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-lg font-bold">{stats.totalWeight.toFixed(1)} kg</p>
                      <p className="text-xs text-muted-foreground">Peso Totale</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Scale className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-lg font-bold">{stats.averageWeight.toFixed(2)} kg</p>
                      <p className="text-xs text-muted-foreground">Media Peso</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-lg font-bold">{stats.catchesPerHour}/ora</p>
                      <p className="text-xs text-muted-foreground">Trend Catture</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-lg font-bold">{stats.inspectorsStats.coverage}%</p>
                      <p className="text-xs text-muted-foreground">Copertura Ispettori</p>
                    </div>
                  </div>
                </div>

                {/* Top Catcher */}
                {stats.topCatcher && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-8 w-8 text-amber-500" />
                      <div>
                        <p className="font-bold text-amber-700 dark:text-amber-400">
                          Top: {stats.topCatcher.name}
                        </p>
                        <p className="text-sm text-amber-600 dark:text-amber-500">
                          {stats.topCatcher.catches} catture - {stats.topCatcher.weight.toFixed(1)} kg totali
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                {stats.recentActivity.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Attivita Recente
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {stats.recentActivity.slice(0, 5).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              activity.type === "catch_approved"
                                ? "bg-green-500"
                                : activity.type === "catch_rejected"
                                ? "bg-red-500"
                                : activity.type === "catch_submitted"
                                ? "bg-blue-500"
                                : "bg-purple-500"
                            }`}
                          />
                          <span className="flex-1 truncate">{activity.description}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleTimeString(locale, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nessuna statistica disponibile
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/participants`}>
                <Users className="h-5 w-5" />
                <span className="text-xs">Partecipanti</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/teams`}>
                <Ship className="h-5 w-5" />
                <span className="text-xs">Barche/Equipaggi</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/judges`}>
                <UserCheck className="h-5 w-5" />
                <span className="text-xs">Ispettori</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/staff`}>
                <Gavel className="h-5 w-5 text-blue-600" />
                <span className="text-xs">Giudici/Staff</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/communications`}>
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">Comunicazioni</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/penalties`}>
                <Gavel className="h-5 w-5" />
                <span className="text-xs">Penalita</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/homologation`}>
                <Shield className="h-5 w-5" />
                <span className="text-xs">Omologazione</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/sponsors`}>
                <Building2 className="h-5 w-5" />
                <span className="text-xs">Sponsor</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/prizes`}>
                <Gift className="h-5 w-5" />
                <span className="text-xs">Premi</span>
              </Link>
            </Button>

            {(isOngoing || isCompleted) && (
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/analytics`}>
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-xs">Analytics</span>
                </Link>
              </Button>
            )}

            {(isOngoing || tournament.status === "REGISTRATION_CLOSED") && (
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link href={`/${locale}/dashboard/strikes?tournamentId=${tournament.id}`}>
                  <Zap className="h-5 w-5" />
                  <span className="text-xs">Strike Live</span>
                </Link>
              </Button>
            )}

            {isOngoing && (
              <Button variant="default" className="h-auto py-4 flex-col gap-2 bg-red-600 hover:bg-red-700" asChild>
                <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/live`}>
                  <Activity className="h-5 w-5" />
                  <span className="text-xs">Live Dashboard</span>
                </Link>
              </Button>
            )}

            {(isOngoing || isCompleted) && (
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link href={`/${locale}/dashboard/judge?tournamentId=${tournament.id}`}>
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-xs">Catture</span>
                </Link>
              </Button>
            )}

            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/zones`}>
                <MapPin className="h-5 w-5" />
                <span className="text-xs">Zone di Pesca</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/settings`}>
                <Settings className="h-5 w-5" />
                <span className="text-xs">Impostazioni</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity / Participants Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Ultimi Iscritti</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/dashboard/tournaments/${tournament.id}/participants`}>
                Vedi tutti
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tournament.registrations && tournament.registrations.length > 0 ? (
              <div className="space-y-3">
                {tournament.registrations.slice(0, 5).map((reg, index) => (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {reg.teamName || `${reg.user.firstName} ${reg.user.lastName}`}
                        </p>
                        {reg.boatName && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Ship className="h-3 w-3" />
                            {reg.boatName}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={reg.status === "CONFIRMED" ? "default" : "secondary"} className="text-xs">
                      {reg.status === "CONFIRMED" ? "Confermato" : "In attesa"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nessun iscritto</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informazioni Torneo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Data Inizio</p>
                <p className="font-medium">{formatDate(tournament.startDate)}</p>
                <p className="text-xs text-muted-foreground">{formatTime(tournament.startDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Data Fine</p>
                <p className="font-medium">{formatDate(tournament.endDate)}</p>
                <p className="text-xs text-muted-foreground">{formatTime(tournament.endDate)}</p>
              </div>
              {tournament.minWeight && (
                <div>
                  <p className="text-muted-foreground">Peso Minimo</p>
                  <p className="font-medium">{parseFloat(tournament.minWeight).toFixed(1)} kg</p>
                </div>
              )}
              {tournament.maxCatchesPerDay && (
                <div>
                  <p className="text-muted-foreground">Max Catture/Giorno</p>
                  <p className="font-medium">{tournament.maxCatchesPerDay}</p>
                </div>
              )}
              {tournament.pointsPerKg && (
                <div>
                  <p className="text-muted-foreground">Punti per Kg</p>
                  <p className="font-medium">{parseFloat(tournament.pointsPerKg).toFixed(0)}</p>
                </div>
              )}
              {tournament.minParticipants && (
                <div>
                  <p className="text-muted-foreground">Min Partecipanti</p>
                  <p className="font-medium">{tournament.minParticipants}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
