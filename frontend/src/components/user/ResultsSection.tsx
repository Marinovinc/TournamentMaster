/**
 * =============================================================================
 * RESULTS SECTION - User Tournament Results
 * =============================================================================
 * Visualizza i risultati nei tornei completati
 * Supporta viewUserId per visualizzazione admin
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Medal,
  Award,
  ChevronRight,
  Target,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { disciplineLabels } from '@/lib/disciplines';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface TournamentResult {
  id: string;
  position: number;
  points: number;
  catches: number;
  totalWeight: number;
  tournament: {
    id: string;
    name: string;
    discipline: string;
    endDate: string;
    bannerImage?: string;
  };
}

interface Stats {
  tournamentsParticipated: number;
  totalPoints: number;
  avgPosition: number;
  podiums: {
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
}

interface ResultsSectionProps {
  primaryColor?: string;
  viewUserId?: string;
  readOnly?: boolean;
}

// disciplineLabels importato da lib/disciplines

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPositionBadge(position: number) {
  if (position === 1) {
    return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Medal className="h-3 w-3 mr-1" />1°</Badge>;
  }
  if (position === 2) {
    return <Badge className="bg-gray-400 hover:bg-gray-500"><Medal className="h-3 w-3 mr-1" />2°</Badge>;
  }
  if (position === 3) {
    return <Badge className="bg-orange-500 hover:bg-orange-600"><Medal className="h-3 w-3 mr-1" />3°</Badge>;
  }
  return <Badge variant="outline">{position}° posto</Badge>;
}

export default function ResultsSection({ primaryColor = "#0066CC", viewUserId, readOnly = false }: ResultsSectionProps) {
  const { token } = useAuth();
  const params = useParams();
  const locale = (params.locale as string) || "it";

  const [results, setResults] = useState<TournamentResult[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      if (!token) return;

      setLoading(true);
      try {
        const resultsEndpoint = viewUserId
          ? `${API_URL}/api/users/${viewUserId}/results`
          : `${API_URL}/api/users/me/results`;

        const statsEndpoint = viewUserId
          ? `${API_URL}/api/users/${viewUserId}/stats`
          : `${API_URL}/api/users/me/stats`;

        const [resultsRes, statsRes] = await Promise.all([
          fetch(resultsEndpoint, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(statsEndpoint, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (resultsRes.ok) {
          const resultsData = await resultsRes.json();
          setResults(resultsData.data || []);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Impossibile caricare i risultati");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [token, viewUserId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" style={{ color: primaryColor }} />
                <div>
                  <p className="text-2xl font-bold">{stats.tournamentsParticipated}</p>
                  <p className="text-sm text-muted-foreground">Tornei</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalPoints}</p>
                  <p className="text-sm text-muted-foreground">Punti Totali</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.avgPosition ? stats.avgPosition.toFixed(1) : "-"}</p>
                  <p className="text-sm text-muted-foreground">Pos. Media</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.podiums.total}</p>
                  <p className="text-sm text-muted-foreground">Podi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Podiums Detail */}
      {stats && stats.podiums.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Piazzamenti sul Podio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mb-2 mx-auto">
                  <Medal className="h-7 w-7 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold">{stats.podiums.gold}</p>
                <p className="text-sm text-muted-foreground">Ori</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-2 mx-auto">
                  <Medal className="h-7 w-7 text-gray-500" />
                </div>
                <p className="text-2xl font-bold">{stats.podiums.silver}</p>
                <p className="text-sm text-muted-foreground">Argenti</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-2 mx-auto">
                  <Medal className="h-7 w-7 text-orange-600" />
                </div>
                <p className="text-2xl font-bold">{stats.podiums.bronze}</p>
                <p className="text-sm text-muted-foreground">Bronzi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results List */}
      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div
                  className="sm:w-32 h-24 sm:h-auto bg-cover bg-center flex-shrink-0"
                  style={{
                    backgroundImage: result.tournament.bannerImage
                      ? `url(${getMediaUrl(result.tournament.bannerImage)})`
                      : `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}20)`,
                  }}
                >
                  {!result.tournament.bannerImage && (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                <CardContent className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold">{result.tournament.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {disciplineLabels[result.tournament.discipline] || result.tournament.discipline}
                        {" - "}
                        {formatDate(result.tournament.endDate)}
                      </p>
                    </div>
                    {getPositionBadge(result.position)}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1.5" style={{ color: primaryColor }}>
                      <Target className="h-4 w-4" />
                      <strong>{result.points}</strong> punti
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      {result.catches} catture
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      {result.totalWeight.toFixed(2)} kg totali
                    </span>
                  </div>

                  {!readOnly && (
                    <div className="mt-3">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/${locale}/tournaments/${result.tournament.id}`}>
                          Dettagli
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-4">
              {viewUserId ? "Nessun risultato disponibile" : "Nessun risultato disponibile"}
            </p>
            <p className="text-sm text-muted-foreground">
              I risultati appariranno qui dopo la conclusione dei tornei
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
