import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				chalk: ['Caveat', 'cursive'],
				handwriting: ['Architects Daughter', 'cursive'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				chalkboard: {
					DEFAULT: '#121212',
					dark: '#0A0A0A',
					light: '#1E1E1E',
				},
				chalk: {
					white: '#FFFFFF',
					gray: '#C8C8C9',
					blue: '#D3E4FD',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
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
				'chalk-draw': {
					'0%': { 
						strokeDashoffset: '100%',
						opacity: '0.2'
					},
					'100%': {
						strokeDashoffset: '0%',
						opacity: '1'
					}
				},
				'chalk-fade-in': {
					'0%': { 
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'chalk-dust': {
					'0%': { 
						opacity: '0',
						transform: 'translateY(0) scale(1)'
					},
					'50%': {
						opacity: '0.5',
						transform: 'translateY(-10px) scale(1.5)'
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(-20px) scale(1)'
					}
				},
				'chalk-smudge': {
					'0%': { 
						backgroundPosition: '0% 0%'
					},
					'100%': {
						backgroundPosition: '100% 0%'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'chalk-draw': 'chalk-draw 1.5s ease-out forwards',
				'chalk-fade-in': 'chalk-fade-in 0.5s ease-out forwards',
				'chalk-dust': 'chalk-dust 2s ease-out infinite',
				'chalk-smudge': 'chalk-smudge 0.3s ease-out forwards'
			},
			backgroundImage: {
				'chalkboard-texture': "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgb3BhY2l0eT0iMC4xIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiMxMjEyMTIiLz48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxIiBmaWxsPSIjRkZGRkZGIi8+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMC41IiBmaWxsPSIjRkZGRkZGIi8+PGNpcmNsZSBjeD0iMjAiIGN5PSI0MCIgcj0iMC43NSIgZmlsbD0iI0ZGRkZGRiIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iMTUiIHI9IjAuNCIgZmlsbD0iI0ZGRkZGRiIvPjwvc3ZnPg==')",
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
