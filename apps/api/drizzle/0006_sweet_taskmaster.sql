CREATE TYPE "public"."listing_status" AS ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'SOLD', 'RESERVED', 'EXPIRED', 'SUSPENDED', 'DELETED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'ETB' NOT NULL,
	"category_id" uuid NOT NULL,
	"brand_id" uuid,
	"model_id" uuid,
	"condition" varchar(20) NOT NULL,
	"status" "listing_status" DEFAULT 'DRAFT' NOT NULL,
	"location_id" uuid,
	"address" text,
	"specifications" text,
	"warranty" varchar(100),
	"imei" varchar(20),
	"views_count" integer DEFAULT 0 NOT NULL,
	"favorites_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_location_id_areas_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listings_seller_id_idx" ON "listings" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "listings_category_id_idx" ON "listings" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "listings_brand_id_idx" ON "listings" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "listings_model_id_idx" ON "listings" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "listings_status_idx" ON "listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listings_price_idx" ON "listings" USING btree ("price");--> statement-breakpoint
CREATE INDEX "listings_created_at_idx" ON "listings" USING btree ("created_at");