import { ImageResponse } from "next/og";
import { loadBladeBySlug } from "@/lib/product-detail";

export const alt = "PongSmith Holz-Detail";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: { slug: string } }) {
  const product = await loadBladeBySlug(params.slug);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0e0e0e 0%, #1a0d05 100%)",
          padding: 70,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: -200,
            right: -100,
            width: 600,
            height: 600,
            background: "radial-gradient(circle, rgba(255,107,53,0.30) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#fafaf7", fontSize: 22, letterSpacing: "0.06em", fontWeight: 700, textTransform: "uppercase" }}>
          <span style={{ color: "#ff6b35", fontSize: 28 }}>◈</span>
          PongSmith
          <span style={{ fontSize: 11, letterSpacing: "0.18em", color: "#ff8b56", marginLeft: 12 }}>HOLZ</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", marginBottom: 30, gap: 18 }}>
          {product && (
            <div style={{ color: "#ff8b56", fontSize: 24, fontWeight: 600, letterSpacing: "0.04em" }}>
              {product.manufacturer.name}
            </div>
          )}
          <div style={{ color: "#fafaf7", fontSize: 84, lineHeight: 0.95, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {product?.name ?? "Holz"}
          </div>

          {product && (
            <div style={{ display: "flex", gap: 40, marginTop: 24 }}>
              {product.speed !== null && <SpecBadge label="SPEED" value={product.speed.toFixed(1)} />}
              {product.control !== null && <SpecBadge label="CONTROL" value={product.control.toFixed(1)} />}
              {product.composition && <SpecBadge label="AUFBAU" value={product.composition.substring(0, 16)} />}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#a8a8a3", fontSize: 18, borderTop: "1px solid #333", paddingTop: 18 }}>
          <span>{product?.reviewCount ? `★ ${product.reviewCount} Community-Reviews` : "Independent · Free · No brand bias"}</span>
          <span style={{ color: "#ff8b56", fontWeight: 600 }}>pongsmith.de</span>
        </div>
      </div>
    ),
    { ...size },
  );
}

function SpecBadge({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ color: "#a8a8a3", fontSize: 14, letterSpacing: "0.18em", fontWeight: 600 }}>{label}</span>
      <span style={{ color: "#fafaf7", fontSize: 36, fontWeight: 700 }}>{value}{value.length <= 4 ? <span style={{ color: "#666", fontSize: 18 }}>/10</span> : null}</span>
    </div>
  );
}
