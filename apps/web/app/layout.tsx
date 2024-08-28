import { Noto_Sans, Red_Hat_Display } from "next/font/google"

import "styles/tailwind.css"
import { Navbar } from "./components/Navbar"
import { Metadata } from "next"

const inter = Noto_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${redHatDisplay.variable}`}>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
