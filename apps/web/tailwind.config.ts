import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 한국 시장 관습: 상승=빨강, 하락=파랑 (미국식 반대 색상 금지 — PRD 11장)
        up: "#D64541",
        down: "#2B6CB0",
        flat: "#8A8F98",
        grade: {
          S: "#0F7B3E",
          A: "#2E9E5B",
          B: "#7FB77E",
          C: "#8A8F98",
          D: "#D98F6B",
          E: "#C2472F",
        },
      },
    },
  },
  plugins: [],
};

export default config;
