import { embedMany, generateObject } from "https://esm.sh/ai@3.3.9";
import { openai } from "https://esm.sh/@ai-sdk/openai@0.0.48";
import { wrapAISDKModel } from "npm:langsmith@0.1.41/wrappers/vercel";
import { z } from "https://esm.sh/zod@3.23.8";

export const generateEmbeddings = async (
    inputs: string[],
    model = "text-embedding-3-small",
) => {
    console.log(
        `[generateEmbeddings] Will embed ${inputs.length} chunks.`,
    );

    const { embeddings } = await embedMany({
        model: openai.embedding(model),
        values: inputs,
    });

    return embeddings;
};

const queryEmbeddingSchema = z.object({
    queries: z.array(z.string()),
});

export const generateQueryEmbeddings = async (input: string) => {
    const { object } = await generateObject<
        z.infer<typeof queryEmbeddingSchema>
    >({
        model: wrapAISDKModel(openai.languageModel("gpt-4o-mini-2024-07-18")),
        prompt:
            `Convert the following text into search queries that would match the most relevant documents in the database. The database is a collection of notes and documents, we want to match the content of the notes and documents to the query.
Text: "${input}"`,
        schema: queryEmbeddingSchema,
    });

    const embeddings = await generateEmbeddings(object.queries);

    return embeddings;
};
