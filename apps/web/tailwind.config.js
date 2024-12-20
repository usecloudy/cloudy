/** @type {import('tailwindcss').Config} */
import tailwindAnimate from "tailwindcss-animate";

const config = {
	content: ["./app/**/*.{js,ts,jsx,tsx}"],
	darkMode: "selector",
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		letterSpacing: {
			tighter: "-.05em",
			tight: "-.025em",
			normal: "0",
			wide: "0.02em",
			wider: ".05em",
			widest: ".25em",
		},
		extend: {
			colors: {
				primary: "rgb(var(--color-primary) / <alpha-value>)",
				secondary: "rgb(var(--color-secondary) / <alpha-value>)",
				tertiary: "rgb(var(--color-tertiary) / <alpha-value>)",
				placeholder: "rgb(var(--color-placeholder) / <alpha-value>)",
				border: "rgb(var(--color-border) / <alpha-value>)",
				background: "rgb(var(--color-background) / <alpha-value>)",
				"background-secondary": "rgb(var(--color-background-secondary) / <alpha-value>)",
				card: "rgb(var(--color-card) / <alpha-value>)",
				accent: "rgb(var(--color-accent) / <alpha-value>)",
				"accent-secondary": "rgb(var(--color-accent-secondary) / <alpha-value>)",
			},
			borderRadius: {
				lg: `var(--radius)`,
				md: `calc(var(--radius) - 8px)`,
				DEFAULT: "calc(var(--radius) - 12px)",
				sm: "calc(var(--radius) - 16px)",
			},
			fontFamily: {
				sans: "var(--font-sans)",
				display: "var(--font-display)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
		},
	},
	plugins: [tailwindAnimate],
};

export default config;
