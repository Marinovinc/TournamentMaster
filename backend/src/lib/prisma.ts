import { PrismaClient } from "@prisma/client";
import { config } from "../config";

// Global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isDev ? ["query", "info", "warn", "error"] : ["error"],
  });

if (config.isDev) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
