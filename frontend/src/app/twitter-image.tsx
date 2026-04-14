import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #F7EFE0 0%, #FBF8F2 100%)",
          padding: "70px",
          color: "#1A1A16",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            border: "2px solid #CF9C56",
            borderRadius: 999,
            color: "#8B5A22",
            fontSize: 24,
            fontWeight: 600,
            padding: "8px 20px",
          }}
        >
          AI Contract Briefs
        </div>

        <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2 }}>
          Understand any contract in 60 seconds.
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 700 }}>{SITE_NAME}</div>
          <div style={{ fontSize: 28, color: "#57564F" }}>Key dates • Red flags • Renewal clauses</div>
        </div>
      </div>
    ),
    size
  );
}
