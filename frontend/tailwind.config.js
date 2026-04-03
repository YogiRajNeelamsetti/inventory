/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // You can map CSS variable-based colors via arbitrary values in classes, e.g., bg-[var(--color-bg)]
    },
  },
  plugins: [],
}
