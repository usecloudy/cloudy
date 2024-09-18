import Link from "next/link";

export const Footer = () => {
	return (
		<div className="flex flex-col items-center w-full justify-center">
			<div className="flex flex-col text-sm text-center gap-4">
				<Link href="/support" className="text-accent hover:text-accent/80">
					Support
				</Link>
				<Link href="/pp" className="text-accent hover:text-accent/80">
					Privacy Policy
				</Link>
				<Link href="/tos" className="text-accent hover:text-accent/80">
					Terms of Service
				</Link>
			</div>
			<div className="mt-8 pb-4 text-sm opacity-25">© 2024 Brain Fog Inc.</div>
		</div>
	);
};
