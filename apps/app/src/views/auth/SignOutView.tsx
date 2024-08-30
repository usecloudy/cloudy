import { useEffect } from "react";

import { supabase } from "src/clients/supabase";
import { SimpleLayout } from "src/components/SimpleLayout";

export const SignOutView = () => {
	useEffect(() => {
		supabase.auth.signOut();
	}, []);

	return (
		<SimpleLayout>
			<div>
				<p>You have been signed out</p>
			</div>
		</SimpleLayout>
	);
};
