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
        bg: {
          primary: "#0a0a0a",
          secondary: "#111111",
          card: "#161616",
          elevated: "#1c1c1c",
        },
        border: {
          DEFAULT: "#242424",
          subtle: "#1a1a1a",
        },
        text: {
          primary: "#f0f0f0",
          secondary: "#888888",
          muted: "#555555",
        },
        crew: {
          rushil: "#22c55e",
          alan: "#7c5cfc",
          kevin: "#f5c518",
        },
        accent: {
          purple: "#7c5cfc",
          yellow: "#f5c518",
          green: "#22c55e",
          red: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "28px",
        "4xl": "36px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
        float: "0 8px 32px rgba(0,0,0,0.5)",
        inner: "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
