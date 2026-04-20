// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ numpages: number; text: string }>;
import { createLogger } from "../config/logger";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PdfData {
    pageCount: number;
    text: string;
}

const logger = createLogger({ context: "pdf-service" });

// ── Text + page count (pdf-parse — zero native deps) ─────────────────────────

export async function extractPdfData(buffer: Buffer): Promise<PdfData> {
    const startedAt = Date.now();
    logger.info("PDF text extraction started", { bytes: buffer.length });
    const result = await pdfParse(buffer);
    logger.info("PDF text extraction completed", {
        bytes: buffer.length,
        pageCount: result.numpages,
        extractedTextLength: result.text?.length ?? 0,
        durationMs: Date.now() - startedAt,
    });
    return {
        pageCount: result.numpages,
        text: result.text.trim(),
    };
}

// ── Thumbnail (pdfjs-dist + canvas — first page rendered as JPEG) ─────────────

export async function generatePdfThumbnail(buffer: Buffer): Promise<Buffer | null> {
    try {
        const startedAt = Date.now();
        logger.info("PDF thumbnail generation started", { bytes: buffer.length });
        // Dynamic imports keep startup fast and allow graceful failure
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const { createCanvas } = await import('canvas');

        // No worker thread in Node
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';

        const pdfDoc = await pdfjsLib
            .getDocument({ data: new Uint8Array(buffer), verbosity: 0 })
            .promise;
        const page = await pdfDoc.getPage(1);

        // Scale to ~400px wide thumbnail
        const THUMBNAIL_WIDTH = 400;
        const unscaled = page.getViewport({ scale: 1 });
        const scale = THUMBNAIL_WIDTH / unscaled.width;
        const viewport = page.getViewport({ scale });

        const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
        // canvas context is compatible enough for pdfjs rendering
        const ctx = canvas.getContext('2d') as unknown as Parameters<typeof page.render>[0]['canvasContext'];

        const canvasFactory = {
            create(w: number, h: number) {
                const c = createCanvas(w, h);
                return { canvas: c, context: c.getContext('2d') as unknown };
            },
            reset(pair: { canvas: { width: number; height: number } }, w: number, h: number) {
                pair.canvas.width = w;
                pair.canvas.height = h;
            },
            destroy(pair: { canvas: { width: number; height: number } }) {
                pair.canvas.width = 0;
                pair.canvas.height = 0;
            },
        };

        await page.render({ canvasContext: ctx, viewport, canvasFactory } as unknown as Parameters<typeof page.render>[0]).promise;

        await pdfDoc.destroy();

        const thumbnail = (canvas as unknown as { toBuffer(type: string, config?: object): Buffer }).toBuffer('image/jpeg', { quality: 0.85 });
        logger.info("PDF thumbnail generation completed", {
            sourceBytes: buffer.length,
            thumbnailBytes: thumbnail.length,
            durationMs: Date.now() - startedAt,
        });
        return thumbnail;
    } catch {
        // Thumbnail generation is best-effort; never block the upload
        logger.warn("PDF thumbnail generation failed (best-effort)");
        return null;
    }
}
