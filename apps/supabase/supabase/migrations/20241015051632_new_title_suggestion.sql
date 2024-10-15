alter table "public"."thoughts" add column "disable_title_suggestions" boolean;

alter table "public"."thoughts" add column "title_suggestion" text;

alter table "public"."thoughts" add column "title_suggestion_content_md" text;