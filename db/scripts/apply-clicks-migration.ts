/**
 * Wendet die clicks-Migration manuell an (Workaround für db:migrate-Hänger).
 * Idempotent — kann mehrfach ausgeführt werden.
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL fehlt.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

async function main() {
  console.log("→ Lege clicks-Tabelle an (falls nicht vorhanden)...");

  await sql`
    CREATE TABLE IF NOT EXISTS clicks (
      id SERIAL PRIMARY KEY,
      shop_id VARCHAR(30) NOT NULL,
      product_type VARCHAR(10) NOT NULL,
      product_id INTEGER NOT NULL,
      session_id VARCHAR(100),
      referrer VARCHAR(200),
      user_agent_short VARCHAR(50),
      clicked_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS clicks_shop_idx ON clicks(shop_id)`;
  await sql`CREATE INDEX IF NOT EXISTS clicks_product_idx ON clicks(product_type, product_id)`;
  await sql`CREATE INDEX IF NOT EXISTS clicks_session_idx ON clicks(session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS clicks_clicked_at_idx ON clicks(clicked_at)`;

  console.log("✓ clicks-Tabelle + Indexe vorhanden.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
