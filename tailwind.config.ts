import type { Config } from "tailwindcss";

import plugin from "tailwindcss/plugin";
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted-hsl))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent-hsl))",
          foreground: "hsl(var(--accent-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // E-Cell design tokens
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        line: "var(--line)",
        grid: "var(--grid)",
        mark: {
          DEFAULT: "var(--mark)",
          ink: "var(--mark-ink)",
        },
        ok: "var(--ok)",
        err: "var(--err)",
        panel: {
          DEFAULT: "var(--panel)",
          fg: "var(--panel-fg)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "IBM Plex Sans", "sans-serif"],
        body: ["var(--font-body)", "IBM Plex Sans", "sans-serif"],
        display: ["var(--font-condensed)", "Big Shoulders Display", "sans-serif"],
        heading: ["var(--font-condensed)", "Big Shoulders Display", "sans-serif"],
        condensed: ["var(--font-condensed)", "Big Shoulders Display", "sans-serif"],
        pixel: ["var(--font-pixel)", "Silkscreen", "monospace"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "monospace"],
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
      ringWidth: {
        3: "3px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Tailwind 3 equivalents of the Tailwind 4 variants/utilities used by the
    // generated shadcn (base-nova) components.
    plugin(({ addVariant, matchVariant, addUtilities }) => {
      for (const state of [
        "open",
        "closed",
        "active",
        "selected",
        "disabled",
        "vertical",
        "horizontal",
        "starting-style",
        "ending-style",
      ]) {
        addVariant(`data-${state}`, `&[data-${state}]`);
      }
      matchVariant("in-data", (value) => `:where([data-${value}]) &`);
      matchVariant("has-data", (value) => `&:has([data-${value}])`);
      addUtilities({
        ".outline-hidden": {
          outline: "2px solid transparent",
          "outline-offset": "2px",
        },
      });
    }),
  ],
};

export default config;
