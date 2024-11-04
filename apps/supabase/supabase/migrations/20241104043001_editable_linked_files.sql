alter table "public"."document_repo_links" add column "branch" text;

alter table "public"."repository_connections" add column "default_branch" text not null default 'main'::text;