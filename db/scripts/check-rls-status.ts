/**
 * Prüft den RLS-Status (Row-Level Security) aller Tabellen im public Schema.
 * Wenn rls_enabled = false → über die Supabase REST-API frei zugänglich.
 */

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
  console.log("\n=== RLS-Status aller public-Tabellen ===\n");

  const rows = await sql<{ schemaname: string; tablename: string; rls_enabled: boolean }[]>`
    SELECT
      schemaname,
      tablename,
      rowsecurity AS rls_enabled
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;

  let withRls = 0;
  let withoutRls = 0;

  for (const r of rows) {
    const status = r.rls_enabled ? "✓ RLS AN" : "✗ RLS AUS — ÖFFENTLICH";
    const color = r.rls_enabled ? "" : "(KRITISCH)";
    console.log(`  ${status.padEnd(25)} ${r.tablename}  ${color}`);
    if (r.rls_enabled) withRls++;
    else withoutRls++;
  }

  console.log(`\nGesamt: ${withRls + withoutRls} Tabellen`);
  console.log(`  Geschützt: ${withRls}`);
  console.log(`  OFFEN: ${withoutRls} ${withoutRls > 0 ? "← MUSS GESCHLOSSEN WERDEN" : ""}`);

  // Aktuelle Rolle prüfen
  const role = await sql<{ current_user: string; session_user: string }[]>`
    SELECT current_user, session_user
  `;
  console.log(`\nAktuelle Postgres-Rolle: ${role[0]!.current_user}`);
  console.log("(Service-Role / Postgres umgeht RLS — App-Zugriff bleibt OK)");

  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
