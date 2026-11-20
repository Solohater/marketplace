CREATE TYPE "public"."media_purpose" AS ENUM('listing', 'chat', 'avatar');--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"purpose" "media_purpose" NOT NULL,
	"object_key" text NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"mime_type" varchar(50) NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_owner_idx" ON "media" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "media_owner_purpose_idx" ON "media" USING btree ("owner_id","purpose");--> statement-breakpoint
CREATE UNIQUE INDEX "media_object_key_unique" ON "media" USING btree ("object_key");