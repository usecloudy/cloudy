import { ellipsizeText, fixOneToOne, handleSupabaseError } from "@cloudy/utils/common";

import { getSupabaseAnonClient } from "app/utils/supabase";

import { DocumentView } from "./DocumentView";

export const generateMetadata = async ({ params }: { params: { documentId: string } }) => {
	const supabase = await getSupabaseAnonClient();
	const thought = handleSupabaseError(
		await supabase
			.from("thoughts")
			.select("latest_version:document_versions!latest_version_id(id, title, content_md)")
			.eq("id", params.documentId)
			.eq("access_strategy", "public")
			.maybeSingle(),
	);

	const documentVersion = thought?.latest_version && fixOneToOne(thought.latest_version);

	return {
		title: `${documentVersion?.title || "Untitled"} | Cloudy Pages`,
		description: ellipsizeText(documentVersion?.content_md ?? "", 128),
	};
};

export default async function PublicDocumentPage({ params }: { params: { documentId: string } }) {
	const supabase = await getSupabaseAnonClient();
	const document = handleSupabaseError(
		await supabase
			.from("thoughts")
			.select("latest_version:document_versions!latest_version_id(id, title, content_json)")
			.eq("id", params.documentId)
			.eq("access_strategy", "public")
			.maybeSingle(),
	);

	if (!document?.latest_version) {
		return <div>Document not found or not public</div>;
	}

	const documentVersion = fixOneToOne(document.latest_version)!;

	return <DocumentView documentVersion={documentVersion} />;
}
