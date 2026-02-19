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
        "bg-void": "#000000",
        "bg-sub": "#050505",
        panel: "#0A0A0A",
        profit: "#00FF94",
        active: "#3B82F6",
        danger: "#FF3333",
        "text-white": "#EDEDED",
        "text-gray": "#888888",
      },
      fontFamily: {
        main: ["Inter", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        code: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
