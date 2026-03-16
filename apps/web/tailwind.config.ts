import type { Config } from "tailwindcss";

/**
 * Local Tailwind config for apps/web.
 * Content paths are relative to THIS file (apps/web/).
 * This overrides the monorepo-root tailwind.config.ts for Vite/PostCSS.
 */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            borderColor: {
                // Required by `@apply border-border` in index.css
                border: "hsl(var(--border))",
                DEFAULT: "hsl(var(--border))",
            },
            borderRadius: {
                lg: "1rem",
                md: "0.75rem",
                sm: "0.5rem",
            },
            colors: {
                background: "hsl(var(--background) / <alpha-value>)",
                foreground: "hsl(var(--foreground) / <alpha-value>)",
                border: "hsl(var(--border) / <alpha-value>)",
                input: "hsl(var(--input) / <alpha-value>)",
                card: {
                    DEFAULT: "hsl(var(--card) / <alpha-value>)",
                    foreground: "hsl(var(--card-foreground) / <alpha-value>)",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover) / <alpha-value>)",
                    foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
                },
                primary: {
                    DEFAULT: "hsl(var(--primary) / <alpha-value>)",
                    foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
                    foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted) / <alpha-value>)",
                    foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent) / <alpha-value>)",
                    foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
                    foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
                },
                ring: "hsl(var(--ring) / <alpha-value>)",
                status: {
                    online: "rgb(34 197 94)",
                    away: "rgb(245 158 11)",
                    busy: "rgb(239 68 68)",
                    offline: "rgb(156 163 175)",
                },
            },
            fontFamily: {
                sans: ["var(--font-sans)"],
                display: ["var(--font-display)"],
                serif: ["var(--font-serif)"],
                mono: ["var(--font-mono)"],
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
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                pulseGlow: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.5", boxShadow: "0 0 20px rgba(23, 226, 255, 0.8)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                float: "float 4s ease-in-out infinite",
                "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "hover-elevate": "hover-elevate 0.2s ease-out",
            },
            boxShadow: {
                "3d-inner": "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                "3d-pressed": "inset 0 2px 4px rgba(0, 0, 0, 0.3)",
            },
        },
    },
    plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
