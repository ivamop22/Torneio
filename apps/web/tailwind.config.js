/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:     '#06091A',
          surface:  '#0D1526',
          elevated: '#162040',
          card:     '#0F1B33',
        },
        accent: {
          lime:  '#B4FF3D',
          gold:  '#FFD14A',
          red:   '#FF4060',
          blue:  '#3D9EFF',
        },
        text: {
          primary: '#EEF2FF',
          muted:   '#7A90B8',
          faint:   '#3A4E72',
        },
        border: {
          DEFAULT: '#1C2D50',
          glow:    '#2A4580',
        },
        // Legacy support
        primary: {
          50:  '#f0fdf4',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Barlow Condensed', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
      },
      boxShadow: {
        lime:  '0 4px 20px rgba(180,255,61,0.25)',
        gold:  '0 4px 20px rgba(255,209,74,0.25)',
        red:   '0 4px 20px rgba(255,64,96,0.25)',
        card:  '0 2px 16px rgba(0,0,0,0.3)',
        panel: '0 8px 32px rgba(0,0,0,0.4)',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
