/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/tournaments/[id]/page.tsx
 * Creato: 2025-12-29
 * Descrizione: Pagina dettaglio singolo torneo con info, partecipanti, catture
 *
 * Dipendenze:
 * - @/components/ui/card (shadcn)
 * - @/components/ui/badge (shadcn)
 * - @/components/ui/tabs (shadcn)
 * - lucide-react (icons)
 *
 * API:
 * - GET /api/tournaments/:id
 * - GET /api/tournaments/:id/participants
 * - GET /api/tournaments/:id/catches
 * =============================================================================
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, MapPin, Users, Trophy, Fish, Euro, Clock,
  ArrowLeft, Award, Anchor, User, Scale, Target, Download, BarChart3
} from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";

interface TournamentDetail {
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
  minWeight: string | null;
  maxCatchesPerDay: number | null;
  pointsPerKg: string | null;
  tenant: { name: string; slug: string };
  organizer: { firstName: string; lastName: string };
  _count: { registrations: number; catches: number };
  registrations?: Array<{
    id: string;
    teamName: string | null;
    boatName: string | null;
    status: string;
    user: { firstName: string; lastName: string };
  }>;
  catches?: Array<{
    id: string;
    weight: string;
    points: string;
    status: string;
    species: { id: string; commonNameIt: string; commonNameEn: string } | null;
    user: { firstName: string; lastName: string };
    createdAt: string;
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

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Bozza", variant: "secondary" },
  PUBLISHED: { label: "Iscrizioni Aperte", variant: "default" },
  ONGOING: { label: "In Corso", variant: "destructive" },
  COMPLETED: { label: "Completato", variant: "outline" },
  CANCELLED: { label: "Annullato", variant: "secondary" },
};

async function getTournament(id: string): Promise<TournamentDetail | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/tournaments/${id}`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.data || null;
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return null;
  }
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const tournament = await getTournament(id);

  if (!tournament) {
    notFound();
  }

  const status = statusConfig[tournament.status] || statusConfig.DRAFT;
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);
  const isOngoing = tournament.status === "ONGOING";
  const isCompleted = tournament.status === "COMPLETED";
  const canRegister = tournament.status === "PUBLISHED";

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href={`/${locale}/tournaments`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna ai tornei
      </Link>

      {/* Header */}
      <div className="mb-8">
        {isOngoing && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium mb-4 animate-pulse">
            <Clock className="h-4 w-4" />
            Torneo in corso!
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">{tournament.name}</h1>
              <HelpGuide pageKey="tournamentDetail" position="inline" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
              <Badge variant={status.variant}>{status.label}</Badge>
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

          {canRegister && (
            <Button size="lg" className="shrink-0" asChild>
              <Link href={`/${locale}/tournaments/${tournament.id}/register`}>
                <Users className="h-5 w-5 mr-2" />
                Iscriviti al Torneo
              </Link>
            </Button>
          )}

          {isCompleted && (
            <div className="flex gap-2">
              <Button variant="outline" className="shrink-0" asChild>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/reports/public/pdf/leaderboard/${tournament.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Scarica Classifica PDF
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {tournament.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descrizione</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{tournament.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Tabs for Participants and Catches */}
          <Tabs defaultValue={isCompleted ? "catches" : "participants"}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="participants" className="gap-2">
                <Users className="h-4 w-4" />
                Partecipanti ({tournament._count.registrations})
              </TabsTrigger>
              <TabsTrigger value="catches" className="gap-2">
                <Fish className="h-4 w-4" />
                Catture ({tournament._count.catches})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="participants">
              <Card>
                <CardContent className="pt-6">
                  {tournament.registrations && tournament.registrations.length > 0 ? (
                    <div className="space-y-3">
                      {tournament.registrations.map((reg, index) => (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">
                                {reg.teamName || `${reg.user.firstName} ${reg.user.lastName}`}
                              </p>
                              {reg.boatName && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Anchor className="h-3 w-3" />
                                  {reg.boatName}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant={reg.status === "CONFIRMED" ? "default" : "secondary"}>
                            {reg.status === "CONFIRMED" ? "Confermato" : "In attesa"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Nessun partecipante ancora iscritto</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catches">
              <Card>
                <CardContent className="pt-6">
                  {tournament.catches && tournament.catches.length > 0 ? (
                    <div className="space-y-3">
                      {tournament.catches.map((catchItem, index) => (
                        <div
                          key={catchItem.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {index < 3 ? (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                index === 0 ? "bg-amber-100 text-amber-600" :
                                index === 1 ? "bg-gray-100 text-gray-600" :
                                "bg-orange-100 text-orange-600"
                              }`}>
                                <Trophy className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                                {index + 1}
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {`${catchItem.user.firstName} ${catchItem.user.lastName}`}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Fish className="h-3 w-3" />
                                {catchItem.species?.commonNameIt || "Specie sconosciuta"}
                                <span className="text-muted-foreground/50">|</span>
                                <Scale className="h-3 w-3" />
                                {parseFloat(catchItem.weight).toFixed(1)} kg
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              {parseFloat(catchItem.points).toFixed(0)} pt
                            </p>
                            <Badge variant={catchItem.status === "APPROVED" ? "default" : "secondary"} className="text-xs">
                              {catchItem.status === "APPROVED" ? "Validata" : "In verifica"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Fish className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Nessuna cattura registrata</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informazioni</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(startDate)}
                    {startDate.toDateString() !== endDate.toDateString() && (
                      <><br />→ {formatDate(endDate)}</>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Orario: {formatTime(startDate)} - {formatTime(endDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Luogo</p>
                  <p className="text-sm text-muted-foreground">{tournament.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Euro className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Quota Iscrizione</p>
                  <p className="text-sm text-muted-foreground">
                    {parseFloat(tournament.registrationFee).toFixed(0)}€
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Partecipanti</p>
                  <p className="text-sm text-muted-foreground">
                    {tournament._count.registrations}
                    {tournament.maxParticipants && ` / ${tournament.maxParticipants}`} iscritti
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rules Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Regolamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tournament.minWeight && (
                <div className="flex items-center gap-2 text-sm">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <span>Peso minimo: {parseFloat(tournament.minWeight).toFixed(1)} kg</span>
                </div>
              )}
              {tournament.maxCatchesPerDay && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>Max catture/giorno: {tournament.maxCatchesPerDay}</span>
                </div>
              )}
              {tournament.pointsPerKg && (
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>Punti per kg: {parseFloat(tournament.pointsPerKg).toFixed(0)}</span>
                </div>
              )}
              {!tournament.minWeight && !tournament.maxCatchesPerDay && !tournament.pointsPerKg && (
                <p className="text-sm text-muted-foreground">
                  Regolamento standard del circuito
                </p>
              )}
            </CardContent>
          </Card>

          {/* Organizer Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organizzatore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{tournament.tenant.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {tournament.organizer.firstName} {tournament.organizer.lastName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
