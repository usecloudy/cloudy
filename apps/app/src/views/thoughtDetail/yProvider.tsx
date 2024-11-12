import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";

import { supabase } from "src/clients/supabase";
import { SupabaseProvider } from "src/utils/yjsSyncProvider";

export const useYProvider = (thoughtId: string, disableUpdatesRef: MutableRefObject<boolean>) => {
	const [isConnected, setIsConnected] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const providerRef = useRef<SupabaseProvider | null>(null);

	const { doc: ydoc, provider } = useMemo(() => {
		const doc = new Y.Doc({ guid: thoughtId });

		const newProvider = new SupabaseProvider(supabase, {
			id: thoughtId!,
			name: `thought:${thoughtId}`,
			document: doc,
			databaseDetails: {
				schema: "public",
				table: "note_contents",
				updateColumns: { name: "id", content: "content" },
				conflictColumns: "id",
			},
			disableUpdatesRef,
		});

		return { provider: newProvider, doc };
	}, [thoughtId, disableUpdatesRef]);

	useEffect(() => {
		// Store the current object in the ref
		const previousProvider = providerRef.current;
		providerRef.current = provider;

		// Cleanup function
		return () => {
			if (previousProvider && previousProvider !== provider) {
				previousProvider.destroy();
			}
		};
	}, [provider]);

	useEffect(() => {
		provider.on("synced", () => {
			setIsConnected(true);
			setIsLoading(false);
		});
		provider.on("disconnect", () => {
			setIsConnected(false);
		});
	}, [provider]);

	return { isLoading, isConnected, ydoc, provider };
};
