import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: process.env.NODE_ENV !== "production",
  isProd: process.env.NODE_ENV === "production",

  // Database
  databaseUrl: process.env.DATABASE_URL || "",

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "default-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  // CORS
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // File Upload
  upload: {
    dir: process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads"),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB
  },

  // Stripe (Phase 2)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },

  // Cloudinary (Media Upload)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
};

export default config;
