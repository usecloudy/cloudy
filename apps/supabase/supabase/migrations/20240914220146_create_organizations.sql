
create table "public"."organization_users" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "organization_id" uuid not null,
    "user_id" uuid not null
);


create table "public"."organizations" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "stripe_customer_id" text
);

alter table "public"."thoughts" add column "organization_id" uuid;

CREATE UNIQUE INDEX organization_users_pkey ON public.organization_users USING btree (id);

CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

alter table "public"."organization_users" add constraint "organization_users_pkey" PRIMARY KEY using index "organization_users_pkey";

alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."organization_users" add constraint "organization_users_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."organization_users" validate constraint "organization_users_organization_id_fkey";

alter table "public"."organization_users" add constraint "organization_users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."organization_users" validate constraint "organization_users_user_id_fkey";

alter table "public"."thoughts" add constraint "thoughts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."thoughts" validate constraint "thoughts_organization_id_fkey";

grant delete on table "public"."organization_users" to "anon";

grant insert on table "public"."organization_users" to "anon";

grant references on table "public"."organization_users" to "anon";

grant select on table "public"."organization_users" to "anon";

grant trigger on table "public"."organization_users" to "anon";

grant truncate on table "public"."organization_users" to "anon";

grant update on table "public"."organization_users" to "anon";

grant delete on table "public"."organization_users" to "authenticated";

grant insert on table "public"."organization_users" to "authenticated";

grant references on table "public"."organization_users" to "authenticated";

grant select on table "public"."organization_users" to "authenticated";

grant trigger on table "public"."organization_users" to "authenticated";

grant truncate on table "public"."organization_users" to "authenticated";

grant update on table "public"."organization_users" to "authenticated";

grant delete on table "public"."organization_users" to "service_role";

grant insert on table "public"."organization_users" to "service_role";

grant references on table "public"."organization_users" to "service_role";

grant select on table "public"."organization_users" to "service_role";

grant trigger on table "public"."organization_users" to "service_role";

grant truncate on table "public"."organization_users" to "service_role";

grant update on table "public"."organization_users" to "service_role";

grant delete on table "public"."organizations" to "anon";

grant insert on table "public"."organizations" to "anon";

grant references on table "public"."organizations" to "anon";

grant select on table "public"."organizations" to "anon";

grant trigger on table "public"."organizations" to "anon";

grant truncate on table "public"."organizations" to "anon";

grant update on table "public"."organizations" to "anon";

grant delete on table "public"."organizations" to "authenticated";

grant insert on table "public"."organizations" to "authenticated";

grant references on table "public"."organizations" to "authenticated";

grant select on table "public"."organizations" to "authenticated";

grant trigger on table "public"."organizations" to "authenticated";

grant truncate on table "public"."organizations" to "authenticated";

grant update on table "public"."organizations" to "authenticated";

grant delete on table "public"."organizations" to "service_role";

grant insert on table "public"."organizations" to "service_role";

grant references on table "public"."organizations" to "service_role";

grant select on table "public"."organizations" to "service_role";

grant trigger on table "public"."organizations" to "service_role";

grant truncate on table "public"."organizations" to "service_role";

grant update on table "public"."organizations" to "service_role";