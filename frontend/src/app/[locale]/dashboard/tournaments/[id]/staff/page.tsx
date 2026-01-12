/**
 * =============================================================================
 * TOURNAMENT STAFF MANAGEMENT
 * =============================================================================
 * Gestione dello staff del torneo (Giudici di Gara, Direttori, Scorer)
 * Differente dagli Ispettori di Bordo gestiti in /judges
 *
 * Features:
 * - Assegnazione giudici di gara
 * - Assegnazione direttore di gara
 * - Gestione scorer (addetti punteggi)
 * =============================================================================
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Gavel,
  Shield,
  Calculator,
  UserPlus,
  Trash2,
  RefreshCw,
  Crown,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Users,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  role: "DIRECTOR" | "JUDGE" | "JUDGE_ASSISTANT" | "INSPECTOR" | "SCORER";
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar: string | null;
  };
  parentStaff?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
  assistants?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  }[];
}

interface AvailableUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar: string | null;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
}

const roleLabels: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  DIRECTOR: { label: "Direttore di Gara", icon: Crown, color: "bg-purple-100 text-purple-700 border-purple-200" },
  JUDGE: { label: "Giudice di Gara", icon: Gavel, color: "bg-blue-100 text-blue-700 border-blue-200" },
  JUDGE_ASSISTANT: { label: "Assistente Giudice", icon: UserCheck, color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  INSPECTOR: { label: "Ispettore", icon: Shield, color: "bg-green-100 text-green-700 border-green-200" },
  SCORER: { label: "Addetto Punteggi", icon: Calculator, color: "bg-orange-100 text-orange-700 border-orange-200" },
};

export default function TournamentStaffPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const locale = params.locale as string || "it";
  const { token } = useAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("JUDGE");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assistantDialogOpen, setAssistantDialogOpen] = useState(false);
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null);
  const [expandedJudges, setExpandedJudges] = useState<Set<string>>(new Set());

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Fetch tournament info
      const tournamentRes = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tournamentRes.ok) {
        const data = await tournamentRes.json();
        setTournament(data.data || data);
      }

      // Fetch staff
      const staffRes = await fetch(`${API_URL}/api/staff/tournament/${tournamentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaff(data.data?.staff || []);
      }

      // Fetch available users
      const availableRes = await fetch(`${API_URL}/api/staff/tournament/${tournamentId}/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (availableRes.ok) {
        const data = await availableRes.json();
        setAvailableUsers(data.data || []);
      }
    } catch {
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  }, [API_URL, tournamentId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssign = async () => {
    if (!selectedUserId || !selectedRole) {
      toast.error("Seleziona un utente e un ruolo");
      return;
    }

    setAssigning(true);
    try {
      const res = await fetch(`${API_URL}/api/staff/tournament/${tournamentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole,
          notes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${roleLabels[selectedRole].label} assegnato con successo`);
        setDialogOpen(false);
        setSelectedUserId("");
        setNotes("");
        fetchData();
      } else {
        toast.error(data.message || "Errore nell'assegnazione");
      }
    } catch {
      toast.error("Errore nell'assegnazione");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (staffId: string, userName: string) => {
    if (!confirm(`Rimuovere ${userName} dallo staff del torneo?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/staff/${staffId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Membro rimosso dallo staff");
        fetchData();
      } else {
        toast.error(data.message || "Errore nella rimozione");
      }
    } catch {
      toast.error("Errore nella rimozione");
    }
  };

  const toggleJudgeExpanded = (judgeId: string) => {
    setExpandedJudges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(judgeId)) {
        newSet.delete(judgeId);
      } else {
        newSet.add(judgeId);
      }
      return newSet;
    });
  };

  const openAssistantDialog = (judgeId: string) => {
    setSelectedJudgeId(judgeId);
    setSelectedUserId("");
    setNotes("");
    setAssistantDialogOpen(true);
  };

  const handleAssignAssistant = async () => {
    if (!selectedUserId || !selectedJudgeId) {
      toast.error("Seleziona un utente");
      return;
    }

    setAssigning(true);
    try {
      const res = await fetch(`${API_URL}/api/staff/judge/${selectedJudgeId}/assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          notes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Assistente assegnato con successo");
        setAssistantDialogOpen(false);
        setSelectedUserId("");
        setSelectedJudgeId(null);
        setNotes("");
        fetchData();
      } else {
        toast.error(data.message || "Errore nell'assegnazione");
      }
    } catch {
      toast.error("Errore nell'assegnazione");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssistant = async (assistantId: string, assistantName: string) => {
    if (!confirm(`Rimuovere ${assistantName} come assistente?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/staff/assistant/${assistantId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Assistente rimosso");
        fetchData();
      } else {
        toast.error(data.message || "Errore nella rimozione");
      }
    } catch {
      toast.error("Errore nella rimozione");
    }
  };

  // Group staff by role
  const directors = staff.filter((s) => s.role === "DIRECTOR");
  const judges = staff.filter((s) => s.role === "JUDGE");
  const scorers = staff.filter((s) => s.role === "SCORER");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/dashboard/tournaments/${tournamentId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Staff del Torneo</h1>
            <p className="text-muted-foreground">
              {tournament?.name} - Gestione Giudici e Direttori di Gara
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Aggiungi Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assegna Membro Staff</DialogTitle>
              <DialogDescription>
                Seleziona un utente e il ruolo da assegnare per questo torneo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ruolo</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona ruolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIRECTOR">
                      <span className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-purple-600" />
                        Direttore di Gara
                      </span>
                    </SelectItem>
                    <SelectItem value="JUDGE">
                      <span className="flex items-center gap-2">
                        <Gavel className="w-4 h-4 text-blue-600" />
                        Giudice di Gara
                      </span>
                    </SelectItem>
                    <SelectItem value="SCORER">
                      <span className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-orange-600" />
                        Addetto Punteggi
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Utente</label>
                {availableUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Nessun utente disponibile. Tutti gli utenti idonei sono già assegnati.
                  </p>
                ) : (
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona utente" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <span className="flex items-center gap-2">
                            {user.firstName} {user.lastName}
                            <span className="text-xs text-muted-foreground">
                              ({user.email})
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Note (opzionale)</label>
                <Textarea
                  placeholder="Aggiungi note..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button
                onClick={handleAssign}
                disabled={assigning || !selectedUserId}
              >
                {assigning ? "Assegnazione..." : "Assegna"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">
                Staff vs Ispettori di Bordo
              </p>
              <p className="text-blue-700 mt-1">
                Questa sezione gestisce il <strong>personale di gara</strong> (Direttori, Giudici, Scorer)
                che validano le catture e gestiscono il torneo. Per assegnare <strong>Ispettori di Bordo</strong>
                alle barche, usa la sezione{" "}
                <Link
                  href={`/${locale}/dashboard/tournaments/${tournamentId}/judges`}
                  className="underline font-medium"
                >
                  Ispettori
                </Link>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Directors Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-600" />
              <CardTitle>Direttore di Gara</CardTitle>
            </div>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              {directors.length} assegnato
            </Badge>
          </div>
          <CardDescription>
            Il direttore di gara ha la responsabilità generale del torneo e può approvare/rifiutare catture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {directors.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Crown className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Nessun direttore assegnato</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setSelectedRole("DIRECTOR");
                  setDialogOpen(true);
                }}
              >
                Assegna Direttore
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directors.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-xs">
                          {member.user.firstName[0]}{member.user.lastName[0]}
                        </div>
                        {member.user.firstName} {member.user.lastName}
                      </div>
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() =>
                          handleRemove(
                            member.id,
                            `${member.user.firstName} ${member.user.lastName}`
                          )
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Judges Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-blue-600" />
              <CardTitle>Giudici di Gara</CardTitle>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {judges.length} assegnati
            </Badge>
          </div>
          <CardDescription>
            I giudici validano le catture e approvano o rifiutano le dichiarazioni.
            Ogni giudice puo avere uno o piu assistenti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {judges.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Gavel className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Nessun giudice assegnato</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setSelectedRole("JUDGE");
                  setDialogOpen(true);
                }}
              >
                Assegna Giudice
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {judges.map((member) => (
                <div key={member.id} className="border rounded-lg">
                  {/* Judge Row */}
                  <div className="flex items-center justify-between p-4 bg-blue-50/50">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        onClick={() => toggleJudgeExpanded(member.id)}
                      >
                        {expandedJudges.has(member.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                        {member.user.firstName[0]}{member.user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{member.user.firstName} {member.user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-cyan-50 text-cyan-700">
                        <Users className="w-3 h-3 mr-1" />
                        {member.assistants?.length || 0} assistenti
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssistantDialog(member.id)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Aggiungi
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() =>
                          handleRemove(
                            member.id,
                            `${member.user.firstName} ${member.user.lastName}`
                          )
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Assistants Section (Expandable) */}
                  {expandedJudges.has(member.id) && (
                    <div className="p-4 border-t bg-white">
                      {member.assistants && member.assistants.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground mb-3">Assistenti:</p>
                          {member.assistants.map((assistant) => (
                            <div
                              key={assistant.id}
                              className="flex items-center justify-between p-3 bg-cyan-50/50 rounded-md"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-semibold text-xs">
                                  {assistant.user.firstName[0]}{assistant.user.lastName[0]}
                                </div>
                                <span>{assistant.user.firstName} {assistant.user.lastName}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  handleRemoveAssistant(
                                    assistant.id,
                                    `${assistant.user.firstName} ${assistant.user.lastName}`
                                  )
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Nessun assistente assegnato</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => openAssistantDialog(member.id)}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Aggiungi Assistente
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assistant Assignment Dialog */}
      <Dialog open={assistantDialogOpen} onOpenChange={setAssistantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assegna Assistente al Giudice</DialogTitle>
            <DialogDescription>
              Seleziona un utente da assegnare come assistente del giudice selezionato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Utente</label>
              {availableUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Nessun utente disponibile.
                </p>
              ) : (
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona utente" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <span className="flex items-center gap-2">
                          {user.firstName} {user.lastName}
                          <span className="text-xs text-muted-foreground">
                            ({user.email})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (opzionale)</label>
              <Textarea
                placeholder="Aggiungi note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssistantDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleAssignAssistant}
              disabled={assigning || !selectedUserId}
            >
              {assigning ? "Assegnazione..." : "Assegna Assistente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scorers Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-orange-600" />
              <CardTitle>Addetti Punteggi</CardTitle>
            </div>
            <Badge variant="outline" className="bg-orange-50 text-orange-700">
              {scorers.length} assegnati
            </Badge>
          </div>
          <CardDescription>
            Gli addetti punteggi gestiscono la classifica e i calcoli dei punti durante il torneo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scorers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calculator className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Nessun addetto punteggi assegnato</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setSelectedRole("SCORER");
                  setDialogOpen(true);
                }}
              >
                Assegna Scorer
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scorers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-semibold text-xs">
                          {member.user.firstName[0]}{member.user.lastName[0]}
                        </div>
                        {member.user.firstName} {member.user.lastName}
                      </div>
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() =>
                          handleRemove(
                            member.id,
                            `${member.user.firstName} ${member.user.lastName}`
                          )
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-700">{directors.length}</p>
                <p className="text-sm text-purple-600">Direttori</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-700">{judges.length}</p>
                <p className="text-sm text-blue-600">Giudici</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-700">{scorers.length}</p>
                <p className="text-sm text-orange-600">Scorer</p>
              </div>
            </div>
            <div className="text-right">
              {staff.length > 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Staff configurato</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Staff da configurare</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
