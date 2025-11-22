/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "trend-up": "#10b981",
        "trend-down": "#ef4444",
        "trend-sideways": "#eab308",
        "trend-whale": "#a855f7",
        "trend-rug": "#f97316",
      },
    },
  },
  plugins: [],
};
