import OpenAI from 'openai';
import prisma from '../config/prisma';
import env from '../config/env';
import { createLogger } from '../config/logger';

const CHUNK_SIZE = 3000;
const CHUNK_OVERLAP = 200;
const MAX_HISTORY_TURNS = 8;
const SMALL_DOC_THRESHOLD = 15_000;
const TOP_CHUNKS = 5;

const logger = createLogger({ context: 'document-chat-service' });

// ── Chunking ──────────────────────────────────────────────────────────────────

function buildChunks(
    text: string,
    pageTextJson: unknown,
    totalPages: number | null,
): Array<{ content: string; startChar: number; endChar: number; pageNumber: number | null }> {
    const chunks: Array<{ content: string; startChar: number; endChar: number; pageNumber: number | null }> = [];

    // Build a char-offset → page-number lookup from page_text_json when available
    // (OCR worker currently stores [] so this path is effectively unused for now)
    const pageOffsets: Array<{ start: number; end: number; page: number }> = [];
    if (Array.isArray(pageTextJson) && pageTextJson.length > 0) {
        let offset = 0;
        for (let i = 0; i < pageTextJson.length; i++) {
            const item = pageTextJson[i];
            // Support both plain-string arrays and {text:"..."} object arrays
            const pageText = typeof item === 'string' ? item : String((item as Record<string, unknown>)?.text ?? '');
            if (pageText.length > 0) {
                pageOffsets.push({ start: offset, end: offset + pageText.length, page: i + 1 });
                offset += pageText.length;
            }
        }
    }

    function pageForOffset(charPos: number): number | null {
        // Prefer exact per-page offsets
        if (pageOffsets.length > 0) {
            for (const po of pageOffsets) {
                if (charPos >= po.start && charPos < po.end) return po.page;
            }
            return pageOffsets[pageOffsets.length - 1]?.page ?? null;
        }

        // Fallback: proportional estimate from total page count
        if (totalPages && totalPages > 0 && text.length > 0) {
            return Math.max(1, Math.ceil((charPos / text.length) * totalPages));
        }

        return null;
    }

    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + CHUNK_SIZE, text.length);
        const content = text.slice(start, end);
        chunks.push({
            content,
            startChar: start,
            endChar: end,
            pageNumber: pageForOffset(start),
        });
        if (end === text.length) break;
        start = end - CHUNK_OVERLAP;
    }

    return chunks;
}

export async function chunkDocument(documentUuid: string, userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { uuid: userId },
        select: { id: true },
    });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const doc = await prisma.document.findUnique({
        where: { uuid: documentUuid },
        select: { id: true, ownerUserId: true, status: true, metadataJson: true, pageCount: true },
    });
    if (!doc || !doc) throw Object.assign(new Error('Document not found'), { statusCode: 404 });
    if (doc.ownerUserId !== user.id) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

    // Wait for text to be available — if still PROCESSING, throw so BullMQ retries
    const ocrResult = await prisma.documentOcrResult.findUnique({
        where: { documentId: doc.id },
        select: { extractedText: true, pageTextJson: true },
    });

    const fullText =
        ocrResult?.extractedText?.trim() ||
        ((doc.metadataJson as Record<string, unknown>)?.textSnippet as string | undefined)?.trim() ||
        '';

    if (!fullText) {
        logger.warn('No text available yet for chunking, will retry', { documentUuid });
        throw new Error('Document text not ready yet');
    }

    logger.info('Chunking document', { documentUuid, textLength: fullText.length });

    const rawChunks = buildChunks(fullText, ocrResult?.pageTextJson ?? null, doc.pageCount ?? null);

    // Replace all existing chunks then insert fresh
    await prisma.documentChunk.deleteMany({ where: { documentId: doc.id } });

    await prisma.documentChunk.createMany({
        data: rawChunks.map((c, idx) => ({
            documentId: doc.id,
            chunkIndex: idx,
            content: c.content,
            pageNumber: c.pageNumber,
            startChar: c.startChar,
            endChar: c.endChar,
        })),
    });

    logger.info('Chunking completed', { documentUuid, chunkCount: rawChunks.length });
}

// ── Retrieval ─────────────────────────────────────────────────────────────────

function scoreChunk(content: string, query: string): number {
    const queryWords = query
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 2);
    const lowerContent = content.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
        let pos = 0;
        while ((pos = lowerContent.indexOf(word, pos)) !== -1) {
            score += 1;
            pos += word.length;
        }
    }
    return score;
}

interface ContextResult {
    contextText: string;
    sourcePages: number[];
    usingFullText: boolean;
}

