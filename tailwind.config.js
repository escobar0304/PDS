/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Os valores vivem em src/app/globals.css. Aqui so ficam expostos ao
      // Tailwind. Nenhum componente deve escrever um hexadecimal.
      colors: {
        surface: {
          DEFAULT: 'var(--surface)',
          raised: 'var(--surface-raised)',
          sunken: 'var(--surface-sunken)',
        },
        line: {
          DEFAULT: 'var(--line)',
          plum: 'var(--plum-line)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
        },
        plum: 'var(--plum)',
        rose: {
          100: 'var(--rose-100)',
          200: 'var(--rose-200)',
          300: 'var(--rose-300)',
          600: 'var(--rose-600)',
          700: 'var(--rose-700)',
          900: 'var(--rose-900)',
        },
        sage: {
          100: 'var(--sage-100)',
          600: 'var(--sage-600)',
        },
        danger: {
          100: 'var(--danger-100)',
          700: 'var(--danger-700)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      // Uma escala de forma: controlos 4px, cartoes 8px, paineis 12px.
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '4px',
        md: '4px',
        lg: '8px',
        xl: '12px',
        '2xl': '12px',
        '3xl': '12px',
        full: '9999px',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        medium: 'var(--shadow-medium)',
        strong: 'var(--shadow-strong)',
        none: 'none',
      },
      letterSpacing: {
        display: '-0.02em',
      },
    },
  },
  plugins: [],
}
