/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Refined European Bistro & Pakistani Kitchen Palette
        charcoal: {
          DEFAULT: '#1A1815',
          50: '#F8F6F2',
          100: '#EFECE6',
          200: '#DDD7CE',
          300: '#C2BBB0',
          400: '#A19A8E',
          500: '#787166',
          600: '#4D473F',
          700: '#2E2A25',
          800: '#1F1C18',
          850: '#171512',
          900: '#12100E',
          950: '#0A0908',
        },
        terracotta: {
          DEFAULT: '#C8763A',
          50: '#FDF7F3',
          100: '#FAE8DC',
          200: '#F4CFB9',
          300: '#EAB08E',
          400: '#DE8E5E',
          500: '#C8763A',
          600: '#B05E26',
          700: '#8C481C',
          800: '#6C3616',
          900: '#542B13',
        },
        olive: {
          DEFAULT: '#4A5D3A',
          50: '#F5F8F3',
          100: '#E6EFE1',
          200: '#CDDFC3',
          300: '#A8C59A',
          400: '#7FA46E',
          500: '#4A5D3A',
          600: '#3D4D30',
          700: '#313E27',
          800: '#26301F',
          900: '#1D2518',
        },
        bistro: {
          bg: '#FAF6F1',
          surface: '#FFFFFF',
          card: '#FDFBF8',
          border: '#EBE4DA',
          muted: '#857D74',
          'dark-bg': '#0E0C0A',
          'dark-surface': '#161411',
          'dark-card': '#1E1B17',
          'dark-border': '#302B24',
        },
        // Status colors
        status: {
          pending: '#D97706',    // Amber
          confirmed: '#475569',  // Blue-slate
          preparing: '#C8763A',  // Terracotta
          ready: '#4A5D3A',      // Olive
          completed: '#15803D',  // Neutral/Forest Green
          cancelled: '#DC2626',  // Muted red
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        soft: '0 2px 10px rgba(26, 24, 21, 0.05)',
        card: '0 4px 20px rgba(26, 24, 21, 0.06)',
        modal: '0 20px 40px rgba(26, 24, 21, 0.15)',
        'dark-soft': '0 2px 10px rgba(0, 0, 0, 0.3)',
        'dark-card': '0 4px 20px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
