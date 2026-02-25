import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: "#1a1d21",
        surface: "#22262b",
        header: "#22262b",
        row: "#252a30",
        border: "#2d333b",
        muted: "#8b949e",
        pill: "#373e47",
        pillActive: "#388bfd",
      },
    },
  },
  plugins: [],
};
export default config;
