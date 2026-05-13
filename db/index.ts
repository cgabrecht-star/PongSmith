import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * DB-Initialisierung mit Build-Safe-Fallback.
 *
 * Wenn DATABASE_URL gesetzt ist, wird die echte Connection gebaut — auch
 * während `next build` (z. B. für die Sitemap-Generierung, die alle Produkt-
 * URLs aus der DB enumeriert).
 *
 * Wenn DATABASE_URL fehlt (z. B. lokaler Build ohne `.env.local`), wird ein
 * Proxy zurückgegeben, der bei jedem Zugriff einen klaren Fehler wirft.
 * Aufrufer wie `app/sitemap.ts` fangen das im try/catch und liefern einen
 * Fallback-Stand aus — der Build bricht nicht ab.
 */

type Db = ReturnType<typeof drizzle<typeof schema>>;

function initDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Lazy fail: nur beim tatsächlichen Zugriff werfen, nicht beim Import.
    const handler: ProxyHandler<object> = {
      get() {
        throw new Error("DATABASE_URL ist nicht gesetzt");
      },
    };
    return new Proxy({}, handler) as Db;
  }
  return drizzle(postgres(url), { schema });
}

export const db: Db = initDb();
