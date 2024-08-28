import LoadingSpinner from "src/components/LoadingSpinner";
import { SimpleLayout } from "src/components/SimpleLayout";

export const LoadingView = () => {
	return (
		<SimpleLayout>
			<div className="flex h-screen items-center justify-center">
				<LoadingSpinner />
			</div>
		</SimpleLayout>
	);
};
