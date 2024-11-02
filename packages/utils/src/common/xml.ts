export const extractInnerTextFromXml = (xml: string, tag: string) => {
	const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "s");
	const match = xml.match(regex);
	return match ? match[1] : "";
};
