export const extractInnerTextFromXml = (
    xml: string,
    tag: string,
    options: { trim?: boolean } = { trim: false }
) => {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "s");
    const match = xml.match(regex);
    return match?.[1] ? (options.trim ? match[1].trim() : match[1]) : "";
};

export const extractMultipleInnerTextFromXml = (
    xml: string,
    tag: string,
    options: { trim?: boolean } = { trim: false }
) => {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "gs");
    const matches = Array.from(xml.matchAll(regex));
    return matches.map((match) =>
        match[1] ? (options.trim ? match[1].trim() : match[1]) : ""
    );
};
