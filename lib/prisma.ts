import { PrismaClient } from "@prisma/client";

// Serverless-safe singleton. Without this, every hot reload in dev and every
// warm lambda on Vercel opens a new pool and drains the free-tier limit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
