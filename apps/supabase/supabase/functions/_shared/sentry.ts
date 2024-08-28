import * as Sentry from "https://deno.land/x/sentry@8.26.0/index.mjs";

Sentry.init({
    dsn: Deno.env.get("SENTRY_DSN")!,
    defaultIntegrations: false,
    tracesSampleRate: 1.0,
});

export const withSentry = (fn: (...args: any[]) => Promise<Response>) => {
    return async (...args: any[]): Promise<Response> => {
        try {
            return await fn(...args);
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    };
};