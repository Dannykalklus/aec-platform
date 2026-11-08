/** AEC brand tokens: see PRD section 15 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0F2347', 900: '#0A1832', 800: '#0F2347', 700: '#1A3363', 600: '#27457F' },
        ink: '#0B1A33',
        scholar: '#4CA81E',
        action: { DEFAULT: '#357A14', hover: '#2C6610' },
        library: '#1F6FD6',
        tassel: '#E6AE1F',
        mist: '#F4F6FA',
        line: '#DDE3EC',
        slate: '#5B6578',
        alert: '#C93C3C',
      },
      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,26,51,.06), 0 8px 24px -12px rgba(11,26,51,.18)',
      },
      maxWidth: { site: '72rem' },
    },
  },
  plugins: [],
}
