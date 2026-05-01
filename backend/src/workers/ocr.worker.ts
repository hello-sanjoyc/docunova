import { Worker, Job } from 'bullmq';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { OCR_QUEUE_NAME, OcrJobData } from '../queues/ocr.queue';
import { getRedisConnection } from '../queues/email.queue';
import { downloadFromStorage } from '../services/storage.service';
import { runPythonOcr } from '../services/ocr.service';
import { enqueueAiSummarize } from '../queues/ai.queue';
import { classifyDocument } from '../utils/classifyDocument';
import prisma from '../config/prisma';
import { appLogger } from '../config/logger';
import { invalidateDocumentListCacheForUser } from '../services/document.service';

let _worker: Worker<OcrJobData> | null = null;

async function processOcrJob(job: Job<OcrJobData>): Promise<void> {
    const { documentUuid, userId, storageKey, fileExtension } = job.data;
    appLogger.info('[ocr-worker] Job started', { jobId: job.id, documentUuid });

    await job.updateProgress(5);

    // Resolve document + owner IDs needed for DB writes
    const user = await prisma.user.findUnique({
        where: { uuid: userId },
        select: { id: true },
    });
    if (!user) throw new Error(`User not found: ${userId}`);

    const doc = await prisma.document.findUnique({ where: { uuid: documentUuid } });
    if (!doc || doc.deletedAt) throw new Error(`Document not found: ${documentUuid}`);

    // Download file from S3 into a temp file
    const tmpPath = path.join(os.tmpdir(), `ocr-${job.id}.${fileExtension}`);
    try {
        const { stream } = await downloadFromStorage(storageKey);
        await pipeline(stream as Readable, fs.createWriteStream(tmpPath));
        await job.updateProgress(25);
        appLogger.info('[ocr-worker] File downloaded to tmp', { jobId: job.id, tmpPath });

        // Run Python OCR
        const extractedText = await runPythonOcr(tmpPath);
        await job.updateProgress(75);
        appLogger.info('[ocr-worker] Python OCR completed', {
            jobId: job.id,
            documentUuid,
            chars: extractedText.length,
        });

        // Persist OCR result
        await prisma.documentOcrResult.upsert({
            where: { documentId: doc.id },
            create: {
                documentId: doc.id,
                extractedText,
                pageTextJson: [],
                ocrStatus: 'COMPLETED',
                ocrMethod: 'tesseract',
            },
            update: {
                extractedText,
                ocrStatus: 'COMPLETED',
                ocrMethod: 'tesseract',
            },
        });

        // Classify document now that we have text
        const classification = classifyDocument(extractedText);
        if (classification) {
            await prisma.$transaction([
                prisma.documentClassification.deleteMany({ where: { documentId: doc.id } }),
                prisma.documentClassification.create({
                    data: {
                        documentId: doc.id,
                        classLabel: classification.label,
                        confidenceScore: Math.min(classification.score, 100),
                        isPrimary: true,
                    },
                }),
                prisma.document.update({
                    where: { id: doc.id },
                    data: {
                        metadataJson: {
                            ...((doc.metadataJson as Record<string, unknown>) ?? {}),
                            classification: classification.label,
                            textSnippet: extractedText.slice(0, 500),
                        } as never,
                    },
                }),
            ]);
        } else {
            // Update snippet even if classification stays UNKNOWN
            await prisma.document.update({
                where: { id: doc.id },
                data: {
                    metadataJson: {
                        ...((doc.metadataJson as Record<string, unknown>) ?? {}),
                        textSnippet: extractedText.slice(0, 500),
                    } as never,
                },
            });
        }

        await job.updateProgress(90);

        // Hand off to AI summarization
        const aiJobId = await enqueueAiSummarize(documentUuid, userId);
        appLogger.info('[ocr-worker] AI summarize job enqueued', {
            jobId: job.id,
            documentUuid,
            aiJobId,
        });

        await job.updateProgress(100);
    } finally {
        await fs.promises.unlink(tmpPath).catch(() => {});
    }
}

export function startOcrWorker(): Worker<OcrJobData> {
    if (_worker) return _worker;

    _worker = new Worker<OcrJobData>(OCR_QUEUE_NAME, processOcrJob, {
        connection: getRedisConnection(),
        concurrency: 2,
    });

    _worker.on('completed', (job) => {
        appLogger.info('[ocr-worker] Job completed', {
            jobId: job.id,
            documentUuid: job.data.documentUuid,
        });
    });

    _worker.on('failed', async (job, err) => {
        appLogger.error('[ocr-worker] Job failed', {
            jobId: job?.id,
            documentUuid: job?.data.documentUuid,
            err,
        });
        // Mark document FAILED so the frontend stops polling
        if (job?.data.documentUuid) {
            await prisma.document
                .updateMany({
                    where: { uuid: job.data.documentUuid },
                    data: { status: 'FAILED' },
                })
                .catch(() => {});
            await invalidateDocumentListCacheForUser(job.data.userId).catch(
                () => {},
            );
        }
    });

    return _worker;
}

export async function stopOcrWorker(): Promise<void> {
    if (_worker) {
        await _worker.close();
        _worker = null;
    }
}
