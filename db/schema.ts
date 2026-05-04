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
  "sticky",   // klebrig (z.B. chinesische Beläge)
  "grippy",   // griffig (z.B. europäische Beläge)
  "neutral",
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

    description: text("description"),                       // Hersteller-Beschreibung (umformuliert)
    communityDescription: text("community_description"),     // Schnittmenge der Community-Meinungen
    imageUrl: varchar("image_url", { length: 500 }),
    sourceUrl: varchar("source_url", { length: 500 }), // URL der Datenquelle
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

    description: text("description"),                       // Hersteller-Beschreibung (umformuliert)
    communityDescription: text("community_description"),     // Schnittmenge der Community-Meinungen
    imageUrl: varchar("image_url", { length: 500 }),
    sourceUrl: varchar("source_url", { length: 500 }),
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
