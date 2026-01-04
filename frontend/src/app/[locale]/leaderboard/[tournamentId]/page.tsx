/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/leaderboard/[tournamentId]/page.tsx
 * Creato: 2026-01-02
 * Descrizione: Pagina classifica dettagliata per singolo torneo
 *
 * Dipendenze:
 * - @/components/native/LiveLeaderboard
 *
 * API:
 * - GET /api/tournaments/:id
 * - GET /api/tournaments/:id/leaderboard
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Award, Trophy, Home, ArrowLeft, Calendar, MapPin, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

interface LeaderboardEntry {
  rank: number;
  oddsRank?: number;
  oddsLabel?: string;
  participantId: string;
  oddsParticipant?: string;
  participantName: string;
  oddsName?: string;
  oddsLastName?: string;
  totalPoints: number;
  oddsPoints?: number;
  totalCatches: number;
  oddsCatches?: number;
  totalWeight: number;
  oddsWeight?: number;
  biggestCatch?: number;
  oddsMax?: number;
}

interface Tournament {
  id: string;
  name: string;
  description?: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  discipline: string;
}

export default function TournamentLeaderboardPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const locale = params.locale as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch tournament info
      const tournamentRes = await fetch(`${apiUrl}/api/tournaments/${tournamentId}`);
      if (tournamentRes.ok) {
        const tournamentData = await tournamentRes.json();
        setTournament(tournamentData.data || tournamentData);
      }

      // Fetch leaderboard
      const leaderboardRes = await fetch(`${apiUrl}/api/tournaments/${tournamentId}/leaderboard`);
      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setLeaderboard(leaderboardData.data || leaderboardData || []);
      }

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError("Errore nel caricamento dei dati");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-black">1</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-black">2</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600 text-white">3</Badge>;
    return <Badge variant="outline">{rank}</Badge>;
  };

  if (loading && !tournament) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Caricamento classifica...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/${locale}/leaderboard`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tutte le classifiche
        </Link>
        <span className="text-muted-foreground">|</span>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>

      {/* Tournament Header */}
      {tournament && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-primary" />
                  {tournament.name}
                </CardTitle>
                <p className="text-muted-foreground mt-1">{tournament.discipline}</p>
              </div>
              <Badge className={tournament.status === "ONGOING" ? "bg-green-500" : "bg-gray-500"}>
                {tournament.status === "ONGOING" ? "In Corso" : tournament.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{tournament.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Classifica Live
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Ultimo aggiornamento: {lastUpdate.toLocaleTimeString("it-IT")}
          </span>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="py-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      {leaderboard.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nessuna classifica disponibile</h3>
            <p className="text-muted-foreground">
              La classifica sara disponibile quando inizieranno le catture.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Pos.</th>
                  <th className="px-4 py-3 text-left font-medium">Partecipante</th>
                  <th className="px-4 py-3 text-right font-medium">Punti</th>
                  <th className="px-4 py-3 text-right font-medium">Catture</th>
                  <th className="px-4 py-3 text-right font-medium">Peso Tot.</th>
                  <th className="px-4 py-3 text-right font-medium">Max</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr
                    key={entry.participantId || index}
                    className={`border-t ${index < 3 ? "bg-muted/30" : ""}`}
                  >
                    <td className="px-4 py-3">
                      {getRankBadge(entry.rank || index + 1)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {entry.participantName || entry.oddsName || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary">
                      {entry.totalPoints || entry.oddsPoints || 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.totalCatches || entry.oddsCatches || 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {((entry.totalWeight || entry.oddsWeight || 0) / 1000).toFixed(2)} kg
                    </td>
                    <td className="px-4 py-3 text-right">
                      {((entry.biggestCatch || entry.oddsMax || 0) / 1000).toFixed(2)} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </main>
  );
}
