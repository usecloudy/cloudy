drop trigger if exists "handle_updated_at" on "public"."collections";

drop trigger if exists "handle_updated_at" on "public"."thoughts";

create table "public"."thought_chunk_multi_embeddings" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "chunk_id" uuid not null,
    "token_index" smallint not null,
    "embedding" vector not null
);


create table "public"."thought_chunks" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "thought_id" uuid not null,
    "content" text not null,
    "hash" text not null,
    "context" text not null
);


create table "public"."topic_message_matches" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "topic_id" uuid,
    "message_id" uuid
);


create table "public"."topic_thought_chunk_matches" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "topic_id" uuid not null,
    "chunk_id" uuid not null
);


create table "public"."topics" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "workspace_id" uuid not null,
    "query" text not null,
    "summary" text,
    "latest_update" text
);

CREATE UNIQUE INDEX thought_chunk_multi_embeddings_pkey ON public.thought_chunk_multi_embeddings USING btree (id);

CREATE UNIQUE INDEX thought_chunks_pkey ON public.thought_chunks USING btree (id);

CREATE UNIQUE INDEX topic_message_matches_pkey ON public.topic_message_matches USING btree (id);

CREATE UNIQUE INDEX topic_thought_chunk_matches_pkey ON public.topic_thought_chunk_matches USING btree (id);

CREATE UNIQUE INDEX topics_pkey ON public.topics USING btree (id);

alter table "public"."thought_chunk_multi_embeddings" add constraint "thought_chunk_multi_embeddings_pkey" PRIMARY KEY using index "thought_chunk_multi_embeddings_pkey";

alter table "public"."thought_chunks" add constraint "thought_chunks_pkey" PRIMARY KEY using index "thought_chunks_pkey";

alter table "public"."topic_message_matches" add constraint "topic_message_matches_pkey" PRIMARY KEY using index "topic_message_matches_pkey";

alter table "public"."topic_thought_chunk_matches" add constraint "topic_thought_chunk_matches_pkey" PRIMARY KEY using index "topic_thought_chunk_matches_pkey";

alter table "public"."topics" add constraint "topics_pkey" PRIMARY KEY using index "topics_pkey";

