drop trigger if exists "Respond to thread" on "public"."thought_chat_threads";

alter table "public"."thoughts" add column "signals" json;

