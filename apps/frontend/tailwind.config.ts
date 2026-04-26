import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "../../packages/ui/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        "brand-beige": "#F0EFEA",
        "brand-purple": "#B197FC",
        "brand-yellow": "#FFD93D",
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'brutalist': '8px 8px 0px 0px rgba(0,0,0,1)',
      },
      fontFamily: {
        'space-mono': ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
