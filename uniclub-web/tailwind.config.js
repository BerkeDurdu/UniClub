/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#112A46",
        mist: "#F5F7FA",
        signal: "#EF8354",
        pine: "#2A9D8F",
        slate: "#5C6B7A",
      },
    },
  },
  plugins: [],
}

