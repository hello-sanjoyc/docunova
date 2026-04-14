import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

export default fp(async function authPlugin(app: FastifyInstance) {
  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "change-me-in-production",
    sign: { expiresIn: "15m" },
  });

  // Decorator used as a preHandler hook on protected routes
  app.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const payload = await request.jwtVerify<{
          sub: string;
          email: string;
          plan: string;
        }>();

        // Fetch fresh user so plan / existence is always current
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            email: true,
            fullName: true,
            companyName: true,
            plan: true,
          },
        });

        if (!user) {
          return reply.status(401).send({ error: "Unauthorized", message: "User not found" });
        }

        request.user = user;
      } catch {
        reply.status(401).send({ error: "Unauthorized", message: "Invalid or expired token" });
      }
    }
  );
});
