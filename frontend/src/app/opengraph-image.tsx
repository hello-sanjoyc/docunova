import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at top left, #FEE8C8 0%, #F9F6EF 45%, #F7EFE0 100%)",
          padding: "64px",
          color: "#1A1A16",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            borderRadius: 999,
            background: "#F3DDC0",
            color: "#8B5A22",
            fontSize: 26,
            fontWeight: 600,
            padding: "10px 22px",
          }}
        >
          No lawyer required
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
            Understand any contract in 60 seconds.
          </div>
          <div style={{ fontSize: 31, color: "#3D3D37", maxWidth: 980 }}>
            {SITE_DESCRIPTION}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 44, fontWeight: 700 }}>{SITE_NAME}</div>
          <div style={{ fontSize: 28, color: "#6B6A62" }}>Upload PDF or DOCX</div>
        </div>
      </div>
    ),
    size
  );
}
