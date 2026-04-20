import OpenAI from "openai";
import env from "../config/env";
import { createLogger } from "../config/logger";

// ── Provider base URLs ────────────────────────────────────────────────────────

const PROVIDER_BASE_URLS: Record<string, string> = {
    groq: "https://api.groq.com/openai/v1",
    openai: "https://api.openai.com/v1",
};
const logger = createLogger({ context: "ai-service" });

// ── Summary schema (mirrors the requested response shape) ─────────────────────

export interface RiskItem {
    title: string;
    severity: "low" | "medium" | "high";
    details: string;
    clause_reference: string | null;
}

export interface ActionItem {
    title: string;
    priority: "low" | "medium" | "high";
    details: string;
}

export interface DocumentSummary {
    document_title: string | null;
    parties: string | null;
    effective_date: string | null;
    obligations: string | null;
    payment: string | null;
    red_flags: string | null;
    actions: string | null;
    summary: string;
    risk_items: RiskItem[];
    action_items: ActionItem[];
    notes: string[];
}

// ── Provider wrapper ──────────────────────────────────────────────────────────
//
// Routes the completion call to the correct provider based on AI_PROVIDER.
// Both OpenAI and Groq use the same OpenAI-compatible SDK interface; only the
// base URL and feature availability (e.g. json_object mode) differ.
//
// Add a new branch here when a new provider is needed.

interface CallOptions {
    systemPrompt: string;
    userMessage: string;
    temperature?: number;
}

function extractBalancedJsonObject(input: string): string | null {
    const start = input.indexOf("{");
    if (start < 0) return null;

    let depth = 0;
    let inString = false;
    let isEscaped = false;

    for (let i = start; i < input.length; i += 1) {
        const ch = input[i];

        if (inString) {
            if (isEscaped) {
                isEscaped = false;
                continue;
            }
            if (ch === "\\") {
                isEscaped = true;
                continue;
            }
            if (ch === '"') {
                inString = false;
            }
            continue;
        }

        if (ch === '"') {
            inString = true;
            continue;
        }

        if (ch === "{") {
            depth += 1;
            continue;
        }

        if (ch === "}") {
            depth -= 1;
            if (depth === 0) {
                return input.slice(start, i + 1);
            }
        }
    }

    return null;
}

function parseModelJson(raw: string): Partial<DocumentSummary> {
    const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

    try {
        return JSON.parse(cleaned) as Partial<DocumentSummary>;
    } catch {
        // Fallback for model responses like:
        // "Here is the JSON summary: { ... }"
        const extracted = extractBalancedJsonObject(cleaned);
        if (!extracted)
            throw new Error("No valid JSON object found in model output");
        return JSON.parse(extracted) as Partial<DocumentSummary>;
    }
}

async function callAiModel(options: CallOptions): Promise<string> {
    const provider = env.AI_PROVIDER;

    // Resolve base URL: explicit override → provider default → SDK default (OpenAI)
    const baseURL =
        env.AI_BASE_URL ?? PROVIDER_BASE_URLS[provider] ?? undefined;

    const client = new OpenAI({ apiKey: env.AI_MODEL_API_KEY, baseURL });
    logger.info("AI model call started", {
        provider,
        model: env.AI_MODEL_NAME,
        hasBaseUrlOverride: Boolean(env.AI_BASE_URL),
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userMessage },
    ];

    // Groq supports json_object mode only on specific models; gate it by provider
    const supportsJsonMode = provider === "openai";

    const startedAt = Date.now();
    const response = await client.chat.completions.create({
        model: env.AI_MODEL_NAME,
        messages,
        temperature: options.temperature ?? 0.2,
        ...(supportsJsonMode
            ? { response_format: { type: "json_object" } }
            : {}),
    });

    logger.info("AI model call completed", {
        provider,
        model: env.AI_MODEL_NAME,
        durationMs: Date.now() - startedAt,
    });

    return response.choices[0]?.message?.content ?? "{}";
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are a legal document analyst.

Analyze the provided document text and return a structured JSON summary.

IMPORTANT:
- You MUST return ONLY valid JSON.
- Do NOT include any text before or after the JSON.
- Do NOT include explanations, markdown, or comments.
- If you violate this, the response will be rejected.

Extraction requirements:
- parties involved
- effective date / term
- key obligations
- payment terms
- red flags (auto-renewal, exclusivity, penalties, vague language, liability issues, etc.)
- recommended business actions
- "summary": a plain-English overview of the document in AT MOST 200 words (never exceed 200 words; aim for 150-200). It must be a single continuous paragraph, cover the document's purpose, parties, main obligations, payment, and notable risks, and be safe to show directly to end users.

Rules:
- Use plain English.
- Be concise but specific.
- Do NOT invent information.
- If unclear, return null and explain briefly in "notes".
- Focus only on commercially important terms.

Output must EXACTLY match this JSON schema:

{
  "document_title": string | null,
  "parties": string | null,
  "effective_date": string | null,
  "obligations": string | null,
  "payment": string | null,
  "red_flags": string | null,
  "actions": string | null,
  "risk_items": [
    {
      "title": string,
      "severity": "low" | "medium" | "high",
      "details": string,
      "clause_reference": string | null
    }
  ],
  "action_items": [
    {
      "title": string,
      "priority": "low" | "medium" | "high",
      "details": string
    }
  ],
  "summary": string,
  "notes": string[]
}

Return ONLY valid JSON.
`;

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateSummary(
    documentText: string,
): Promise<DocumentSummary> {
    logger.info("AI summary generation started", {
        documentTextLength: documentText.length,
        truncatedTo: Math.min(documentText.length, 120_000),
    });
    const raw = await callAiModel({
        systemPrompt: SYSTEM_PROMPT,
        userMessage: `Analyse the following document and return the JSON summary:\n\n${documentText.slice(0, 120_000)}`,
    });

    let parsed: Partial<DocumentSummary>;
    try {
        parsed = parseModelJson(raw);
    } catch (err) {
        logger.error("AI summary parsing failed", {
            rawLength: raw.length,
            cleanedLength: raw
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/\s*```$/, "")
                .trim().length,
            err,
        });
        throw err;
    }

    logger.info("AI summary generation completed", {
        hasParties: Boolean(parsed.parties),
        hasEffectiveDate: Boolean(parsed.effective_date),
        riskItemCount: Array.isArray(parsed.risk_items)
            ? parsed.risk_items.length
            : 0,
        actionItemCount: Array.isArray(parsed.action_items)
            ? parsed.action_items.length
            : 0,
    });

    return {
        document_title: parsed.document_title ?? null,
        parties: parsed.parties ?? null,
        effective_date: parsed.effective_date ?? null,
        obligations: parsed.obligations ?? null,
        payment: parsed.payment ?? null,
        red_flags: parsed.red_flags ?? null,
        actions: parsed.actions ?? null,
        summary: enforceWordLimit(parsed.summary ?? "", 200),
        risk_items: Array.isArray(parsed.risk_items) ? parsed.risk_items : [],
        action_items: Array.isArray(parsed.action_items)
            ? parsed.action_items
            : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    };
}

// Trim overflow to guarantee the <=200 word contract even if the model overshoots.
function enforceWordLimit(text: string, maxWords: number): string {
    const normalized = (text || "").replace(/\s+/g, " ").trim();
    if (!normalized) return "";
    const words = normalized.split(" ");
    if (words.length <= maxWords) return normalized;
    return `${words.slice(0, maxWords).join(" ")}…`;
}
