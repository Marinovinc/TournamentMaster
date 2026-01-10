/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/leaderboard/page.tsx
 * Creato: 2026-01-02
 * Descrizione: Pagina classifica generale - lista tornei con classifiche live
 *
 * Dipendenze:
 * - @/components/native/LiveLeaderboard
 * - @/components/tournament/TournamentCard
 *
 * API:
 * - GET /api/tournaments (per lista tornei attivi)
 * =============================================================================
 */

import Link from "next/link";
import { Award, Trophy, Home, Calendar, MapPin, Users } from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Tournament {
  id: string;
  name: string;
  description?: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  discipline: string;
  maxParticipants?: number;
  _count?: {
    registrations: number;
  };
}

interface TournamentsResponse {
  success: boolean;
  data: Tournament[];
}

async function getActiveTournaments(): Promise<Tournament[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/tournaments?status=ONGOING&limit=50`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch tournaments");
    }

    const data: TournamentsResponse = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return [];
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ONGOING":
      return <Badge className="bg-green-500">In Corso</Badge>;
    case "PUBLISHED":
      return <Badge className="bg-blue-500">Prossimamente</Badge>;
    case "COMPLETED":
      return <Badge variant="secondary">Completato</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tournaments = await getActiveTournaments();

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Back to Home */}
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <Home className="h-4 w-4" />
        Torna alla Home
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl md:text-4xl font-bold">
            <Award className="inline h-8 w-8 mr-3 text-primary" />
            Classifiche
          </h1>
          <HelpGuide pageKey="leaderboard" position="inline" />
        </div>
        <p className="text-muted-foreground text-lg">
          Consulta le classifiche in tempo reale dei tornei in corso
        </p>
      </div>

      {/* Tournaments Grid */}
      {tournaments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nessun torneo in corso</h3>
            <p className="text-muted-foreground mb-4">
              Al momento non ci sono tornei attivi con classifiche disponibili.
            </p>
            <Link
              href={`/${locale}/tournaments`}
              className="text-primary hover:underline"
            >
              Vedi tutti i tornei
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/${locale}/leaderboard/${tournament.id}`}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{tournament.name}</CardTitle>
                    {getStatusBadge(tournament.status)}
                  </div>
                  <CardDescription>{tournament.discipline}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{tournament.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                      </span>
                    </div>
                    {tournament._count && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{tournament._count.registrations} partecipanti</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-primary font-medium flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Vedi Classifica
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
