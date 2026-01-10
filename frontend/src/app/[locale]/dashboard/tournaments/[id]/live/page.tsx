"use client";

/**
 * =============================================================================
 * LIVE DASHBOARD - Real-time Tournament Monitoring
 * =============================================================================
 * Pagina per monitoraggio in tempo reale durante tornei ONGOING
 *
 * Features:
 * - Classifica live con WebSocket
 * - Feed attivita in tempo reale
 * - Statistiche aggiornate
 * - Catture recenti
 * =============================================================================
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft,
  Trophy,
  Activity,
  Fish,
  Scale,
  Clock,
  Users,
  RefreshCw,
  Wifi,
  WifiOff,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Types
interface LeaderboardEntry {
  rank: number;
  odilUserId?: string;
  odilUserName?: string;
  odilTeamId?: string;
  odilTeamName?: string;
  totalWeight: number;
  catchCount: number;
  approvedCatches: number;
  pendingCatches: number;
}

interface ActivityItem {
  id: string;
  type: "catch_submitted" | "catch_approved" | "catch_rejected" | "registration" | "status_change";
  description: string;
  userName?: string;
  timestamp: string;
}

interface LiveStats {
  totalCatches: number;
  pendingCatches: number;
  approvedCatches: number;
  rejectedCatches: number;
  totalWeight: number;
  catchesPerHour: number;
  participantsActive: number;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  discipline: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LiveDashboardPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const locale = params.locale as string;

  // State
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Socket ref
  const socketRef = useRef<Socket | null>(null);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch tournament
      const tournamentRes = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, { headers });
      if (tournamentRes.ok) {
        const data = await tournamentRes.json();
        setTournament(data.data || data);
      }

      // Fetch leaderboard
      const leaderboardRes = await fetch(`${API_URL}/api/leaderboard/${tournamentId}`, { headers });
      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.data || data || []);
      }

      // Fetch stats
      const statsRes = await fetch(`${API_URL}/api/tournaments/${tournamentId}/stats`, { headers });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data || data);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Errore nel caricamento dei dati");
      setLoading(false);
    }
  }, [tournamentId]);

  // Initialize WebSocket connection
  useEffect(() => {
    fetchInitialData();

    // Connect to WebSocket
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[Live] WebSocket connected");
      setIsConnected(true);
      socket.emit("tournament:join", tournamentId);
    });

    socket.on("disconnect", () => {
      console.log("[Live] WebSocket disconnected");
      setIsConnected(false);
    });

    // Listen for updates
    socket.on("leaderboard:update", (data) => {
      console.log("[Live] Leaderboard update:", data);
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    });

    socket.on("catch:update", (data) => {
      console.log("[Live] Catch update:", data);
      // Add to activity feed
      const newActivity: ActivityItem = {
        id: `catch-${Date.now()}`,
        type: data.type === "new" ? "catch_submitted" : "catch_approved",
        description: data.catch?.userName
          ? `${data.catch.userName}: ${data.catch.weight || 0}kg`
          : "Nuova cattura",
        userName: data.catch?.userName,
        timestamp: data.timestamp,
      };
      setActivities((prev) => [newActivity, ...prev].slice(0, 20));

      // Refresh stats
      fetchInitialData();
    });

    socket.on("activity:new", (activity) => {
      console.log("[Live] New activity:", activity);
      setActivities((prev) => [activity, ...prev].slice(0, 20));
    });

    socket.on("tournament:status", (data) => {
      console.log("[Live] Tournament status change:", data);
      setTournament((prev) =>
        prev ? { ...prev, status: data.newStatus } : null
      );
    });

    socketRef.current = socket;

    return () => {
      socket.emit("tournament:leave", tournamentId);
      socket.disconnect();
    };
  }, [tournamentId, fetchInitialData]);

  // Refresh data manually
  const handleRefresh = () => {
    fetchInitialData();
  };

  // Format time ago
  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diff < 60) return `${diff}s fa`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m fa`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h fa`;
    return `${Math.floor(diff / 86400)}g fa`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || "Torneo non trovato"}</p>
        </div>
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
                <h1 className="text-xl font-bold">{tournament.name}</h1>
                <p className="text-sm text-gray-500">Live Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Connection status */}
              <Badge variant={isConnected ? "default" : "destructive"} className="gap-1">
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3" /> Connesso
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" /> Disconnesso
                  </>
                )}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Aggiorna
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Fish className="w-4 h-4" />
                <span className="text-sm">Catture Totali</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalCatches}</p>
              <div className="flex gap-2 mt-1 text-xs">
                <span className="text-green-600">{stats.approvedCatches} approvate</span>
                <span className="text-yellow-600">{stats.pendingCatches} pending</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Scale className="w-4 h-4" />
                <span className="text-sm">Peso Totale</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalWeight.toFixed(2)} kg</p>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Catture/Ora</span>
              </div>
              <p className="text-2xl font-bold">{stats.catchesPerHour}</p>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Partecipanti Attivi</span>
              </div>
              <p className="text-2xl font-bold">{stats.participantsActive || leaderboard.length}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leaderboard - 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-xl border">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="font-semibold">Classifica Live</h2>
              </div>
              <Badge variant="outline">{leaderboard.length} partecipanti</Badge>
            </div>

            <div className="divide-y max-h-[500px] overflow-y-auto">
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Fish className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nessuna cattura registrata</p>
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.odilTeamId || entry.odilUserId || index}
                    className={`p-4 flex items-center gap-4 ${
                      index < 3 ? "bg-yellow-50/50" : ""
                    }`}
                  >
                    {/* Rank */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0
                          ? "bg-yellow-400 text-white"
                          : index === 1
                          ? "bg-gray-300 text-white"
                          : index === 2
                          ? "bg-amber-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {entry.rank || index + 1}
                    </div>

                    {/* Name */}
                    <div className="flex-1">
                      <p className="font-medium">
                        {entry.odilTeamName || entry.odilUserName || "Anonimo"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {entry.catchCount} catture ({entry.approvedCatches || entry.catchCount} approvate)
                      </p>
                    </div>

                    {/* Weight */}
                    <div className="text-right">
                      <p className="text-lg font-bold">{Number(entry.totalWeight || 0).toFixed(2)} kg</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed - 1 column */}
          <div className="bg-white rounded-xl border">
            <div className="p-4 border-b flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold">Attivita Recente</h2>
            </div>

            <div className="divide-y max-h-[500px] overflow-y-auto">
              {activities.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nessuna attivita recente</p>
                  <p className="text-sm mt-1">Le attivita appariranno qui in tempo reale</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="p-3 flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === "catch_approved"
                          ? "bg-green-100 text-green-600"
                          : activity.type === "catch_rejected"
                          ? "bg-red-100 text-red-600"
                          : activity.type === "catch_submitted"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {activity.type === "catch_approved" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : activity.type === "catch_rejected" ? (
                        <XCircle className="w-4 h-4" />
                      ) : activity.type === "catch_submitted" ? (
                        <Fish className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.timestamp ? timeAgo(activity.timestamp) : "ora"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
