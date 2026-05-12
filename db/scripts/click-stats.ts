/**
 * Click-Statistik-Übersicht.
 * Liefert Argumente für künftige Affiliate-Verhandlungen:
 *   "Wir schicken X Klicks/Monat zu TT-Shop, wollt ihr ein Programm?"
 *
 * Usage:  npx dotenv-cli -e .env.local -- npx tsx db/scripts/click-stats.ts
 *         npx dotenv-cli -e .env.local -- npx tsx db/scripts/click-stats.ts --days=7
 */

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

function parseDays(): number {
  const arg = process.argv.find((a) => a.startsWith("--days="));
  if (!arg) return 30;
  const n = parseInt(arg.split("=")[1] ?? "30", 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

async function main() {
  const days = parseDays();
  console.log(`\n=== Click-Statistik letzte ${days} Tage ===\n`);

  // ── Klicks pro Shop ──────────────────────────────────────────────────────
  const perShop = await sql<{ shop_id: string; clicks: number }[]>`
    SELECT shop_id, COUNT(*)::int AS clicks
    FROM clicks
    WHERE clicked_at >= NOW() - INTERVAL '1 day' * ${days}
    GROUP BY shop_id
    ORDER BY clicks DESC
  `;

  if (perShop.length === 0) {
    console.log("  (Noch keine Klicks im Zeitraum.)");
  } else {
    console.log("SHOP-RANKING (mehr = wichtiger für Affiliate-Verhandlungen):");
    console.log("  " + "─".repeat(50));
    for (const row of perShop) {
      const bar = "█".repeat(Math.min(30, Math.ceil(row.clicks / Math.max(1, perShop[0]!.clicks / 30))));
      console.log(`  ${row.shop_id.padEnd(20)} ${String(row.clicks).padStart(5)}  ${bar}`);
    }
  }

  // ── Top 10 geklickte Produkte ────────────────────────────────────────────
  console.log("\nTOP 10 PRODUKTE (für Affiliate-Pitch — 'genau das wollen unsere User'):");
  console.log("  " + "─".repeat(70));

  const topProducts = await sql<{
    product_type: string;
    product_id: number;
    clicks: number;
    name: string;
    manufacturer: string;
  }[]>`
    WITH click_counts AS (
      SELECT product_type, product_id, COUNT(*)::int AS clicks
      FROM clicks
      WHERE clicked_at >= NOW() - INTERVAL '1 day' * ${days}
      GROUP BY product_type, product_id
    )
    SELECT
      cc.product_type,
      cc.product_id,
      cc.clicks,
      COALESCE(b.name, r.name, '?') AS name,
      COALESCE(bm.name, rm.name, '?') AS manufacturer
    FROM click_counts cc
    LEFT JOIN blades b ON cc.product_type = 'blade' AND cc.product_id = b.id
    LEFT JOIN manufacturers bm ON b.manufacturer_id = bm.id
    LEFT JOIN rubbers r ON cc.product_type = 'rubber' AND cc.product_id = r.id
    LEFT JOIN manufacturers rm ON r.manufacturer_id = rm.id
    ORDER BY cc.clicks DESC
    LIMIT 10
  `;

  if (topProducts.length === 0) {
    console.log("  (Noch keine Klicks.)");
  } else {
    for (const p of topProducts) {
      const kind = p.product_type === "blade" ? "Holz " : "Belag";
      console.log(`  ${String(p.clicks).padStart(3)}× [${kind}] ${p.manufacturer} ${p.name}`);
    }
  }

  // ── Gesamtzahl + Trend ──────────────────────────────────────────────────
  const total = await sql<{ total: number }[]>`
    SELECT COUNT(*)::int AS total FROM clicks WHERE clicked_at >= NOW() - INTERVAL '1 day' * ${days}
  `;
  const lifetime = await sql<{ total: number }[]>`SELECT COUNT(*)::int AS total FROM clicks`;

  console.log(`\nGESAMT:`);
  console.log(`  Letzte ${days} Tage:  ${total[0]!.total} Klicks`);
  console.log(`  All-time:        ${lifetime[0]!.total} Klicks`);

  // ── Pitch-Argumente generieren ──────────────────────────────────────────
  if (perShop.length > 0) {
    console.log(`\n── PITCH-ARGUMENTE für deine Affiliate-Anfragen ──\n`);
    for (const row of perShop.slice(0, 3)) {
      const monthly = Math.round((row.clicks / days) * 30);
      console.log(
        `  "${row.shop_id}": ~${monthly} Klicks/Monat — sag das im Pitch zur Adcell-Bewerbung oder direkt zum Shop.`,
      );
    }
  }

  console.log();
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
