import { Metadata } from "next"
import { Button } from "./components/Button"
import Link from "next/link"
import { RocketIcon } from "lucide-react"

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
}

const HeroBackground = () => {
  return (
    <div className="bg-background absolute inset-0 z-[-1] flex flex-1 items-start justify-center">
      <div className="relative mt-[6vw] size-[180px] rounded-full md:size-[240px] lg:size-[20vw]">
        <div className="bg-accent absolute size-[180px] translate-x-[24%] rounded-full md:size-[240px] lg:size-[20vw]" />
        <div className="bg-accent-2 absolute size-[180px] translate-x-[-24%] rounded-full md:size-[240px] lg:size-[20vw]" />
      </div>
      <div className="bg-background/20 absolute left-0 top-0 size-full backdrop-blur-[72px] md:backdrop-blur-[108px]" />
    </div>
  )
}

export default function Web() {
  return (
    <div>
      <HeroBackground />
      <section>
        <div className="mx-auto grid max-w-screen-xl px-4 py-20 text-center lg:py-24">
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
      </section>
      <div className="text-tertiary fixed bottom-0 flex w-full justify-center pb-4 text-sm">© 2024 Brain Fog Inc.</div>
    </div>
  )
}
