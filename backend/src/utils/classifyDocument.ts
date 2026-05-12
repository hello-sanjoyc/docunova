// ── Document classifier ──────────────────────────────────────────────────────
// Scores extracted text against a weighted phrase dictionary and returns the
// highest-scoring label (or null if nothing meets the minimum score).

export type ClassificationKey =
    | "NDA"
    | "LEASE"
    | "EMPLOYMENT"
    | "VENDOR"
    | "SAAS"
    | "TENDER"
    | "CIVIL_CASE"
    | "CRIMINAL_CASE"
    | "UNKNOWN";

export interface ClassificationResult {
    key: ClassificationKey;
    label: string;
    score: number;
    matches: number;
}

interface Term {
    phrase: string;
    weight: number;
}

// Minimum aggregated score required to consider a document classified. Tuned
// to avoid mis-labeling unrelated documents that incidentally match 1-2 common
// words (e.g. "termination", "compensation").
const MIN_SCORE = 8;

export const LABELS: Record<ClassificationKey, string> = {
    NDA: "NDA (Non-Disclosure Agreement)",
    LEASE: "Lease Agreement",
    EMPLOYMENT: "Employment Contract",
    VENDOR: "Vendor / Service Agreement",
    SAAS: "SaaS / Terms of Service",
    TENDER: "Tender Document",
    CIVIL_CASE: "Civil Case",
    CRIMINAL_CASE: "Criminal Case",
    UNKNOWN: "Scanned Document",
};

