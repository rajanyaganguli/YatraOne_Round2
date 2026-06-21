/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'deep-indigo': '#1E1B4B',
        'coral-orange': '#EA580C',
        'success-green': '#16A34A',
        'ai-indigo': '#4338CA',
        'dark-text': '#0f172a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-sos': 'pulse-sos 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-sos': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.7)' },
          '50%': { boxShadow: '0 0 0 15px rgba(220, 38, 38, 0)' },
        },
      },
    },
  },
  plugins: [],
};
