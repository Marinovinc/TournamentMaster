import { Router } from "express";

const router = Router();

/**
 * Health check endpoint for Railway/monitoring
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

export default router;
