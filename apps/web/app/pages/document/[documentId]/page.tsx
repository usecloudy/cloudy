import { ellipsizeText, handleSupabaseError } from "@cloudy/utils/common";

import { getSupabaseAnonClient } from "app/utils/supabase";

import { DocumentView } from "./DocumentView";

export const generateMetadata = async ({ params }: { params: { documentId: string } }) => {
	const supabase = await getSupabaseAnonClient();
	const document = handleSupabaseError(
		await supabase
			.from("thoughts")
			.select("id, title, content_plaintext")
			.eq("id", params.documentId)
			.eq("access_strategy", "public")
			.maybeSingle(),
	);

	return {
		title: `${document?.title || "Untitled"} | Cloudy Pages`,
		description: ellipsizeText(document?.content_plaintext, 128),
	};
};

export default async function PublicDocumentPage({ params }: { params: { documentId: string } }) {
	const supabase = await getSupabaseAnonClient();
	const document = handleSupabaseError(
		await supabase
			.from("thoughts")
			.select("id, title, content")
			.eq("id", params.documentId)
			.eq("access_strategy", "public")
			.maybeSingle(),
	);

	if (!document) {
		return <div>Document not found or not public</div>;
	}

	return <DocumentView document={document} />;
}
