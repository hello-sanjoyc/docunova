import prisma from '../config/prisma';
import env from '../config/env';
import { appLogger, createLogger } from '../config/logger';
import { generateSummary } from './ai.service';

// ── Core orchestration ────────────────────────────────────────────────────────

export async function runAiSummarize(
    documentUuid: string,
    userId: string,
): Promise<void> {
    const logger = createLogger({
        context: "ai-summarize-service",
        documentUuid,
        userId,
    });
    const startedAt = Date.now();
    logger.info("AI summarize pipeline started");

    // Resolve owner + document
    const user = await prisma.user.findUnique({
        where: { uuid: userId },
        select: { id: true, organizationId: true },
    });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    logger.info("User resolved for AI summarize", {
        userDbId: user.id.toString(),
        organizationId: user.organizationId.toString(),
    });

    const doc = await prisma.document.findUnique({ where: { uuid: documentUuid } });
    if (!doc || doc.deletedAt) throw Object.assign(new Error('Document not found'), { statusCode: 404 });
    if (doc.ownerUserId !== user.id) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    logger.info("Document resolved for AI summarize", {
        documentDbId: doc.id.toString(),
        status: doc.status,
        mimeType: doc.mimeType,
    });

    // Create AiJob record (RUNNING)
    const aiJob = await prisma.aiJob.create({
        data: {
            organizationId: user.organizationId,
            documentId: doc.id,
            triggeredBy: user.id,
            jobType: 'SUMMARIZE',
            status: 'RUNNING',
            providerName: env.AI_PROVIDER,
            modelName: env.AI_MODEL_NAME,
            startedAt: new Date(),
            inputJson: { documentUuid, userId } as never,
        },
    });
    logger.info("AI job created", {
        aiJobId: aiJob.id.toString(),
        status: aiJob.status,
        provider: aiJob.providerName,
        model: aiJob.modelName,
    });

    try {
        // Get text — prefer OcrResult, fall back to metadataJson.textSnippet
        logger.info("Loading document text for summarization");
        const ocrResult = await prisma.documentOcrResult.findUnique({
            where: { documentId: doc.id },
            select: { extractedText: true },
        });

        const documentText =
            ocrResult?.extractedText?.trim() ||
            ((doc.metadataJson as Record<string, unknown>)?.textSnippet as string) ||
            '';
        logger.info("Document text source resolved", {
            source: ocrResult?.extractedText ? "documentOcrResult" : "metadataJson.textSnippet",
            documentTextLength: documentText.length,
        });

        if (!documentText) {
            throw new Error('No text content available for summarization');
        }

        // Call AI model
        logger.info("AI analysis started");
        const summary = await generateSummary(documentText);
        logger.info("AI analysis completed", {
            riskItems: summary.risk_items.length,
            actionItems: summary.action_items.length,
            hasRedFlags: Boolean(summary.red_flags),
            hasActions: Boolean(summary.actions),
        });

        // Structured payload stored in summaryText (all requested fields present)
        const summaryPayload = {
            document_title: summary.document_title,
            parties: summary.parties,
            effective_date: summary.effective_date,
            obligations: summary.obligations,
            payment: summary.payment,
            red_flags: summary.red_flags,
            actions: summary.actions,
            summary: summary.summary,
            risk_items: summary.risk_items,
            action_items: summary.action_items,
            notes: summary.notes,
        };

        // keyPointsJson stores a flat list of key points derived from risk + action items
        const keyPoints = [
            ...summary.risk_items.map((r) => `[Risk] ${r.title}: ${r.details}`),
            ...summary.action_items.map((a) => `[Action] ${a.title}: ${a.details}`),
            ...summary.notes,
        ];

        // Persist to document_ai_summaries — replace any prior general summary
        logger.info("Persisting AI summary records");
        await prisma.documentAiSummary.deleteMany({
            where: { documentId: doc.id, summaryType: 'general' },
        });
        await prisma.documentAiSummary.create({
            data: {
                documentId: doc.id,
                aiJobId: aiJob.id,
                summaryType: 'general',
                summaryText: JSON.stringify(summaryPayload),
                keyPointsJson: keyPoints as never,
                providerName: env.AI_PROVIDER,
                modelName: env.AI_MODEL_NAME,
            },
        });
        logger.info("AI summary persisted", {
            documentDbId: doc.id.toString(),
            summaryType: "general",
        });

        // Merge summary fields into Document.metadataJson so the frontend card picks them up
        const existingMeta = (doc.metadataJson as Record<string, unknown>) ?? {};
        const updatedMeta: Record<string, unknown> = {
            ...existingMeta,
            ...(summary.parties && { parties: summary.parties }),
            ...(summary.effective_date && { effectiveDate: summary.effective_date }),
            ...(summary.obligations && { obligations: summary.obligations }),
            ...(summary.payment && { payment: summary.payment }),
            ...(summary.red_flags && { redFlags: summary.red_flags }),
            ...(summary.actions && { actions: summary.actions }),
            ...(summary.summary && { summary: summary.summary }),
        };

        // End-to-end processing time: from initial document upload to AI completion.
        const completedAt = new Date();
        const totalProcessingSeconds = Math.max(
            0,
            Math.round(
                (completedAt.getTime() - new Date(doc.uploadedAt).getTime()) /
                    1000,
            ),
        );
        updatedMeta.processingTimeSeconds = totalProcessingSeconds;
        updatedMeta.processingTime = `${totalProcessingSeconds}s`;
        updatedMeta.processedAt = completedAt.toISOString();

        // Status: PROCESSING → READY once AI summarization completes
        logger.info("Updating document status to READY");
        await prisma.document.update({
            where: { id: doc.id },
            data: {
                status: 'READY',
                metadataJson: updatedMeta as never,
            },
        });
        logger.info("Document status updated to READY");

        // Mark job COMPLETED
        logger.info("Marking AI job as COMPLETED");
        await prisma.aiJob.update({
            where: { id: aiJob.id },
            data: {
                status: 'COMPLETED',
                completedAt,
                progressPercent: 100,
                outputJson: summary as never,
            },
        });
        logger.info("AI job marked as COMPLETED", {
            aiJobId: aiJob.id.toString(),
            totalProcessingSeconds,
            durationMs: Date.now() - startedAt,
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        appLogger.error('[ai-summarize] Failed to summarize document', {
            documentUuid,
            userId,
            errorMessage,
            err,
        });
        logger.error("AI summarize pipeline failed", { errorMessage, err });

        // Update document status to FAILED so the frontend stops polling
        logger.warn("Updating document status to FAILED");
        await prisma.document.update({
            where: { id: doc.id },
            data: { status: 'FAILED' },
        }).catch(() => {});

        // Mark AiJob FAILED with the error message
        logger.warn("Marking AI job as FAILED");
        await prisma.aiJob.update({
            where: { id: aiJob.id },
            data: {
                status: 'FAILED',
                completedAt: new Date(),
                errorMessage,
            },
        }).catch(() => {});

        throw err;
    }
}

// ── Job status ────────────────────────────────────────────────────────────────

export async function getAiJobStatus(documentUuid: string, userId: string) {
    const user = await prisma.user.findUnique({
        where: { uuid: userId },
        select: { id: true },
    });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const doc = await prisma.document.findUnique({ where: { uuid: documentUuid } });
    if (!doc || doc.deletedAt) throw Object.assign(new Error('Document not found'), { statusCode: 404 });
    if (doc.ownerUserId !== user.id) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

    const job = await prisma.aiJob.findFirst({
        where: { documentId: doc.id, jobType: 'SUMMARIZE' },
        orderBy: { createdAt: 'desc' },
        select: {
            uuid: true,
            status: true,
            providerName: true,
            modelName: true,
            progressPercent: true,
            errorMessage: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
        },
    });

    return {
        documentUuid,
        documentStatus: doc.status,
        aiJob: job ?? null,
    };
}

// ── Fetch stored summary ──────────────────────────────────────────────────────

export async function getAiSummary(documentUuid: string, userId: string) {
    const user = await prisma.user.findUnique({
        where: { uuid: userId },
        select: { id: true },
    });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const doc = await prisma.document.findUnique({ where: { uuid: documentUuid } });
    if (!doc || doc.deletedAt) throw Object.assign(new Error('Document not found'), { statusCode: 404 });
    if (doc.ownerUserId !== user.id) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

    const summary = await prisma.documentAiSummary.findFirst({
        where: { documentId: doc.id, summaryType: 'general' },
        orderBy: { createdAt: 'desc' },
    });

    if (!summary) return null;

    const metadata = (doc.metadataJson as Record<string, unknown>) ?? {};
    const processingTimeSeconds =
        typeof metadata.processingTimeSeconds === "number"
            ? metadata.processingTimeSeconds
            : null;
    const processingTime =
        typeof metadata.processingTime === "string"
            ? metadata.processingTime
            : processingTimeSeconds !== null
              ? `${processingTimeSeconds}s`
              : null;

    return {
        documentUuid,
        summaryType: summary.summaryType,
        summary: JSON.parse(summary.summaryText) as Record<string, unknown>,
        providerName: summary.providerName,
        modelName: summary.modelName,
        processingTimeSeconds,
        processingTime,
        createdAt: summary.createdAt,
    };
}
