"use client";

/**
 * =============================================================================
 * ARCHIVE & HALL OF FAME PAGE
 * =============================================================================
 * Pagina archivio storico, hall of fame, record e statistiche
 * =============================================================================
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Medal,
  Award,
  Calendar,
  Users,
  Fish,
  Scale,
  Target,
  Crown,
  Star,
  ChevronLeft,
  ChevronRight,
  History,
  TrendingUp,
  MapPin,
} from "lucide-react";

interface HallOfFameEntry {
  tournamentId: string;
  tournamentName: string;
  tournamentDate: string;
  discipline: string;
  category: string;
  position: number;
  userId: string;
  userName: string;
  userAvatar: string | null;
  teamName: string | null;
  value: number | null;
  valueLabel: string;
}

interface RecordEntry {
  record: number;
  unit: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  tournament?: {
    id: string;
    name: string;
    date?: string;
  };
}

interface Records {
  biggestCatch: RecordEntry | null;
  mostCatches: RecordEntry | null;
  mostPoints: RecordEntry | null;
  mostWins: {
    userId: string;
    name: string;
    avatar: string | null;
    wins: number;
  } | null;
}

interface TournamentArchive {
  id: string;
  name: string;
  description: string | null;
  discipline: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  _count: {
    registrations: number;
    catches: number;
  };
  winner: {
    userId: string;
    userName: string;
    userAvatar: string | null;
    teamName: string | null;
    totalPoints: number;
  } | null;
}

interface MyStats {
  totalTournaments: number;
  totalCatches: number;
  totalWeight: number;
  averagePosition: number | null;
  bestPosition: number | null;
  wins: number;
  podiums: number;
  biggestCatch: number | null;
  favoriteBoat: string | null;
  favoriteDiscipline: string | null;
}

interface MyHistory {
  tournamentId: string;
  tournamentName: string;
  date: string;
  discipline: string;
  status: string;
  position: number | null;
  points: number;
  catches: number;
  totalWeight: number;
  biggestCatch: number | null;
  teamName: string | null;
}

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  GENERAL: { label: "Classifica Generale", icon: Trophy, color: "bg-yellow-500" },
  BIGGEST_CATCH: { label: "Cattura Maggiore", icon: Scale, color: "bg-blue-500" },
  MOST_CATCHES: { label: "Piu Catture", icon: Fish, color: "bg-green-500" },
};

const positionConfig: Record<number, { label: string; color: string; bgColor: string }> = {
  1: { label: "1°", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  2: { label: "2°", color: "text-gray-500", bgColor: "bg-gray-100" },
  3: { label: "3°", color: "text-amber-700", bgColor: "bg-amber-100" },
};

export default function ArchivePage() {
  const params = useParams();
  const locale = params?.locale as string || "it";

  const [activeTab, setActiveTab] = useState("hall-of-fame");
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([]);
  const [records, setRecords] = useState<Records | null>(null);
  const [archive, setArchive] = useState<TournamentArchive[]>([]);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [myHistory, setMyHistory] = useState<MyHistory[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Fetch available years
  useEffect(() => {
    async function fetchYears() {
      const res = await api<number[]>("/api/archive/years");
      if (res.success && res.data) {
        setYears(res.data);
      }
    }
    fetchYears();
  }, []);

  // Fetch Hall of Fame
  const fetchHallOfFame = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedYear !== "all") params.append("year", selectedYear);
    if (selectedDiscipline !== "all") params.append("discipline", selectedDiscipline);
    params.append("limit", "50");

    const res = await api<HallOfFameEntry[]>(`/api/archive/hall-of-fame?${params}`);
    if (res.success && res.data) {
      setHallOfFame(res.data);
    }
    setLoading(false);
  }, [selectedYear, selectedDiscipline]);

  // Fetch Records
  const fetchRecords = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedDiscipline !== "all") params.append("discipline", selectedDiscipline);

    const res = await api<Records>(`/api/archive/records?${params}`);
    if (res.success && res.data) {
      setRecords(res.data);
    }
  }, [selectedDiscipline]);

  // Fetch Tournament Archive
  const fetchArchive = useCallback(async (page: number = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedYear !== "all") params.append("year", selectedYear);
    if (selectedDiscipline !== "all") params.append("discipline", selectedDiscipline);
    params.append("page", page.toString());
    params.append("limit", "12");

    const res = await api<{ tournaments: TournamentArchive[]; pagination: { page: number; totalPages: number } }>(
      `/api/archive/tournaments?${params}`
    );
    if (res.success && res.data) {
      setArchive(res.data.tournaments);
      setPagination({ page: res.data.pagination.page, totalPages: res.data.pagination.totalPages });
    }
    setLoading(false);
  }, [selectedYear, selectedDiscipline]);

  // Fetch My Stats & History
  const fetchMyData = useCallback(async () => {
    setLoading(true);
    const [statsRes, historyRes] = await Promise.all([
      api<MyStats>("/api/archive/my-stats"),
      api<MyHistory[]>("/api/archive/my-history"),
    ]);

    if (statsRes.success && statsRes.data) {
      setMyStats(statsRes.data);
    }
    if (historyRes.success && historyRes.data) {
      setMyHistory(historyRes.data);
    }
    setLoading(false);
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "hall-of-fame") {
      fetchHallOfFame();
    } else if (activeTab === "records") {
      fetchRecords();
    } else if (activeTab === "archive") {
      fetchArchive(1);
    } else if (activeTab === "my-stats") {
      fetchMyData();
    }
  }, [activeTab, selectedYear, selectedDiscipline, fetchHallOfFame, fetchRecords, fetchArchive, fetchMyData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Archivio Storico
          </h1>
          <p className="text-muted-foreground">Hall of Fame, Record e Statistiche</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Anno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli anni</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte</SelectItem>
              <SelectItem value="SPINNING">Spinning</SelectItem>
              <SelectItem value="BOLOGNESE">Bolognese</SelectItem>
              <SelectItem value="SURFCASTING">Surfcasting</SelectItem>
              <SelectItem value="TRAINA">Traina</SelectItem>
              <SelectItem value="BIG_GAME">Big Game</SelectItem>
              <SelectItem value="DRIFTING">Drifting</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hall-of-fame" className="gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Hall of Fame</span>
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-2">
            <Medal className="h-4 w-4" />
            <span className="hidden sm:inline">Record</span>
          </TabsTrigger>
          <TabsTrigger value="archive" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Archivio</span>
          </TabsTrigger>
          <TabsTrigger value="my-stats" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Le Mie Stats</span>
          </TabsTrigger>
        </TabsList>

        {/* Hall of Fame Tab */}
        <TabsContent value="hall-of-fame" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : hallOfFame.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Nessun dato</h3>
                <p className="text-muted-foreground">Non ci sono tornei completati</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {hallOfFame.map((entry, index) => {
                const category = categoryConfig[entry.category] || categoryConfig.GENERAL;
                const position = positionConfig[entry.position];
                const CategoryIcon = category.icon;

                return (
                  <Card key={`${entry.tournamentId}-${entry.category}-${entry.position}-${index}`} className="overflow-hidden">
                    <div className={`h-2 ${category.color}`} />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {category.label}
                        </Badge>
                        {position && (
                          <div className={`px-2 py-1 rounded-full ${position.bgColor} ${position.color} text-sm font-bold`}>
                            {position.label}
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-lg">{entry.tournamentName}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.tournamentDate)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={entry.userAvatar || undefined} />
                          <AvatarFallback>
                            {entry.userName.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{entry.userName}</p>
                          {entry.teamName && (
                            <p className="text-sm text-muted-foreground">{entry.teamName}</p>
                          )}
                          <p className="text-sm font-medium text-primary">{entry.valueLabel}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records" className="space-y-4">
          {!records ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Biggest Catch */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-blue-500" />
                    Cattura Piu Grande
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {records.biggestCatch ? (
                    <div className="space-y-3">
                      <div className="text-4xl font-bold text-blue-600">
                        {records.biggestCatch.record} {records.biggestCatch.unit}
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={records.biggestCatch.user.avatar || undefined} />
                          <AvatarFallback>{records.biggestCatch.user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{records.biggestCatch.user.name}</p>
                          {records.biggestCatch.tournament && (
                            <p className="text-sm text-muted-foreground">{records.biggestCatch.tournament.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nessun record</p>
                  )}
                </CardContent>
              </Card>

              {/* Most Catches */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fish className="h-5 w-5 text-green-500" />
                    Piu Catture in un Torneo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {records.mostCatches ? (
                    <div className="space-y-3">
                      <div className="text-4xl font-bold text-green-600">
                        {records.mostCatches.record} {records.mostCatches.unit}
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={records.mostCatches.user.avatar || undefined} />
                          <AvatarFallback>{records.mostCatches.user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{records.mostCatches.user.name}</p>
                          {records.mostCatches.tournament && (
                            <p className="text-sm text-muted-foreground">{records.mostCatches.tournament.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nessun record</p>
                  )}
                </CardContent>
              </Card>

              {/* Most Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Piu Punti in un Torneo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {records.mostPoints ? (
                    <div className="space-y-3">
                      <div className="text-4xl font-bold text-purple-600">
                        {records.mostPoints.record} {records.mostPoints.unit}
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={records.mostPoints.user.avatar || undefined} />
                          <AvatarFallback>{records.mostPoints.user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{records.mostPoints.user.name}</p>
                          {records.mostPoints.tournament && (
                            <p className="text-sm text-muted-foreground">{records.mostPoints.tournament.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nessun record</p>
                  )}
                </CardContent>
              </Card>

              {/* Most Wins */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    Piu Vittorie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {records.mostWins ? (
                    <div className="space-y-3">
                      <div className="text-4xl font-bold text-yellow-600">
                        {records.mostWins.wins} vittorie
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={records.mostWins.avatar || undefined} />
                          <AvatarFallback>{records.mostWins.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{records.mostWins.name}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nessun record</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : archive.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Nessun torneo</h3>
                <p className="text-muted-foreground">Non ci sono tornei completati</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {archive.map((tournament) => (
                  <Card key={tournament.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant="outline">{tournament.discipline}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(tournament.startDate)}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{tournament.name}</CardTitle>
                      {tournament.location && (
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {tournament.location}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{tournament._count.registrations} partecipanti</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Fish className="h-4 w-4 text-muted-foreground" />
                          <span>{tournament._count.catches} catture</span>
                        </div>
                      </div>

                      {tournament.winner && (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-yellow-500" />
                            Vincitore
                          </p>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={tournament.winner.userAvatar || undefined} />
                              <AvatarFallback>
                                {tournament.winner.userName.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{tournament.winner.userName}</p>
                              <p className="text-xs text-muted-foreground">
                                {tournament.winner.totalPoints} punti
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchArchive(pagination.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Pagina {pagination.page} di {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchArchive(pagination.page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* My Stats Tab */}
        <TabsContent value="my-stats" className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-48" />
              <Skeleton className="h-96" />
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              {myStats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Award className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tornei</p>
                          <p className="text-2xl font-bold">{myStats.totalTournaments}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <Trophy className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Vittorie</p>
                          <p className="text-2xl font-bold">{myStats.wins}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Fish className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Catture Totali</p>
                          <p className="text-2xl font-bold">{myStats.totalCatches}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Medal className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Podi</p>
                          <p className="text-2xl font-bold">{myStats.podiums}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Additional Stats */}
              {myStats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Statistiche Dettagliate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Peso Totale</p>
                        <p className="text-xl font-semibold">{myStats.totalWeight.toFixed(2)} kg</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Cattura Piu Grande</p>
                        <p className="text-xl font-semibold">
                          {myStats.biggestCatch ? `${myStats.biggestCatch} kg` : "-"}
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Miglior Posizione</p>
                        <p className="text-xl font-semibold">
                          {myStats.bestPosition ? `${myStats.bestPosition}°` : "-"}
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Posizione Media</p>
                        <p className="text-xl font-semibold">
                          {myStats.averagePosition ? `${myStats.averagePosition}°` : "-"}
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Disciplina Preferita</p>
                        <p className="text-xl font-semibold">{myStats.favoriteDiscipline || "-"}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Barca Preferita</p>
                        <p className="text-xl font-semibold">{myStats.favoriteBoat || "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tournament History */}
              <Card>
                <CardHeader>
                  <CardTitle>Storico Tornei</CardTitle>
                  <CardDescription>I tuoi tornei in ordine cronologico</CardDescription>
                </CardHeader>
                <CardContent>
                  {myHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Non hai ancora partecipato a nessun torneo
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myHistory.map((entry) => (
                        <div
                          key={entry.tournamentId}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-[60px]">
                              {entry.status === "COMPLETED" && entry.position ? (
                                <div className={`text-2xl font-bold ${
                                  entry.position === 1 ? "text-yellow-500" :
                                  entry.position === 2 ? "text-gray-400" :
                                  entry.position === 3 ? "text-amber-600" :
                                  "text-muted-foreground"
                                }`}>
                                  {entry.position}°
                                </div>
                              ) : (
                                <Badge variant={entry.status === "IN_PROGRESS" ? "default" : "secondary"}>
                                  {entry.status === "IN_PROGRESS" ? "In Corso" : "In Attesa"}
                                </Badge>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">{entry.tournamentName}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(entry.date)} - {entry.discipline}
                              </p>
                              {entry.teamName && (
                                <p className="text-sm text-muted-foreground">Team: {entry.teamName}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{entry.points} pt</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.catches} catture - {entry.totalWeight.toFixed(2)} kg
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