const DICTIONARY: Record<ClassificationKey, Term[]> = {
    NDA: [
        { phrase: "confidential information", weight: 4 },
        { phrase: "non-disclosure", weight: 4 },
        { phrase: "non disclosure agreement", weight: 6 },
        { phrase: "proprietary information", weight: 3 },
        { phrase: "receiving party", weight: 2 },
        { phrase: "disclosing party", weight: 2 },
        { phrase: "permitted use", weight: 2 },
        { phrase: "return or destroy", weight: 3 },
        { phrase: "exceptions to confidentiality", weight: 4 },
        { phrase: "trade secrets", weight: 5 },
        { phrase: "confidentiality obligations", weight: 5 },
        { phrase: "confidential materials", weight: 4 },
        { phrase: "unauthorized disclosure", weight: 5 },
        { phrase: "need to know basis", weight: 4 },
        { phrase: "mutual confidentiality", weight: 5 },
        { phrase: "confidentiality period", weight: 5 },
        { phrase: "survival of confidentiality", weight: 4 },
    ],

    LEASE: [
        { phrase: "landlord", weight: 4 },
        { phrase: "tenant", weight: 4 },
        { phrase: "premises", weight: 4 },
        { phrase: "rent", weight: 3 },
        { phrase: "security deposit", weight: 3 },
        { phrase: "lease term", weight: 3 },
        { phrase: "subletting", weight: 2 },
        { phrase: "possession", weight: 2 },
        { phrase: "maintenance", weight: 2 },
        { phrase: "rental agreement", weight: 5 },
        { phrase: "monthly rent", weight: 4 },
        { phrase: "lessee", weight: 5 },
        { phrase: "lessor", weight: 5 },
        { phrase: "eviction", weight: 5 },
        { phrase: "rent escalation", weight: 5 },
        { phrase: "registered lease deed", weight: 6 },
        { phrase: "leave and license", weight: 5 },
        { phrase: "lock-in period", weight: 4 },
        { phrase: "utility charges", weight: 3 },
    ],

    EMPLOYMENT: [
        { phrase: "employee", weight: 4 },
        { phrase: "employer", weight: 4 },
        { phrase: "salary", weight: 3 },
        { phrase: "compensation", weight: 3 },
        { phrase: "benefits", weight: 2 },
        { phrase: "notice period", weight: 3 },
        { phrase: "termination", weight: 2 },
        { phrase: "non-compete", weight: 3 },
        { phrase: "non-solicitation", weight: 3 },
        { phrase: "employment agreement", weight: 6 },
        { phrase: "appointment letter", weight: 5 },
        { phrase: "offer letter", weight: 5 },
        { phrase: "joining date", weight: 4 },
        { phrase: "probation period", weight: 5 },
        { phrase: "ctc", weight: 5 },
        { phrase: "gross salary", weight: 5 },
        { phrase: "leave policy", weight: 4 },
        { phrase: "resignation", weight: 4 },
        { phrase: "termination for cause", weight: 5 },
    ],

    VENDOR: [
        { phrase: "services", weight: 3 },
        { phrase: "scope of work", weight: 4 },
        { phrase: "deliverables", weight: 4 },
        { phrase: "payment terms", weight: 3 },
        { phrase: "invoice", weight: 2 },
        { phrase: "milestones", weight: 3 },
        { phrase: "service levels", weight: 3 },
        { phrase: "acceptance criteria", weight: 3 },
        { phrase: "statement of work", weight: 6 },
        { phrase: "sow", weight: 5 },
        { phrase: "purchase order", weight: 4 },
        { phrase: "work order", weight: 4 },
        { phrase: "professional services", weight: 5 },
        { phrase: "support services", weight: 4 },
        { phrase: "turnaround time", weight: 4 },
        { phrase: "penalty clause", weight: 5 },
        { phrase: "liquidated damages", weight: 5 },
        { phrase: "change request", weight: 4 },
    ],

    SAAS: [
        { phrase: "subscription", weight: 4 },
        { phrase: "license", weight: 4 },
        { phrase: "user account", weight: 3 },
        { phrase: "usage restrictions", weight: 3 },
        { phrase: "auto-renewal", weight: 3 },
        { phrase: "billing cycle", weight: 3 },
        { phrase: "service availability", weight: 3 },
        { phrase: "api usage", weight: 2 },
        { phrase: "data processing", weight: 3 },
        { phrase: "software as a service", weight: 7 },
        { phrase: "hosted service", weight: 5 },
        { phrase: "cloud platform", weight: 4 },
        { phrase: "uptime", weight: 4 },
        { phrase: "service credits", weight: 5 },
        { phrase: "authorized users", weight: 4 },
        { phrase: "account suspension", weight: 5 },
        { phrase: "subscription fees", weight: 5 },
        { phrase: "data retention", weight: 5 },
        { phrase: "service level agreement", weight: 5 },
        { phrase: "sla", weight: 5 },
    ],

    TENDER: [
        { phrase: "tender", weight: 4 },
        { phrase: "bid", weight: 4 },
        { phrase: "proposal", weight: 3 },
        { phrase: "evaluation", weight: 3 },
        { phrase: "request for proposal", weight: 7 },
        { phrase: "rfp", weight: 7 },
        { phrase: "request for quotation", weight: 7 },
        { phrase: "rfq", weight: 7 },
        { phrase: "eligibility criteria", weight: 5 },
        { phrase: "technical bid", weight: 6 },
        { phrase: "financial bid", weight: 6 },
        { phrase: "emd", weight: 6 },
        { phrase: "earnest money deposit", weight: 6 },
        { phrase: "bid security", weight: 5 },
        { phrase: "corrigendum", weight: 5 },
        { phrase: "lowest bidder", weight: 5 },
        { phrase: "tender notice", weight: 6 },
    ],

    CIVIL_CASE: [
        { phrase: "plaintiff", weight: 4 },
        { phrase: "defendant", weight: 4 },
        { phrase: "petitioner", weight: 3 },
        { phrase: "respondent", weight: 3 },
        { phrase: "plaint", weight: 5 },
        { phrase: "written statement", weight: 5 },
        { phrase: "cause of action", weight: 5 },
        { phrase: "relief sought", weight: 4 },
        { phrase: "injunction", weight: 4 },
        { phrase: "permanent injunction", weight: 5 },
        { phrase: "temporary injunction", weight: 5 },
        { phrase: "specific performance", weight: 5 },
        { phrase: "declaration", weight: 4 },
        { phrase: "damages", weight: 4 },
        { phrase: "civil suit", weight: 5 },
        { phrase: "title suit", weight: 5 },
        { phrase: "money suit", weight: 5 },
        { phrase: "partition suit", weight: 5 },
        { phrase: "decree", weight: 5 },
        { phrase: "execution case", weight: 5 },
        { phrase: "schedule property", weight: 5 },
        { phrase: "mesne profits", weight: 5 },
        { phrase: "civil procedure code", weight: 4 },
        { phrase: "cpc", weight: 4 },
    ],

    CRIMINAL_CASE: [
        { phrase: "accused", weight: 5 },
        { phrase: "complainant", weight: 4 },
        { phrase: "prosecution", weight: 4 },
        { phrase: "first information report", weight: 6 },
        { phrase: "fir", weight: 6 },
        { phrase: "charge sheet", weight: 6 },
        { phrase: "investigation", weight: 4 },
        { phrase: "offence", weight: 4 },
        { phrase: "punishable", weight: 4 },
        { phrase: "bail", weight: 5 },
        { phrase: "anticipatory bail", weight: 6 },
        { phrase: "regular bail", weight: 5 },
        { phrase: "custody", weight: 4 },
        { phrase: "judicial custody", weight: 5 },
        { phrase: "police custody", weight: 5 },
        { phrase: "arrest", weight: 5 },
        { phrase: "remand", weight: 5 },
        { phrase: "cognizance", weight: 5 },
        { phrase: "magistrate", weight: 4 },
        { phrase: "sessions court", weight: 4 },
        { phrase: "witness", weight: 3 },
        { phrase: "cross-examination", weight: 4 },
        { phrase: "evidence", weight: 3 },
        { phrase: "conviction", weight: 5 },
        { phrase: "acquittal", weight: 5 },
        { phrase: "sentence", weight: 5 },
        { phrase: "criminal revision", weight: 5 },
        { phrase: "criminal appeal", weight: 5 },
        { phrase: "criminal procedure code", weight: 5 },
        { phrase: "crpc", weight: 5 },
        { phrase: "indian penal code", weight: 5 },
        { phrase: "ipc", weight: 5 },
        { phrase: "police station", weight: 4 },
        { phrase: "case diary", weight: 4 },
        { phrase: "seizure list", weight: 4 },
    ],

    UNKNOWN: [],
};

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface CompiledTerm {
    pattern: RegExp;
    weight: number;
}

