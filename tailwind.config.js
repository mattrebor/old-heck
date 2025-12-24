export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Quicksand', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        card: {
          // Felt green palette (card table aesthetic) - MORE VIBRANT
          felt: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            green: '#10b981',
            dark: '#059669',
          },
          // Bidding phase - VIBRANT blue/purple tones
          bid: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca',
          },
          // Results phase - VIBRANT success/danger colors
          result: {
            success: '#10b981',
            successLight: '#34d399',
            danger: '#ef4444',
            dangerLight: '#f87171',
            successBg: '#d1fae5',
            dangerBg: '#fee2e2',
          },
          // Accent colors - MORE VIBRANT
          accent: {
            gold: '#f59e0b',
            orange: '#fb923c',
            purple: '#a855f7',
            pink: '#ec4899',
            cyan: '#06b6d4',
          }
        }
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};
