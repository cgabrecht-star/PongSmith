CREATE TYPE "public"."affiliate_program" AS ENUM('adcell', 'awin', 'direct', 'none');--> statement-breakpoint
CREATE TYPE "public"."hand" AS ENUM('right', 'left');--> statement-breakpoint
CREATE TYPE "public"."play_style" AS ENUM('offensive_topspin', 'allround', 'defensive', 'material');--> statement-breakpoint
CREATE TYPE "public"."player_setup_status" AS ENUM('current', 'previous');--> statement-breakpoint
CREATE TYPE "public"."recommendation_rating" AS ENUM('good', 'medium', 'bad');--> statement-breakpoint
CREATE TYPE "public"."rubber_type" AS ENUM('smooth', 'short_pips', 'long_pips', 'anti');--> statement-breakpoint
CREATE TYPE "public"."topsheet_character" AS ENUM('sticky', 'grippy', 'neutral');--> statement-breakpoint
CREATE TABLE "blades" (
	"id" serial PRIMARY KEY NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"speed_raw" numeric(5, 2),
	"control_raw" numeric(5, 2),
	"speed_raw_scale" smallint,
	"speed_norm" numeric(4, 1),
	"control_norm" numeric(4, 1),
	"community_speed" numeric(4, 1),
	"community_control" numeric(4, 1),
	"community_review_count" integer DEFAULT 0,
	"layers" smallint,
	"composition" varchar(100),
	"weight_min" smallint,
	"weight_max" smallint,
	"stiffness" varchar(20),
	"play_style" "play_style",
	"ttr_min" smallint,
	"ttr_max" smallint,
	"ttr_optimal" smallint,
	"description" text,
	"description_en" text,
	"community_description" text,
	"community_description_en" text,
	"image_url" varchar(500),
	"source_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blades_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "manufacturers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"country" varchar(50),
	"website" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "manufacturers_name_unique" UNIQUE("name"),
	CONSTRAINT "manufacturers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"beobachtete_staerken" text,
	"defizite" text,
	"eigene_empfehlung" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_setups" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"status" "player_setup_status" DEFAULT 'current' NOT NULL,
	"blade_id" integer,
	"rubber_vh_id" integer,
	"rubber_rh_id" integer,
	"schlaegergewicht" smallint,
	"score_tempo" smallint,
	"score_spin" smallint,
	"score_kontrolle" smallint,
	"score_gesamtzufriedenheit" smallint,
	"wechselgrund" text,
	"kommentar" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"ttr_actual" smallint,
	"ttr_range" varchar(20),
	"jahre_aktiv" smallint,
	"spielstil" "play_style",
	"hand" "hand",
	"notizen" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_product_id" integer NOT NULL,
	"price" numeric(8, 2) NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"scraped_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"recommendation_id" integer NOT NULL,
	"rating" "recommendation_rating" NOT NULL,
	"kommentar" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"eingaben_jsonb" jsonb NOT NULL,
	"empfohlenes_setup_jsonb" jsonb NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rubber_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"rubber_id" integer NOT NULL,
	"thickness" numeric(3, 1) NOT NULL,
	"hardness" smallint,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "rubber_variants_unique" UNIQUE("rubber_id","thickness","hardness")
);
--> statement-breakpoint
CREATE TABLE "rubbers" (
	"id" serial PRIMARY KEY NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"type" "rubber_type" DEFAULT 'smooth' NOT NULL,
	"speed_raw" numeric(5, 2),
	"spin_raw" numeric(5, 2),
	"control_raw" numeric(5, 2),
	"speed_raw_scale" smallint,
	"speed_norm" numeric(4, 1),
	"spin_norm" numeric(4, 1),
	"control_norm" numeric(4, 1),
	"community_speed" numeric(4, 1),
	"community_spin" numeric(4, 1),
	"community_control" numeric(4, 1),
	"community_review_count" integer DEFAULT 0,
	"topsheet_character" "topsheet_character",
	"hardness_min" smallint,
	"hardness_max" smallint,
	"play_style" "play_style",
	"ttr_min" smallint,
	"ttr_max" smallint,
	"ttr_optimal" smallint,
	"description" text,
	"description_en" text,
	"community_description" text,
	"community_description_en" text,
	"image_url" varchar(500),
	"source_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rubbers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "shop_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"product_type" varchar(10) NOT NULL,
	"product_id" integer NOT NULL,
	"shop_product_url" text NOT NULL,
	"affiliate_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shop_products_unique" UNIQUE("shop_id","product_type","product_id")
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"domain" varchar(100) NOT NULL,
	"affiliate_program" "affiliate_program" DEFAULT 'none',
	"commission_percent" numeric(4, 2),
	"cookie_days" smallint,
	"affiliate_tracking_id" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shops_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "synergies" (
	"id" serial PRIMARY KEY NOT NULL,
	"blade_id" integer NOT NULL,
	"rubber_id" integer NOT NULL,
	"synergy_score" smallint NOT NULL,
	"tempo_match" smallint,
	"control_reserve" smallint,
	"spin_potential" smallint,
	"weight_balance" smallint,
	"style_fit" smallint,
	"play_style_target" "play_style",
	"ttr_target" smallint,
	"score_offensive" smallint,
	"score_allround" smallint,
	"score_defensive" smallint,
	"score_material" smallint,
	"begruendung_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "synergies_unique" UNIQUE("blade_id","rubber_id")
);
--> statement-breakpoint
ALTER TABLE "blades" ADD CONSTRAINT "blades_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_setups" ADD CONSTRAINT "player_setups_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_setups" ADD CONSTRAINT "player_setups_blade_id_blades_id_fk" FOREIGN KEY ("blade_id") REFERENCES "public"."blades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_setups" ADD CONSTRAINT "player_setups_rubber_vh_id_rubbers_id_fk" FOREIGN KEY ("rubber_vh_id") REFERENCES "public"."rubbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_setups" ADD CONSTRAINT "player_setups_rubber_rh_id_rubbers_id_fk" FOREIGN KEY ("rubber_rh_id") REFERENCES "public"."rubbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubber_variants" ADD CONSTRAINT "rubber_variants_rubber_id_rubbers_id_fk" FOREIGN KEY ("rubber_id") REFERENCES "public"."rubbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubbers" ADD CONSTRAINT "rubbers_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synergies" ADD CONSTRAINT "synergies_blade_id_blades_id_fk" FOREIGN KEY ("blade_id") REFERENCES "public"."blades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synergies" ADD CONSTRAINT "synergies_rubber_id_rubbers_id_fk" FOREIGN KEY ("rubber_id") REFERENCES "public"."rubbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blades_manufacturer_idx" ON "blades" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE INDEX "blades_play_style_idx" ON "blades" USING btree ("play_style");--> statement-breakpoint
CREATE INDEX "blades_ttr_idx" ON "blades" USING btree ("ttr_min","ttr_max");--> statement-breakpoint
CREATE INDEX "player_setups_player_idx" ON "player_setups" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "prices_shop_product_idx" ON "prices" USING btree ("shop_product_id");--> statement-breakpoint
CREATE INDEX "prices_scraped_at_idx" ON "prices" USING btree ("scraped_at");--> statement-breakpoint
CREATE INDEX "recommendations_session_idx" ON "recommendations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "rubber_variants_rubber_idx" ON "rubber_variants" USING btree ("rubber_id");--> statement-breakpoint
CREATE INDEX "rubbers_manufacturer_idx" ON "rubbers" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE INDEX "rubbers_type_idx" ON "rubbers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "rubbers_ttr_idx" ON "rubbers" USING btree ("ttr_min","ttr_max");--> statement-breakpoint
CREATE INDEX "shop_products_product_idx" ON "shop_products" USING btree ("product_type","product_id");--> statement-breakpoint
CREATE INDEX "synergies_blade_idx" ON "synergies" USING btree ("blade_id");--> statement-breakpoint
CREATE INDEX "synergies_rubber_idx" ON "synergies" USING btree ("rubber_id");--> statement-breakpoint
CREATE INDEX "synergies_score_idx" ON "synergies" USING btree ("synergy_score");