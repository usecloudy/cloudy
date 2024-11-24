"use client";

import { create } from "@kodingdotninja/use-tailwind-breakpoint";
import { Config } from "tailwindcss";
import resolveConfig from "tailwindcss/resolveConfig";

import tailwindConfig from "../../tailwind.config";

const config = resolveConfig(tailwindConfig as Config);

export const { useBreakpoint } = create(config.theme.screens);
