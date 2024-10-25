/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cyber-dark': 'var(--cyber-dark)',
        'cyber-light': 'var(--cyber-blue)',
        'cyber-accent': 'var(--cyber-pink)',
        'cyber-success': 'var(--cyber-green)',
        'cyber-purple': 'var(--cyber-purple)',
        'cyber-error': 'var(--cyber-error)',
        'cyber-glow': 'var(--cyber-glow)',
        'cyber-text': 'var(--cyber-text)',
      },
      boxShadow: {
        'cyber': '0 0 10px rgba(64, 179, 255, 0.3)',
        'cyber-lg': '0 0 20px rgba(64, 179, 255, 0.5)',
      },
    },
  },
  plugins: [],
};