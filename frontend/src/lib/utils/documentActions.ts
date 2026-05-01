import { jsPDF } from "jspdf";
import { toast } from "react-toastify";
import { downloadDocumentFile, type DocumentItem } from "@/lib/api/documents";
import { formatApiError } from "@/lib/api/errors";

export interface SummaryPdfContent {
    parties?: string | null;
    effectiveDate?: string | null;
    obligations?: string | null;
    indemnity?: string | null;
    IP?: string | null;
    confidentiality?: string | null;
    payment?: string | null;
    redFlags?: string | null;
    actions?: string | null;
    summary?: string | null;
    summaryLabel?: string | null;
}

interface BusyActionInput {
    documentId: string;
    setBusyDocumentId?: (value: string | null) => void;
}

interface DownloadInput extends BusyActionInput {
    filename?: string;
}

interface SummaryPdfInput {
    document: DocumentItem;
    content?: SummaryPdfContent;
    footerPrimaryText?: string;
    mode?: "download" | "blob";
}

function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function toMetadataRecord(
    value: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
    if (!value || Array.isArray(value)) return {};
    return value;
}

export function metadataText(
    metadata: Record<string, unknown>,
    keys: string[],
    fallback: string,
) {
    function toLabel(rawKey: string) {
        return rawKey
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    function formatValue(value: unknown): string {
        if (typeof value === "string" && value.trim()) return value.trim();
        if (typeof value === "number" && Number.isFinite(value))
            return String(value);
        if (Array.isArray(value)) {
            const normalized = value
                .map((item) => formatValue(item))
                .filter(Boolean);
            if (normalized.length > 0) return normalized.join(" · ");
            return "";
        }
        if (value && typeof value === "object") {
            const entries = Object.entries(value as Record<string, unknown>)
                .map(([entryKey, entryValue]) => {
                    const formatted = formatValue(entryValue);
                    return formatted
                        ? `${toLabel(entryKey)}: ${formatted}`
                        : "";
                })
                .filter(Boolean);
            if (entries.length > 0) return entries.join(" · ");
        }
        return "";
    }

    for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(metadata, key)) continue;
        const normalized = formatValue(metadata[key]);
        return normalized || fallback;
    }
    return fallback;
}

export async function handleDownload({
    documentId,
    filename,
    setBusyDocumentId,
}: DownloadInput) {
    setBusyDocumentId?.(documentId);
    try {
        const blob = await downloadDocumentFile(documentId);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename || "document";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    } catch (error) {
        toast.error(formatApiError(error));
    } finally {
        setBusyDocumentId?.(null);
    }
}

function buildSummaryContent(
    document: DocumentItem,
    overrides?: SummaryPdfContent,
) {
    const metadata = toMetadataRecord(document.metadataJson);
    const cleanText = (value: unknown): string | undefined => {
        if (typeof value !== "string") return undefined;
        const trimmed = value.trim();
        return trimmed || undefined;
    };
    const resolveText = (
        override: string | null | undefined,
        keys: string[],
    ) => {
        if (override !== undefined) return cleanText(override);
        return cleanText(metadataText(metadata, keys, ""));
    };
    const derivedSummary = metadataText(
        metadata,
        ["summary", "aiSummary", "textSnippet", "textPreview", "extractedText"],
        "",
    );

    return {
        parties: resolveText(overrides?.parties, ["parties", "partyNames"]),
        effectiveDate: resolveText(overrides?.effectiveDate, [
            "effectiveDate",
            "dateRange",
            "term",
        ]),
        obligations: resolveText(overrides?.obligations, [
            "obligations",
            "keyObligations",
        ]),
        indemnity: resolveText(overrides?.indemnity, ["indemnity"]),
        IP: resolveText(overrides?.IP, ["IP", "ip"]),
        confidentiality: resolveText(overrides?.confidentiality, [
            "confidentiality",
        ]),
        payment: resolveText(overrides?.payment, ["payment", "paymentTerms"]),
        redFlags: resolveText(overrides?.redFlags, [
            "redFlags",
            "riskFlags",
            "risks",
        ]),
        actions: resolveText(overrides?.actions, [
            "actions",
            "recommendedActions",
            "nextActions",
        ]),
        summary:
            overrides?.summary !== undefined
                ? cleanText(overrides.summary)
                : cleanText(derivedSummary),
        summaryLabel: cleanText(overrides?.summaryLabel) ?? "Summary",
    };
}

