alter table "public"."thoughts" add column "content_ts" timestamp with time zone not null default now();

alter table "public"."thoughts" add column "title_ts" timestamp with time zone not null default now();


