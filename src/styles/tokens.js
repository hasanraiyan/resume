// ========================================
// 🎨 DESIGN TOKENS (SWISS MINIMALIST LUXURY)
// ========================================

export const designTokens = {
  // ==================
  // COLORS
  // ==================
  colors: {
    // Brand Colors
    brand: {
      primary: '#121212', // Obsidian
      secondary: '#FAFAF9', // Warm Alabaster
      accent: '#C5A059', // Muted Gold (Optional)
    },

    // Neutral Palette (Warm/Stone)
    neutral: {
      50: '#FAFAF9',
      100: '#F5F5F4',
      200: '#E7E5E4',
      300: '#D6D3D1',
      400: '#A8A29E',
      500: '#78716C',
      600: '#57534E',
      700: '#44403C',
      800: '#292524',
      900: '#1C1917',
      950: '#0C0A09',
    },

    // Semantic Colors
    background: {
      primary: '#FAFAF9', // Canvas
      secondary: '#FFFFFF',
      glass: 'rgba(255, 255, 255, 0.65)',
      dark: '#121212',
    },

    text: {
      primary: '#121212', // Obsidian
      secondary: '#57534E', // Stone 600
      tertiary: '#78716C', // Stone 500
      inverse: '#FAFAF9',
    },

    border: {
      subtle: 'rgba(0, 0, 0, 0.06)',
      default: 'rgba(0, 0, 0, 0.12)',
      focus: '#121212',
    },
  },

  // ==================
  // TYPOGRAPHY (EDITORIAL)
  // ==================
  typography: {
    fonts: {
      heading: "'Playfair Display', serif",
      body: "'Space Grotesk', sans-serif",
    },

    // Elevated Scale
    sizes: {
      xs: { mobile: '0.75rem', desktop: '0.75rem' },
      sm: { mobile: '0.875rem', desktop: '0.875rem' },
      base: { mobile: '1rem', desktop: '1.125rem' }, // Slightly larger body
      lg: { mobile: '1.125rem', desktop: '1.25rem' },
      xl: { mobile: '1.25rem', desktop: '1.5rem' },
      '2xl': { mobile: '1.5rem', desktop: '2rem' },
      '3xl': { mobile: '2rem', desktop: '3rem' },
      '4xl': { mobile: '2.5rem', desktop: '4rem' },
      '5xl': { mobile: '3rem', desktop: '5rem' },
      '6xl': { mobile: '3.75rem', desktop: '6rem' },
      '7xl': { mobile: '4.5rem', desktop: '8rem' }, // Massive headings
      '8xl': { mobile: '6rem', desktop: '10rem' },
      '9xl': { mobile: '8rem', desktop: '12rem' },
    },

    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // ==================
  // SPACING (FLUID)
  // ==================
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    64: '16rem',

    section: {
      mobile: '6rem',
      tablet: '8rem',
      desktop: '10rem', // Generous whitespace
    },
  },

  // ==================
  // SHADOWS (PREMIUM)
  // ==================
  shadows: {
    none: 'none',
    subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
    premium: `
      0 0 0 1px rgba(0,0,0,0.03),
      0 2px 8px rgba(0,0,0,0.04),
      0 12px 24px -6px rgba(0,0,0,0.08)
    `,
    floating: `
      0 20px 40px -10px rgba(0,0,0,0.05),
      0 0 10px -2px rgba(0,0,0,0.02)
    `,
  },

  // ==================
  // BORDERS
  // ==================
  borders: {
    radius: {
      none: '0',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem', // Standard for cards
      '3xl': '1.5rem',
      full: '9999px',
    },
  },
};

export default designTokens;
