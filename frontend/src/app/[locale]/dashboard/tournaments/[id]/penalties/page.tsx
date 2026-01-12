"use client";

/**
 * =============================================================================
 * PENALTIES MANAGEMENT PAGE
 * =============================================================================
 * Gestione penalità torneo - Fase 4: Compliance
 * Include: lista penalità, creazione, appelli, statistiche
 * =============================================================================
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Plus,
  ArrowLeft,
  Shield,
  Users,
  Clock,
  Ban,
  AlertCircle,
  CheckCircle,
  XCircle,
  Scale,
  FileText,
  Filter,
  BarChart3,
  Gavel,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";

// Types
interface PenaltyType {
  type: string;
  label: string;
  description: string;
  defaultPoints: number;
  isTerminal?: boolean;
}

interface Team {
  id: string;
  name: string;
  boatName: string | null;
  boatNumber: number | null;
  clubName: string | null;
}

interface Penalty {
  id: string;
  type: string;
  status: string;
  points: number;
  reason: string;
  evidence: string | null;
  evidencePhotos: string | null;
  issuedAt: string;
  appealedAt: string | null;
  appealReason: string | null;
  appealDecision: string | null;
  appealDecidedAt: string | null;
  team: Team | null;
}

interface PenaltyStats {
  total: number;
  active: number;
  appealed: number;
  upheld: number;
  overturned: number;
  byType: Record<string, number>;
  totalPointsDeducted: number;
  disqualifications: number;
}

interface TeamSummary {
  teamId: string;
  teamName: string;
  boatNumber: number | null;
  totalPoints: number;
  penaltyCount: number;
  isDisqualified: boolean;
}

// Status badge colors
const statusColors: Record<string, string> = {
  ACTIVE: "bg-red-100 text-red-800 border-red-200",
  APPEALED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  UPHELD: "bg-orange-100 text-orange-800 border-orange-200",
  OVERTURNED: "bg-green-100 text-green-800 border-green-200",
  EXPIRED: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Attiva",
  APPEALED: "In Appello",
  UPHELD: "Confermata",
  OVERTURNED: "Annullata",
  EXPIRED: "Scaduta",
};

// Type icons
const typeIcons: Record<string, React.ReactNode> = {
  LATE_ARRIVAL: <Clock className="h-4 w-4" />,
  ZONE_VIOLATION: <AlertTriangle className="h-4 w-4" />,
  EQUIPMENT_VIOLATION: <Shield className="h-4 w-4" />,
  UNSPORTSMANLIKE: <Ban className="h-4 w-4" />,
  CATCH_VIOLATION: <AlertCircle className="h-4 w-4" />,
  SAFETY_VIOLATION: <AlertTriangle className="h-4 w-4" />,
  RULE_VIOLATION: <FileText className="h-4 w-4" />,
  WARNING: <AlertCircle className="h-4 w-4" />,
  DISQUALIFICATION: <XCircle className="h-4 w-4" />,
};

export default function PenaltiesPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  // State
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [penaltyTypes, setPenaltyTypes] = useState<PenaltyType[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<PenaltyStats | null>(null);
  const [teamSummary, setTeamSummary] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const [showDecideDialog, setShowDecideDialog] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    teamId: "",
    type: "",
    points: 0,
    reason: "",
    evidence: "",
  });
  const [appealReason, setAppealReason] = useState("");
  const [appealDecision, setAppealDecision] = useState<"UPHELD" | "OVERTURNED">("UPHELD");
  const [decisionReason, setDecisionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load penalty types
      const typesRes = await api<PenaltyType[]>("/api/penalties/types");
      if (typesRes.success && typesRes.data) {
        setPenaltyTypes(typesRes.data);
      }

      // Load penalties
      const penaltiesRes = await api<Penalty[]>(`/api/penalties/tournament/${tournamentId}`);
      if (penaltiesRes.success && penaltiesRes.data) {
        setPenalties(penaltiesRes.data);
      }

      // Load stats
      const statsRes = await api<PenaltyStats>(`/api/penalties/tournament/${tournamentId}/stats`);
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      // Load team summary
      const summaryRes = await api<TeamSummary[]>(`/api/penalties/tournament/${tournamentId}/summary`);
      if (summaryRes.success && summaryRes.data) {
        setTeamSummary(summaryRes.data);
      }

      // Load teams
      const teamsRes = await api<Team[]>(`/api/tournaments/${tournamentId}/teams`);
      if (teamsRes.success && teamsRes.data) {
        setTeams(teamsRes.data);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter penalties
  const filteredPenalties = penalties.filter((p) => {
    if (filterType !== "all" && p.type !== filterType) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const teamName = p.team?.name?.toLowerCase() || "";
      const reason = p.reason.toLowerCase();
      if (!teamName.includes(search) && !reason.includes(search)) return false;
    }
    return true;
  });

  // Handle type selection (auto-fill points)
  const handleTypeChange = (type: string) => {
    const penaltyType = penaltyTypes.find((t) => t.type === type);
    setFormData({
      ...formData,
      type,
      points: penaltyType?.defaultPoints || 0,
    });
  };

  // Create penalty
  const handleCreatePenalty = async () => {
    try {
      setSubmitting(true);
      const res = await api("/api/penalties", {
        method: "POST",
        body: {
          tournamentId,
          teamId: formData.teamId || undefined,
          type: formData.type,
          points: formData.points,
          reason: formData.reason,
          evidence: formData.evidence || undefined,
        },
      });

      if (res.success) {
        setShowCreateDialog(false);
        setFormData({ teamId: "", type: "", points: 0, reason: "", evidence: "" });
        loadData();
      } else {
        alert(res.message || "Errore nella creazione della penalita");
      }
    } catch (err) {
      console.error("Error creating penalty:", err);
      alert("Errore nella creazione della penalita");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit appeal
  const handleSubmitAppeal = async () => {
    if (!selectedPenalty) return;
    try {
      setSubmitting(true);
      const res = await api(`/api/penalties/${selectedPenalty.id}/appeal`, {
        method: "POST",
        body: { appealReason },
      });

      if (res.success) {
        setShowAppealDialog(false);
        setAppealReason("");
        setSelectedPenalty(null);
        loadData();
      } else {
        alert(res.message || "Errore nell'invio dell'appello");
      }
    } catch (err) {
      console.error("Error submitting appeal:", err);
      alert("Errore nell'invio dell'appello");
    } finally {
      setSubmitting(false);
    }
  };

  // Decide appeal
  const handleDecideAppeal = async () => {
    if (!selectedPenalty) return;
    try {
      setSubmitting(true);
      const res = await api(`/api/penalties/${selectedPenalty.id}/appeal/decide`, {
        method: "POST",
        body: {
          decision: appealDecision,
          decisionReason,
        },
      });

      if (res.success) {
        setShowDecideDialog(false);
        setDecisionReason("");
        setSelectedPenalty(null);
        loadData();
      } else {
        alert(res.message || "Errore nella decisione dell'appello");
      }
    } catch (err) {
      console.error("Error deciding appeal:", err);
      alert("Errore nella decisione dell'appello");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete penalty
  const handleDeletePenalty = async (penaltyId: string) => {
    if (!confirm("Eliminare questa penalita?")) return;
    try {
      const res = await api(`/api/penalties/${penaltyId}`, {
        method: "DELETE",
      });
      if (res.success) {
        loadData();
      } else {
        alert(res.message || "Errore nell'eliminazione della penalita");
      }
    } catch (err) {
      console.error("Error deleting penalty:", err);
      alert("Errore nell'eliminazione della penalita");
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    return penaltyTypes.find((t) => t.type === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/it/dashboard/tournaments/${tournamentId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna al torneo
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gavel className="h-6 w-6 text-red-600" />
              Gestione Penalita
            </h1>
            <p className="text-gray-500">Sistema penalita e appelli</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Penalita
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">Totale</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{stats.active}</div>
              <div className="text-sm text-gray-500">Attive</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.appealed}</div>
              <div className="text-sm text-gray-500">In Appello</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">{stats.upheld}</div>
              <div className="text-sm text-gray-500">Confermate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.overturned}</div>
              <div className="text-sm text-gray-500">Annullate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-600">{stats.totalPointsDeducted}</div>
              <div className="text-sm text-gray-500">Punti Totali</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Lista Penalita
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Riepilogo Team
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistiche
          </TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label>Cerca</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Team o motivazione..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Label>Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti i tipi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i tipi</SelectItem>
                      {penaltyTypes.map((type) => (
                        <SelectItem key={type.type} value={type.type}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Label>Stato</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti gli stati" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli stati</SelectItem>
                      <SelectItem value="ACTIVE">Attiva</SelectItem>
                      <SelectItem value="APPEALED">In Appello</SelectItem>
                      <SelectItem value="UPHELD">Confermata</SelectItem>
                      <SelectItem value="OVERTURNED">Annullata</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Penalties Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Motivazione</TableHead>
                    <TableHead className="text-center">Punti</TableHead>
                    <TableHead className="text-center">Stato</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPenalties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nessuna penalita trovata
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPenalties.map((penalty) => (
                      <TableRow key={penalty.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {typeIcons[penalty.type]}
                            <span className="font-medium">{getTypeLabel(penalty.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {penalty.team ? (
                            <div>
                              <div className="font-medium">{penalty.team.name}</div>
                              {penalty.team.boatNumber && (
                                <div className="text-xs text-gray-500">
                                  Barca #{penalty.team.boatNumber}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate" title={penalty.reason}>
                            {penalty.reason}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${penalty.points > 0 ? "text-red-600" : ""}`}>
                            {penalty.points > 0 ? `-${penalty.points}` : penalty.points}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={statusColors[penalty.status]}>
                            {statusLabels[penalty.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(penalty.issuedAt).toLocaleDateString("it-IT")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {penalty.status === "ACTIVE" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPenalty(penalty);
                                    setShowAppealDialog(true);
                                  }}
                                >
                                  <Scale className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => handleDeletePenalty(penalty.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {penalty.status === "APPEALED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPenalty(penalty);
                                  setShowDecideDialog(true);
                                }}
                              >
                                <Gavel className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Riepilogo Penalita per Team</CardTitle>
            </CardHeader>
            <CardContent>
              {teamSummary.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nessun team con penalita
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">N. Barca</TableHead>
                      <TableHead className="text-center">Penalita</TableHead>
                      <TableHead className="text-center">Punti Totali</TableHead>
                      <TableHead className="text-center">Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamSummary.map((team) => (
                      <TableRow key={team.teamId}>
                        <TableCell className="font-medium">{team.teamName}</TableCell>
                        <TableCell className="text-center">
                          {team.boatNumber || "-"}
                        </TableCell>
                        <TableCell className="text-center">{team.penaltyCount}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-red-600">-{team.totalPoints}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {team.isDisqualified ? (
                            <Badge className="bg-red-600 text-white">SQUALIFICATO</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">Regolare</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuzione per Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && Object.keys(stats.byType).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {typeIcons[type]}
                          <span>{getTypeLabel(type)}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Nessun dato disponibile</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Riepilogo Generale</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span>Penalita Totali</span>
                      <span className="font-bold text-xl">{stats.total}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span>Punti Totali Dedotti</span>
                      <span className="font-bold text-xl text-red-600">
                        -{stats.totalPointsDeducted}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span>Appelli in Corso</span>
                      <span className="font-bold text-xl text-yellow-600">{stats.appealed}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span>Squalifiche</span>
                      <span className="font-bold text-xl text-purple-600">
                        {stats.disqualifications}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Penalty Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuova Penalita</DialogTitle>
            <DialogDescription>
              Assegna una penalita a un team o partecipante
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Team (opzionale)</Label>
              <Select value={formData.teamId} onValueChange={(v) => setFormData({ ...formData, teamId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessun team specifico</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} {team.boatNumber ? `(#${team.boatNumber})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo Penalita *</Label>
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {penaltyTypes.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      <div className="flex items-center gap-2">
                        {typeIcons[type.type]}
                        <span>{type.label}</span>
                        <span className="text-gray-400 text-xs">({type.defaultPoints} pt)</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.type && (
                <p className="text-xs text-gray-500 mt-1">
                  {penaltyTypes.find((t) => t.type === formData.type)?.description}
                </p>
              )}
            </div>
            <div>
              <Label>Punti da Sottrarre</Label>
              <Input
                type="number"
                min="0"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Motivazione *</Label>
              <Textarea
                placeholder="Descrivi la motivazione della penalita..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Prove/Evidence (opzionale)</Label>
              <Textarea
                placeholder="Note aggiuntive, riferimenti a foto/video..."
                value={formData.evidence}
                onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleCreatePenalty}
              disabled={!formData.type || !formData.reason || submitting}
            >
              {submitting ? "Salvataggio..." : "Crea Penalita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appeal Dialog */}
      <Dialog open={showAppealDialog} onOpenChange={setShowAppealDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Presenta Appello</DialogTitle>
            <DialogDescription>
              {selectedPenalty && (
                <span>
                  Appello contro: {getTypeLabel(selectedPenalty.type)} -{" "}
                  {selectedPenalty.team?.name || "Team"}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Motivazione Appello *</Label>
            <Textarea
              placeholder="Descrivi le ragioni dell'appello..."
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppealDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleSubmitAppeal} disabled={!appealReason || submitting}>
              {submitting ? "Invio..." : "Invia Appello"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decide Appeal Dialog */}
      <Dialog open={showDecideDialog} onOpenChange={setShowDecideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decidi Appello</DialogTitle>
            <DialogDescription>
              {selectedPenalty && (
                <div className="space-y-2 mt-2">
                  <div>
                    <strong>Penalita:</strong> {getTypeLabel(selectedPenalty.type)}
                  </div>
                  <div>
                    <strong>Team:</strong> {selectedPenalty.team?.name || "-"}
                  </div>
                  <div>
                    <strong>Motivazione Appello:</strong> {selectedPenalty.appealReason}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Decisione *</Label>
              <Select
                value={appealDecision}
                onValueChange={(v) => setAppealDecision(v as "UPHELD" | "OVERTURNED")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPHELD">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-orange-600" />
                      Confermata (Appello Respinto)
                    </div>
                  </SelectItem>
                  <SelectItem value="OVERTURNED">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-green-600" />
                      Annullata (Appello Accolto)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motivazione Decisione *</Label>
              <Textarea
                placeholder="Descrivi le ragioni della decisione..."
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecideDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleDecideAppeal} disabled={!decisionReason || submitting}>
              {submitting ? "Salvataggio..." : "Conferma Decisione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
