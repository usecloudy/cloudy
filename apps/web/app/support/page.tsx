import { MailIcon, TwitterIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { Button } from "../components/Button";

export const metadata: Metadata = {
	title: "Cloudy Support",
};

const HeroBackground = () => {
	return (
		<div className="bg-background absolute inset-0 z-[-1] flex flex-1 items-start justify-center">
			<div className="relative mt-[6vw] size-[180px] rounded-full md:size-[240px] lg:size-[20vw]">
				<div className="bg-accent absolute size-[180px] translate-x-[24%] rounded-full md:size-[240px] lg:size-[20vw]" />
				<div className="bg-accent-2 absolute size-[180px] translate-x-[-24%] rounded-full md:size-[240px] lg:size-[20vw]" />
			</div>
			<div className="bg-background/20 absolute left-0 top-0 size-full backdrop-blur-[72px] md:backdrop-blur-[108px]" />
		</div>
	);
};

export default function Support() {
	return (
		<div>
			<HeroBackground />
			<section>
				<div className="mx-auto grid max-w-screen-xl px-4 py-20 text-center lg:py-24">
					<div className="mx-auto flex flex-col items-center gap-6 place-self-center">
						<div className="flex flex-col items-center gap-1">
							<h1 className="font-display mb-4 px-4 text-center text-2xl font-bold leading-none tracking-tight md:text-3xl xl:text-4xl">
								Need help? We're here for you.
							</h1>
							<div className="text-primary/50 flex flex-col px-4 text-center text-base font-normal md:text-lg">
								<span>
									{"If you're experiencing any issues or have questions, don't hesitate to reach out."}
								</span>
								<span>{"Our team is ready to assist you."}</span>
							</div>
						</div>
						<div className="flex flex-col items-center gap-4">
							<Link href="mailto:founders@usecloudy.com">
								<Button size="lg">
									<MailIcon className="size-5" />
									<span>Email Support</span>
								</Button>
							</Link>
							<div className="text-secondary text-sm">
								Contact us at{" "}
								<a href="mailto:founders@usecloudy.com" className="text-accent hover:underline">
									founders@usecloudy.com
								</a>
							</div>
							<div className="text-secondary text-sm">
								For a faster response or just to chat, shoot Jenn a dm on X:{" "}
								<a href="https://x.com/jennmueng" className="text-accent hover:underline">
									@jennmueng
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
