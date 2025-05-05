
import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
        backgroundImage: { // Add utility for grid pattern
          'grid-pattern': 'linear-gradient(to right, var(--grid-color, hsl(var(--primary)/0.08)) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-color, hsl(var(--primary)/0.08)) 1px, transparent 1px)',
        },
        backgroundSize: { // Add utility for grid size
          'grid-size': 'var(--grid-size, 60px) var(--grid-size, 60px)',
        },
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
                DEFAULT: 'hsl(var(--primary))', // Use CSS var now
  				foreground: 'hsl(var(--primary-foreground))'
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
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))', // Keep ring variable
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  		},
        fontFamily: {
          sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
           mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'], // Added mono font stack
        },
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
            xl: 'calc(var(--radius) + 4px)', // Added xl for chat messages
            '2xl': 'calc(var(--radius) + 8px)',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
            'fade-in': { // Adjusted fade-in
                '0%': { opacity: '0', transform: 'translateY(15px) scale(0.97)' },
                '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
            },
            'fade-in-delay': { // Fade in with delay
                '0%': { opacity: '0', transform: 'translateY(10px)' },
                '50%': { opacity: '0', transform: 'translateY(10px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
            },
            'gradient-bg': { // Background animation
                '0%': { backgroundPosition: '0% 80%, 0% 50%' },
                '50%': { backgroundPosition: '100% 50%, 100% 50%' },
                '100%': { backgroundPosition: '0% 80%, 0% 50%' },
            },
            'grid-scroll': { // Grid background scroll
               '0%': { backgroundPosition: '0 0' },
               '100%': { backgroundPosition: 'var(--grid-size, 60px) var(--grid-size, 60px)' }, // Use CSS var
            },
            'pulse-glow': { // Subtle pulse glow
                 '0%, 100%': { filter: 'drop-shadow(0 0 5px hsl(var(--primary) / calc(var(--glow-intensity) * 0.7)))', transform: 'scale(1)' },
                 '50%': { filter: 'drop-shadow(0 0 12px hsl(var(--primary) / calc(var(--glow-intensity) * 1.0)))', transform: 'scale(1.03)' },
            },
             'rocket-launch-fullscreen': { // Full screen rocket launch
                '0%': { transform: 'translateY(50px) rotate(-45deg) scale(0.8)', opacity: '0' },
                '20%': { transform: 'translateY(0) rotate(-45deg) scale(1)', opacity: '1' },
                '60%': { transform: 'translateY(-20px) rotate(-45deg) scale(1.1)', opacity: '1' },
                '100%': { transform: 'translateY(-100vh) rotate(-45deg) scale(1.5)', opacity: '0' },
            },
            'rocket-takeoff-button': { // Rocket icon animation for button
                '0%': { transform: 'translateY(0) rotate(-45deg)', opacity: '1' },
                '50%': { transform: 'translateY(-5px) rotate(-45deg)', opacity: '1' },
                '100%': { transform: 'translateY(-30px) rotate(-45deg) scale(0.5)', opacity: '0' },
            },
             spin: {
               'to': { transform: 'rotate(360deg)' },
             },
             float: {
                '0%': { transform: 'translateY(0px) translateX(0px) rotate(0deg) scale(1)' },
                '33%': { transform: 'translateY(-25px) translateX(20px) rotate(120deg) scale(1.05)' },
                '66%': { transform: 'translateY(10px) translateX(-15px) rotate(240deg) scale(0.95)' },
                '100%': { transform: 'translateY(0px) translateX(0px) rotate(360deg) scale(1)' },
             },
              'float-alt': {
                '0%': { transform: 'translateY(0px) translateX(0px) rotate(0deg) scale(1)' },
                '50%': { transform: 'translateY(-15px) translateX(-10px) rotate(-180deg) scale(1.1)' },
                '100%': { transform: 'translateY(0px) translateX(0px) rotate(-360deg) scale(1)' },
             },
             'radar-pulse-spin': {
                '0%, 100%': { transform: 'rotate(0deg) scale(1)', opacity: '0.7', borderWidth: '2px' },
                '50%': { transform: 'rotate(180deg) scale(1.1)', opacity: '1', borderWidth: '2.5px' },
             },
             'radar-inner-spin': {
                from: { transform: 'rotate(0deg)' },
                to: { transform: 'rotate(-360deg)' },
             },
             'radar-spin': { /* Pure spin for hover state */
                from: { transform: 'rotate(0deg)' },
                to: { transform: 'rotate(360deg)' },
             },
             orbit: { // Added orbit keyframe
                 from: { transform: 'rotate(0deg) translateX(110px) rotate(0deg)' },
                 to:   { transform: 'rotate(360deg) translateX(110px) rotate(-360deg)' },
             },
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
            'fade-in': 'fade-in 0.7s ease-out forwards',
            'fade-in-delay': 'fadeInDelay 1.5s ease-out forwards',
            'gradient-bg': 'gradient-bg 45s ease infinite',
            'grid-scroll': 'grid-scroll 10s linear infinite',
            'pulse-glow': 'pulse-glow 3.5s infinite ease-in-out',
            'rocket-launch-fullscreen': 'rocket-launch-fullscreen 2s ease-in-out forwards',
            'rocket-takeoff-button': 'rocket-takeoff-button 0.6s ease-in forwards',
            'spin': 'spin 1s linear infinite', // Default spin speed
            'spin-slow': 'spin 3s linear infinite', // Slower spin variant
            'float': 'float var(--float-duration, 15s) infinite ease-in-out',
            'float-delay': 'float-alt var(--float-duration, 18s) infinite ease-in-out',
            'radar-pulse-spin': 'radar-pulse-spin 3.5s ease-in-out infinite',
            'radar-inner-spin': 'radar-inner-spin 5s linear infinite',
            'radar-spin': 'radar-spin 1s linear infinite',
             orbit: 'orbit linear infinite', // Added orbit animation
  		},
        animationDelay: { // Added animation delay utilities
            '100ms': '100ms',
            '200ms': '200ms',
            '300ms': '300ms',
            '500ms': '500ms',
            '700ms': '700ms',
            '1000ms': '1000ms',
        },
        animationDuration: { // Added animation duration utilities
             '2s': '2s',
             '3s': '3s',
             '5s': '5s',
             '6s': '6s',
             '8s': '8s',
             '10s': '10s',
        },
  	}
  },
  plugins: [
      require("tailwindcss-animate"),
      function ({ addUtilities, theme }: { addUtilities: any, theme: any }) {
        const delays = theme('animationDelay');
        const delayUtilities = Object.entries(delays).map(([key, value]) => ({
          [`.animation-delay-${key}`]: { 'animation-delay': value },
        }));
        addUtilities(delayUtilities);

         const durations = theme('animationDuration');
         const durationUtilities = Object.entries(durations).map(([key, value]) => ({
            [`.animation-duration-${key}`]: { 'animation-duration': value },
         }));
         addUtilities(durationUtilities);


        addUtilities({ // 3D transforms plugin
            '.perspective': {
                perspective: '1200px',
            },
            '.transform-style-3d': {
                'transform-style': 'preserve-3d',
            },
            '.backface-hidden': {
                'backface-visibility': 'hidden',
            },
            '.hover\\:rotate-x-2:hover': {
                 transform: 'rotateX(2deg)',
            },
            '.hover\\:rotate-y-1:hover': {
                 transform: 'rotateY(1deg)',
            },
            '.hover\\:rotate-x-5:hover': {
                transform: 'rotateX(5deg)',
            },
            '.hover\\:rotate-y-10:hover': {
                transform: 'rotateY(10deg)',
            },
        })
      }
   ],
} satisfies Config;
