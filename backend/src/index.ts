import app from "./app";
import { config } from "./config";
import prisma from "./lib/prisma";

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("\nShutting down gracefully...");
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

    // Start HTTP server
    app.listen(config.port, () => {
      console.log(`
========================================
  TournamentMaster Backend API
========================================
  Environment: ${config.nodeEnv}
  Port: ${config.port}
  Frontend URL: ${config.frontendUrl}
  Database: Connected
========================================
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
