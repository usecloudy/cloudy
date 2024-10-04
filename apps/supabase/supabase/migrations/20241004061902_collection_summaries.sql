alter table "public"."collections" add column "summary" json;

alter table "public"."collections" add column "summary_updated_at" timestamp with time zone;