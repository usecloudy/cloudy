import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAsync } from "react-use";

import { supabase } from "src/clients/supabase";
import { SimpleLayout } from "src/components/SimpleLayout";

export const SignOutView = () => {
	const navigate = useNavigate();

	useAsync(async () => {
		await supabase.auth.signOut();
		navigate("/");
	}, []);

	return (
		<SimpleLayout>
			<div>
				<p>You have been signed out</p>
			</div>
		</SimpleLayout>
	);
};
