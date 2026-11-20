CREATE TABLE "seller_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"store_name" varchar(100) NOT NULL,
	"store_description" text,
	"logo_url" text,
	"phone" varchar(20),
	"location_id" uuid,
	"address" text,
	"is_verified" varchar(5) DEFAULT 'false' NOT NULL,
	"verified_at" timestamp with time zone,
	"verification_level" varchar(20) DEFAULT 'none' NOT NULL,
	"member_since" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seller_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_location_id_areas_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seller_profiles_user_id_idx" ON "seller_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "seller_profiles_store_name_idx" ON "seller_profiles" USING btree ("store_name");