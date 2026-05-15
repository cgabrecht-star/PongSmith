import {
  pgTable,
  pgEnum,
  serial,
  smallint,
  integer,
  varchar,
  text,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const rubberTypeEnum = pgEnum("rubber_type", [
  "smooth",       // Noppen innen (Standard)
  "short_pips",   // Noppen außen kurz
  "long_pips",    // Noppen außen lang
  "anti",         // Anti-Topspin
]);

export const topsheetCharacterEnum = pgEnum("topsheet_character", [
  "sticky",   // klebrig klassisch chinesisch (z.B. Hurricane 3, Skyline, Big Dipper)
  "grippy",   // griffig europäisch-tensioniert (z.B. Tenergy, Rakza, Acuda)
  "neutral",  // weder klebrig noch ausgeprägt griffig
  "hybrid",   // chinesisches klebriges Topsheet + europäischer Tensor-Schwamm
              // (z.B. Tibhar K3, DHS Hurricane Neo Blue Sponge, JOOLA Dynaryz CMD)
              // Aktueller Markttrend seit ~2022
]);

export const playStyleEnum = pgEnum("play_style", [
  "offensive_topspin",
  "allround",
  "defensive",
  "material",   // Noppen/Anti-Spieler
]);

export const handEnum = pgEnum("hand", ["right", "left"]);

export const playerSetupStatusEnum = pgEnum("player_setup_status", [
  "current",
  "previous",
]);

export const recommendationRatingEnum = pgEnum("recommendation_rating", [
  "good",
  "medium",
  "bad",
]);

export const affiliateProgramEnum = pgEnum("affiliate_program", [
  "adcell",
  "awin",
  "direct",
  "none",
]);

// ---------------------------------------------------------------------------
// Hersteller
// ---------------------------------------------------------------------------

export const manufacturers = pgTable("manufacturers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  country: varchar("country", { length: 50 }),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Hölzer (Blades)
// ---------------------------------------------------------------------------

export const blades = pgTable(
  "blades",
  {
    id: serial("id").primaryKey(),
    manufacturerId: integer("manufacturer_id")
      .notNull()
      .references(() => manufacturers.id),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull().unique(),

    // Hersteller-Rohdaten (auf originaler Skala, z.B. Butterfly 1–13)
    speedRaw: numeric("speed_raw", { precision: 5, scale: 2 }),
    controlRaw: numeric("control_raw", { precision: 5, scale: 2 }),
    speedRawScale: smallint("speed_raw_scale"), // max. Wert der Hersteller-Skala

    // Normierte Werte (1.0–10.0, hersteller-übergreifend vergleichbar)
    speedNorm: numeric("speed_norm", { precision: 4, scale: 1 }),
    controlNorm: numeric("control_norm", { precision: 4, scale: 1 }),

    // Community-Werte (aggregiert aus revspin.net, normiert 1.0–10.0)
    communitySpeed: numeric("community_speed", { precision: 4, scale: 1 }),
    communityControl: numeric("community_control", { precision: 4, scale: 1 }),
    communityReviewCount: integer("community_review_count").default(0),

    // Konstruktion
    layers: smallint("layers"),                          // Anzahl Furniere
    composition: varchar("composition", { length: 100 }), // z.B. "5+2 Carbon"
    weightMin: smallint("weight_min"),                   // Gramm
    weightMax: smallint("weight_max"),
    // soft | medium | stiff | very_stiff
    stiffness: varchar("stiffness", { length: 20 }),

    // Spielprofil
    playStyle: playStyleEnum("play_style"),
    ttrMin: smallint("ttr_min"),
    ttrMax: smallint("ttr_max"),
    ttrOptimal: smallint("ttr_optimal"),

    description: text("description"),                            // Hersteller-Beschreibung (DE)
    descriptionEn: text("description_en"),                        // Hersteller-Beschreibung (EN)
    communityDescription: text("community_description"),          // Spielerstimmen-Schnittmenge (DE)
    communityDescriptionEn: text("community_description_en"),     // Spielerstimmen-Schnittmenge (EN)
    imageUrl: varchar("image_url", { length: 500 }),
    sourceUrl: varchar("source_url", { length: 500 }), // URL der Datenquelle
    priceEur: numeric("price_eur", { precision: 6, scale: 2 }), // UVP DE-Markt
    /** True wenn das Holz manuell von uns ergänzt wurde (DE-Klassiker die in den
     *  Quell-Daten aus revspin etc. fehlen). Umgeht den community_review_count >=
     *  10 Filter, damit z.B. Yasaka Sweden Classic im Berater erscheinen kann. */
    isManuallyCurated: boolean("is_manually_curated").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("blades_manufacturer_idx").on(t.manufacturerId),
    index("blades_play_style_idx").on(t.playStyle),
    index("blades_ttr_idx").on(t.ttrMin, t.ttrMax),
  ]
);

// ---------------------------------------------------------------------------
// Beläge (Rubbers)
// ---------------------------------------------------------------------------

export const rubbers = pgTable(
  "rubbers",
  {
    id: serial("id").primaryKey(),
    manufacturerId: integer("manufacturer_id")
      .notNull()
      .references(() => manufacturers.id),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull().unique(),
    type: rubberTypeEnum("type").notNull().default("smooth"),

    // Hersteller-Rohdaten
    speedRaw: numeric("speed_raw", { precision: 5, scale: 2 }),
    spinRaw: numeric("spin_raw", { precision: 5, scale: 2 }),
    controlRaw: numeric("control_raw", { precision: 5, scale: 2 }),
    speedRawScale: smallint("speed_raw_scale"),

    // Normierte Werte (1.0–10.0)
    speedNorm: numeric("speed_norm", { precision: 4, scale: 1 }),
    spinNorm: numeric("spin_norm", { precision: 4, scale: 1 }),
    controlNorm: numeric("control_norm", { precision: 4, scale: 1 }),

    // Community-Werte (revspin.net, normiert 1.0–10.0)
    communitySpeed: numeric("community_speed", { precision: 4, scale: 1 }),
    communitySpin: numeric("community_spin", { precision: 4, scale: 1 }),
    communityControl: numeric("community_control", { precision: 4, scale: 1 }),
    communityReviewCount: integer("community_review_count").default(0),

    // Physikalische Eigenschaften
    topsheetCharacter: topsheetCharacterEnum("topsheet_character"),
    hardnessMin: smallint("hardness_min"), // Schwammhärte in Grad (z.B. 36)
    hardnessMax: smallint("hardness_max"),

    // Spielprofil
    playStyle: playStyleEnum("play_style"),
    ttrMin: smallint("ttr_min"),
    ttrMax: smallint("ttr_max"),
    ttrOptimal: smallint("ttr_optimal"),

    description: text("description"),                            // Hersteller-Beschreibung (DE)
    descriptionEn: text("description_en"),                        // Hersteller-Beschreibung (EN)
    communityDescription: text("community_description"),          // Spielerstimmen-Schnittmenge (DE)
    communityDescriptionEn: text("community_description_en"),     // Spielerstimmen-Schnittmenge (EN)
    imageUrl: varchar("image_url", { length: 500 }),
    sourceUrl: varchar("source_url", { length: 500 }),
    priceEur: numeric("price_eur", { precision: 6, scale: 2 }), // UVP DE-Markt
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("rubbers_manufacturer_idx").on(t.manufacturerId),
    index("rubbers_type_idx").on(t.type),
    index("rubbers_ttr_idx").on(t.ttrMin, t.ttrMax),
  ]
);

// ---------------------------------------------------------------------------
// Belag-Varianten (Dicke × Härte)
// ---------------------------------------------------------------------------

export const rubberVariants = pgTable(
  "rubber_variants",
  {
    id: serial("id").primaryKey(),
    rubberId: integer("rubber_id")
      .notNull()
      .references(() => rubbers.id),
    thickness: numeric("thickness", { precision: 3, scale: 1 }).notNull(), // mm
    hardness: smallint("hardness"),                                          // Grad
    isActive: boolean("is_active").default(true).notNull(),
  },
  (t) => [
    unique("rubber_variants_unique").on(t.rubberId, t.thickness, t.hardness),
    index("rubber_variants_rubber_idx").on(t.rubberId),
  ]
);

// ---------------------------------------------------------------------------
// Synergien (Holz × Belag — paarweise, 1 Eintrag pro Kombination)
// Setup-Score für Holz+VH+RH wird aus je zwei Einträgen berechnet.
// ---------------------------------------------------------------------------

export const synergies = pgTable(
  "synergies",
  {
    id: serial("id").primaryKey(),
    bladeId: integer("blade_id")
      .notNull()
      .references(() => blades.id),
    rubberId: integer("rubber_id")
      .notNull()
      .references(() => rubbers.id),

    // Gesamt-Score (0–100)
    synergyScore: smallint("synergy_score").notNull(),

    // Teilscores (0–100)
    tempoMatch: smallint("tempo_match"),       // Tempo-Abstimmung
    controlReserve: smallint("control_reserve"), // Kontroll-Puffer
    spinPotential: smallint("spin_potential"),
    weightBalance: smallint("weight_balance"),
    styleFit: smallint("style_fit"),            // Spielstil-Übereinstimmung

    // Für welchen Spieler-Typ diese Kombi optimal ist
    playStyleTarget: playStyleEnum("play_style_target"),
    ttrTarget: smallint("ttr_target"),

    // Stil-spezifische Scores — jeder Wert ist der synergyScore wenn der
    // Spieler diesen Stil hat. Erlaubt präzise Filterung ohne Recompute.
    scoreOffensive: smallint("score_offensive"),    // Gewichtung: Tempo+Spin dominant
    scoreAllround: smallint("score_allround"),       // Gewichtung: Control+Spin+Tempo ausgewogen
    scoreDefensive: smallint("score_defensive"),     // Gewichtung: Control dominant
    scoreMaterial: smallint("score_material"),       // Gewichtung: Kontrolle + Stil dominant

    begruendungText: text("begruendung_text"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("synergies_unique").on(t.bladeId, t.rubberId),
    index("synergies_blade_idx").on(t.bladeId),
    index("synergies_rubber_idx").on(t.rubberId),
    index("synergies_score_idx").on(t.synergyScore),
  ]
);

// ---------------------------------------------------------------------------
// Shops
// ---------------------------------------------------------------------------

export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  domain: varchar("domain", { length: 100 }).notNull().unique(),
  affiliateProgram: affiliateProgramEnum("affiliate_program").default("none"),
  commissionPercent: numeric("commission_percent", { precision: 4, scale: 2 }),
  cookieDays: smallint("cookie_days"),
  affiliateTrackingId: varchar("affiliate_tracking_id", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Shop-Produkte (URL-Mapping: PongSmith-Produkt → Shop-URL)
// ---------------------------------------------------------------------------

export const shopProducts = pgTable(
  "shop_products",
  {
    id: serial("id").primaryKey(),
    shopId: integer("shop_id")
      .notNull()
      .references(() => shops.id),
    // "blade" oder "rubber" — product_id zeigt auf blades.id bzw. rubbers.id
    productType: varchar("product_type", { length: 10 }).notNull(),
    productId: integer("product_id").notNull(),
    shopProductUrl: text("shop_product_url").notNull(),
    affiliateUrl: text("affiliate_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("shop_products_unique").on(t.shopId, t.productType, t.productId),
    index("shop_products_product_idx").on(t.productType, t.productId),
  ]
);

// ---------------------------------------------------------------------------
// Preise (täglich per Scraping befüllt)
// ---------------------------------------------------------------------------

export const prices = pgTable(
  "prices",
  {
    id: serial("id").primaryKey(),
    shopProductId: integer("shop_product_id")
      .notNull()
      .references(() => shopProducts.id),
    price: numeric("price", { precision: 8, scale: 2 }).notNull(),
    inStock: boolean("in_stock").default(true).notNull(),
    scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
  },
  (t) => [
    index("prices_shop_product_idx").on(t.shopProductId),
    index("prices_scraped_at_idx").on(t.scrapedAt),
  ]
);

// ---------------------------------------------------------------------------
// Spieler (anonymisiert — Vereins-Erfahrungs-DB)
// ---------------------------------------------------------------------------

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  ttrActual: smallint("ttr_actual"),
  ttrRange: varchar("ttr_range", { length: 20 }), // z.B. "1200-1300"
  jahreAktiv: smallint("jahre_aktiv"),
  spielstil: playStyleEnum("spielstil"),
  hand: handEnum("hand"),
  notizen: text("notizen"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Spieler-Setups (aktuell und vergangene)
// ---------------------------------------------------------------------------

export const playerSetups = pgTable(
  "player_setups",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id),
    status: playerSetupStatusEnum("status").notNull().default("current"),
    bladeId: integer("blade_id").references(() => blades.id),
    rubberVhId: integer("rubber_vh_id").references(() => rubbers.id),
    rubberRhId: integer("rubber_rh_id").references(() => rubbers.id),
    schlaegergewicht: smallint("schlaegergewicht"), // Gramm

    // Spieler-Selbstbewertung (1–10)
    scoreTempo: smallint("score_tempo"),
    scoreSpin: smallint("score_spin"),
    scoreKontrolle: smallint("score_kontrolle"),
    scoreGesamtzufriedenheit: smallint("score_gesamtzufriedenheit"),

    wechselgrund: text("wechselgrund"),
    kommentar: text("kommentar"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("player_setups_player_idx").on(t.playerId)]
);

// ---------------------------------------------------------------------------
// Beobachtungen (Einschätzungen zu Spielern)
// ---------------------------------------------------------------------------

export const observations = pgTable("observations", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  beobachteteStaerken: text("beobachtete_staerken"),
  defizite: text("defizite"),
  eigeneEmpfehlung: text("eigene_empfehlung"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// KI-Empfehlungen (Tracking + Feedback-Schleife)
// ---------------------------------------------------------------------------

export const recommendations = pgTable(
  "recommendations",
  {
    id: serial("id").primaryKey(),
    sessionId: varchar("session_id", { length: 100 }).notNull(),
    // Nutzer-Eingaben als JSONB (TTR, Spielstil, Budget, Probleme etc.)
    eingabenJsonb: jsonb("eingaben_jsonb").notNull(),
    // Empfohlene Setups als JSONB (blade_id, rubber_vh_id, rubber_rh_id, scores, Begründung)
    empfohlenesSetupJsonb: jsonb("empfohlenes_setup_jsonb").notNull(),
    generatedAt: timestamp("generated_at").defaultNow().notNull(),
  },
  (t) => [index("recommendations_session_idx").on(t.sessionId)]
);

export const recommendationFeedback = pgTable("recommendation_feedback", {
  id: serial("id").primaryKey(),
  recommendationId: integer("recommendation_id")
    .notNull()
    .references(() => recommendations.id),
  rating: recommendationRatingEnum("rating").notNull(),
  kommentar: text("kommentar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Affiliate-Click-Tracking
// Jeder Klick auf einen "Zum Shop"-Button geht durch /api/click und wird hier
// geloggt — anonym, ohne Cookies. Spätere Conversion-Attribution möglich
// über sessionId + Affiliate-Netzwerk-Reports.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Interview-Submissions (Audit-Log für /mithelfen-Form)
// Speichert ALLE eingehenden Submissions inkl. Spam — players-Tabelle bleibt
// dadurch sauber. Bei "valid"-Verdict wird zusätzlich in players + setups +
// observations geschrieben und insertedPlayerId hier verlinkt.
// ---------------------------------------------------------------------------

export const interviewSubmissions = pgTable(
  "interview_submissions",
  {
    id: serial("id").primaryKey(),
    /** Komplette Roh-Submission als JSON (für Audit + Re-Processing) */
    rawData: jsonb("raw_data").notNull(),
    /** AI-Verdict: "valid" | "suspect" | "spam" */
    aiVerdict: varchar("ai_verdict", { length: 20 }),
    /** Kurzbegründung der AI (deutsch) */
    aiReason: text("ai_reason"),
    /** Wenn valid und insertet: FK auf den entstandenen Spieler-Eintrag */
    insertedPlayerId: integer("inserted_player_id").references(() => players.id),
    /** IP-Hash (SHA256) für Rate-Limiting nachträglich, NICHT die echte IP */
    ipHash: varchar("ip_hash", { length: 64 }),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  },
  (t) => [
    index("submissions_verdict_idx").on(t.aiVerdict),
    index("submissions_at_idx").on(t.submittedAt),
  ]
);

export const clicks = pgTable(
  "clicks",
  {
    id: serial("id").primaryKey(),
    /** Welcher Shop wurde angeklickt (amazon, joola, tt-shop, ...) */
    shopId: varchar("shop_id", { length: 30 }).notNull(),
    /** "blade" oder "rubber" */
    productType: varchar("product_type", { length: 10 }).notNull(),
    /** DB-ID des Produkts */
    productId: integer("product_id").notNull(),
    /** Session-ID der Recommendation (optional, fürs Attribution-Tracking) */
    sessionId: varchar("session_id", { length: 100 }),
    /** Referrer-Pfad (welche Seite hat den Klick ausgelöst) */
    referrer: varchar("referrer", { length: 200 }),
    /** User-Agent (gekürzt — DSGVO-freundlich, keine eindeutige Kennung) */
    userAgentShort: varchar("user_agent_short", { length: 50 }),
    clickedAt: timestamp("clicked_at").defaultNow().notNull(),
  },
  (t) => [
    index("clicks_shop_idx").on(t.shopId),
    index("clicks_product_idx").on(t.productType, t.productId),
    index("clicks_session_idx").on(t.sessionId),
    index("clicks_clicked_at_idx").on(t.clickedAt),
  ]
);
