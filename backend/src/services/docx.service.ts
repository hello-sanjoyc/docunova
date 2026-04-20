import mammoth from "mammoth";
import JSZip from "jszip";
import { createLogger } from "../config/logger";

const logger = createLogger({ context: "docx-service" });

export interface DocxData {
    pageCount: number;
    text: string;
}

// ── Text extraction (mammoth) ────────────────────────────────────────────────

async function extractText(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || "").trim();
}

// ── Page count from docProps/app.xml (written by Word on save) ───────────────

async function extractPageCountFromZip(buffer: Buffer): Promise<number | null> {
    try {
        const zip = await JSZip.loadAsync(buffer);
        const appXml = zip.file("docProps/app.xml");
        if (!appXml) return null;
        const xml = await appXml.async("string");
        const match = xml.match(/<Pages>(\d+)<\/Pages>/);
        if (match) return parseInt(match[1], 10);
        return null;
    } catch {
        return null;
    }
}

// Approximate page count when docProps is absent (new/unopened docx files).
// ~3000 characters per page is a standard Word default (single-spaced, 11pt).
function approximatePageCount(text: string): number {
    if (!text) return 0;
    const CHARS_PER_PAGE = 3000;
    return Math.max(1, Math.ceil(text.length / CHARS_PER_PAGE));
}

export async function extractDocxData(buffer: Buffer): Promise<DocxData> {
    const startedAt = Date.now();
    logger.info("DOCX extraction started", { bytes: buffer.length });

    const [text, metaPageCount] = await Promise.all([
        extractText(buffer),
        extractPageCountFromZip(buffer),
    ]);

    const pageCount = metaPageCount ?? approximatePageCount(text);
    logger.info("DOCX extraction completed", {
        bytes: buffer.length,
        pageCount,
        pageCountSource: metaPageCount !== null ? "metadata" : "approximation",
        extractedTextLength: text.length,
        durationMs: Date.now() - startedAt,
    });

    return { pageCount, text };
}
