"use client";

/**
 * =============================================================================
 * CATCHES PAGE - Tournament Catches Management
 * =============================================================================
 * Pagina per visualizzare e gestire tutte le catture di un torneo
 *
 * Features:
 * - Lista catture con filtri (status, data, utente)
 * - Multi-media gallery per ogni cattura
 * - Approvazione/rifiuto catture
 * - Statistiche catture
 * =============================================================================
 */

import { useEffect, useState, useCallback } from "react";
import { getMediaUrl } from "@/lib/media";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Fish,
  Scale,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Play,
  Image as ImageIcon,
  MapPin,
  User,
  Calendar,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
interface CatchMedia {
  id: string;
  type: "PHOTO" | "VIDEO";
  path: string;
  filename: string;
  thumbnailPath?: string;
  isPrimary: boolean;
  caption?: string;
  displayOrder: number;
}

interface Catch {
  id: string;
  weight: number;
  length?: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  points?: number;
  photoPath?: string;
  videoPath?: string;
  latitude: number;
  longitude: number;
  caughtAt: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  notes?: string;
  isInsideZone: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  species?: {
    id: string;
    commonNameIt: string;
    commonNameEn: string;
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  media: CatchMedia[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function CatchesPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const locale = params.locale as string;

  // State
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [catches, setCatches] = useState<Catch[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal state
  const [selectedCatch, setSelectedCatch] = useState<Catch | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalWeight: 0,
  });

  // Fetch tournament
  const fetchTournament = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTournament(data.data || data);
      }
    } catch (err) {
      console.error("Error fetching tournament:", err);
    }
  }, [tournamentId]);

  // Fetch catches
  const fetchCatches = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      let url = `${API_URL}/api/catches?tournamentId=${tournamentId}&page=${pagination.page}&limit=${pagination.limit}`;
      if (statusFilter !== "ALL") {
        url += `&status=${statusFilter}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCatches(data.catches || []);
        setPagination(data.pagination || pagination);

        // Calculate stats from all catches
        const allCatches = data.catches || [];
        setStats({
          total: data.pagination?.total || allCatches.length,
          pending: allCatches.filter((c: Catch) => c.status === "PENDING").length,
          approved: allCatches.filter((c: Catch) => c.status === "APPROVED").length,
          rejected: allCatches.filter((c: Catch) => c.status === "REJECTED").length,
          totalWeight: allCatches
            .filter((c: Catch) => c.status === "APPROVED")
            .reduce((sum: number, c: Catch) => sum + Number(c.weight), 0),
        });
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching catches:", err);
      setError("Errore nel caricamento delle catture");
      setLoading(false);
    }
  }, [tournamentId, pagination.page, pagination.limit, statusFilter]);

  // Initial load
  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  useEffect(() => {
    fetchCatches();
  }, [fetchCatches]);

  // Get all media for a catch (including legacy photoPath/videoPath)
  const getAllMedia = (catchItem: Catch): CatchMedia[] => {
    const mediaList: CatchMedia[] = [...(catchItem.media || [])];

    // Add legacy photo if no media and photoPath exists
    if (mediaList.length === 0 && catchItem.photoPath) {
      mediaList.push({
        id: "legacy-photo",
        type: "PHOTO",
        path: catchItem.photoPath,
        filename: "photo.jpg",
        isPrimary: true,
        displayOrder: 0,
      });
    }

    // Add legacy video if exists and not in media
    if (catchItem.videoPath && !mediaList.some(m => m.path === catchItem.videoPath)) {
      mediaList.push({
        id: "legacy-video",
        type: "VIDEO",
        path: catchItem.videoPath,
        filename: "video.mp4",
        isPrimary: false,
        displayOrder: mediaList.length,
      });
    }

    return mediaList.sort((a, b) => a.displayOrder - b.displayOrder);
  };

  // Handle catch approval
  const handleApprove = async (catchId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/catches/${catchId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        fetchCatches();
        setSelectedCatch(null);
      }
    } catch (err) {
      console.error("Error approving catch:", err);
    }
  };

  // Handle catch rejection
  const handleReject = async (catchId: string, reason: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/catches/${catchId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewNotes: reason }),
      });
      if (res.ok) {
        fetchCatches();
        setSelectedCatch(null);
      }
    } catch (err) {
      console.error("Error rejecting catch:", err);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800 gap-1">
            <CheckCircle className="w-3 h-3" /> Approvata
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800 gap-1">
            <XCircle className="w-3 h-3" /> Rifiutata
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 gap-1">
            <AlertCircle className="w-3 h-3" /> In attesa
          </Badge>
        );
    }
  };

  if (loading && catches.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/dashboard/tournaments/${tournamentId}`}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">
                  {tournament?.name || "Torneo"}
                </h1>
                <p className="text-sm text-gray-500">Gestione Catture</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={fetchCatches}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Aggiorna
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Fish className="w-4 h-4" />
              <span className="text-sm">Totali</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-yellow-500 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">In Attesa</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Approvate</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">Rifiutate</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Scale className="w-4 h-4" />
              <span className="text-sm">Peso Totale</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalWeight.toFixed(2)} kg</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Filtri:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tutti</SelectItem>
                <SelectItem value="PENDING">In attesa</SelectItem>
                <SelectItem value="APPROVED">Approvate</SelectItem>
                <SelectItem value="REJECTED">Rifiutate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Catches Grid */}
        {catches.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Fish className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-600">Nessuna cattura trovata</h3>
            <p className="text-gray-500 mt-1">
              {statusFilter !== "ALL"
                ? "Prova a cambiare i filtri"
                : "Le catture appariranno qui quando i partecipanti le registreranno"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catches.map((catchItem) => {
              const media = getAllMedia(catchItem);
              const primaryMedia = media.find((m) => m.isPrimary) || media[0];

              return (
                <div
                  key={catchItem.id}
                  className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedCatch(catchItem);
                    setCurrentMediaIndex(0);
                  }}
                >
                  {/* Media Preview */}
                  <div className="relative aspect-video bg-gray-100">
                    {primaryMedia ? (
                      primaryMedia.type === "VIDEO" ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                          <Play className="w-12 h-12 text-white opacity-80" />
                        </div>
                      ) : (
                        <Image
                          src={getMediaUrl(primaryMedia.path)}
                          alt="Cattura"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                      </div>
                    )}

                    {/* Media count badge */}
                    {media.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {media.length} media
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="absolute top-2 left-2">
                      <StatusBadge status={catchItem.status} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-blue-500" />
                        <span className="text-lg font-bold">
                          {Number(catchItem.weight).toFixed(2)} kg
                        </span>
                      </div>
                      {catchItem.points && (
                        <Badge variant="outline">{catchItem.points} pt</Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span>
                          {catchItem.user.firstName} {catchItem.user.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(catchItem.caughtAt)}</span>
                      </div>
                      {catchItem.species && (
                        <div className="flex items-center gap-2">
                          <Fish className="w-3 h-3" />
                          <span>{catchItem.species.commonNameIt}</span>
                        </div>
                      )}
                    </div>

                    {/* GPS Zone Status */}
                    <div className="mt-3 flex items-center gap-1">
                      <MapPin
                        className={`w-3 h-3 ${
                          catchItem.isInsideZone ? "text-green-500" : "text-red-500"
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          catchItem.isInsideZone ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {catchItem.isInsideZone ? "Dentro zona" : "Fuori zona"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() =>
                setPagination((p) => ({ ...p, page: p.page - 1 }))
              }
            >
              <ChevronLeft className="w-4 h-4" />
              Precedente
            </Button>
            <span className="text-sm text-gray-600">
              Pagina {pagination.page} di {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPagination((p) => ({ ...p, page: p.page + 1 }))
              }
            >
              Successiva
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCatch && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCatch(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">Dettaglio Cattura</h3>
                <StatusBadge status={selectedCatch.status} />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedCatch(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-0">
              {/* Media Gallery */}
              <div className="bg-gray-900 relative">
                {(() => {
                  const media = getAllMedia(selectedCatch);
                  const currentMedia = media[currentMediaIndex];

                  if (!currentMedia) {
                    return (
                      <div className="aspect-video flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-gray-600" />
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="aspect-video relative">
                        {currentMedia.type === "VIDEO" ? (
                          <video
                            src={getMediaUrl(currentMedia.path)}
                            controls
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Image
                            src={getMediaUrl(currentMedia.path)}
                            alt="Cattura"
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        )}
                      </div>

                      {/* Navigation arrows */}
                      {media.length > 1 && (
                        <>
                          <button
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                            onClick={() =>
                              setCurrentMediaIndex(
                                (currentMediaIndex - 1 + media.length) % media.length
                              )
                            }
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                            onClick={() =>
                              setCurrentMediaIndex(
                                (currentMediaIndex + 1) % media.length
                              )
                            }
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {/* Thumbnails */}
                      {media.length > 1 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                          <div className="flex gap-2 justify-center">
                            {media.map((m, idx) => (
                              <button
                                key={m.id}
                                className={`w-12 h-12 rounded overflow-hidden border-2 ${
                                  idx === currentMediaIndex
                                    ? "border-white"
                                    : "border-transparent opacity-60"
                                }`}
                                onClick={() => setCurrentMediaIndex(idx)}
                              >
                                {m.type === "VIDEO" ? (
                                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                    <Play className="w-4 h-4 text-white" />
                                  </div>
                                ) : (
                                  <Image
                                    src={m.thumbnailPath || m.path}
                                    alt=""
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Media type label */}
                      <div className="absolute top-2 left-2">
                        <Badge
                          variant="secondary"
                          className="bg-black/50 text-white"
                        >
                          {currentMedia.type === "VIDEO" ? (
                            <>
                              <Play className="w-3 h-3 mr-1" /> Video
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-3 h-3 mr-1" /> Foto
                            </>
                          )}
                        </Badge>
                      </div>

                      {/* Counter */}
                      {media.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {currentMediaIndex + 1} / {media.length}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Details */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {/* Weight */}
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-blue-500" />
                      <span className="text-gray-600">Peso</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {Number(selectedCatch.weight).toFixed(2)} kg
                    </span>
                  </div>

                  {/* Length */}
                  {selectedCatch.length && (
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-gray-600">Lunghezza</span>
                      <span className="font-medium">{selectedCatch.length} cm</span>
                    </div>
                  )}

                  {/* Points */}
                  {selectedCatch.points && (
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-gray-600">Punti</span>
                      <span className="font-medium">{selectedCatch.points}</span>
                    </div>
                  )}

                  {/* User */}
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Pescatore</span>
                    </div>
                    <span className="font-medium">
                      {selectedCatch.user.firstName} {selectedCatch.user.lastName}
                    </span>
                  </div>

                  {/* Species */}
                  {selectedCatch.species && (
                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center gap-2">
                        <Fish className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">Specie</span>
                      </div>
                      <span className="font-medium">
                        {selectedCatch.species.commonNameIt}
                      </span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Data cattura</span>
                    </div>
                    <span className="font-medium">
                      {formatDate(selectedCatch.caughtAt)}
                    </span>
                  </div>

                  {/* GPS */}
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-2">
                      <MapPin
                        className={`w-5 h-5 ${
                          selectedCatch.isInsideZone
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      />
                      <span className="text-gray-600">Posizione</span>
                    </div>
                    <span
                      className={`font-medium ${
                        selectedCatch.isInsideZone
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedCatch.isInsideZone ? "Dentro zona" : "Fuori zona"}
                    </span>
                  </div>

                  {/* Notes */}
                  {selectedCatch.notes && (
                    <div className="py-3 border-b">
                      <span className="text-gray-600 block mb-1">Note</span>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedCatch.notes}
                      </p>
                    </div>
                  )}

                  {/* Review notes */}
                  {selectedCatch.reviewNotes && (
                    <div className="py-3 border-b">
                      <span className="text-gray-600 block mb-1">
                        Note revisione
                      </span>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedCatch.reviewNotes}
                      </p>
                    </div>
                  )}

                  {/* Reviewer */}
                  {selectedCatch.reviewer && (
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-gray-600">Revisore</span>
                      <span className="font-medium">
                        {selectedCatch.reviewer.firstName}{" "}
                        {selectedCatch.reviewer.lastName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {selectedCatch.status === "PENDING" && (
                  <div className="mt-6 flex gap-3">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(selectedCatch.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approva
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        const reason = prompt("Motivo del rifiuto:");
                        if (reason) {
                          handleReject(selectedCatch.id, reason);
                        }
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rifiuta
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
