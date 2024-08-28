import { CoreMessage } from "https://esm.sh/ai@3.3.9";

interface RelatedThought {
    content: string;
}

export const makeDocumentGenPrompts = ({
    relatedThoughts,
    prompt,
}: {
    relatedThoughts: RelatedThought[];
    prompt: string;
}): CoreMessage[] => [
    {
        role: "user",
        content: `You are an assistant that is an expert at writing.
        
        Below are some relevant notes I've previously written:
${
            relatedThoughts.map((thought) =>
                `<note>\n${thought.content}\n</note>`
            ).join("\n")
        }

Based on that, accomplish the prompt::
<prompt>
${prompt}
</prompt>`,
    },
];
