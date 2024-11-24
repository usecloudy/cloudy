drop trigger if exists "folders_webhook" on "public"."folders";

drop trigger if exists "documents_webhook" on "public"."thoughts";

CREATE TRIGGER folders_webhook AFTER INSERT OR DELETE OR UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION webhook('https://www.usecloudy.com/api/folders/webhook');

CREATE TRIGGER documents_webhook AFTER INSERT OR DELETE OR UPDATE ON public.thoughts FOR EACH ROW EXECUTE FUNCTION webhook('https://www.usecloudy.com/api/documents/webhook');