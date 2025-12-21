/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nav: "#0b1936",
        accent: "#1d68c4",
        "accent-strong": "#2d7de0",
        muted: "#64748b",
      },
      boxShadow: {
        card: "0 10px 30px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
