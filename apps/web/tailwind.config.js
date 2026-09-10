/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core European Bistro Palette
        charcoal: {
          DEFAULT: '#1A1815',
          50: '#F7F6F5',
          100: '#E6E4E1',
          200: '#C8C4BE',
          300: '#A49E96',
          400: '#756F67',
          500: '#4A4640',
          600: '#2E2B27',
          700: '#24211D',
          800: '#1A1815',
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
      },
      boxShadow: {
        soft: '0 2px 10px rgba(26, 24, 21, 0.05)',
        card: '0 4px 20px rgba(26, 24, 21, 0.06)',
        modal: '0 20px 40px rgba(26, 24, 21, 0.15)',
      },
    },
  },
  plugins: [],
};
