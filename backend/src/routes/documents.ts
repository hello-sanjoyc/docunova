import type { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import path from "node:path";
import { prisma } from "../lib/prisma.js";
import {
  saveUploadedFile,
  deleteFile,
  extractText,
  generateBriefPdf,
} from "../services/document.service.js";
import { analyzeContract, answerQuestion } from "../services/ai.service.js";
import { PLAN_LIMITS, planAllows } from "../types/index.js";
import type { Plan } from "@prisma/client";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

export default async function documentRoutes(app: FastifyInstance) {
  // ─── POST /api/documents — upload & analyse ──────────────────────────────
  app.post(
    "/",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = request.user;
      const plan = user.plan as Plan;

      // Enforce Free plan document limit
      const limit = PLAN_LIMITS[plan].maxDocuments;
      if (limit !== null) {
        const count = await prisma.document.count({ where: { userId: user.id } });
        if (count >= limit) {
          return reply.status(402).send({
            error: "PaymentRequired",
            message: `Free plan allows ${limit} documents. Upgrade to Pro for unlimited uploads.`,
          });
        }
      }

      const part = await request.file();
      if (!part) {
        return reply.status(400).send({ error: "BadRequest", message: "No file uploaded" });
      }

      if (!ALLOWED_MIME.has(part.mimetype)) {
        return reply.status(415).send({
          error: "UnsupportedMediaType",
          message: "Only PDF and DOCX files are supported",
        });
      }

      const ext = path.extname(part.filename) || ".bin";
      const filename = `${uuidv4()}${ext}`;

      // Save to disk
      const { filePath, fileSize } = await saveUploadedFile(part, filename);

      // Create DB record immediately (status = PROCESSING)
      const doc = await prisma.document.create({
        data: {
          userId:      user.id,
          filename,
          originalName: part.filename,
          mimeType:    part.mimetype,
          fileSize,
          filePath,
          status:      "PROCESSING",
        },
      });

      // Run extraction + AI analysis asynchronously so we can respond fast
      processDocument(doc.id, filePath, part.mimetype).catch((err) => {
        app.log.error({ docId: doc.id, err }, "document processing failed");
      });

      reply.status(202).send({
        document: {
          id:          doc.id,
          originalName: doc.originalName,
          status:      doc.status,
          createdAt:   doc.createdAt,
        },
      });
    }
  );

  // ─── GET /api/documents — list user's documents ──────────────────────────
  app.get(
    "/",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = request.user;
      const { page = "1", limit = "20" } = request.query as Record<string, string>;
      const take = Math.min(Number(limit), 100);
      const skip = (Number(page) - 1) * take;

      const [documents, total] = await prisma.$transaction([
        prisma.document.findMany({
          where:   { userId: user.id },
          orderBy: { createdAt: "desc" },
          take,
          skip,
          select: {
            id:           true,
            originalName: true,
            mimeType:     true,
            fileSize:     true,
            status:       true,
            pageCount:    true,
            processingMs: true,
            createdAt:    true,
            brief:        { select: { id: true, redFlags: true } },
          },
        }),
        prisma.document.count({ where: { userId: user.id } }),
      ]);

      reply.send({ documents, total, page: Number(page), limit: take });
    }
  );

  // ─── GET /api/documents/:id — get document + brief ───────────────────────
  app.get(
    "/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const doc = await prisma.document.findUnique({
        where: { id },
        include: { brief: { include: { questions: { orderBy: { createdAt: "asc" } } } } },
      });

      if (!doc || doc.userId !== request.user.id) {
        return reply.status(404).send({ error: "NotFound", message: "Document not found" });
      }

      reply.send({ document: doc });
    }
  );

  // ─── DELETE /api/documents/:id ────────────────────────────────────────────
  app.delete(
    "/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const doc = await prisma.document.findUnique({ where: { id } });

      if (!doc || doc.userId !== request.user.id) {
        return reply.status(404).send({ error: "NotFound", message: "Document not found" });
      }

      await prisma.document.delete({ where: { id } });
      await deleteFile(doc.filePath);

      reply.status(204).send();
    }
  );

  // ─── POST /api/documents/:id/questions — follow-up Q&A (Pro+) ───────────
  app.post(
    "/:id/questions",
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: "object",
          required: ["question"],
          properties: { question: { type: "string", minLength: 3, maxLength: 1000 } },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const user = request.user;
      if (!planAllows(user.plan as Plan, "questions")) {
        return reply.status(402).send({
          error: "PaymentRequired",
          message: "Follow-up questions require a Pro or Team plan",
        });
      }

      const { id } = request.params as { id: string };
      const { question } = request.body as { question: string };

      const doc = await prisma.document.findUnique({
        where: { id },
        include: { brief: true },
      });

      if (!doc || doc.userId !== user.id) {
        return reply.status(404).send({ error: "NotFound", message: "Document not found" });
      }
      if (doc.status !== "READY" || !doc.brief) {
        return reply.status(409).send({ error: "Conflict", message: "Document is not ready yet" });
      }

      // Read file text for context
      const { text } = await extractText(doc.filePath, doc.mimeType);
      const brief = doc.brief;
      const answer = await answerQuestion(
        text,
        {
          parties:            brief.parties ?? "",
          effectiveDate:      brief.effectiveDate ?? "",
          obligations:        brief.obligations ?? "",
          payment:            brief.payment ?? "",
          penalties:          brief.penalties ?? "",
          renewalTerms:       brief.renewalTerms ?? "",
          redFlags:           brief.redFlags,
          recommendedActions: brief.recommendedActions,
        },
        question
      );

      const saved = await prisma.question.create({
        data: { briefId: brief.id, question, answer },
      });

      reply.status(201).send({ question: saved });
    }
  );

  // ─── GET /api/documents/:id/export — download brief as PDF ───────────────
  app.get(
    "/:id/export",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const doc = await prisma.document.findUnique({
        where: { id },
        include: { brief: true },
      });

      if (!doc || doc.userId !== request.user.id) {
        return reply.status(404).send({ error: "NotFound", message: "Document not found" });
      }
      if (doc.status !== "READY" || !doc.brief) {
        return reply.status(409).send({ error: "Conflict", message: "Document is not ready yet" });
      }

      const pdfBuffer = await generateBriefPdf(doc.originalName, doc.brief as any);
      const safeName = doc.originalName.replace(/[^a-z0-9._-]/gi, "_").replace(/\.[^.]+$/, "");

      reply
        .header("Content-Type", "application/pdf")
        .header("Content-Disposition", `attachment; filename="${safeName}-brief.pdf"`)
        .send(pdfBuffer);
    }
  );

  // ─── POST /api/documents/:id/share — create share link (Pro+) ────────────
  app.post(
    "/:id/share",
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: "object",
          properties: {
            expiresInDays: { type: "integer", minimum: 1, maximum: 365 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const user = request.user;
      if (!planAllows(user.plan as Plan, "shareLinks")) {
        return reply.status(402).send({
          error: "PaymentRequired",
          message: "Shareable links require a Pro or Team plan",
        });
      }

      const { id } = request.params as { id: string };
      const { expiresInDays } = (request.body ?? {}) as { expiresInDays?: number };

      const doc = await prisma.document.findUnique({ where: { id } });
      if (!doc || doc.userId !== user.id) {
        return reply.status(404).send({ error: "NotFound", message: "Document not found" });
      }

      let expiresAt: Date | null = null;
      if (expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      }

      const share = await prisma.shareLink.create({
        data: { documentId: id, expiresAt },
      });

      const baseUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
      reply.status(201).send({
        shareLink: {
          id:        share.id,
          token:     share.token,
          url:       `${baseUrl}/share/${share.token}`,
          expiresAt: share.expiresAt,
          createdAt: share.createdAt,
        },
      });
    }
  );
}

// ─── Background processing ────────────────────────────────────────────────────

async function processDocument(
  docId: string,
  filePath: string,
  mimeType: string
): Promise<void> {
  const start = Date.now();
  try {
    const { text, pageCount } = await extractText(filePath, mimeType);
    const brief = await analyzeContract(text);

    await prisma.$transaction([
      prisma.document.update({
        where: { id: docId },
        data: {
          status:      "READY",
          pageCount,
          processingMs: Date.now() - start,
        },
      }),
      prisma.brief.create({
        data: {
          documentId:        docId,
          parties:           brief.parties,
          effectiveDate:     brief.effectiveDate,
          obligations:       brief.obligations,
          payment:           brief.payment,
          penalties:         brief.penalties,
          renewalTerms:      brief.renewalTerms,
          redFlags:          brief.redFlags,
          recommendedActions: brief.recommendedActions,
        },
      }),
    ]);
  } catch (err) {
    await prisma.document.update({
      where: { id: docId },
      data: {
        status:       "ERROR",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      },
    });
    throw err;
  }
}
