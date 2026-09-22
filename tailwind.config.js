/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // next/font expoe as familias como variaveis CSS a partir de layout.tsx.
      // Sem isto, font-serif resolvia para o default do Tailwind (Georgia) e a
      // Playfair Display era descarregada sem nunca ser aplicada.
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
