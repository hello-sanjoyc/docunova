"use client";

/**
 * UploadZone
 *
 * Drag-and-drop / click-to-browse file picker for contract uploads.
 *
 * State machine (3 states, not booleans — keeps transitions explicit):
 *   idle       → waiting for user interaction
 *   dragover   → file is hovering; visual feedback only, no file read yet
 *   processing → file accepted; hand off to upload API here
 *
 * Integration seam: handleDrop currently just flips to "processing". Replace
 * setState("processing") in that handler with your actual upload logic
 * (e.g. POST /api/upload with FormData) and derive the processing state from
 * the in-flight request instead.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api/session";

type UploadState = "idle" | "dragover" | "processing";

export default function UploadZone() {
    const router = useRouter();
    const [state, setState] = useState<UploadState>("idle");

    function handleDragOver(e: React.DragEvent) {
        // Prevent browser default (open file) and signal we accept the drop.
        e.preventDefault();
        setState("dragover");
    }

    function handleDragLeave() {
        setState("idle");
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        // TODO: read e.dataTransfer.files[0], validate MIME type / size,
        // then trigger the upload. For now we just show the processing state.
        setState("processing");
    }

    function handleClick() {
        if (getAccessToken()) {
            router.push("/documents/new");
            return;
        }
        router.push("/login");
    }

    // Derive CSS class from state so the stylesheet owns the visual states
    // (see .upload-zone, .drag-over, .dropped in globals.css).
    const zoneClass =
        state === "dragover"
            ? "upload-zone drag-over"
            : state === "processing"
              ? "upload-zone dropped"
              : "upload-zone";

    // Processing view: animated dots while the AI runs.
    // Swap this out for a real progress indicator once the upload API exists.
    if (state === "processing") {
        return (
            <div
                id="upload_zone"
                className={`${zoneClass} rounded-2xl p-8 text-center`}
            >
                <div className="flex items-center justify-center gap-3 py-2">
                    {/* Staggered shimmer via nth-child delay in globals.css */}
                    <div className="flex gap-1">
                        <span className="processing-dot w-2 h-2 rounded-full bg-sage inline-block" />
                        <span className="processing-dot w-2 h-2 rounded-full bg-sage inline-block" />
                        <span className="processing-dot w-2 h-2 rounded-full bg-sage inline-block" />
                    </div>
                    <span className="text-sage text-sm font-medium">
                        Processing your document…
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            id="upload_zone"
            className={`${zoneClass} rounded-2xl p-8 text-center cursor-pointer`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleClick()}
            aria-label="Upload contract document"
        >
            <div className="w-12 h-12 bg-amber-light rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C8852A"
                    strokeWidth="1.5"
                >
                    <path
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            <p className="font-medium text-ink mb-1">
                Drop your contract here....
            </p>
            <p className="text-sm text-muted mb-4">
                PDF or DOCX — up to 50 pages
            </p>
            <button
                type="button"
                className="bg-ink text-cream text-sm px-6 py-2.5 rounded-full hover:bg-amber transition-colors font-medium"
                onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                }}
            >
                Choose file
            </button>
        </div>
    );
}
