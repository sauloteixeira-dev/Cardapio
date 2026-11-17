// Mesmo arquivo de replica/design/tokens.json, com o "content" ajustado para este projeto.
// Veja replica/design/tailwind.config.ts para a fonte comentada.
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        border: "var(--color-border)",
        "border-input": "var(--color-border-input)",
        text: "var(--color-text)",
        muted: "var(--color-text-muted)",
        accent: "var(--color-accent)",
        "accent-text": "var(--color-accent-text)",
        "on-accent": "var(--color-on-accent)",
        danger: "var(--color-danger)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
      },
      fontFamily: {
        sans: "var(--font-sans)".split(", "),
        mono: "var(--font-mono)".split(", "),
      },
      fontSize: {
        xs: ["var(--text-xs-size)", { lineHeight: "var(--text-xs-line)" }],
        sm: ["var(--text-sm-size)", { lineHeight: "var(--text-sm-line)" }],
        base: ["var(--text-base-size)", { lineHeight: "var(--text-base-line)" }],
        lg: ["var(--text-lg-size)", { lineHeight: "var(--text-lg-line)" }],
        xl: ["var(--text-xl-size)", { lineHeight: "var(--text-xl-line)" }],
        display: ["var(--text-display-size)", { lineHeight: "var(--text-display-line)" }],
      },
      spacing: { "0": "var(--space-0)", "1": "var(--space-1)", "2": "var(--space-2)", "3": "var(--space-3)", "4": "var(--space-4)", "5": "var(--space-5)", "6": "var(--space-6)", "7": "var(--space-7)", "8": "var(--space-8)" },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      boxShadow: { card: "var(--shadow-card)", pop: "var(--shadow-pop)" },
      transitionDuration: { fast: "120", base: "200" },
    },
  },
  plugins: [],
} satisfies Config;
