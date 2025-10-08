// ========================================
// 🎨 DESIGN TOKENS
// All design decisions in one place
// ========================================

export const designTokens = {
  // ==================
  // COLORS
  // ==================
  colors: {
    // Brand Colors
    brand: {
      primary: '#000000',
      secondary: '#FFFFFF',
    },

    // Neutral Palette
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },

    // Semantic Colors
    background: {
      primary: '#F5F5F5',
      secondary: '#FFFFFF',
      dark: '#000000',
    },

    text: {
      primary: '#000000',
      secondary: '#525252',
      tertiary: '#737373',
      inverse: '#FFFFFF',
    },

    border: {
      light: '#E5E5E5',
      default: '#D4D4D4',
      dark: '#000000',
    },

    // State Colors (for future use)
    state: {
      hover: '#262626',
      focus: '#000000',
      active: '#000000',
      disabled: '#D4D4D4',
    },
  },

  // ==================
  // TYPOGRAPHY
  // ==================
  typography: {
    // Font Families
    fonts: {
      heading: "'Playfair Display', serif",
      body: "'Space Grotesk', sans-serif",
      mono: "'JetBrains Mono', monospace", // For code if needed
    },

    // Font Sizes (Mobile first, then sm, md, lg)
    sizes: {
      xs: {
        mobile: '0.75rem', // 12px
        desktop: '0.75rem',
      },
      sm: {
        mobile: '0.875rem', // 14px
        desktop: '0.875rem',
      },
      base: {
        mobile: '1rem', // 16px
        desktop: '1rem',
      },
      lg: {
        mobile: '1.125rem', // 18px
        desktop: '1.125rem',
      },
      xl: {
        mobile: '1.25rem', // 20px
        desktop: '1.25rem',
      },
      '2xl': {
        mobile: '1.5rem', // 24px
        desktop: '1.5rem',
      },
      '3xl': {
        mobile: '1.875rem', // 30px
        tablet: '2.25rem', // 36px
        desktop: '3rem', // 48px
      },
      '4xl': {
        mobile: '2.25rem', // 36px
        tablet: '3rem', // 48px
        desktop: '3.75rem', // 60px
      },
      '5xl': {
        mobile: '3rem', // 48px
        tablet: '3.75rem', // 60px
        desktop: '4.5rem', // 72px
      },
      '6xl': {
        mobile: '3.75rem', // 60px
        tablet: '4.5rem', // 72px
        desktop: '5.625rem', // 90px
      },
      '7xl': {
        mobile: '4.5rem', // 72px
        tablet: '6rem', // 96px
        desktop: '7.5rem', // 120px
      },
    },

    // Font Weights
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },

    // Line Heights
    lineHeights: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },

    // Letter Spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // ==================
  // SPACING
  // ==================
  spacing: {
    // Base unit: 4px (0.25rem)
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    7: '1.75rem', // 28px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    32: '8rem', // 128px

    // Section Spacing (responsive)
    section: {
      mobile: '4rem', // py-16
      tablet: '5rem', // py-20
      desktop: '6rem', // py-24
    },
  },

  // ==================
  // BREAKPOINTS
  // ==================
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // ==================
  // SHADOWS
  // ==================
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // ==================
  // BORDERS
  // ==================
  borders: {
    width: {
      0: '0',
      1: '1px',
      2: '2px',
      4: '4px',
      8: '8px',
    },
    radius: {
      none: '0',
      sm: '0.125rem', // 2px
      base: '0.25rem', // 4px
      md: '0.375rem', // 6px
      lg: '0.5rem', // 8px
      xl: '0.75rem', // 12px
      '2xl': '1rem', // 16px
      full: '9999px',
    },
  },

  // ==================
  // TRANSITIONS
  // ==================
  transitions: {
    duration: {
      fast: '150ms',
      base: '300ms',
      slow: '500ms',
    },
    timing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      linear: 'linear',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      smooth: 'cubic-bezier(0.77, 0, 0.175, 1)',
    },
  },

  // ==================
  // Z-INDEX
  // ==================
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    cursor: 9998,
    cursorDot: 9999,
  },

  // ==================
  // LAYOUT
  // ==================
  layout: {
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      container: '1152px', // max-w-6xl (Your default)
    },

    containerPadding: {
      mobile: '1rem', // px-4
      tablet: '1.5rem', // px-6
      desktop: '3rem', // px-12
    },
  },

  // ==================
  // ANIMATIONS
  // ==================
  animations: {
    cursor: {
      size: {
        default: '20px',
        follower: '40px',
        hover: '60px',
      },
      duration: '300ms',
    },

    scroll: {
      duration: 1,
      stagger: 0.2,
      ease: 'power2.out',
    },

    magnetic: {
      strength: 0.3,
      duration: '0.4s',
      ease: 'power2.out',
      returnDuration: '0.6s',
      returnEase: 'elastic.out(1, 0.3)',
    },

    dropdown: {
      duration: '0.3s',
      distance: '-15px',
      ease: 'power2.out',
    },

    marquee: {
      duration: '20s',
    },
  },
};

export default designTokens;
