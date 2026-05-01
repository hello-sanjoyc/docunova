// ── Document classifier ──────────────────────────────────────────────────────
// Scores extracted text against a weighted phrase dictionary and returns the
// highest-scoring label (or null if nothing meets the minimum score).

export type ClassificationKey =
    | "NDA"
    | "LEASE"
    | "EMPLOYMENT"
    | "VENDOR"
    | "SAAS"
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
    CIVIL_CASE: "Civil Case",
    CRIMINAL_CASE: "Criminal Case",
    UNKNOWN: "Scanned Document",
};

const DICTIONARY: Record<ClassificationKey, Term[]> = {
    NDA: [
        { phrase: "confidential information", weight: 4 },
        { phrase: "non-disclosure", weight: 4 },
        { phrase: "proprietary information", weight: 3 },
        { phrase: "receiving party", weight: 2 },
        { phrase: "disclosing party", weight: 2 },
        { phrase: "permitted use", weight: 2 },
        { phrase: "return or destroy", weight: 3 },
        { phrase: "exceptions to confidentiality", weight: 4 },
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
        { phrase: "compensation", weight: 2 },
        { phrase: "civil suit", weight: 5 },
        { phrase: "title suit", weight: 5 },
        { phrase: "money suit", weight: 5 },
        { phrase: "partition suit", weight: 5 },
        { phrase: "affidavit", weight: 3 },
        { phrase: "verification", weight: 3 },
        { phrase: "decree", weight: 5 },
        { phrase: "judgment debtor", weight: 4 },
        { phrase: "execution case", weight: 5 },
        { phrase: "schedule property", weight: 5 },
        { phrase: "mesne profits", weight: 5 },
        { phrase: "court fee", weight: 3 },
        { phrase: "summons", weight: 3 },
        { phrase: "appearance", weight: 2 },
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
    // UNKNOWN has no terms — it is only used as a placeholder for scanned docs
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
const COMPILED_DICTIONARY: Record<ClassificationKey, CompiledTerm[]> = Object.fromEntries(
    (Object.keys(DICTIONARY) as ClassificationKey[]).map((key) => [
        key,
        DICTIONARY[key].map((term) => ({
            pattern: new RegExp(`\\b${escapeRegex(term.phrase.toLowerCase())}\\b`, "g"),
            weight: term.weight,
        })),
    ]),
) as Record<ClassificationKey, CompiledTerm[]>;

function scoreCategory(normalizedText: string, terms: CompiledTerm[]): { score: number; matches: number } {
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
        const { score, matches } = scoreCategory(normalized, COMPILED_DICTIONARY[key]);
        if (!best || score > best.score) {
            best = { key, label: LABELS[key], score, matches };
        }
    }

    if (!best || best.score < MIN_SCORE) return null;
    return best;
}
