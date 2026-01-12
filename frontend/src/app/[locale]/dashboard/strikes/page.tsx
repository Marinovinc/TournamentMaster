/**
 * =============================================================================
 * STRIKES LIVE PAGE
 * =============================================================================
 * Monitoraggio strike in tempo reale durante le gare
 * =============================================================================
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParams, useSearchParams } from "next/navigation";
import {
  Zap,
  Plus,
  RefreshCw,
  Clock,
  Ship,
  Target,
  Trophy,
  Fish,
  XCircle,
  CheckCircle,
  Waves,
  History,
  BarChart3,
} from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";
import { BackButton } from "@/components/BackButton";

// Types
interface Strike {
  id: string;
  tournamentId: string;
  teamId: string;
  rodCount: number;
  strikeAt: string;
  result?: "CATCH" | "LOST" | "RELEASED" | null;
  latitude?: number;
  longitude?: number;
  notes?: string;
  reportedById: string;
  team?: {
    id: string;
    name: string;
    boatName: string;
    boatNumber?: number;
  };
  tournament?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  boatName: string;
  boatNumber?: number;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
}

interface TeamStats {
  teamId: string;
  _count: { id: number };
  _sum: { rodCount: number };
}

export default function StrikesPage() {
  const { user, token, isAdmin } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string || "it";
  const isHistoryMode = searchParams.get("mode") === "history";

  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(!isHistoryMode);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedStrike, setSelectedStrike] = useState<Strike | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    tournamentId: "",
    teamId: "",
    rodCount: "1",
    notes: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch tournaments
  useEffect(() => {
    const fetchTournaments = async () => {
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/tournaments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          // Filter tournaments based on mode
          const filtered = (data.data || []).filter((t: Tournament) => {
            if (isHistoryMode) {
              // History mode: show COMPLETED tournaments
              return t.status === "COMPLETED";
            } else {
              // Live mode: show ONGOING/ACTIVE tournaments
              return t.status === "ONGOING" || t.status === "ACTIVE";
            }
          });
          setTournaments(filtered);
          if (filtered.length > 0 && !selectedTournament) {
            setSelectedTournament(filtered[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      }
    };

    fetchTournaments();
  }, [token, API_URL]);

  // Fetch strikes and teams when tournament changes
  const fetchStrikesData = useCallback(async () => {
    if (!token || !selectedTournament) {
      setLoading(false);
      return;
    }

    try {
      // Fetch live strikes
      const strikesRes = await fetch(
        `${API_URL}/api/strikes/tournament/${selectedTournament}/live`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (strikesRes.ok) {
        const strikesData = await strikesRes.json();
        setStrikes(strikesData.data?.strikes || []);
        setTeamStats(strikesData.data?.teamStats || []);
      }

      // Fetch teams for this tournament
      const teamsRes = await fetch(
        `${API_URL}/api/teams/tournament/${selectedTournament}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData.data || []);
      }
    } catch (error) {
      console.error("Error fetching strikes:", error);
    } finally {
      setLoading(false);
    }
  }, [token, selectedTournament, API_URL]);

  useEffect(() => {
    fetchStrikesData();
  }, [fetchStrikesData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !selectedTournament) return;

    const interval = setInterval(() => {
      fetchStrikesData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedTournament, fetchStrikesData]);

  // Handle create strike
  const handleCreateStrike = async () => {
    if (!formData.tournamentId || !formData.teamId) {
      alert("Seleziona torneo e team");
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/strikes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tournamentId: formData.tournamentId,
          teamId: formData.teamId,
          rodCount: parseInt(formData.rodCount) || 1,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setStrikes([data.data, ...strikes]);
        setCreateDialogOpen(false);
        resetForm();
        // Refresh to get updated stats
        fetchStrikesData();
      } else {
        alert(`Errore: ${data.message || "Registrazione strike fallita"}`);
      }
    } catch (error) {
      console.error("Error creating strike:", error);
      alert("Errore di rete");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update strike result
  const handleUpdateResult = async (result: "CATCH" | "LOST" | "RELEASED") => {
    if (!selectedStrike) return;

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/strikes/${selectedStrike.id}/result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ result }),
      });

      const data = await response.json();
      if (response.ok) {
        setStrikes(strikes.map((s) =>
          s.id === selectedStrike.id ? { ...s, result } : s
        ));
        setResultDialogOpen(false);
        setSelectedStrike(null);
      } else {
        alert(`Errore: ${data.message || "Aggiornamento fallito"}`);
      }
    } catch (error) {
      console.error("Error updating result:", error);
    } finally {
      setFormLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      tournamentId: selectedTournament,
      teamId: "",
      rodCount: "1",
      notes: "",
    });
  };

  // Format time
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get result badge
  const getResultBadge = (result?: string | null) => {
    if (!result) {
      return <Badge variant="outline" className="text-yellow-600">In Corso</Badge>;
    }
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; icon: React.ReactNode }> = {
      CATCH: { variant: "default", icon: <Fish className="h-3 w-3" /> },
      LOST: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
      RELEASED: { variant: "secondary", icon: <Waves className="h-3 w-3" /> },
    };
    const labels: Record<string, string> = {
      CATCH: "Cattura",
      LOST: "Perso",
      RELEASED: "Rilasciato",
    };
    const { variant, icon } = variants[result] || variants.LOST;
    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {labels[result] || result}
      </Badge>
    );
  };

  // Get team stats by teamId
  const getTeamStats = (teamId: string) => {
    const stats = teamStats.find((s) => s.teamId === teamId);
    return {
      strikes: stats?._count?.id || 0,
      rods: stats?._sum?.rodCount || 0,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get tournamentId from URL if present for fallback navigation
  const urlTournamentId = searchParams.get("tournamentId");

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton
        label="Torna indietro"
        fallbackHref={urlTournamentId
          ? `/${locale}/dashboard/tournaments/${urlTournamentId}`
          : `/${locale}/dashboard/tournaments`
        }
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {isHistoryMode ? (
                <><History className="h-8 w-8 text-blue-500" /> Storico Strike</>
              ) : (
                <><Zap className="h-8 w-8 text-yellow-500" /> Strike Live</>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isHistoryMode 
                ? "Statistiche e storico abboccate dei tornei completati"
                : "Monitoraggio abboccate in tempo reale"}
            </p>
          </div>
          <HelpGuide pageKey="strikes" position="inline" isAdmin={true} />
        </div>
        <div className="flex items-center gap-2">
          {!isHistoryMode && (
            <>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
                {autoRefresh ? "Auto ON" : "Auto OFF"}
              </Button>
              <Button onClick={() => {
                setFormData({ ...formData, tournamentId: selectedTournament });
                setCreateDialogOpen(true);
              }} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuovo Strike
              </Button>
            </>
          )}
          {isHistoryMode && (
            <Button variant="outline" onClick={fetchStrikesData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna
            </Button>
          )}
        </div>
      </div>

      {/* Tournament Selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{isHistoryMode ? "Torneo Completato" : "Torneo Attivo"}</CardTitle>
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Seleziona torneo" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.length === 0 ? (
                  <SelectItem value="none" disabled>{isHistoryMode ? "Nessun torneo completato" : "Nessun torneo attivo"}</SelectItem>
                ) : (
                  tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      {teams.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {teams.slice(0, 6).map((team) => {
            const stats = getTeamStats(team.id);
            return (
              <Card key={team.id} className="bg-gradient-to-br from-card to-muted/30">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      #{team.boatNumber || "-"}
                    </Badge>
                    <Zap className="h-4 w-4 text-yellow-500" />
                  </div>
                  <p className="font-medium text-sm truncate">{team.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{team.boatName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{stats.strikes}</span>
                    <span className="text-xs text-muted-foreground">{stats.rods} canne</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Strikes Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isHistoryMode ? "Storico Strike" : "Strike Recenti"}</CardTitle>
          <CardDescription>
            {isHistoryMode 
              ? "Tutti gli strike del torneo selezionato"
              : `Ultimi 50 strike registrati - Aggiornamento ${autoRefresh ? "automatico" : "manuale"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ora</TableHead>
                  <TableHead>Team / Barca</TableHead>
                  <TableHead>Canne</TableHead>
                  <TableHead>Risultato</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strikes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Zap className="h-8 w-8" />
                        <p>Nessuno strike registrato</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData({ ...formData, tournamentId: selectedTournament });
                            setCreateDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Registra primo strike
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  strikes.map((strike) => (
                    <TableRow key={strike.id} className={!strike.result ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono">{formatTime(strike.strikeAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{strike.team?.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Ship className="h-3 w-3" />
                            {strike.team?.boatName}
                            {strike.team?.boatNumber && ` (#${strike.team.boatNumber})`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {strike.rodCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getResultBadge(strike.result)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {strike.notes || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {!strike.result && !isHistoryMode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStrike(strike);
                              setResultDialogOpen(true);
                            }}
                          >
                            <Target className="h-4 w-4 mr-1" />
                            Esito
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Strike Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Registra Strike
            </DialogTitle>
            <DialogDescription>
              Registra una nuova abboccata con timestamp automatico
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="teamId">Team *</Label>
              <Select
                value={formData.teamId}
                onValueChange={(value) => setFormData({ ...formData, teamId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      #{t.boatNumber || "-"} - {t.name} ({t.boatName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rodCount">Numero Canne</Label>
              <Select
                value={formData.rodCount}
                onValueChange={(value) => setFormData({ ...formData, rodCount: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Es. Strike doppio, esca viva..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleCreateStrike}
              disabled={formLoading || !formData.teamId}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {formLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Registra Strike
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Esito Strike</DialogTitle>
            <DialogDescription>
              Seleziona l&apos;esito dello strike per {selectedStrike?.team?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 py-4">
            <Button
              variant="default"
              className="flex flex-col h-20 bg-green-600 hover:bg-green-700"
              onClick={() => handleUpdateResult("CATCH")}
              disabled={formLoading}
            >
              <Fish className="h-6 w-6 mb-1" />
              Cattura
            </Button>
            <Button
              variant="destructive"
              className="flex flex-col h-20"
              onClick={() => handleUpdateResult("LOST")}
              disabled={formLoading}
            >
              <XCircle className="h-6 w-6 mb-1" />
              Perso
            </Button>
            <Button
              variant="secondary"
              className="flex flex-col h-20"
              onClick={() => handleUpdateResult("RELEASED")}
              disabled={formLoading}
            >
              <Waves className="h-6 w-6 mb-1" />
              Rilasciato
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultDialogOpen(false)}>
              Annulla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