export async function buildContext(
    documentId: bigint,
    query: string,
): Promise<ContextResult> {
    // Check if we have chunks
    const chunkCount = await prisma.documentChunk.count({ where: { documentId } });

    if (chunkCount === 0) {
        // Fall back to raw text from OCR / metadataJson
        const ocrResult = await prisma.documentOcrResult.findUnique({
            where: { documentId },
            select: { extractedText: true },
        });
        const doc = await prisma.document.findUnique({
            where: { id: documentId },
            select: { metadataJson: true },
        });
        const rawText =
            ocrResult?.extractedText?.trim() ||
            ((doc?.metadataJson as Record<string, unknown>)?.textSnippet as string | undefined)?.trim() ||
            '';
        return { contextText: rawText.slice(0, SMALL_DOC_THRESHOLD), sourcePages: [], usingFullText: true };
    }

    const chunks = await prisma.documentChunk.findMany({
        where: { documentId },
        select: { content: true, pageNumber: true, chunkIndex: true },
        orderBy: { chunkIndex: 'asc' },
    });

    // For small documents use full text
    const totalChars = chunks.reduce((sum, c) => sum + c.content.length, 0);
    if (totalChars <= SMALL_DOC_THRESHOLD) {
        const contextText = chunks.map((c) => c.content).join('\n\n');
        const pages = [...new Set(chunks.map((c) => c.pageNumber).filter((p): p is number => p !== null))];
        return { contextText, sourcePages: pages, usingFullText: true };
    }

    // Score and pick top N chunks
    const scored = chunks
        .map((c) => ({ ...c, score: scoreChunk(c.content, query) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_CHUNKS)
        .sort((a, b) => a.chunkIndex - b.chunkIndex);

    const contextText = scored.map((c) => c.content).join('\n\n---\n\n');
    const sourcePages = [
        ...new Set(scored.map((c) => c.pageNumber).filter((p): p is number => p !== null)),
    ].sort((a, b) => a - b);

    return { contextText, sourcePages, usingFullText: false };
}

// ── Chat history ──────────────────────────────────────────────────────────────

export async function saveMessage(
    documentId: bigint,
    userId: bigint,
    role: 'user' | 'assistant',
    content: string,
): Promise<void> {
    await prisma.documentChatMessage.create({
        data: { documentId, userId, role, content },
    });
}

export async function getRecentHistory(
    documentId: bigint,
    userId: bigint,
): Promise<Array<{ role: string; content: string }>> {
    const messages = await prisma.documentChatMessage.findMany({
        where: { documentId, userId },
        orderBy: { createdAt: 'desc' },
        take: MAX_HISTORY_TURNS * 2,
        select: { role: true, content: true },
    });
    return messages.reverse();
}

// ── Streaming chat ────────────────────────────────────────────────────────────

let _openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
    if (!_openaiClient) {
        _openaiClient = new OpenAI({
            apiKey: env.AI_MODEL_API_KEY,
            baseURL: env.AI_BASE_URL ?? undefined,
        });
    }
    return _openaiClient;
}

const CHAT_SYSTEM_PROMPT = `You are Nova, an intelligent document assistant.
You answer questions strictly based on the document context provided.
Always be concise and factual.
If the answer isn't in the context, say: "I couldn't find that information in the document."
Format your response in markdown when helpful (bold key terms, use bullet lists for multiple items).
Do NOT add any page number, source, or citation at the end of your response — the system will append that automatically.`;

export interface ChatStreamCallbacks {
    onToken: (token: string) => void;
    onDone: (fullText: string, sourcePages: number[]) => void;
    onError: (err: Error) => void;
}

export async function streamDocumentChat(
    documentUuid: string,
    userId: string,
    query: string,
    callbacks: ChatStreamCallbacks,
): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { uuid: userId },
        select: { id: true },
    });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const doc = await prisma.document.findUnique({
        where: { uuid: documentUuid },
        select: { id: true, ownerUserId: true, title: true },
    });
    if (!doc) throw Object.assign(new Error('Document not found'), { statusCode: 404 });
    if (doc.ownerUserId !== user.id) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

    const [context, history] = await Promise.all([
        buildContext(doc.id, query),
        getRecentHistory(doc.id, user.id),
    ]);

    const contextBlock = context.contextText
        ? `<document_context>\n${context.contextText}\n</document_context>`
        : '<document_context>No text content available for this document yet.</document_context>';

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        {
            role: 'user',
            content: `Document: "${doc.title}"\n\n${contextBlock}`,
        },
        { role: 'assistant', content: 'Understood. I have reviewed the document context. How can I help you?' },
        ...history.map((h) => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
        })),
        { role: 'user', content: query },
    ];

    // Save the user message before streaming
    await saveMessage(doc.id, user.id, 'user', query);

    const client = getClient();
    let fullText = '';

    try {
        const stream = await client.chat.completions.create({
            model: env.AI_MODEL_NAME,
            messages,
            temperature: 0.3,
            stream: true,
        });

        for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content ?? '';
            if (token) {
                fullText += token;
                callbacks.onToken(token);
            }
        }

        // Append source citation if not already present
        if (context.sourcePages.length > 0 && !context.usingFullText) {
            const citation = `\n\nSource: Page ${context.sourcePages.join(', ')}`;
            if (!fullText.includes('Source:')) {
                fullText += citation;
                callbacks.onToken(citation);
            }
        }

        await saveMessage(doc.id, user.id, 'assistant', fullText);
        callbacks.onDone(fullText, context.sourcePages);
    } catch (err) {
        callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
}
