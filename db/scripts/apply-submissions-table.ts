/**
 * Wendet die interview_submissions-Migration manuell an.
 * Idempotent.
 */

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
  console.log("→ Lege interview_submissions-Tabelle an…");

  await sql`
    CREATE TABLE IF NOT EXISTS interview_submissions (
      id SERIAL PRIMARY KEY,
      raw_data JSONB NOT NULL,
      ai_verdict VARCHAR(20),
      ai_reason TEXT,
      inserted_player_id INTEGER REFERENCES players(id),
      ip_hash VARCHAR(64),
      submitted_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS submissions_verdict_idx ON interview_submissions(ai_verdict)`;
  await sql`CREATE INDEX IF NOT EXISTS submissions_at_idx ON interview_submissions(submitted_at)`;

  console.log("✓ Tabelle + Indexe vorhanden.");
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
