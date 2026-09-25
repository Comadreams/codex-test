import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dreamz: {
          bg: "#130d26",
          panel: "#1f1438",
          card: "#2a1d47",
          accent: "#9b87f5",
          text: "#f3edff",
          muted: "#b8abd9"
        }
      }
    }
  },
  plugins: []
} satisfies Config;
