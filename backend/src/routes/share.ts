import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export default async function shareRoutes(app: FastifyInstance) {
  // ─── GET /api/share/:token — public read-only brief view ─────────────────
  app.get("/:token", async (request, reply) => {
    const { token } = request.params as { token: string };

    const share = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        document: {
          select: {
            id:           true,
            originalName: true,
            mimeType:     true,
            pageCount:    true,
            processingMs: true,
            status:       true,
            createdAt:    true,
            brief: {
              select: {
                parties:           true,
                effectiveDate:     true,
                obligations:       true,
                payment:           true,
                penalties:         true,
                renewalTerms:      true,
                redFlags:          true,
                recommendedActions: true,
              },
            },
          },
        },
      },
    });

    if (!share) {
      return reply.status(404).send({ error: "NotFound", message: "Share link not found" });
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      return reply.status(410).send({ error: "Gone", message: "This share link has expired" });
    }

    reply.send({
      document: share.document,
      sharedAt: share.createdAt,
      expiresAt: share.expiresAt,
    });
  });

  // ─── DELETE /api/share/:token — revoke (owner only) ──────────────────────
  app.delete(
    "/:token",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { token } = request.params as { token: string };

      const share = await prisma.shareLink.findUnique({
        where: { token },
        include: { document: { select: { userId: true } } },
      });

      if (!share) {
        return reply.status(404).send({ error: "NotFound", message: "Share link not found" });
      }

      if (share.document.userId !== request.user.id) {
        return reply.status(403).send({ error: "Forbidden", message: "Cannot revoke another user's share link" });
      }

      await prisma.shareLink.delete({ where: { token } });
      reply.status(204).send();
    }
  );
}
