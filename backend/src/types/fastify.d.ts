import type { AuthenticatedUser } from "./index.js";

// Telling @fastify/jwt what shape request.user will have after authenticate()
declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: AuthenticatedUser;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply
    ) => Promise<void>;
  }
}
