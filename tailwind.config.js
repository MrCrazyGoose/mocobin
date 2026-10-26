/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}', './shared/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        heading: ['Fredoka', 'Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Greens from logo.png. 400 is the logo's main green; use it as a
        // fill behind dark text. 700 is the text and button green (5.4:1 on white).
        brand: {
          50: '#F3FCEE',
          100: '#E3F8D8',
          200: '#C8FFB4',
          300: '#A6E98A',
          400: '#7DD956',
          500: '#5BB534',
          600: '#3F8F23',
          700: '#2F7A1A',
          800: '#255F16',
          900: '#1F4F12',
        },
        page: '#F7FBF4',
        ink: '#1A2414',
        // County bin colors, used only to show where something goes.
        bin: '#1C4FA0',
        kraft: '#C9A46B',
        hazard: '#F5C400',
        stop: '#C62828',
        leaf: '#2E6B34',
        plum: '#5B3E8E',
        rust: '#B5541B',
        ash: '#5E6A58',
      },
    },
  },
  plugins: [],
};