alter table "public"."thought_chunk_multi_embeddings" add constraint "thought_chunk_multi_embeddings_chunk_id_fkey" FOREIGN KEY (chunk_id) REFERENCES thought_chunks(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thought_chunk_multi_embeddings" validate constraint "thought_chunk_multi_embeddings_chunk_id_fkey";

alter table "public"."thought_chunks" add constraint "thought_chunks_thought_id_fkey" FOREIGN KEY (thought_id) REFERENCES thoughts(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thought_chunks" validate constraint "thought_chunks_thought_id_fkey";

alter table "public"."topic_thought_chunk_matches" add constraint "topic_thought_chunk_matches_chunk_id_fkey" FOREIGN KEY (chunk_id) REFERENCES thought_chunks(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."topic_thought_chunk_matches" validate constraint "topic_thought_chunk_matches_chunk_id_fkey";

alter table "public"."topic_thought_chunk_matches" add constraint "topic_thought_chunk_matches_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES topics(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."topic_thought_chunk_matches" validate constraint "topic_thought_chunk_matches_topic_id_fkey";

alter table "public"."topics" add constraint "topics_organization_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."topics" validate constraint "topics_organization_fkey";

alter table "public"."topics" add constraint "topics_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."topics" validate constraint "topics_workspace_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.multi_embedding_thought_chunk_search(query_embeddings vector[], match_threshold double precision, max_results integer, workspace_id uuid)
 RETURNS TABLE(chunk_id uuid, thought_id uuid, similarity_score double precision)
 LANGUAGE sql
AS $function$
  WITH query_vectors AS (
    SELECT unnest(query_embeddings) AS query_vector
  )
  SELECT 
    tcme.chunk_id,
    tc.thought_id,
    1 - MIN(tcme.embedding <=> qv.query_vector) AS similarity_score
  FROM thought_chunk_multi_embeddings tcme
  JOIN thought_chunks tc ON tcme.chunk_id = tc.id
  JOIN thoughts t ON tc.thought_id = t.id
  CROSS JOIN query_vectors qv
  WHERE t.workspace_id = workspace_id
  GROUP BY tcme.chunk_id, tc.thought_id
  HAVING 1 - MIN(tcme.embedding <=> qv.query_vector) > match_threshold
  ORDER BY similarity_score DESC
  LIMIT LEAST(max_results, 200);
$function$
;

grant delete on table "public"."thought_chunk_multi_embeddings" to "anon";

grant insert on table "public"."thought_chunk_multi_embeddings" to "anon";

grant references on table "public"."thought_chunk_multi_embeddings" to "anon";

grant select on table "public"."thought_chunk_multi_embeddings" to "anon";

grant trigger on table "public"."thought_chunk_multi_embeddings" to "anon";

grant truncate on table "public"."thought_chunk_multi_embeddings" to "anon";

grant update on table "public"."thought_chunk_multi_embeddings" to "anon";

grant delete on table "public"."thought_chunk_multi_embeddings" to "authenticated";

grant insert on table "public"."thought_chunk_multi_embeddings" to "authenticated";

grant references on table "public"."thought_chunk_multi_embeddings" to "authenticated";

grant select on table "public"."thought_chunk_multi_embeddings" to "authenticated";

grant trigger on table "public"."thought_chunk_multi_embeddings" to "authenticated";

grant truncate on table "public"."thought_chunk_multi_embeddings" to "authenticated";

grant update on table "public"."thought_chunk_multi_embeddings" to "authenticated";

grant delete on table "public"."thought_chunk_multi_embeddings" to "service_role";

grant insert on table "public"."thought_chunk_multi_embeddings" to "service_role";

grant references on table "public"."thought_chunk_multi_embeddings" to "service_role";

grant select on table "public"."thought_chunk_multi_embeddings" to "service_role";

grant trigger on table "public"."thought_chunk_multi_embeddings" to "service_role";

grant truncate on table "public"."thought_chunk_multi_embeddings" to "service_role";

grant update on table "public"."thought_chunk_multi_embeddings" to "service_role";

grant delete on table "public"."thought_chunks" to "anon";

grant insert on table "public"."thought_chunks" to "anon";

grant references on table "public"."thought_chunks" to "anon";

grant select on table "public"."thought_chunks" to "anon";

grant trigger on table "public"."thought_chunks" to "anon";

grant truncate on table "public"."thought_chunks" to "anon";

grant update on table "public"."thought_chunks" to "anon";

grant delete on table "public"."thought_chunks" to "authenticated";

grant insert on table "public"."thought_chunks" to "authenticated";

grant references on table "public"."thought_chunks" to "authenticated";

grant select on table "public"."thought_chunks" to "authenticated";

grant trigger on table "public"."thought_chunks" to "authenticated";

grant truncate on table "public"."thought_chunks" to "authenticated";

grant update on table "public"."thought_chunks" to "authenticated";

grant delete on table "public"."thought_chunks" to "service_role";

grant insert on table "public"."thought_chunks" to "service_role";

grant references on table "public"."thought_chunks" to "service_role";

grant select on table "public"."thought_chunks" to "service_role";

grant trigger on table "public"."thought_chunks" to "service_role";

grant truncate on table "public"."thought_chunks" to "service_role";

grant update on table "public"."thought_chunks" to "service_role";

grant delete on table "public"."topic_message_matches" to "anon";

grant insert on table "public"."topic_message_matches" to "anon";

grant references on table "public"."topic_message_matches" to "anon";

grant select on table "public"."topic_message_matches" to "anon";

grant trigger on table "public"."topic_message_matches" to "anon";

grant truncate on table "public"."topic_message_matches" to "anon";

grant update on table "public"."topic_message_matches" to "anon";

grant delete on table "public"."topic_message_matches" to "authenticated";

grant insert on table "public"."topic_message_matches" to "authenticated";

grant references on table "public"."topic_message_matches" to "authenticated";

grant select on table "public"."topic_message_matches" to "authenticated";

grant trigger on table "public"."topic_message_matches" to "authenticated";

grant truncate on table "public"."topic_message_matches" to "authenticated";

grant update on table "public"."topic_message_matches" to "authenticated";

grant delete on table "public"."topic_message_matches" to "service_role";

grant insert on table "public"."topic_message_matches" to "service_role";

grant references on table "public"."topic_message_matches" to "service_role";

grant select on table "public"."topic_message_matches" to "service_role";

grant trigger on table "public"."topic_message_matches" to "service_role";

grant truncate on table "public"."topic_message_matches" to "service_role";

grant update on table "public"."topic_message_matches" to "service_role";

grant delete on table "public"."topic_thought_chunk_matches" to "anon";

grant insert on table "public"."topic_thought_chunk_matches" to "anon";

grant references on table "public"."topic_thought_chunk_matches" to "anon";

grant select on table "public"."topic_thought_chunk_matches" to "anon";

grant trigger on table "public"."topic_thought_chunk_matches" to "anon";

grant truncate on table "public"."topic_thought_chunk_matches" to "anon";

grant update on table "public"."topic_thought_chunk_matches" to "anon";

grant delete on table "public"."topic_thought_chunk_matches" to "authenticated";

grant insert on table "public"."topic_thought_chunk_matches" to "authenticated";

grant references on table "public"."topic_thought_chunk_matches" to "authenticated";

grant select on table "public"."topic_thought_chunk_matches" to "authenticated";

grant trigger on table "public"."topic_thought_chunk_matches" to "authenticated";

grant truncate on table "public"."topic_thought_chunk_matches" to "authenticated";

grant update on table "public"."topic_thought_chunk_matches" to "authenticated";

grant delete on table "public"."topic_thought_chunk_matches" to "service_role";

grant insert on table "public"."topic_thought_chunk_matches" to "service_role";

grant references on table "public"."topic_thought_chunk_matches" to "service_role";

grant select on table "public"."topic_thought_chunk_matches" to "service_role";

grant trigger on table "public"."topic_thought_chunk_matches" to "service_role";

grant truncate on table "public"."topic_thought_chunk_matches" to "service_role";

grant update on table "public"."topic_thought_chunk_matches" to "service_role";

grant delete on table "public"."topics" to "anon";

grant insert on table "public"."topics" to "anon";

grant references on table "public"."topics" to "anon";

grant select on table "public"."topics" to "anon";

grant trigger on table "public"."topics" to "anon";

grant truncate on table "public"."topics" to "anon";

grant update on table "public"."topics" to "anon";

grant delete on table "public"."topics" to "authenticated";

grant insert on table "public"."topics" to "authenticated";

grant references on table "public"."topics" to "authenticated";

grant select on table "public"."topics" to "authenticated";

grant trigger on table "public"."topics" to "authenticated";

grant truncate on table "public"."topics" to "authenticated";

grant update on table "public"."topics" to "authenticated";

grant delete on table "public"."topics" to "service_role";

grant insert on table "public"."topics" to "service_role";

grant references on table "public"."topics" to "service_role";

grant select on table "public"."topics" to "service_role";

grant trigger on table "public"."topics" to "service_role";

grant truncate on table "public"."topics" to "service_role";

grant update on table "public"."topics" to "service_role";

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');
ALTER TABLE "public"."collections" DISABLE TRIGGER "handle_updated_at";

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.thoughts FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');
ALTER TABLE "public"."thoughts" DISABLE TRIGGER "handle_updated_at";

