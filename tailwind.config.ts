import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // CEFR Level Color Tokens
        cefr: {
          a1: {
            bg: "hsl(var(--cefr-a1-bg))",
            text: "hsl(var(--cefr-a1-text))",
            border: "hsl(var(--cefr-a1-border))",
          },
          a2: {
            bg: "hsl(var(--cefr-a2-bg))",
            text: "hsl(var(--cefr-a2-text))",
            border: "hsl(var(--cefr-a2-border))",
          },
          b1: {
            bg: "hsl(var(--cefr-b1-bg))",
            text: "hsl(var(--cefr-b1-text))",
            border: "hsl(var(--cefr-b1-border))",
          },
          b2: {
            bg: "hsl(var(--cefr-b2-bg))",
            text: "hsl(var(--cefr-b2-text))",
            border: "hsl(var(--cefr-b2-border))",
          },
          c1: {
            bg: "hsl(var(--cefr-c1-bg))",
            text: "hsl(var(--cefr-c1-text))",
            border: "hsl(var(--cefr-c1-border))",
          },
          c2: {
            bg: "hsl(var(--cefr-c2-bg))",
            text: "hsl(var(--cefr-c2-text))",
            border: "hsl(var(--cefr-c2-border))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
