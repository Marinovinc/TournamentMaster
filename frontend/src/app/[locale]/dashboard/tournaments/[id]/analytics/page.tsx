/**
 * =============================================================================
 * TOURNAMENT ANALYTICS PAGE
 * =============================================================================
 * Dashboard con grafici e statistiche avanzate del torneo
 * =============================================================================
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  Fish,
  Scale,
  Trophy,
  Clock,
  RefreshCw,
  Download,
  Activity,
} from "lucide-react";

// ============================================================================
// INTERFACES
// ============================================================================

interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

interface DistributionItem {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

interface ParticipantPerformance {
  userId: string;
  name: string;
  totalCatches: number;
  approvedCatches: number;
  totalWeight: number;
  averageWeight: number;
  biggestCatch: number;
  points: number;
  rank: number;
}

interface HeatmapPoint {
  hour: number;
  day: string;
  value: number;
}

// ============================================================================
// SIMPLE CHART COMPONENTS (No external library needed)
// ============================================================================

function BarChartSimple({ data, title }: { data: TimeSeriesPoint[]; title: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Nessun dato disponibile
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="flex items-end gap-1 h-48 overflow-x-auto pb-2">
        {data.slice(-24).map((point, index) => (
          <div
            key={index}
            className="flex flex-col items-center min-w-[30px]"
            title={point.label || `${point.date}: ${point.value}`}
          >
            <div
              className="w-6 bg-primary rounded-t transition-all hover:bg-primary/80"
              style={{ height: `${(point.value / maxValue) * 160}px` }}
            />
            <span className="text-[10px] text-muted-foreground mt-1 rotate-45 origin-left">
              {point.date.split(" ")[1] || point.date.slice(-5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieChartSimple({ data, title }: { data: DistributionItem[]; title: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Nessun dato disponibile
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.color || `hsl(${index * 45}, 70%, 50%)` }}
            />
            <div className="flex-1">
              <div className="flex justify-between text-sm">
                <span>{item.name}</span>
                <span className="font-medium">{item.value}</span>
              </div>
              <Progress value={item.percentage} className="h-1.5" />
            </div>
            <span className="text-xs text-muted-foreground w-10 text-right">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeatmapSimple({ data }: { data: HeatmapPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Nessun dato disponibile
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const days = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex gap-1">
          <div className="w-10" />
          {hours.filter((h) => h % 3 === 0).map((hour) => (
            <div key={hour} className="text-[10px] text-muted-foreground w-6 text-center">
              {hour}h
            </div>
          ))}
        </div>
        {days.map((day, dayIndex) => (
          <div key={day} className="flex gap-1 items-center">
            <div className="w-10 text-xs text-muted-foreground">{day}</div>
            {hours.map((hour) => {
              const point = data.find((d) => d.day === day && d.hour === hour);
              const value = point?.value || 0;
              const intensity = value / maxValue;
              return (
                <div
                  key={`${day}-${hour}`}
                  className="w-6 h-4 rounded-sm"
                  style={{
                    backgroundColor: value > 0
                      ? `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`
                      : "rgb(241, 245, 249)",
                  }}
                  title={`${day} ${hour}:00 - ${value} catture`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TournamentAnalyticsPage() {
  const params = useParams();
  const { token } = useAuth();
  const locale = (params.locale as string) || "it";
  const tournamentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [timeline, setTimeline] = useState<TimeSeriesPoint[]>([]);
  const [weightDist, setWeightDist] = useState<DistributionItem[]>([]);
  const [speciesDist, setSpeciesDist] = useState<DistributionItem[]>([]);
  const [performance, setPerformance] = useState<ParticipantPerformance[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([]);
  const [tournament, setTournament] = useState<{ name: string; status: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!token || !tournamentId) return;

    try {
      setLoading(true);
      setError(null);

      // Load tournament info
      const tournamentRes = await api<{ name: string; status: string }>(
        `/api/tournaments/${tournamentId}`
      );
      if (tournamentRes.success && tournamentRes.data) {
        setTournament(tournamentRes.data);
      }

      // Load analytics data in parallel
      const [timelineRes, weightRes, speciesRes, perfRes, heatmapRes] = await Promise.all([
        api<TimeSeriesPoint[]>(`/api/analytics/tournament/${tournamentId}/catches-timeline`),
        api<DistributionItem[]>(`/api/analytics/tournament/${tournamentId}/weight-distribution`),
        api<DistributionItem[]>(`/api/analytics/tournament/${tournamentId}/species-distribution`),
        api<ParticipantPerformance[]>(`/api/analytics/tournament/${tournamentId}/participant-performance`),
        api<HeatmapPoint[]>(`/api/analytics/tournament/${tournamentId}/activity-heatmap`),
      ]);

      if (timelineRes.success && timelineRes.data) setTimeline(timelineRes.data);
      if (weightRes.success && weightRes.data) setWeightDist(weightRes.data);
      if (speciesRes.success && speciesRes.data) setSpeciesDist(speciesRes.data);
      if (perfRes.success && perfRes.data) setPerformance(perfRes.data);
      if (heatmapRes.success && heatmapRes.data) setHeatmap(heatmapRes.data);
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError("Errore nel caricamento delle analytics");
    } finally {
      setLoading(false);
    }
  }, [token, tournamentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Errore</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadData}>Riprova</Button>
      </div>
    );
  }

  // Calculate summary stats
  const totalCatches = timeline.reduce((sum, t) => sum + t.value, 0);
  const totalWeight = performance.reduce((sum, p) => sum + p.totalWeight, 0);
  const avgWeight = performance.length > 0
    ? totalWeight / performance.reduce((sum, p) => sum + p.approvedCatches, 0)
    : 0;
  const topPerformer = performance[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/dashboard/tournaments/${tournamentId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna al torneo
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics
          </h1>
          {tournament && (
            <p className="text-muted-foreground">{tournament.name}</p>
          )}
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Fish className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCatches}</p>
                <p className="text-xs text-muted-foreground">Catture Totali</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Scale className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalWeight.toFixed(1)} kg</p>
                <p className="text-xs text-muted-foreground">Peso Totale</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgWeight.toFixed(2)} kg</p>
                <p className="text-xs text-muted-foreground">Media Peso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{performance.length}</p>
                <p className="text-xs text-muted-foreground">Partecipanti Attivi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performer Highlight */}
      {topPerformer && (
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Trophy className="h-10 w-10 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Leader Classifica</p>
                <p className="text-xl font-bold">{topPerformer.name}</p>
                <p className="text-sm text-amber-600">
                  {topPerformer.approvedCatches} catture - {topPerformer.totalWeight.toFixed(1)} kg - {topPerformer.points} punti
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Distribuzione</span>
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Classifica</span>
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Heatmap</span>
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Catture nel Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChartSimple data={timeline} title="Catture per ora" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Distribuzione Peso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PieChartSimple data={weightDist} title="Catture per fascia di peso" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fish className="h-5 w-5" />
                  Distribuzione Specie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PieChartSimple data={speciesDist} title="Catture per specie" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Classifica Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-sm font-medium">#</th>
                      <th className="text-left py-2 px-2 text-sm font-medium">Partecipante</th>
                      <th className="text-center py-2 px-2 text-sm font-medium">Catture</th>
                      <th className="text-center py-2 px-2 text-sm font-medium">Peso Tot.</th>
                      <th className="text-center py-2 px-2 text-sm font-medium">Media</th>
                      <th className="text-center py-2 px-2 text-sm font-medium">Max</th>
                      <th className="text-right py-2 px-2 text-sm font-medium">Punti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((p) => (
                      <tr key={p.userId} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">
                          {p.rank <= 3 ? (
                            <Badge
                              variant={p.rank === 1 ? "default" : "secondary"}
                              className={
                                p.rank === 1
                                  ? "bg-amber-500"
                                  : p.rank === 2
                                  ? "bg-gray-400"
                                  : "bg-amber-700"
                              }
                            >
                              {p.rank}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{p.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-2 font-medium">{p.name}</td>
                        <td className="py-3 px-2 text-center">{p.approvedCatches}</td>
                        <td className="py-3 px-2 text-center">{p.totalWeight.toFixed(1)} kg</td>
                        <td className="py-3 px-2 text-center">{p.averageWeight.toFixed(2)} kg</td>
                        <td className="py-3 px-2 text-center">{p.biggestCatch.toFixed(1)} kg</td>
                        <td className="py-3 px-2 text-right font-bold">{p.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {performance.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Heatmap Attivita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Distribuzione delle catture per giorno della settimana e ora
              </p>
              <HeatmapSimple data={heatmap} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
