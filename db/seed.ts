// Seed-Skript — wird in Phase 1.4 befüllt
// Ausführen: npx dotenv -e .env.local -- tsx db/seed.ts

import { db } from "./index";
import { manufacturers } from "./schema";

async function seed() {
  console.log("Seed gestartet...");

  // Hersteller — Basis-Datensatz
  await db
    .insert(manufacturers)
    .values([
      { name: "Butterfly", slug: "butterfly", country: "Japan", website: "https://www.butterfly.co.jp" },
      { name: "Stiga", slug: "stiga", country: "Schweden", website: "https://www.stiga.com" },
      { name: "Donic", slug: "donic", country: "Deutschland", website: "https://www.donic.de" },
      { name: "Tibhar", slug: "tibhar", country: "Deutschland", website: "https://www.tibhar.de" },
      { name: "Joola", slug: "joola", country: "Deutschland", website: "https://www.joola.de" },
      { name: "Xiom", slug: "xiom", country: "Korea", website: "https://www.xiom.com" },
      { name: "DHS", slug: "dhs", country: "China", website: "https://www.dhsports.com" },
      { name: "Nittaku", slug: "nittaku", country: "Japan", website: "https://www.nittaku.com" },
      { name: "Andro", slug: "andro", country: "Deutschland", website: "https://www.andro.de" },
      { name: "Yasaka", slug: "yasaka", country: "Schweden", website: "https://www.yasaka.se" },
    ])
    .onConflictDoNothing();

  console.log("✓ Hersteller eingefügt");
  console.log("Seed abgeschlossen.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed fehlgeschlagen:", err);
  process.exit(1);
});
