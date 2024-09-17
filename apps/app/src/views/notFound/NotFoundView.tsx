export const NotFoundView = () => {
	return (
		<div className="flex flex-col items-center justify-center h-full gap-4">
			<img src="/cringe-cat.jpg" className="w-96 h-48" alt="Oh no! Cringe" />
			<div className="flex flex-col items-center gap-2">
				<p className="text-center">Oh no. 404. We couldn't find what you're looking for.</p>
			</div>
		</div>
	);
};
