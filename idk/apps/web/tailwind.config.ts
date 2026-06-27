import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bloom: {
          purple: '#A78BFA',
          pink:   '#F472B6',
          green:  '#34D399',
          orange: '#FB923C',
          dark:   '#0d0d18',
          card:   '#1a1028',
        }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'float':        'float 3.5s ease-in-out infinite',
        'pulse-glow':   'pulse-glow 2s ease-in-out infinite',
        'bloom-in':     'bloom-in .5s cubic-bezier(.34,1.56,.64,1)',
        'fade-up':      'fade-up .4s ease',
      },
      keyframes: {
        float:        { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
        'pulse-glow': { '0%,100%': { boxShadow: '0 0 12px rgba(167,139,250,.3)' }, '50%': { boxShadow: '0 0 28px rgba(167,139,250,.7)' } },
        'bloom-in':   { from: { opacity: '0', transform: 'scale(0.8) translateY(24px)' }, to: { opacity: '1', transform: 'scale(1) translateY(0)' } },
        'fade-up':    { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
export default config
