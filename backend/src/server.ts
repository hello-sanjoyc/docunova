import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";

import { prisma } from "./lib/prisma.js";
import authPlugin from "./plugins/auth.js";
import { ensureUploadsDir } from "./services/document.service.js";

import authRoutes from "./routes/auth.js";
import documentRoutes from "./routes/documents.js";
import teamRoutes from "./routes/teams.js";
import shareRoutes from "./routes/share.js";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

// ─── Plugins ──────────────────────────────────────────────────────────────────

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
  credentials: true,
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

await app.register(multipart, {
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
    files: 1,
  },
});

await app.register(authPlugin);

// ─── Routes ───────────────────────────────────────────────────────────────────

await app.register(authRoutes,     { prefix: "/api/auth" });
await app.register(documentRoutes, { prefix: "/api/documents" });
await app.register(teamRoutes,     { prefix: "/api/teams" });
await app.register(shareRoutes,    { prefix: "/api/share" });

// ─── Health ───────────────────────────────────────────────────────────────────

app.get("/health", async () => ({ status: "ok" }));

app.get("/health/db", async () => {
  await prisma.$queryRaw`SELECT 1`;
  return { status: "ok", db: "connected" };
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.setErrorHandler((error: Error & { statusCode?: number; validation?: unknown }, _request, reply) => {
  app.log.error(error);

  if (error.validation) {
    return reply.status(400).send({
      error: "ValidationError",
      message: error.message,
    });
  }

  const status = error.statusCode ?? 500;
  reply.status(status).send({
    error: status === 500 ? "InternalServerError" : error.name,
    message: status === 500 ? "An unexpected error occurred" : error.message,
  });
});

// ─── Shutdown ─────────────────────────────────────────────────────────────────

const shutdown = async (signal: NodeJS.Signals) => {
  app.log.info(`received ${signal}, shutting down`);
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ─── Start ────────────────────────────────────────────────────────────────────

await ensureUploadsDir();

try {
  await app.listen({ port, host });
  app.log.info(`backend running on http://${host}:${port}`);
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
}
