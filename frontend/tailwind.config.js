/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3A7D44', // Deep natural green
          light: '#4F9A5A',
          dark: '#2C6334',
        },
        accent: {
          DEFAULT: '#A3D9A5', // Soft agriculture green
          light: '#C5E8C6',
        },
        background: '#F9FBF7', // Off-white with nature vibe
        card: '#FFFFFF',
        text: {
          primary: '#1C1C1C',
          secondary: '#4F5B50',
        },
        border: '#E6EDE4',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
