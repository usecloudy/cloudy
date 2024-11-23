import "@cloudy/ui/styles/codeThemes.css";
import "@cloudy/ui/styles/tailwind.css";
import dynamic from "next/dynamic";
import { Noto_Sans, Red_Hat_Display } from "next/font/google";

import { Navbar } from "./components/Navbar";
import { Providers } from "./providers";

const noto = Noto_Sans({
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
		<html lang="en" className={`${noto.variable} ${redHatDisplay.variable}`} suppressHydrationWarning>
			<body>
				<Providers>
					<PostHogPageView />

					<div className="min-h-screen">{children}</div>
				</Providers>
			</body>
		</html>
	);
}
