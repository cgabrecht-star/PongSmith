import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Lazy Initialization — DB-Verbindung wird erst beim ersten Aufruf aufgebaut,
// nicht beim Import. Verhindert Build-Fehler wenn DATABASE_URL nur zur Laufzeit
// (nicht zur Build-Zeit) verfügbar ist.

type Db = ReturnType<typeof drizzle<typeof schema>>;

function buildDb(): Db {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ist nicht gesetzt");
  return drizzle(postgres(process.env.DATABASE_URL), { schema });
}

let _instance: Db | undefined;

export const db: Db = new Proxy({} as Db, {
  get(_, prop) {
    _instance ??= buildDb();
    return Reflect.get(_instance, prop);
  },
});
