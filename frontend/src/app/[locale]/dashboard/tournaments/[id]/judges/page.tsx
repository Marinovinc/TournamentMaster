/**
 * =============================================================================
 * JUDGES MANAGEMENT PAGE
 * =============================================================================
 * Pagina gestione ispettori/giudici di bordo per il torneo
 * Permette di assegnare ispettori alle barche/equipaggi
 * =============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  UserCheck,
  Ship,
  Search,
  Edit,
  Save,
  X,
  Download,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  boatName: string | null;
  boatNumber: string | null;
  inspectorId: string | null;
  inspectorName: string | null;
  inspectorClub: string | null;
  captain: { id: string; firstName: string; lastName: string } | null;
  _count: { members: number };
}

interface Tournament {
  id: string;
  name: string;
  status: string;
}

export default function JudgesManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const locale = (params.locale as string) || "it";
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ inspectorName: "", inspectorClub: "" });
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Download file with auth token
  const downloadWithAuth = async (url: string, filename: string) => {
    if (!token) {
      alert("Devi essere autenticato per scaricare questo file");
      return;
    }
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Errore nel download");
        return;
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert("Errore di rete durante il download");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !tournamentId) return;

      try {
        setLoading(true);

        // Fetch tournament info
        const tournamentRes = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (tournamentRes.ok) {
          const tournamentData = await tournamentRes.json();
          setTournament(tournamentData.data);
        }

        // Fetch teams
        const teamsRes = await fetch(`${API_URL}/api/teams?tournamentId=${tournamentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore nel caricamento");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, tournamentId, API_URL]);

  const handleEditStart = (team: Team) => {
    setEditingTeamId(team.id);
    setEditForm({
      inspectorName: team.inspectorName || "",
      inspectorClub: team.inspectorClub || "",
    });
  };

  const handleEditCancel = () => {
    setEditingTeamId(null);
    setEditForm({ inspectorName: "", inspectorClub: "" });
  };

  const handleEditSave = async (teamId: string) => {
    if (!token) return;

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/teams/${teamId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inspectorName: editForm.inspectorName || null,
          inspectorClub: editForm.inspectorClub || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTeams(teams.map(t => t.id === teamId ? { ...t, ...updated.data } : t));
        setEditingTeamId(null);
      } else {
        const err = await res.json();
        alert(err.message || "Errore nel salvataggio");
      }
    } catch (err) {
      alert("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  const filteredTeams = teams.filter(team => {
    const search = searchTerm.toLowerCase();
    return (
      team.name?.toLowerCase().includes(search) ||
      team.boatName?.toLowerCase().includes(search) ||
      team.inspectorName?.toLowerCase().includes(search)
    );
  });

  const assignedCount = teams.filter(t => t.inspectorName).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/dashboard/tournaments/${tournamentId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna al torneo
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6" />
            Ispettori di Bordo
          </h1>
          <p className="text-muted-foreground">
            {tournament?.name} - Assegna ispettori alle barche
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => downloadWithAuth(
              `${API_URL}/api/reports/export/pdf/judge-assignments/${tournamentId}`,
              `ispettori-${tournamentId}.pdf`
            )}
          >
            <Download className="h-4 w-4 mr-2" />
            Scarica PDF
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{teams.length}</p>
              <p className="text-sm text-muted-foreground">Equipaggi Totali</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{assignedCount}</p>
              <p className="text-sm text-muted-foreground">Con Ispettore</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{teams.length - assignedCount}</p>
              <p className="text-sm text-muted-foreground">Senza Ispettore</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {teams.length > 0 ? Math.round((assignedCount / teams.length) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Copertura</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per equipaggio, barca o ispettore..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Teams List */}
      <Card>
        <CardHeader>
          <CardTitle>Assegnazioni Ispettori</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTeams.length > 0 ? (
            <div className="space-y-3">
              {filteredTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Ship className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{team.name || "Equipaggio"}</p>
                      <p className="text-sm text-muted-foreground">
                        {team.boatName || "Barca non specificata"}
                        {team.boatNumber && ` • #${team.boatNumber}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {editingTeamId === team.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Nome ispettore"
                          value={editForm.inspectorName}
                          onChange={(e) => setEditForm({ ...editForm, inspectorName: e.target.value })}
                          className="w-40"
                        />
                        <Input
                          placeholder="Club"
                          value={editForm.inspectorClub}
                          onChange={(e) => setEditForm({ ...editForm, inspectorClub: e.target.value })}
                          className="w-32"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(team.id)}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleEditCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        {team.inspectorName ? (
                          <div className="text-right">
                            <p className="font-medium text-green-600">{team.inspectorName}</p>
                            {team.inspectorClub && (
                              <p className="text-xs text-muted-foreground">{team.inspectorClub}</p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Non assegnato
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditStart(team)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Ship className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun equipaggio trovato</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
