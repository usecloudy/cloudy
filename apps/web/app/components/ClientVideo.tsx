"use client";

import { useState } from "react";

export function ClientVideo({ url }: { url: string }) {
	return (
		<video controls autoPlay muted aria-label="Video player" poster="placeholder.png">
			<source src={url} type="video/mp4" />
			Your browser does not support the video tag.
		</video>
	);
}
