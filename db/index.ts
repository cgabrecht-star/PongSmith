import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Während `next build` (NEXT_PHASE = "phase-production-build") steht DATABASE_URL
// nicht zur Verfügung. API-Routes mit force-dynamic werden nie beim Build aufgerufen,
// daher ist es sicher db = null zu setzen — nur zur Laufzeit wird die DB genutzt.

type Db = ReturnType<typeof drizzle<typeof schema>>;

function initDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ist nicht gesetzt");
  return drizzle(postgres(url), { schema });
}

const isBuild = process.env.NEXT_PHASE === "phase-production-build";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: Db = isBuild ? (null as any) : initDb();
