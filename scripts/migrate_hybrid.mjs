/**
 * Migration: topsheet_character Enum um "hybrid" erweitern.
 * + Tagging der bekannten Hybrid-Beläge auf den DE-Markt (Stand Mai 2026).
 *
 * Hybrid-Definition: chinesisches/asiatisches klebriges Topsheet
 * KOMBINIERT mit europäischer Schwamm-Technologie (gespannt, weicher).
 * Trend seit ~2022, viele Hersteller haben Hybrid-Linien.
 *
 * Bekannte Vertreter:
 *   - Tibhar K3, K3 Pro, Hybrid MK
 *   - Yinhe Pro 13, Big Dipper Pro
 *   - DHS Hurricane 3 Neo Blue/Orange Sponge (Provincial/National)
 *   - Joola Dynaryz CMD, Inferno
 *   - Friendship 729 Cross, Battle II
 *   - Sanwei Target National, Black Power
 *   - Loki Arthur 9
 *   - Andro Rasanter C53
 *   - Joola Rhyzen ZGR
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

console.log("Step 1: Add 'hybrid' to topsheet_character enum...");
try {
  await sql`ALTER TYPE topsheet_character ADD VALUE IF NOT EXISTS 'hybrid'`;
  console.log("  ✓ enum extended");
} catch (e) {
  console.log("  (info: enum value 'hybrid' already exists or alter failed:", e.message, ")");
}

// Bekannte Hybrid-Beläge — substring matches
const HYBRID_KEYWORDS = [
  // Tibhar
  "Tibhar K3",
  "K3 Pro",
  "Hybrid MK",
  "Quantum X Pro China",
  // Yinhe
  "Big Dipper Pro",
  "Pro 13",
  // DHS Hurricane mit Blue/Orange Sponge / Provincial / National
  "Hurricane 3 National",
  "Hurricane 3 Provincial",
  "Hurricane 3 Neo Blue",
  "Hurricane 3 Neo Orange",
  // Joola
  "Dynaryz CMD",
  "Dynaryz Inferno",
  "Rhyzen ZGR",
  // Friendship 729
  "729 Cross",
  "729 Battle 2",
  "729 Battle II",
  // Sanwei
  "Target National",
  "Sanwei Black Power",
  // Loki
  "Loki Arthur 9",
  "Arthur 9",
  // Andro
  "Rasanter C53",
];

console.log("\nStep 2: Tag known hybrid rubbers...");
let tagged = 0;
const taggedRows = [];
for (const keyword of HYBRID_KEYWORDS) {
  const rows = await sql`
    UPDATE rubbers
       SET topsheet_character = 'hybrid'
     WHERE name ILIKE ${"%" + keyword + "%"}
       AND is_active = true
       AND type = 'smooth'
    RETURNING id, name
  `;
  for (const r of rows) {
    tagged++;
    taggedRows.push(`  ✓ ${r.name}`);
  }
}
console.log(taggedRows.join("\n"));
console.log(`\nTotal: ${tagged} rubbers tagged as hybrid`);

const [counts] = await sql`
  SELECT
    SUM(CASE WHEN topsheet_character = 'hybrid' THEN 1 ELSE 0 END) AS hybrid,
    SUM(CASE WHEN topsheet_character = 'sticky' THEN 1 ELSE 0 END) AS sticky,
    SUM(CASE WHEN topsheet_character = 'grippy' THEN 1 ELSE 0 END) AS grippy,
    SUM(CASE WHEN topsheet_character = 'neutral' THEN 1 ELSE 0 END) AS neutral,
    SUM(CASE WHEN topsheet_character IS NULL THEN 1 ELSE 0 END) AS null_val
    FROM rubbers
   WHERE is_active = true
`;
console.log(`\nFinal distribution: hybrid=${counts.hybrid} sticky=${counts.sticky} grippy=${counts.grippy} neutral=${counts.neutral} null=${counts.null_val}`);

await sql.end();
