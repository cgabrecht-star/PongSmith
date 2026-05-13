/**
 * Aktiviert Row-Level Security (RLS) auf allen Tabellen im public Schema.
 *
 * Strategie: RLS an, KEINE Policies definieren.
 * Effekt: Über die Supabase REST-API (PostgREST) ist nichts mehr zugänglich.
 * Unsere App nutzt die postgres-Rolle direkt über die DATABASE_URL,
 * diese umgeht RLS standardmäßig → App-Zugriff bleibt 100% funktional.
 *
 * Idempotent.
 */

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
  console.log("=== RLS auf allen public-Tabellen aktivieren ===\n");

  // Alle Tabellen im public schema holen
  const tables = await sql<{ tablename: string }[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;

  let activated = 0;
  let alreadyOn = 0;

  for (const { tablename } of tables) {
    // RLS-Status prüfen
    const status = await sql<{ rls: boolean }[]>`
      SELECT rowsecurity AS rls FROM pg_tables
      WHERE schemaname = 'public' AND tablename = ${tablename}
    `;

    if (status[0]?.rls) {
      console.log(`  → ${tablename} (bereits aktiviert)`);
      alreadyOn++;
      continue;
    }

    await sql.unsafe(
      `ALTER TABLE "public"."${tablename}" ENABLE ROW LEVEL SECURITY;`
    );
    console.log(`  ✓ ${tablename}`);
    activated++;
  }

  console.log("\n──────────────────────────");
  console.log(`  Neu aktiviert: ${activated}`);
  console.log(`  Bereits an:    ${alreadyOn}`);
  console.log(`  Gesamt:        ${activated + alreadyOn}\n`);

  console.log("✓ Alle Tabellen über die REST-API jetzt unzugänglich.");
  console.log("✓ App-Zugriff (postgres-Rolle) funktioniert weiter — RLS wird umgangen.");
  console.log("\nVerifikation: npm run db:check-rls\n");

  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
