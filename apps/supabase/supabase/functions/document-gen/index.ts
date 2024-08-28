// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import * as Sentry from "https://deno.land/x/sentry@8.26.0/index.mjs";

import { generateObject, generateText } from "https://esm.sh/ai@3.3.9";
import { anthropic } from "https://esm.sh/@ai-sdk/anthropic@0.0.43";
import { openai } from "https://esm.sh/@ai-sdk/openai@0.0.48";
import { z } from "https://esm.sh/zod@3.23.8";
import { traceable } from "npm:langsmith@0.1.41/traceable";
import { wrapAISDKModel } from "npm:langsmith@0.1.41/wrappers/vercel";

import {
    createClient,
    SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

import { Database } from "../_shared/database.types.ts";
import { makeDocumentGenPrompts } from "./prompt.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { queryThoughts } from "./util.ts";

Sentry.init({
    dsn: Deno.env.get("SENTRY_DSN")!,
    defaultIntegrations: false,
    tracesSampleRate: 1.0,
});

type Payload = {
    prompt: string;
    collectionId?: string;
};

const documentSchema = z.object({
    title: z.string(),
    documentContentString: z.string(),
});

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
        throw new Error("ANTHROPIC_API_KEY is required");
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
        throw new Error("SUPABASE_URL is required");
    }
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseAnonKey) {
        throw new Error("SUPABASE_ANON_KEY is required");
    }

    const authHeader = req.headers.get("Authorization")!;
    const payload: Payload = await req.json();

    const supabase = createClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
        throw new Error(userError.message);
    }
    const authorId = userData.user.id;

    const { prompt, collectionId } = payload;

    console.log(
        "Will generate a document",
        collectionId
            ? `for collection ${collectionId}`
            : "without collection id",
    );

    const newThought = await generateDocument(
        prompt,
        authorId,
        supabase,
        collectionId,
    );

    return new Response(
        JSON.stringify({
            success: true,
            thoughtId: newThought.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
});

const generateDocument = traceable(
    async (
        prompt: string,
        authorId: string,
        supabase: SupabaseClient<Database>,
        collectionId?: string,
    ) => {
        const similarThoughts = await queryThoughts(
            prompt,
            authorId,
            supabase,
            collectionId,
        );

        const documentGenMessages = makeDocumentGenPrompts({
            relatedThoughts: similarThoughts.map((thought) => ({
                ...thought,
                content: thought.content ?? "",
            })),
            prompt,
        });

        const { responseMessages } = await generateText({
            model: wrapAISDKModel(anthropic("claude-3-5-sonnet-20240620")),
            messages: documentGenMessages,
        });

        const { object: document } = await generateObject<
            z.infer<typeof documentSchema>
        >({
            model: wrapAISDKModel(
                openai.languageModel("gpt-4o-mini-2024-07-18"),
            ),
            schema: documentSchema,
            messages: [...documentGenMessages, ...responseMessages, {
                role: "user",
                content: "Place the document in the following schema: ",
            }],
        });

        const { data: newThought, error: newThoughtError } = await supabase
            .from(
                "thoughts",
            ).insert({
                content_md: document.documentContentString,
                content: document.documentContentString,
                title: document.title,
                author_id: authorId,
            }).select().single();

        if (newThoughtError) {
            throw new Error(newThoughtError.message);
        }

        return newThought;
    },
    { name: "generateDocument" },
);
