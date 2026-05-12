import { ImageResponse } from "next/og";

/**
 * Dynamisch generiertes OpenGraph-Bild für Social-Sharing.
 * Erscheint wenn jemand pongsmith.de auf Reddit, WhatsApp, Slack, X, etc. teilt.
 * Next.js sucht diese Datei automatisch und nutzt sie als og:image.
 */

export const alt = "PongSmith, Die Tischtennis-Schmiede";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0e0e0e 0%, #1a0d05 100%)",
          padding: 80,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            bottom: -200,
            right: -100,
            width: 600,
            height: 600,
            background: "radial-gradient(circle, rgba(255,107,53,0.35) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#fafaf7",
            fontSize: 28,
            letterSpacing: "0.08em",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          <span style={{ color: "#ff6b35", fontSize: 36 }}>◈</span>
          PongSmith
          <span
            style={{
              fontSize: 14,
              letterSpacing: "0.16em",
              color: "#ff8b56",
              marginLeft: 14,
            }}
          >
            DIE TT-SCHMIEDE
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            marginBottom: 40,
          }}
        >
          <div style={{ color: "#fafaf7", fontSize: 80, lineHeight: 0.95, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Finde heraus,
          </div>
          <div style={{ color: "#ff8b56", fontSize: 80, lineHeight: 0.95, fontWeight: 800, letterSpacing: "-0.02em" }}>
            ob dein Setup
          </div>
          <div style={{ color: "#fafaf7", fontSize: 80, lineHeight: 0.95, fontWeight: 800, letterSpacing: "-0.02em" }}>
            zu dir passt.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#a8a8a3",
            fontSize: 22,
            borderTop: "1px solid #333",
            paddingTop: 24,
          }}
        >
          <span>Unabhängig · Kostenlos · Q-TTR 1.000-1.700</span>
          <span style={{ color: "#ff8b56", fontWeight: 600 }}>pongsmith.de</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
