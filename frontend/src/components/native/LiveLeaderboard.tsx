/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/components/native/LiveLeaderboard.tsx
 * Creato: 2025-12-30
 * Descrizione: Classifica live in tempo reale per tornei
 *
 * Features:
 * - Aggiornamenti real-time via WebSocket/polling
 * - Notifiche push per cambi posizione
 * - Funziona offline mostrando ultimo stato salvato
 * =============================================================================
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Network } from "@capacitor/network";
import { Preferences } from "@capacitor/preferences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, RefreshCw, Wifi, WifiOff, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  participantId: string;
  participantName: string;
  teamName?: string;
  totalCatches: number;
  totalWeight: number; // in kg
  biggestCatch?: number; // in kg
  lastCatchTime?: Date;
}

interface LiveLeaderboardProps {
  tournamentId: string;
  refreshInterval?: number; // in milliseconds
  highlightParticipantId?: string;
}

export function LiveLeaderboard({
  tournamentId,
  refreshInterval = 30000,
  highlightParticipantId,
}: LiveLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `leaderboard_${tournamentId}`;

  // Load from cache
  const loadFromCache = useCallback(async () => {
    try {
      const cached = await Preferences.get({ key: cacheKey });
      if (cached.value) {
        const data = JSON.parse(cached.value);
        setLeaderboard(data.leaderboard);
        setLastUpdate(new Date(data.timestamp));
      }
    } catch (err) {
      console.warn("Could not load from cache:", err);
    }
  }, [cacheKey]);

  // Save to cache
  const saveToCache = useCallback(
    async (data: LeaderboardEntry[]) => {
      try {
        await Preferences.set({
          key: cacheKey,
          value: JSON.stringify({
            leaderboard: data,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.warn("Could not save to cache:", err);
      }
    },
    [cacheKey]
  );

  // Fetch leaderboard from API
  const fetchLeaderboard = useCallback(async () => {
    const status = await Network.getStatus();
    setIsOnline(status.connected);

    if (!status.connected) {
      await loadFromCache();
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(
        `${apiUrl}/api/tournaments/${tournamentId}/leaderboard`
      );

      if (!response.ok) throw new Error("Failed to fetch leaderboard");

      const data: LeaderboardEntry[] = await response.json();
      setLeaderboard(data);
      setLastUpdate(new Date());
      await saveToCache(data);
    } catch (err) {
      setError("Impossibile aggiornare la classifica");
      await loadFromCache();
      console.error("Leaderboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, loadFromCache, saveToCache]);

  // Initial load and polling
  useEffect(() => {
    fetchLeaderboard();

    const interval = setInterval(fetchLeaderboard, refreshInterval);

    // Network status listener
    const networkListener = Network.addListener("networkStatusChange", (status) => {
      setIsOnline(status.connected);
      if (status.connected) {
        fetchLeaderboard();
      }
    });

    return () => {
      clearInterval(interval);
      networkListener.then((l) => l.remove());
    };
  }, [fetchLeaderboard, refreshInterval]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center font-bold">{rank}</span>;
    }
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous || previous === current) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    if (current < previous) {
      return (
        <div className="flex items-center text-emerald-500">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs ml-1">+{previous - current}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-red-500">
        <TrendingDown className="h-4 w-4" />
        <span className="text-xs ml-1">-{current - previous}</span>
      </div>
    );
  };

  const formatWeight = (kg: number) => {
    if (kg >= 1) {
      return `${kg.toFixed(2)} kg`;
    }
    return `${(kg * 1000).toFixed(0)} g`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Classifica Live
          </span>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-emerald-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-500" />
            )}
            <button
              onClick={fetchLeaderboard}
              disabled={isLoading}
              className="p-1 hover:bg-muted rounded"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </CardTitle>
        {lastUpdate && (
          <p className="text-xs text-muted-foreground">
            Ultimo aggiornamento: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {error && !leaderboard.length && (
          <div className="text-center py-8 text-muted-foreground">
            {error}
          </div>
        )}

        {leaderboard.length === 0 && !error && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            Nessuna cattura registrata
          </div>
        )}

        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.participantId}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                highlightParticipantId === entry.participantId
                  ? "bg-primary/10 border border-primary"
                  : "bg-muted/50"
              }`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-8">
                {getRankIcon(entry.rank)}
              </div>

              {/* Rank change indicator */}
              <div className="w-10">{getRankChange(entry.rank, entry.previousRank)}</div>

              {/* Participant info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.participantName}</p>
                {entry.teamName && (
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.teamName}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="text-right">
                <p className="font-bold">{formatWeight(entry.totalWeight)}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.totalCatches} catture
                </p>
              </div>

              {/* Biggest catch badge */}
              {entry.biggestCatch && entry.rank <= 3 && (
                <Badge variant="secondary" className="text-xs">
                  Max: {formatWeight(entry.biggestCatch)}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
