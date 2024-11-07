import dynamic from "next/dynamic";
import { Noto_Sans, Red_Hat_Display } from "next/font/google";
import "styles/tailwind.css";

import { PHProvider } from "./providers";

const inter = Noto_Sans({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-sans",
});

const redHatDisplay = Red_Hat_Display({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-display",
});

const PostHogPageView = dynamic(() => import("./PosthogPageView"), {
	ssr: false,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${inter.variable} ${redHatDisplay.variable}`}>
			<PHProvider>
				<body>
					<PostHogPageView />
					<div className="min-h-screen">{children}</div>
				</body>
			</PHProvider>
		</html>
	);
}
