import { createServer } from "http";
import app from "./app";
import { config } from "./config";
import prisma from "./lib/prisma";
import { TournamentSchedulerService } from "./services/tournament";
import { initializeWebSocket } from "./services/websocket.service";

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("\nShutting down gracefully...");
  TournamentSchedulerService.stop();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("Database connected successfully");

    // Initialize WebSocket server
    initializeWebSocket(httpServer);

    // Start HTTP server (with Socket.io attached)
    httpServer.listen(config.port, () => {
      console.log(`
========================================
  TournamentMaster Backend API
========================================
  Environment: ${config.nodeEnv}
  Port: ${config.port}
  Frontend URL: ${config.frontendUrl}
  Database: Connected
  WebSocket: Enabled
========================================
      `);

      // Start tournament scheduler for auto-transitions
      TournamentSchedulerService.start();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
