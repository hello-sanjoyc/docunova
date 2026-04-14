import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { planAllows } from "../types/index.js";
import type { Plan } from "@prisma/client";

export default async function teamRoutes(app: FastifyInstance) {
  // ─── POST /api/teams — create a team (Team plan only) ─────────────────────
  app.post(
    "/",
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: "object",
          required: ["name"],
          properties: { name: { type: "string", minLength: 2, maxLength: 100 } },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const user = request.user;
      if (!planAllows(user.plan as Plan, "team")) {
        return reply.status(402).send({
          error: "PaymentRequired",
          message: "Team features require a Team plan",
        });
      }

      // Check if user already belongs to a team as admin
      const existing = await prisma.teamMember.findFirst({
        where: { userId: user.id, role: "ADMIN" },
        include: { team: true },
      });
      if (existing) {
        return reply.status(409).send({
          error: "Conflict",
          message: "You are already an admin of a team",
        });
      }

      const { name } = request.body as { name: string };
      const team = await prisma.team.create({
        data: {
          name,
          members: { create: { userId: user.id, role: "ADMIN" } },
        },
        include: { members: { include: { user: { select: { id: true, email: true, fullName: true } } } } },
      });

      reply.status(201).send({ team });
    }
  );

  // ─── GET /api/teams/me — get the team the current user belongs to ─────────
  app.get(
    "/me",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: request.user.id },
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: { select: { id: true, email: true, fullName: true, plan: true } },
                },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      });

      if (!membership) {
        return reply.status(404).send({ error: "NotFound", message: "You are not in a team" });
      }

      reply.send({ team: membership.team, role: membership.role });
    }
  );

  // ─── POST /api/teams/:id/members — add a member ────────────────────────────
  app.post(
    "/:id/members",
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
            role:  { type: "string", enum: ["ADMIN", "MEMBER"] },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { id: teamId } = request.params as { id: string };
      const { email, role = "MEMBER" } = request.body as { email: string; role?: "ADMIN" | "MEMBER" };

      // Only admins can add members
      const adminMembership = await prisma.teamMember.findFirst({
        where: { teamId, userId: request.user.id, role: "ADMIN" },
      });
      if (!adminMembership) {
        return reply.status(403).send({ error: "Forbidden", message: "Only team admins can add members" });
      }

      const invitee = await prisma.user.findUnique({ where: { email } });
      if (!invitee) {
        return reply.status(404).send({ error: "NotFound", message: "No user with that email" });
      }

      // Check already a member
      const alreadyMember = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: invitee.id } },
      });
      if (alreadyMember) {
        return reply.status(409).send({ error: "Conflict", message: "User is already a team member" });
      }

      const member = await prisma.teamMember.create({
        data: { teamId, userId: invitee.id, role },
        include: { user: { select: { id: true, email: true, fullName: true } } },
      });

      reply.status(201).send({ member });
    }
  );

  // ─── DELETE /api/teams/:id/members/:userId — remove a member ──────────────
  app.delete(
    "/:id/members/:userId",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id: teamId, userId: targetUserId } = request.params as {
        id: string;
        userId: string;
      };

      // Must be admin OR removing themselves
      const adminMembership = await prisma.teamMember.findFirst({
        where: { teamId, userId: request.user.id, role: "ADMIN" },
      });
      const isSelf = request.user.id === targetUserId;

      if (!adminMembership && !isSelf) {
        return reply.status(403).send({ error: "Forbidden", message: "Insufficient permissions" });
      }

      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: targetUserId } },
      });
      if (!membership) {
        return reply.status(404).send({ error: "NotFound", message: "Member not found" });
      }

      await prisma.teamMember.delete({
        where: { teamId_userId: { teamId, userId: targetUserId } },
      });

      reply.status(204).send();
    }
  );
}
