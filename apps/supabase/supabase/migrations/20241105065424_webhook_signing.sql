set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_hmac(secret_key text, payload text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    hmac_result bytea;
BEGIN
    -- Convert text to bytea using encode/decode for proper handling
    hmac_result := extensions.hmac(
        convert_to(payload, 'UTF8'), 
        convert_to(secret_key, 'UTF8'),
        'sha256'::text
    );
    RETURN encode(hmac_result, 'base64');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.users (id, name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.webhook()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    secret text;
    payload jsonb;
    request_id bigint;
    signature text;
    webhook_url text;
BEGIN
    -- Get the webhook URL from TG_ARGV[0]
    webhook_url := TG_ARGV[0];
    
    -- Get the webhook secret from the vault
    SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = 'WEBHOOK_SECRET' LIMIT 1;

    -- Generate the payload
    payload = jsonb_build_object(
            'old_record', old,
            'record', new,
            'type', tg_op,
            'table', tg_table_name,
            'schema', tg_table_schema
              );

    -- Generate the signature using the correct schema reference
    signature = public.generate_hmac(secret, payload::text);

    -- Send the webhook request
    SELECT http_post
    INTO request_id
    FROM
        net.http_post(
                webhook_url,
                payload,
                '{}',
                jsonb_build_object(
                        'Content-Type', 'application/json',
                        'X-Supabase-Signature', signature
                ),
                '1000'
        );

    -- Insert the request ID into the Supabase hooks table
    INSERT INTO supabase_functions.hooks
        (hook_table_id, hook_name, request_id)
    VALUES (tg_relid, tg_name, request_id);

    RETURN new;
END;
$function$
;

CREATE TRIGGER users_webhook AFTER INSERT OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION webhook('https://usecloudy.com/api/auth/handle-db-user');