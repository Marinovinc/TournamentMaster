/**
 * =============================================================================
 * WEBSOCKET SERVICE
 * =============================================================================
 * Servizio per comunicazioni real-time tramite Socket.io
 *
 * Eventi emessi:
 * - tournament:update - Aggiornamento stato torneo
 * - catch:new - Nuova cattura registrata
 * - catch:validated - Cattura approvata/rifiutata
 * - leaderboard:update - Classifica aggiornata
 * - activity:new - Nuova attività nel feed
 *
 * Rooms:
 * - tournament:{id} - Room per singolo torneo
 * =============================================================================
 */

import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { config } from "../config";

let io: SocketServer | null = null;

/**
 * Inizializza Socket.io server
 */
export function initializeWebSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.frontendUrl || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Join tournament room
    socket.on("tournament:join", (tournamentId: string) => {
      socket.join(`tournament:${tournamentId}`);
      console.log(`[WebSocket] ${socket.id} joined tournament:${tournamentId}`);
    });

    // Leave tournament room
    socket.on("tournament:leave", (tournamentId: string) => {
      socket.leave(`tournament:${tournamentId}`);
      console.log(`[WebSocket] ${socket.id} left tournament:${tournamentId}`);
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(`[WebSocket] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log("[WebSocket] Server initialized");
  return io;
}

/**
 * Ottiene l'istanza Socket.io
 */
export function getIO(): SocketServer | null {
  return io;
}

/**
 * Emette evento a tutti i client in una room torneo
 */
export function emitToTournament(tournamentId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`tournament:${tournamentId}`).emit(event, data);
  }
}

/**
 * Emette aggiornamento cattura
 */
export function emitCatchUpdate(
  tournamentId: string,
  catchData: {
    id: string;
    status: string;
    weight?: number;
    species?: string;
    userId?: string;
    userName?: string;
    teamName?: string;
  }
): void {
  emitToTournament(tournamentId, "catch:update", {
    type: catchData.status === "PENDING" ? "new" : "validated",
    catch: catchData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emette aggiornamento classifica
 */
export function emitLeaderboardUpdate(
  tournamentId: string,
  leaderboard: Array<{
    rank: number;
    teamId?: string;
    teamName?: string;
    userId?: string;
    userName?: string;
    totalWeight: number;
    catchCount: number;
  }>
): void {
  emitToTournament(tournamentId, "leaderboard:update", {
    leaderboard,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emette nuova attività nel feed
 */
export function emitActivity(
  tournamentId: string,
  activity: {
    id: string;
    type: "catch_submitted" | "catch_approved" | "catch_rejected" | "registration" | "status_change";
    description: string;
    userName?: string;
    timestamp: Date;
  }
): void {
  emitToTournament(tournamentId, "activity:new", activity);
}

/**
 * Emette cambio stato torneo
 */
export function emitTournamentStatusChange(
  tournamentId: string,
  oldStatus: string,
  newStatus: string
): void {
  emitToTournament(tournamentId, "tournament:status", {
    tournamentId,
    oldStatus,
    newStatus,
    timestamp: new Date().toISOString(),
  });
}
