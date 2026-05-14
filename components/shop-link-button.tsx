"use client";

import { track } from "@vercel/analytics";

interface ShopLinkButtonProps {
  href: string;
  shopName: string;
  affiliateActive: boolean;
  source: "product_detail" | "berater_results";
}

/**
 * Outbound-Link zu einem Shop, mit Vercel-Analytics-Event.
 * Wird in product-detail-view und ähnlichen Server-Components verwendet.
 */
export function ShopLinkButton({ href, shopName, affiliateActive, source }: ShopLinkButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel={affiliateActive ? "sponsored noopener" : "noopener"}
      onClick={() => track("shop_clicked", { shop: shopName, affiliate: affiliateActive, source })}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 6,
        border: affiliateActive
          ? "1px solid rgba(255,107,53,0.5)"
          : "1px solid var(--ps-line)",
        background: affiliateActive
          ? "rgba(255,107,53,0.10)"
          : "var(--ps-bg-3)",
        color: affiliateActive
          ? "var(--ps-ember-2)"
          : "var(--ps-ink-1)",
        fontSize: 13,
        fontWeight: 500,
        textDecoration: "none",
        whiteSpace: "nowrap",
        transition: "all 140ms",
      }}
      title={
        affiliateActive
          ? `${shopName} (Werbung · Affiliate-Partner)`
          : `${shopName} (externer Shop-Link)`
      }
    >
      {shopName} →
    </a>
  );
}
