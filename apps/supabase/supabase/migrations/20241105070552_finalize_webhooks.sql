drop trigger if exists "Generate Thought Embeddings" on "public"."thoughts";

drop trigger if exists "Handle note links" on "public"."thoughts";

drop trigger if exists "Handle thought AI triggers" on "public"."thoughts";

drop trigger if exists "Handle workspace users biling" on "public"."workspace_users";

drop trigger if exists "users_webhook" on "public"."users";

set check_function_bodies = off;

CREATE TRIGGER handle_note_links AFTER UPDATE ON public.thoughts FOR EACH ROW EXECUTE FUNCTION webhook('https://usecloudy.com/api/thoughts/link');

CREATE TRIGGER handle_workspace_users_billing AFTER INSERT OR DELETE OR UPDATE ON public.workspace_users FOR EACH ROW EXECUTE FUNCTION webhook('https://usecloudy.com/api/payments/update/count');

CREATE TRIGGER users_webhook AFTER INSERT OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION webhook('https://usecloudy.com/api/auth/handle-db-user');


