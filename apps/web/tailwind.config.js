/** @type {import('tailwindcss').Config} */

// Colors resolve to the CSS variables in src/styles/tokens.css. Channels are
// stored as "R G B" so Tailwind opacity modifiers (bg-accent/10) keep working.
const channel = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Replaced, not extended: only the design tokens below exist, so ad-hoc
    // palette classes (stone-500, amber-50, ...) no longer generate styles.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      black: '#000000',

      night: channel('--c-night'), // hero sky, deepest
      canvas: channel('--c-canvas'), // page background
      deep: channel('--c-deep'), // sunken bands, table headers
      surface: channel('--c-surface'), // cards, inputs
      raised: channel('--c-raised'), // hover / selected surface

      ink: channel('--c-ink'),
      muted: 'rgb(var(--c-ink) / 0.66)',
      subtle: 'rgb(var(--c-ink) / 0.45)',
      line: 'rgb(var(--c-ink) / 0.08)',
      'line-strong': 'rgb(var(--c-ink) / 0.16)',

      accent: channel('--c-accent'),
      cyan: channel('--c-cyan'),
      rose: channel('--c-rose'),
      danger: channel('--c-danger'),
      warning: channel('--c-warning'),
    },
    fontFamily: {
      serif: ['"Iowan Old Style"', '"Palatino Linotype"', 'Palatino', '"Book Antiqua"', 'Georgia', 'serif'],
      sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      mono: ['ui-monospace', '"SFMono-Regular"', 'Menlo', 'Consolas', 'monospace'],
    },
    // Type scale: 12/14/16/18/22/28/40/56/84. Display sizes are fluid.
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.375rem', { lineHeight: '1.875rem' }],
      '2xl': ['1.75rem', { lineHeight: '2.125rem' }],
      '3xl': ['clamp(2rem, 1.5rem + 2vw, 2.5rem)', { lineHeight: '1.1' }],
      '4xl': ['clamp(2.5rem, 1.75rem + 3vw, 3.5rem)', { lineHeight: '1.05' }],
      '5xl': ['clamp(3rem, 1.5rem + 6vw, 5.25rem)', { lineHeight: '1' }],
    },
    borderRadius: {
      none: '0',
      sm: '8px',
      DEFAULT: '8px', // inputs
      md: '8px',
      lg: '14px', // cards
      xl: '14px',
      '2xl': '14px',
      '3xl': '14px',
      full: '9999px', // pills
    },
    // Depth comes from borders and surface steps, not shadows.
    boxShadow: {
      none: 'none',
      sm: 'none',
      DEFAULT: 'none',
      md: 'none',
      lg: 'none',
      xl: 'none',
      '2xl': 'none',
      overlay: '0 24px 64px -16px rgb(0 0 0 / 0.6)',
    },
    extend: {
      maxWidth: {
        content: '1120px',
        admin: '1280px',
      },
      letterSpacing: {
        display: '-0.02em',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
        out: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
};
