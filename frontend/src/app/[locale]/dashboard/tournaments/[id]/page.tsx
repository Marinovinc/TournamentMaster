/**
 * =============================================================================
 * TOURNAMENT MANAGEMENT PAGE
 * =============================================================================
 * Pagina di gestione torneo nella dashboard
 * Attiva automaticamente la Tournament Mode per mostrare sidebar gestionale
 * =============================================================================
 */

"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

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

export default function TournamentManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const locale = (params.locale as string) || "it";
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            {tournament.name}
            {isOngoing && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium animate-pulse">
                <Clock className="h-3 w-3" />
                LIVE
              </span>
            )}
          </h1>
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

            {(isOngoing || tournament.status === "REGISTRATION_CLOSED") && (
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link href={`/${locale}/dashboard/strikes?tournamentId=${tournament.id}`}>
                  <Zap className="h-5 w-5" />
                  <span className="text-xs">Strike Live</span>
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
