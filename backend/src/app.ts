import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import env from "./config/env";
import { appLogger } from "./config/logger";
import prismaPlugin from "./plugins/prisma";
import jwtPlugin from "./plugins/jwt";
import emailWorkerPlugin from "./plugins/emailWorker";
import aiWorkerPlugin from "./plugins/aiWorker";
import ocrWorkerPlugin from "./plugins/ocrWorker";
import { errorHandler } from "./middlewares/errorHandler";
import registerRoutes from "./routes";

// Fastify uses fast-json-stringify which cannot handle BigInt.
// Replacing the serializer with a JSON.stringify wrapper that converts BigInt → string
// covers every route globally without touching individual services.
function replacer(_key: string, value: unknown) {
    return typeof value === 'bigint' ? value.toString() : value;
}

export async function buildApp() {
    const fastify = Fastify({
        logger: false,
        serializerOpts: {},
    });

    // Override the default serializer so BigInt values are serialised as strings
    fastify.setReplySerializer((payload) => JSON.stringify(payload, replacer));

    fastify.addHook("onRequest", async (request) => {
        (request as typeof request & { startTimeMs?: number }).startTimeMs =
            Date.now();
    });

    fastify.addHook("onResponse", async (request, reply) => {
        const start = (request as typeof request & { startTimeMs?: number })
            .startTimeMs;
        const durationMs = start ? Date.now() - start : undefined;
        const statusCode = reply.statusCode;

        const payload = {
            requestId: request.id,
            method: request.method,
            url: request.url,
            statusCode,
            durationMs,
            ip: request.ip,
            userAgent: request.headers["user-agent"],
        };

        if (statusCode >= 500) {
            appLogger.error("HTTP request completed with server error", payload);
            return;
        }
        if (statusCode >= 400) {
            appLogger.warn("HTTP request completed with client error", payload);
            return;
        }
        appLogger.info("HTTP request completed", payload);
    });

    // Security
    await fastify.register(helmet);
    await fastify.register(cors, {
        origin: env.CORS_ORIGIN,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    });

    // Multipart (file uploads)
    await fastify.register(multipart, {
        limits: {
            fileSize: env.MAX_FILE_SIZE,
            files: 1,
        },
    });

    // Plugins
    await fastify.register(prismaPlugin);
    await fastify.register(jwtPlugin);
    await fastify.register(emailWorkerPlugin);
    await fastify.register(aiWorkerPlugin);
    await fastify.register(ocrWorkerPlugin);

    // Routes
    await registerRoutes(fastify);

    // Health check
    fastify.get("/health", async () => ({
        status: "ok",
        timestamp: new Date().toISOString(),
    }));

    // Error handler
    fastify.setErrorHandler(errorHandler);

    return fastify;
}
