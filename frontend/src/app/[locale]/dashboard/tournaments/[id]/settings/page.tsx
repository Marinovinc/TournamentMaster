/**
 * =============================================================================
 * TOURNAMENT SETTINGS PAGE
 * =============================================================================
 * Pagina impostazioni avanzate del torneo
 * Gestione stato, azioni pericolose, esportazioni
 * =============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Settings,
  Play,
  Pause,
  CheckCircle,
  Ban,
  Trash2,
  Download,
  AlertTriangle,
  FileText,
  Table,
  Clock,
} from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  tenant: { id: string; name: string };
  _count: { registrations: number; catches: number };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: "Bozza", color: "text-gray-700", bgColor: "bg-gray-100" },
  PUBLISHED: { label: "Pubblicato", color: "text-blue-700", bgColor: "bg-blue-100" },
  REGISTRATION_OPEN: { label: "Iscrizioni Aperte", color: "text-green-700", bgColor: "bg-green-100" },
  REGISTRATION_CLOSED: { label: "Iscrizioni Chiuse", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  ONGOING: { label: "In Corso", color: "text-red-700", bgColor: "bg-red-100" },
  COMPLETED: { label: "Completato", color: "text-purple-700", bgColor: "bg-purple-100" },
  CANCELLED: { label: "Annullato", color: "text-gray-500", bgColor: "bg-gray-200" },
};

export default function TournamentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const locale = (params.locale as string) || "it";
  const tournamentId = params.id as string;

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

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    fetchTournament();
  }, [token, tournamentId]);

  const fetchTournament = async () => {
    if (!token || !tournamentId) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTournament(data.data);
      }
    } catch (err) {
      console.error("Error fetching tournament:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!token || !tournament) return;

    try {
      setUpdating(true);
      const res = await fetch(`${API_URL}/api/tournaments/${tournamentId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchTournament();
      } else {
        const err = await res.json();
        alert(err.message || "Errore nell'aggiornamento dello stato");
      }
    } catch (err) {
      alert("Errore di rete");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    await updateStatus("CANCELLED");
    setCancelDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        router.push(`/${locale}/dashboard/tournaments`);
      } else {
        const err = await res.json();
        alert(err.message || "Errore nell'eliminazione");
      }
    } catch (err) {
      alert("Errore di rete");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Torneo non trovato</p>
      </div>
    );
  }

  const status = statusConfig[tournament.status] || statusConfig.DRAFT;
  const canStart = ["REGISTRATION_CLOSED", "PUBLISHED"].includes(tournament.status);
  const canPause = tournament.status === "ONGOING";
  const canComplete = tournament.status === "ONGOING";
  const canCancel = !["COMPLETED", "CANCELLED"].includes(tournament.status);
  const canDelete = tournament.status === "DRAFT" ||
    (tournament._count.registrations === 0 && tournament._count.catches === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/dashboard/tournaments/${tournamentId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna al torneo
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Impostazioni Torneo
        </h1>
        <p className="text-muted-foreground">{tournament.name}</p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stato Attuale</CardTitle>
          <CardDescription>Gestisci lo stato del torneo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
            <span className="text-sm text-muted-foreground">
              {tournament._count.registrations} iscritti • {tournament._count.catches} catture
            </span>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-3">
            {canStart && (
              <Button onClick={() => updateStatus("ONGOING")} disabled={updating}>
                <Play className="h-4 w-4 mr-2" />
                Avvia Torneo
              </Button>
            )}
            {canPause && (
              <Button variant="outline" onClick={() => updateStatus("REGISTRATION_CLOSED")} disabled={updating}>
                <Pause className="h-4 w-4 mr-2" />
                Sospendi
              </Button>
            )}
            {canComplete && (
              <Button variant="outline" onClick={() => updateStatus("COMPLETED")} disabled={updating}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Concludi Torneo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Esportazioni</CardTitle>
          <CardDescription>Scarica report e dati del torneo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" asChild>
              <a
                href={`${API_URL}/api/reports/public/pdf/leaderboard/${tournamentId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Classifica PDF
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadWithAuth(
                `${API_URL}/api/reports/export/csv/tournament/${tournamentId}`,
                `classifica-${tournamentId}.csv`
              )}
            >
              <Table className="h-4 w-4 mr-2" />
              Classifica CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadWithAuth(
                `${API_URL}/api/reports/export/pdf/judge-assignments/${tournamentId}`,
                `ispettori-${tournamentId}.pdf`
              )}
            >
              <FileText className="h-4 w-4 mr-2" />
              Assegnazioni Ispettori PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zona Pericolosa
          </CardTitle>
          <CardDescription>
            Queste azioni sono irreversibili. Procedi con cautela.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canCancel && (
            <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg">
              <div>
                <p className="font-medium">Annulla Torneo</p>
                <p className="text-sm text-muted-foreground">
                  Il torneo verrà marcato come annullato. Le iscrizioni rimarranno nel sistema.
                </p>
              </div>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setCancelDialogOpen(true)}
              >
                <Ban className="h-4 w-4 mr-2" />
                Annulla
              </Button>
            </div>
          )}

          {canDelete && (
            <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg">
              <div>
                <p className="font-medium">Elimina Torneo</p>
                <p className="text-sm text-muted-foreground">
                  Elimina permanentemente il torneo e tutti i dati associati.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Elimina
              </Button>
            </div>
          )}

          {!canDelete && tournament.status !== "DRAFT" && (
            <p className="text-sm text-muted-foreground">
              Non è possibile eliminare un torneo con iscrizioni o catture registrate.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annullare il torneo?</AlertDialogTitle>
            <AlertDialogDescription>
              Il torneo "{tournament.name}" verrà marcato come annullato.
              Questa azione può essere visibile ai partecipanti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Indietro</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-500 hover:bg-red-600">
              Annulla Torneo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare permanentemente "{tournament.name}".
              Tutti i dati del torneo saranno persi. Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Indietro</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Elimina Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
