export const NotFoundView = () => {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-4">
			<img src="/cringe-cat.jpg" className="h-48 w-96" alt="Oh no! Cringe" />
			<div className="flex flex-col items-center gap-2">
				<p className="text-center">Oh no. 404. We couldn't find what you're looking for.</p>
			</div>
		</div>
	);
};
