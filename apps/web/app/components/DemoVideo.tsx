import { list } from "@vercel/blob";

import { ClientVideo } from "./ClientVideo";

export async function VideoComponent({ fileName }: { fileName: string }) {
	const { blobs } = await list({
		prefix: fileName,
		limit: 1,
	});
	const { url } = blobs[0] ?? {};

	return <ClientVideo url={url ?? ""} />;
}
