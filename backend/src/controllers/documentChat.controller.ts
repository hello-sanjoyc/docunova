import { FastifyRequest, FastifyReply } from "fastify";
import { streamDocumentChat, getChatHistory } from "../services/documentChat.service";
import { successResponse } from "../utils/response";
import { createLogger } from "../config/logger";
import env from "../config/env";

interface DocumentIdParams {
    documentId: string;
}

interface ChatBody {
    query: string;
}

// POST /ai/chat/:documentId
// Streams an SSE response: data: {"token":"..."}\n\n  ...  data: {"done":true,"pages":[...]}\n\n
export async function documentChat(
    request: FastifyRequest<{ Params: DocumentIdParams; Body: ChatBody }>,
    reply: FastifyReply,
) {
    const logger = createLogger({
        context: "document-chat-controller",
        requestId: request.id,
        userId: request.user.userId,
        documentUuid: request.params.documentId,
    });

    const { query } = request.body;
    if (!query?.trim()) {
        return reply
            .status(400)
            .send({ success: false, message: "query is required" });
    }

    logger.info("Document chat stream requested", {
        queryLength: query.length,
    });

    // Hijack the response so Fastify does not attempt reply.send() after the
    // handler returns — calling reply.raw.writeHead() and reply.raw.end()
    // directly would otherwise cause a "headers already sent" crash that resets
    // the TCP connection before the browser receives anything.
    reply.hijack();

    // SSE headers — CORS must be set manually because the @fastify/cors plugin
    // sets headers via reply.header() which is flushed by Fastify's own send
    // path, not by our raw writeHead call.
    const origin = request.headers.origin ?? "";
    reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": origin || env.CORS_ORIGIN,
        "Access-Control-Allow-Credentials": "true",
    });

    const write = (payload: unknown) => {
        reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
        await streamDocumentChat(
            request.params.documentId,
            request.user.userId,
            query.trim(),
            {
                onToken: (token) => write({ token }),
                onDone: (_fullText, pages) => {
                    write({ done: true, pages });
                    reply.raw.end();
                    logger.info("Document chat stream ended");
                },
                onError: (err) => {
                    logger.error("Document chat stream error", { err });
                    write({ error: err.message });
                    reply.raw.end();
                },
            },
        );
    } catch (err) {
        logger.error("Document chat handler error", { err });
        const message = err instanceof Error ? err.message : "Internal error";
        write({ error: message });
        reply.raw.end();
    }
}

// GET /ai/chat/:documentId/history
export async function chatHistory(
    request: FastifyRequest<{ Params: DocumentIdParams }>,
    reply: FastifyReply,
) {
    const messages = await getChatHistory(
        request.params.documentId,
        request.user.userId,
    );
    reply.send(successResponse("Chat history fetched", messages));
}
