CREATE TABLE "clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" varchar(30) NOT NULL,
	"product_type" varchar(10) NOT NULL,
	"product_id" integer NOT NULL,
	"session_id" varchar(100),
	"referrer" varchar(200),
	"user_agent_short" varchar(50),
	"clicked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "clicks_shop_idx" ON "clicks" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "clicks_product_idx" ON "clicks" USING btree ("product_type","product_id");--> statement-breakpoint
CREATE INDEX "clicks_session_idx" ON "clicks" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "clicks_clicked_at_idx" ON "clicks" USING btree ("clicked_at");