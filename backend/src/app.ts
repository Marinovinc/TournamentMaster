import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { config } from "./config";

// Import routes
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import tournamentRoutes from "./routes/tournament.routes";
import catchRoutes from "./routes/catch.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import uploadRoutes from "./routes/upload.routes";
import teamRoutes from "./routes/team.routes";
import strikeRoutes from "./routes/strike.routes";
import tenantRoutes from "./routes/tenant.routes";
import reportsRoutes from "./routes/reports.routes";
import cmsRoutes from "./routes/cms.routes";
import mediaRoutes from "./routes/media.routes";
import boatRoutes from "./routes/boat.routes";
import equipmentRoutes from "./routes/equipment.routes";
import skipperRoutes from "./routes/skipper.routes";
import membershipRoutes from "./routes/membership.routes";
import userMediaRoutes from "./routes/user-media.routes";
import messageRoutes from "./routes/message.routes";
import penaltyRoutes from "./routes/penalty.routes";
import homologationRoutes from "./routes/homologation.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notification.routes";
import sponsorRoutes from "./routes/sponsor.routes";
import archiveRoutes from "./routes/archive.routes";
import importExportRoutes from "./routes/import-export.routes";

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration - permissive for mobile app
app.use(
  cors({
    origin: true, // Allow all origins (needed for Capacitor mobile app)
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression
app.use(compression());

// Static files for uploads
app.use("/uploads", express.static(config.upload.dir));

// Static files for video thumbnails
app.use("/thumbnails", express.static(path.join(__dirname, "../public/thumbnails")));

// Health check (both paths for compatibility)
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "TournamentMaster API is running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "TournamentMaster API is running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/catches", catchRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/strikes", strikeRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/boats", boatRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/skippers", skipperRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/user-media", userMediaRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/penalties", penaltyRoutes);
app.use("/api/homologation", homologationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sponsors", sponsorRoutes);
app.use("/api/archive", archiveRoutes);
app.use("/api/import-export", importExportRoutes);

// Static files for prizes uploads
app.use("/uploads/prizes", express.static(path.join(__dirname, "../uploads/prizes")));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.message,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: config.isDev ? err.message : "Internal server error",
    ...(config.isDev && { stack: err.stack }),
  });
});

export default app;
