-- Delete any null values in the matches_thought_id column
DELETE FROM "public"."thought_embedding_matches"
WHERE "matches_thought_id" IS NULL;

alter table "public"."thought_embedding_matches" alter column "matches_thought_id" set not null;

