import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Contract Brief ───────────────────────────────────────────────────────────

export interface ContractBrief {
    parties: string;
    effectiveDate: string;
    obligations: string;
    payment: string;
    penalties: string;
    renewalTerms: string;
    redFlags: string[];
    recommendedActions: string[];
}

const BRIEF_SYSTEM_PROMPT = `You are an expert contract analyst. Given contract text, extract the following fields and return ONLY valid JSON matching this schema exactly — no markdown, no explanation:

{
  "parties": "string — names of all parties",
  "effectiveDate": "string — contract start/end dates and duration",
  "obligations": "string — key obligations of each party",
  "payment": "string — payment amounts, schedule, and late fees",
  "penalties": "string — penalties, termination clauses, and damages",
  "renewalTerms": "string — auto-renewal, notice periods, exit options",
  "redFlags": ["array of concise strings, each a specific risk or trap"],
  "recommendedActions": ["array of concise strings, each an actionable recommendation"]
}

If a field is not present in the contract, use null or an empty array. Be precise and factual.`;

export async function analyzeContract(text: string): Promise<ContractBrief> {
    const truncated = text.slice(0, 90_000); // stay within context limits

    const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: BRIEF_SYSTEM_PROMPT,
        messages: [
            {
                role: "user",
                content: `Analyze this contract and return the JSON brief:\n\n${truncated}`,
            },
        ],
    });

    const raw =
        message.content[0].type === "text" ? message.content[0].text : "";

    // Strip any accidental markdown fences
    const json = raw
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();

    const parsed = JSON.parse(json) as Partial<ContractBrief>;
    return {
        parties: parsed.parties ?? "",
        effectiveDate: parsed.effectiveDate ?? "",
        obligations: parsed.obligations ?? "",
        payment: parsed.payment ?? "",
        penalties: parsed.penalties ?? "",
        renewalTerms: parsed.renewalTerms ?? "",
        redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
        recommendedActions: Array.isArray(parsed.recommendedActions)
            ? parsed.recommendedActions
            : [],
    };
}

// ─── Follow-up Question ───────────────────────────────────────────────────────

export async function answerQuestion(
    contractText: string,
    brief: ContractBrief,
    question: string,
): Promise<string> {
    const truncated = contractText.slice(0, 80_000);

    const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: "You are an expert contract analyst helping a user understand their contract. Answer concisely and accurately, citing specific contract language where relevant. Do not give legal advice — note when professional counsel is recommended.",
        messages: [
            {
                role: "user",
                content: `Contract summary:\n${JSON.stringify(brief, null, 2)}\n\nFull contract text:\n${truncated}\n\nUser question: ${question}`,
            },
        ],
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
}
