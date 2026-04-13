import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "./lib/prisma.js";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

await app.register(cors, {
  origin: true,
});

app.get("/health", async () => {
  return { status: "ok" };
});

app.get("/health/db", async () => {
  await prisma.$queryRaw`SELECT 1`;
  return { status: "ok", db: "connected" };
});

const close = async (signal: NodeJS.Signals) => {
  app.log.info(`received ${signal}, shutting down`);
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", close);
process.on("SIGTERM", close);

try {
  await app.listen({ port, host });
  app.log.info(`backend running on http://${host}:${port}`);
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
}