// Pre-compiled at module load — avoids recreating RegExp objects on every document classification call.
const COMPILED_DICTIONARY: Record<ClassificationKey, CompiledTerm[]> =
    Object.fromEntries(
        (Object.keys(DICTIONARY) as ClassificationKey[]).map((key) => [
            key,
            DICTIONARY[key].map((term) => ({
                pattern: new RegExp(
                    `\\b${escapeRegex(term.phrase.toLowerCase())}\\b`,
                    "g",
                ),
                weight: term.weight,
            })),
        ]),
    ) as Record<ClassificationKey, CompiledTerm[]>;

function scoreCategory(
    normalizedText: string,
    terms: CompiledTerm[],
): { score: number; matches: number } {
    let score = 0;
    let matches = 0;
    for (const term of terms) {
        term.pattern.lastIndex = 0;
        const hits = normalizedText.match(term.pattern);
        if (hits && hits.length > 0) {
            score += term.weight * hits.length;
            matches += hits.length;
        }
    }
    return { score, matches };
}

export function classifyDocument(text: string): ClassificationResult | null {
    if (!text || text.trim().length === 0) return null;
    const normalized = text.toLowerCase();

    let best: ClassificationResult | null = null;
    for (const key of Object.keys(COMPILED_DICTIONARY) as ClassificationKey[]) {
        const { score, matches } = scoreCategory(
            normalized,
            COMPILED_DICTIONARY[key],
        );
        if (!best || score > best.score) {
            best = { key, label: LABELS[key], score, matches };
        }
    }

    if (!best || best.score < MIN_SCORE) return null;
    return best;
}
