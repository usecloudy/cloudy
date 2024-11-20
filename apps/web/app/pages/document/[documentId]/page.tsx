import { ellipsizeText, fixOneToOne, handleSupabaseError } from "@cloudy/utils/common";

import { getSupabaseAnonClient } from "app/utils/supabase";

import { DocumentView } from "./DocumentView";

export const generateMetadata = async ({ params }: { params: { documentId: string } }) => {
	const supabase = await getSupabaseAnonClient();
	const document = handleSupabaseError(
		await supabase.from("document_versions").select("id, title, content_md").eq("id", params.documentId).maybeSingle(),
	);

	return {
		title: `${document?.title || "Untitled"} | Cloudy Pages`,
		description: ellipsizeText(document?.content_md ?? "", 128),
	};
};

export default async function PublicDocumentPage({ params }: { params: { documentId: string } }) {
	const supabase = await getSupabaseAnonClient();
	let tmpDocumentVersion = handleSupabaseError(
		await supabase
			.from("thoughts")
			.select("latest_version:document_versions!latest_version_id(id, title, content_json)")
			.eq("id", params.documentId)
			.maybeSingle(),
	)?.latest_version;

	if (!tmpDocumentVersion) {
		return <div>Document not found or not public</div>;
	}

	const documentVersion = fixOneToOne(tmpDocumentVersion)!;

	return <DocumentView documentVersion={documentVersion} />;
}