export function handleDownloadSummaryPdf({
    document,
    content,
    footerPrimaryText,
    mode = "download",
}: SummaryPdfInput) {
    try {
        const pdfContent = buildSummaryContent(document, content);

        const pdf = new jsPDF({ unit: "pt", format: "a4" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 24;
        const cardX = margin;
        const cardY = margin;
        const cardW = pageWidth - margin * 2;
        const cardH = pageHeight - margin * 2;
        const contentXPad = 12;
        const footerBlockHeight = 54;
        const c = {
            border: [230, 223, 214] as const,
            text: [42, 36, 31] as const,
            muted: [146, 136, 124] as const,
            redBg: [253, 245, 243] as const,
            redAccent: [207, 93, 72] as const,
            greenBg: [242, 248, 245] as const,
            greenAccent: [77, 154, 116] as const,
            previewBg: [251, 249, 245] as const,
        };

        type SummaryPdfRow = {
            label: string;
            value: string;
            bg?: readonly [number, number, number];
            accent?: readonly [number, number, number];
            labelColor?: readonly [number, number, number];
        };
        type SummaryPdfCandidate = Omit<SummaryPdfRow, "value"> & {
            value?: string;
        };

        const rowCandidates: Array<SummaryPdfCandidate | null> = [
            { label: "Parties", value: pdfContent.parties },
            { label: "Effective Date", value: pdfContent.effectiveDate },
            { label: "Obligations", value: pdfContent.obligations },
            { label: "Indemnity", value: pdfContent.indemnity },
            { label: "IP", value: pdfContent.IP },
            { label: "Confidentiality", value: pdfContent.confidentiality },
            { label: "Payment", value: pdfContent.payment },
            pdfContent.redFlags
                ? {
                      label: "Red Flags",
                      value: pdfContent.redFlags,
                      bg: c.redBg,
                      accent: c.redAccent,
                      labelColor: [195, 74, 53] as const,
                  }
                : null,
            pdfContent.actions
                ? {
                      label: "Actions",
                      value: pdfContent.actions,
                      bg: c.greenBg,
                      accent: c.greenAccent,
                      labelColor: [63, 127, 97] as const,
                  }
                : null,
        ];
        const rowItems = rowCandidates.filter(
            (row): row is SummaryPdfRow => Boolean(row?.value?.trim()),
        );

        if (pdfContent.summary) {
            rowItems.push({
                label: pdfContent.summaryLabel || "Summary",
                value: pdfContent.summary,
                bg: c.previewBg,
            });
        }

        const clamp = (value: number, min: number, max: number) =>
            Math.min(max, Math.max(min, value));
        const baseLayout = {
            labelColW: 126,
            titleFontSize: 14,
            titleLineHeight: 15,
            bodyFontSize: 8.5,
            labelFontSize: 8,
            lineHeight: 11,
            rowTopPad: 8,
            minRowH: 30,
        };
        const getScaledLayout = (scale: number) => {
            const safeScale = clamp(scale, 0.58, 1);
            return {
                labelColW: clamp(baseLayout.labelColW * safeScale, 104, 126),
                titleFontSize: clamp(
                    baseLayout.titleFontSize * safeScale,
                    10,
                    baseLayout.titleFontSize,
                ),
                titleLineHeight: clamp(
                    baseLayout.titleLineHeight * safeScale,
                    11,
                    baseLayout.titleLineHeight,
                ),
                bodyFontSize: clamp(
                    baseLayout.bodyFontSize * safeScale,
                    6.4,
                    baseLayout.bodyFontSize,
                ),
                labelFontSize: clamp(
                    baseLayout.labelFontSize * safeScale,
                    6.2,
                    baseLayout.labelFontSize,
                ),
                lineHeight: clamp(
                    baseLayout.lineHeight * safeScale,
                    8.2,
                    baseLayout.lineHeight,
                ),
                rowTopPad: clamp(baseLayout.rowTopPad * safeScale, 4, 8),
                minRowH: clamp(baseLayout.minRowH * safeScale, 20, 30),
            };
        };

        const filename =
            document.originalFilename || document.title || "Document";
        const minBottomY = cardY + cardH - footerBlockHeight - 10;
        const contentTopY = cardY + 12;
        const contentAvailableHeight = minBottomY - contentTopY;
        const cardTitleMaxW = cardW - 235;

        const estimateTotalHeight = (
            layout: ReturnType<typeof getScaledLayout>,
        ) => {
            const contentMaxW = cardW - layout.labelColW - contentXPad * 2 - 10;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(layout.titleFontSize);
            const titleLines = pdf.splitTextToSize(
                filename,
                cardTitleMaxW,
            ) as string[];
            const titleBlockH =
                8 + titleLines.length * layout.titleLineHeight + 8;

            pdf.setFontSize(layout.bodyFontSize);
            const rowsTotalH = rowItems.reduce((sum, rowItem) => {
                const valueLines = pdf.splitTextToSize(
                    rowItem.value || "-",
                    contentMaxW,
                ) as string[];
                const rowH = Math.max(
                    layout.minRowH,
                    layout.rowTopPad * 2 +
                        valueLines.length * layout.lineHeight,
                );
                return sum + rowH;
            }, 0);

            return titleBlockH + rowsTotalH;
        };

        const baseEstimatedH = estimateTotalHeight(getScaledLayout(1));
        const initialScale =
            baseEstimatedH > contentAvailableHeight
                ? contentAvailableHeight / baseEstimatedH
                : 1;
        const layout = getScaledLayout(initialScale);
        const contentMaxW = cardW - layout.labelColW - contentXPad * 2 - 10;

        pdf.setDrawColor(...c.border);
        pdf.roundedRect(cardX, cardY, cardW, cardH, 16, 16);

        let y = contentTopY;

        const divider = () => {
            pdf.setDrawColor(...c.border);
            pdf.line(cardX, y, cardX + cardW, y);
        };

        const row = (
            label: string,
            value: string,
            rowIndex: number,
            opts?: {
                bg?: readonly [number, number, number];
                accent?: readonly [number, number, number];
                labelColor?: readonly [number, number, number];
            },
        ) => {
            const allValueLines = pdf.splitTextToSize(
                value || "-",
                contentMaxW,
            ) as string[];
            const rowsRemaining = rowItems.length - rowIndex - 1;
            const minHeightNeededForRemaining = rowsRemaining * layout.minRowH;
            const maxHeightForCurrent = Math.max(
                layout.minRowH,
                minBottomY - y - minHeightNeededForRemaining,
            );
            const maxLinesForCurrent = Math.max(
                1,
                Math.floor(
                    (maxHeightForCurrent - layout.rowTopPad * 2) /
                        layout.lineHeight,
                ),
            );
            const valueLines =
                allValueLines.length > maxLinesForCurrent
                    ? [
                          ...allValueLines.slice(0, maxLinesForCurrent - 1),
                          `${allValueLines[maxLinesForCurrent - 1]}...`,
                      ]
                    : allValueLines;
            const rowH = Math.max(
                layout.minRowH,
                layout.rowTopPad * 2 + valueLines.length * layout.lineHeight,
            );
            if (y + rowH > minBottomY) return;

            if (opts?.bg) {
                pdf.setFillColor(...opts.bg);
                pdf.rect(cardX, y, cardW, rowH, "F");
            }
            if (opts?.accent) {
                pdf.setFillColor(...opts.accent);
                pdf.rect(cardX, y, 4, rowH, "F");
            }

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(layout.labelFontSize);
            pdf.setTextColor(...(opts?.labelColor || c.muted));
            const labelLines = pdf.splitTextToSize(
                label.toUpperCase(),
                layout.labelColW - 12,
            ) as string[];
            let ly = y + layout.rowTopPad + layout.lineHeight * 0.75;
            for (const line of labelLines) {
                pdf.text(line, cardX + contentXPad, ly);
                ly += layout.lineHeight;
            }

            pdf.setTextColor(...c.text);
            pdf.setFontSize(layout.bodyFontSize);
            let vy = y + layout.rowTopPad + layout.lineHeight * 0.75;
            for (const line of valueLines) {
                pdf.text(line, cardX + layout.labelColW + contentXPad, vy);
                vy += layout.lineHeight;
            }

            y += rowH;
            divider();
        };

        pdf.setTextColor(...c.text);
        pdf.setFontSize(layout.titleFontSize);
        const titleLines = pdf.splitTextToSize(
            filename,
            cardTitleMaxW,
        ) as string[];
        pdf.text(titleLines, cardX + 15, y + layout.titleLineHeight);
        y += 8 + titleLines.length * layout.titleLineHeight + 8;
        divider();

        rowItems.forEach((rowItem, index) => {
            row(rowItem.label, rowItem.value, index, {
                bg: rowItem.bg,
                accent: rowItem.accent,
                labelColor: rowItem.labelColor,
            });
        });

        const footerY = cardY + cardH - 34;
        pdf.setFont("helvetica", "normal");

        pdf.setFontSize(8);
        pdf.setTextColor(126, 118, 108);
        pdf.text(
            "Generated via DocuNova AI (https://docunova.app)",
            cardX + 16,
            footerY + 16,
        );

        const baseName =
            (document.originalFilename || document.title || "document")
                .replace(/\.[^/.]+$/, "")
                .replace(/[^\w.-]+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "") || "document";
        const outputFilename = `${baseName}-summary.pdf`;
        if (mode === "blob") {
            const blob = pdf.output("blob");
            return { blob, filename: outputFilename };
        }

        pdf.save(outputFilename);
        return null;
    } catch {
        toast.error("Failed to generate summary PDF");
        return null;
    }
}
