import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma.js";

const REFRESH_TOKEN_TTL_DAYS = 30;

function refreshExpiry(): Date {
    const d = new Date();
    d.setDate(d.getDate() + REFRESH_TOKEN_TTL_DAYS);
    return d;
}

export default async function authRoutes(app: FastifyInstance) {
    // ─── POST /api/auth/signup ─────────────────────────────────────────────────
    app.post(
        "/signup",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["email", "fullName", "password"],
                    properties: {
                        email: { type: "string", format: "email" },
                        fullName: { type: "string", minLength: 2 },
                        companyName: { type: "string" },
                        password: { type: "string", minLength: 8 },
                    },
                    additionalProperties: false,
                },
            },
        },
        async (request, reply) => {
            const { email, fullName, companyName, password } = request.body as {
                email: string;
                fullName: string;
                companyName?: string;
                password: string;
            };

            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return reply.status(409).send({
                    error: "Conflict",
                    message: "Email already in use",
                });
            }

            const passwordHash = await bcrypt.hash(password, 12);

            const user = await prisma.user.create({
                data: { email, fullName, companyName, passwordHash },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    companyName: true,
                    plan: true,
                },
            });

            const accessToken = app.jwt.sign(
                { sub: user.id, email: user.email, plan: user.plan },
                { expiresIn: "15m" },
            );
            const rawRefresh = uuidv4();
            await prisma.refreshToken.create({
                data: {
                    userId: user.id,
                    token: rawRefresh,
                    expiresAt: refreshExpiry(),
                },
            });

            reply
                .status(201)
                .send({ user, accessToken, refreshToken: rawRefresh });
        },
    );

    // ─── POST /api/auth/login ──────────────────────────────────────────────────
    app.post(
        "/login",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", format: "email" },
                        password: { type: "string" },
                    },
                    additionalProperties: false,
                },
            },
        },
        async (request, reply) => {
            const { email, password } = request.body as {
                email: string;
                password: string;
            };

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return reply.status(401).send({
                    error: "Unauthorized",
                    message: "Invalid credentials",
                });
            }

            const valid = await bcrypt.compare(password, user.passwordHash);
            if (!valid) {
                return reply.status(401).send({
                    error: "Unauthorized",
                    message: "Invalid credentials",
                });
            }

            const accessToken = app.jwt.sign(
                { sub: user.id, email: user.email, plan: user.plan },
                { expiresIn: "15m" },
            );
            const rawRefresh = uuidv4();
            await prisma.refreshToken.create({
                data: {
                    userId: user.id,
                    token: rawRefresh,
                    expiresAt: refreshExpiry(),
                },
            });

            reply.send({
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    companyName: user.companyName,
                    plan: user.plan,
                },
                accessToken,
                refreshToken: rawRefresh,
            });
        },
    );

    // ─── POST /api/auth/refresh ────────────────────────────────────────────────
    app.post(
        "/refresh",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["refreshToken"],
                    properties: { refreshToken: { type: "string" } },
                    additionalProperties: false,
                },
            },
        },
        async (request, reply) => {
            const { refreshToken } = request.body as { refreshToken: string };

            const stored = await prisma.refreshToken.findUnique({
                where: { token: refreshToken },
                include: { user: true },
            });

            if (!stored || stored.expiresAt < new Date()) {
                // Invalidate if expired
                if (stored)
                    await prisma.refreshToken.delete({
                        where: { id: stored.id },
                    });
                return reply.status(401).send({
                    error: "Unauthorized",
                    message: "Refresh token expired or invalid",
                });
            }

            // Rotate token
            await prisma.refreshToken.delete({ where: { id: stored.id } });
            const rawRefresh = uuidv4();
            await prisma.refreshToken.create({
                data: {
                    userId: stored.userId,
                    token: rawRefresh,
                    expiresAt: refreshExpiry(),
                },
            });

            const accessToken = app.jwt.sign(
                {
                    sub: stored.user.id,
                    email: stored.user.email,
                    plan: stored.user.plan,
                },
                { expiresIn: "15m" },
            );

            reply.send({ accessToken, refreshToken: rawRefresh });
        },
    );

    // ─── POST /api/auth/logout ─────────────────────────────────────────────────
    app.post(
        "/logout",
        {
            preHandler: [app.authenticate],
            schema: {
                body: {
                    type: "object",
                    properties: { refreshToken: { type: "string" } },
                    additionalProperties: false,
                },
            },
        },
        async (request, reply) => {
            const { refreshToken } = (request.body ?? {}) as {
                refreshToken?: string;
            };
            if (refreshToken) {
                await prisma.refreshToken.deleteMany({
                    where: { token: refreshToken },
                });
            }
            reply.status(204).send();
        },
    );

    // ─── GET /api/auth/me ──────────────────────────────────────────────────────
    app.get(
        "/me",
        { preHandler: [app.authenticate] },
        async (request, reply) => {
            reply.send({ user: request.user });
        },
    );
}
