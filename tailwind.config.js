/** @type {import('tailwindcss').Config} */
module.exports = {
  // ✅ NOTE: Keep this content array to ensure Tailwind scans all relevant files for classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}