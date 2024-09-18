import { RocketIcon } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import bgPic from "./assets/bg.jpg";
import { Button } from "./components/Button";
import { VideoComponent } from "./components/DemoVideo";

export const metadata: Metadata = {
	title: "Cloudy",
	// twitter: {
	//   card: "summary_large_image",
	// },
	// openGraph: {
	//   url: "https://next-enterprise.vercel.app/",
	//   images: [
	//     {
	//       width: 1200,
	//       height: 630,
	//       url: "https://raw.githubusercontent.com/Blazity/next-enterprise/main/.github/assets/project-logo.png",
	//     },
	//   ],
	// },
};

const HeroBackground = () => {
	return (
		<div className="bg-[#FDFEF7] absolute inset-0 z-[-1] flex flex-1 items-start justify-center">
			<div className="fixed z-[-2] w-screen h-screen bg-[#FDFEF7]" />
			<Image
				src={bgPic}
				alt="Hero Background"
				width={1920}
				height={1080}
				className="object-cover w-full h-full"
				quality={100}
			/>
		</div>
	);
};

export default function Web() {
	return (
		<div>
			<HeroBackground />
			<section className="flex flex-col gap-12">
				<div className="mx-auto grid max-w-screen-xl px-4 pt-20 text-center lg:pt-24">
					<div className="mx-auto flex flex-col items-center gap-6 place-self-center">
						<div className="flex flex-col items-center gap-1">
							<h1 className="font-display mb-4 px-4 text-center text-4xl font-bold leading-none tracking-tight md:text-5xl xl:text-6xl">
								Supercharge your thoughts.
							</h1>
							<div className="text-primary/50 flex flex-col px-4 text-center text-base font-normal md:text-lg">
								<span>{"Just start writing, and watch your thoughts instantly evolve."}</span>
								<span>{"Cloudy's AI doesn't just organize your ideas—it sparks new ones."}</span>
							</div>
						</div>
						<div className="flex justify-center">
							<Link href="https://app.usecloudy.com">
								<Button size="lg">
									<RocketIcon className="size-5" />
									<span>Get Started</span>
								</Button>
							</Link>
						</div>
					</div>
				</div>
				<div className="flex flex-col items-center justify-center px-6 md:px-8">
					<div className="bg-card w-full aspect-[16/10.25] max-w-screen-md overflow-hidden rounded-lg flex items-center justify-center">
						<Suspense>
							<VideoComponent fileName="demo-FoehVMRJTQ9S2lISrhOY7ByI8fHfBS.mp4" />
						</Suspense>
					</div>
				</div>
			</section>
		</div>
	);
}
