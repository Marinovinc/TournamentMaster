/**
 * =============================================================================
 * JUDGE DASHBOARD - CATCH VALIDATION
 * =============================================================================
 * Dashboard per giudici e admin per validare le catture
 *
 * Features:
 * - Lista catture pendenti
 * - Filtri per torneo/stato
 * - Approvazione/Rifiuto con note
 * - Preview foto e dati GPS
 * =============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { HelpGuide } from "@/components/HelpGuide";
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Weight,
  Ruler,
  Calendar,
  User,
  Fish,
  AlertTriangle,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Video,
  Image,
  History,
} from "lucide-react";
import { toast } from "sonner";

interface Catch {
  id: string;
  weight: number;
  length?: number;
  latitude: number;
  longitude: number;
  gpsAccuracy?: number;
  photoPath: string;
  videoPath?: string;
  caughtAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isInsideZone: boolean;
  notes?: string;
  reviewNotes?: string;
  points?: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tournament: {
    id: string;
    name: string;
  };
  species?: {
    id: string;
    commonNameIt: string;
  };
}

export default function JudgeDashboardPage() {
  const { token, hasRole } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string || "it";
  const isHistoryMode = searchParams.get("mode") === "history";
  
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(isHistoryMode ? "ALL" : "PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state
  const [selectedCatch, setSelectedCatch] = useState<Catch | null>(null);
  const [dialogMode, setDialogMode] = useState<"view" | "approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Check authorization
  const canValidate = hasRole("SUPER_ADMIN", "TENANT_ADMIN", "ORGANIZER", "JUDGE");

  useEffect(() => {
    fetchCatches();
  }, [token, statusFilter]);

  const fetchCatches = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }
      params.append("limit", "50");

      const res = await fetch(`${API_URL}/api/catches?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        setCatches(data.data || []);
      } else {
        // If API fails, show demo data
        setCatches(getDemoCatches());
      }
    } catch (error) {
      console.error("Failed to fetch catches:", error);
      // Show demo data on error
      setCatches(getDemoCatches());
    } finally {
      setLoading(false);
    }
  };

  // Demo data for when API is not available
  // Photos: foto reali dalla collezione utente in /public/demo/
  const getDemoCatches = (): Catch[] => [
    {
      id: "catch-1",
      weight: 127.5,
      length: 210,
      latitude: 40.72,
      longitude: 13.90,
      gpsAccuracy: 5.0,
      // Aguglia Imperiale - foto reale
      photoPath: "/demo/catch1.jpg",
      caughtAt: new Date().toISOString(),
      status: "PENDING",
      isInsideZone: true,
      user: { id: "u1", firstName: "Giuseppe", lastName: "Marino", email: "g.marino@demo.it" },
      tournament: { id: "t1", name: "Trofeo Ischia Big Game 2024" },
      species: { id: "s1", commonNameIt: "Aguglia Imperiale" },
    },
    {
      id: "catch-2",
      weight: 32.8,
      length: 115,
      latitude: 40.73,
      longitude: 13.88,
      gpsAccuracy: 3.0,
      // Tonno - foto reale
      photoPath: "/demo/catch2.jpg",
      caughtAt: new Date(Date.now() - 3600000).toISOString(),
      status: "PENDING",
      isInsideZone: true,
      user: { id: "u2", firstName: "Marco", lastName: "De Luca", email: "m.deluca@demo.it" },
      tournament: { id: "t1", name: "Trofeo Ischia Big Game 2024" },
      species: { id: "s2", commonNameIt: "Tonno" },
    },
    {
      id: "catch-3",
      weight: 18.5,
      length: 95,
      latitude: 40.71,
      longitude: 13.91,
      gpsAccuracy: 8.0,
      // Totano - foto reale
      photoPath: "/demo/catch3.jpg",
      caughtAt: new Date(Date.now() - 7200000).toISOString(),
      status: "PENDING",
      isInsideZone: false,
      notes: "Cattura ai limiti della zona di gara",
      user: { id: "u3", firstName: "Roberto", lastName: "Colombo", email: "r.colombo@demo.it" },
      tournament: { id: "t2", name: "Coppa Inverno Ischia 2024" },
      species: { id: "s3", commonNameIt: "Totano" },
    },
    {
      id: "catch-4",
      weight: 52.3,
      length: 165,
      latitude: 40.74,
      longitude: 13.89,
      gpsAccuracy: 4.0,
      // Foto reale con video
      photoPath: "/demo/catch4.jpg",
      videoPath: "/demo/catch4_video.mp4",
      caughtAt: new Date(Date.now() - 10800000).toISOString(),
      status: "PENDING",
      isInsideZone: true,
      notes: "Video della cattura allegato",
      user: { id: "u4", firstName: "Antonio", lastName: "Ferrara", email: "a.ferrara@demo.it" },
      tournament: { id: "t1", name: "Trofeo Ischia Big Game 2024" },
      species: { id: "s4", commonNameIt: "Ricciola" },
    },
    {
      id: "catch-5",
      weight: 68.0,
      length: 175,
      latitude: 40.70,
      longitude: 13.92,
      gpsAccuracy: 6.0,
      // Foto reale
      photoPath: "/demo/catch5.jpg",
      caughtAt: new Date(Date.now() - 14400000).toISOString(),
      status: "PENDING",
      isInsideZone: true,
      user: { id: "u5", firstName: "Salvatore", lastName: "Esposito", email: "s.esposito@demo.it" },
      tournament: { id: "t2", name: "Coppa Inverno Ischia 2024" },
      species: { id: "s5", commonNameIt: "Pesce spada" },
    },
  ];

  const handleApprove = async () => {
    if (!selectedCatch) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/catches/${selectedCatch.id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reviewNotes }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cattura approvata con successo!");
        setCatches(prev =>
          prev.map(c =>
            c.id === selectedCatch.id ? { ...c, status: "APPROVED" as const, reviewNotes } : c
          )
        );
        closeDialog();
      } else {
        toast.error(data.message || "Errore durante l'approvazione");
      }
    } catch (error) {
      // Demo mode - simulate success
      toast.success("Cattura approvata! (demo mode)");
      setCatches(prev =>
        prev.map(c =>
          c.id === selectedCatch.id ? { ...c, status: "APPROVED" as const, reviewNotes } : c
        )
      );
      closeDialog();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCatch || !reviewNotes.trim()) {
      toast.error("Inserisci una motivazione per il rifiuto");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/catches/${selectedCatch.id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reviewNotes }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cattura rifiutata");
        setCatches(prev =>
          prev.map(c =>
            c.id === selectedCatch.id ? { ...c, status: "REJECTED" as const, reviewNotes } : c
          )
        );
        closeDialog();
      } else {
        toast.error(data.message || "Errore durante il rifiuto");
      }
    } catch (error) {
      // Demo mode - simulate success
      toast.success("Cattura rifiutata (demo mode)");
      setCatches(prev =>
        prev.map(c =>
          c.id === selectedCatch.id ? { ...c, status: "REJECTED" as const, reviewNotes } : c
        )
      );
      closeDialog();
    } finally {
      setActionLoading(false);
    }
  };

  const openDialog = (catchItem: Catch, mode: "view" | "approve" | "reject") => {
    setSelectedCatch(catchItem);
    setDialogMode(mode);
    setReviewNotes("");
  };

  const closeDialog = () => {
    setSelectedCatch(null);
    setDialogMode(null);
    setReviewNotes("");
    setShowVideo(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />In Attesa</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approvata</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rifiutata</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter catches by search
  const filteredCatches = catches.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.user.firstName.toLowerCase().includes(query) ||
      c.user.lastName.toLowerCase().includes(query) ||
      c.tournament.name.toLowerCase().includes(query) ||
      c.species?.commonNameIt.toLowerCase().includes(query)
    );
  });

  const pendingCount = catches.filter(c => c.status === "PENDING").length;

  if (!canValidate) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Accesso Non Autorizzato</h2>
          <p className="text-muted-foreground">
            Non hai i permessi per accedere a questa sezione.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {isHistoryMode ? (
                <><History className="h-8 w-8 text-blue-500" /> Storico Catture</>
              ) : (
                <>Validazione Catture</>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isHistoryMode 
                ? "Archivio catture validate dei tornei completati"
                : `${pendingCount} catture in attesa di validazione`}
            </p>
          </div>
          <HelpGuide pageKey="judge" position="inline" isAdmin={true} />
        </div>
        <Button onClick={fetchCatches} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per pescatore, torneo, specie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtra per stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tutti gli stati</SelectItem>
                <SelectItem value="PENDING">In Attesa</SelectItem>
                <SelectItem value="APPROVED">Approvate</SelectItem>
                <SelectItem value="REJECTED">Rifiutate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Catches Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCatches.length === 0 ? (
            <div className="text-center p-12">
              <Fish className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessuna cattura trovata</h3>
              <p className="text-muted-foreground">
                Non ci sono catture che corrispondono ai filtri selezionati.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pescatore</TableHead>
                  <TableHead>Torneo</TableHead>
                  <TableHead>Specie</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>GPS</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCatches.map((catchItem) => (
                  <TableRow key={catchItem.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                          {catchItem.user.firstName[0]}{catchItem.user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {catchItem.user.firstName} {catchItem.user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {catchItem.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{catchItem.tournament.name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {catchItem.species?.commonNameIt || "N/A"}
                        </span>
                        {catchItem.videoPath && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                            <Video className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Weight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-semibold">{catchItem.weight} kg</span>
                      </div>
                      {catchItem.length && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Ruler className="h-3 w-3" />
                          {catchItem.length} cm
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {catchItem.isInsideZone ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            In Zona
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Fuori Zona
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(catchItem.caughtAt)}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(catchItem.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(catchItem, "view")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {catchItem.status === "PENDING" && !isHistoryMode && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => openDialog(catchItem, "approve")}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDialog(catchItem, "reject")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View/Action Dialog */}
      <Dialog open={!!dialogMode} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "view" && "Dettagli Cattura"}
              {dialogMode === "approve" && "Approva Cattura"}
              {dialogMode === "reject" && "Rifiuta Cattura"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "view" && "Visualizza tutti i dettagli della cattura"}
              {dialogMode === "approve" && "Conferma l'approvazione di questa cattura"}
              {dialogMode === "reject" && "Specifica il motivo del rifiuto"}
            </DialogDescription>
          </DialogHeader>

          {selectedCatch && (
            <div className="space-y-4">
              {/* Photo/Video Toggle */}
              {selectedCatch.videoPath && (
                <div className="flex gap-2 mb-2">
                  <Button
                    variant={!showVideo ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowVideo(false)}
                  >
                    <Image className="h-4 w-4 mr-1" />
                    Foto
                  </Button>
                  <Button
                    variant={showVideo ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowVideo(true)}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Video
                  </Button>
                </div>
              )}

              {/* Photo or Video */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                {showVideo && selectedCatch.videoPath ? (
                  <video
                    src={selectedCatch.videoPath}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    title="Video cattura"
                  />
                ) : (
                  <>
                    <img
                      src={selectedCatch.photoPath}
                      alt={`Cattura di ${selectedCatch.species?.commonNameIt || "pesce"}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      {selectedCatch.videoPath && (
                        <Badge className="bg-blue-600 text-white cursor-pointer" onClick={() => setShowVideo(true)}>
                          <Video className="h-3 w-3 mr-1" />
                          Video disponibile
                        </Badge>
                      )}
                      <Badge className="bg-black/70 text-white">
                        {selectedCatch.weight} kg
                      </Badge>
                    </div>
                  </>
                )}
              </div>

              {/* Catch Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Pescatore</label>
                  <p className="font-medium">
                    {selectedCatch.user.firstName} {selectedCatch.user.lastName}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Torneo</label>
                  <p className="font-medium">{selectedCatch.tournament.name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Specie</label>
                  <p className="font-medium">{selectedCatch.species?.commonNameIt || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Peso</label>
                  <p className="font-medium text-lg">{selectedCatch.weight} kg</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Lunghezza</label>
                  <p className="font-medium">{selectedCatch.length || "N/A"} cm</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Data/Ora</label>
                  <p className="font-medium">{formatDate(selectedCatch.caughtAt)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Coordinate GPS</label>
                  <p className="font-mono text-sm">
                    {selectedCatch.latitude.toFixed(4)}, {selectedCatch.longitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Precisione: ±{selectedCatch.gpsAccuracy || "N/A"}m
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Zona</label>
                  {selectedCatch.isInsideZone ? (
                    <Badge className="bg-green-100 text-green-700">Dentro la zona autorizzata</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">FUORI dalla zona autorizzata</Badge>
                  )}
                </div>
              </div>

              {/* Notes from fisher */}
              {selectedCatch.notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <label className="text-sm text-muted-foreground">Note del pescatore</label>
                  <p className="mt-1">{selectedCatch.notes}</p>
                </div>
              )}

              {/* Review Notes Input */}
              {(dialogMode === "approve" || dialogMode === "reject") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Note di validazione
                    {dialogMode === "reject" && <span className="text-red-500">*</span>}
                  </label>
                  <Textarea
                    placeholder={
                      dialogMode === "approve"
                        ? "Note opzionali per il pescatore..."
                        : "Specifica il motivo del rifiuto (obbligatorio)..."
                    }
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {dialogMode === "view" ? "Chiudi" : "Annulla"}
            </Button>
            {dialogMode === "approve" && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? "Approvazione..." : "Approva Cattura"}
              </Button>
            )}
            {dialogMode === "reject" && (
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading || !reviewNotes.trim()}
              >
                {actionLoading ? "Rifiuto..." : "Rifiuta Cattura"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
