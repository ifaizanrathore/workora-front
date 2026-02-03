import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          '50': '#F5F4FE',
          '100': '#E8E6FA',
          '200': '#D1CDF5',
          '500': '#6E62E5',
          '600': '#5B4FD9',
          '700': '#4A3FC7',
          DEFAULT: 'hsl(var(--primary))',
          hover: '#5B4FD9',
          light: '#8B82EB',
          lighter: '#E8E6FA',
          foreground: 'hsl(var(--primary-foreground))'
        },
        background: 'hsl(var(--background))',
        border: 'hsl(var(--border))',
        text: {
          primary: '#1E1F21',
          secondary: '#6D6E6F',
          tertiary: '#8B8B8B',
          dark: '#020406'
        },
        status: {
          urgent: '#FF4D4D',
          high: '#F59E0B',
          normal: '#3B82F6',
          low: '#22C55E',
          inProgress: '#3B82F6',
          onHold: '#F59E0B',
          todo: '#6D6E6F',
          complete: '#12A594'
        },
        success: '#12A594',
        warning: '#F59E0B',
        error: '#FF4D4D',
        info: '#3B82F6',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      fontFamily: {
        sans: [
          'Segoe UI',
          'Inter',
          'system-ui',
          'sans-serif'
        ]
      },
      fontSize: {
        xs: [
          '12px',
          {
            lineHeight: '16px'
          }
        ],
        sm: [
          '13px',
          {
            lineHeight: '18px'
          }
        ],
        base: [
          '14px',
          {
            lineHeight: '20px'
          }
        ],
        md: [
          '15px',
          {
            lineHeight: '22px'
          }
        ],
        lg: [
          '16px',
          {
            lineHeight: '24px'
          }
        ],
        xl: [
          '18px',
          {
            lineHeight: '28px'
          }
        ],
        '2xl': [
          '20px',
          {
            lineHeight: '28px'
          }
        ],
        '3xl': [
          '24px',
          {
            lineHeight: '32px'
          }
        ]
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        DEFAULT: '6px',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: '12px',
        full: '9999px'
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-dot': 'pulseDot 2s infinite',
        'row-inserted': 'rowInserted 0.2s ease-out',
        'dropdown-in': 'dropdownIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': {
            opacity: '0'
          },
          '100%': {
            opacity: '1'
          }
        },
        slideIn: {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1'
          }
        },
        slideUp: {
          '0%': {
            transform: 'translateY(10px)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        scaleIn: {
          '0%': {
            transform: 'scale(0.95)',
            opacity: '0'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        pulseDot: {
          '0%, 100%': {
            opacity: '1'
          },
          '50%': {
            opacity: '0.5'
          }
        },
        rowInserted: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-8px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        dropdownIn: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-4px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        }
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    // Scrollbar utilities plugin
    function({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        // Hide scrollbar completely
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        // Thin scrollbar (subtle)
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': '#d1d5db transparent',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#d1d5db',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#9ca3af',
          },
        },
        // Custom scrollbar (matches your theme)
        '.scrollbar-custom': {
          'scrollbar-width': 'thin',
          'scrollbar-color': '#6E62E5 transparent',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#6E62E5',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#5B4FD9',
          },
        },
      });
    },
  ],
};

export default config;