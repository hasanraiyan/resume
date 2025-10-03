import { designTokens } from './tokens'

// ========================================
// 🎨 COMPONENT STYLES
// Reusable component patterns
// ========================================

export const componentStyles = {
  // ==================
  // BUTTONS
  // ==================
  buttons: {
    // Base button styles (common to all)
    base: `
      inline-flex items-center justify-center
      font-semibold transition-all duration-300
      focus:outline-none hover-target
    `,
    
    // Primary button (black background)
    primary: `
      bg-black text-white
      hover:bg-gray-800
      px-6 sm:px-7 py-3 sm:py-3.5
      text-sm sm:text-base
      magnetic-btn
    `,
    
    // Secondary button (outlined)
    secondary: `
      border-2 border-black text-black
      hover:bg-black hover:text-white
      px-6 sm:px-7 py-3 sm:py-3.5
      text-sm sm:text-base
      magnetic-btn
    `,
    
    // Ghost button (text only)
    ghost: `
      text-black hover:text-gray-600
      underline-animate
      text-sm sm:text-base font-semibold
    `,
    
    // Small button
    small: `
      px-4 py-2 text-xs sm:text-sm
    `,
    
    // Large button
    large: `
      px-10 sm:px-14 py-4 sm:py-5
      text-sm sm:text-base
    `,
  },

  // ==================
  // CARDS
  // ==================
  cards: {
    base: `
      bg-white rounded-lg
      transition-shadow duration-300
    `,
    
    elevated: `
      shadow-lg hover:shadow-2xl
    `,
    
    bordered: `
      border-2 border-gray-200
      hover:border-black
    `,
    
    interactive: `
      hover-target cursor-pointer
      transform transition-transform
      hover:scale-105
    `,
  },

  // ==================
  // FORM INPUTS
  // ==================
  forms: {
    // Base input styles
    input: `
      w-full border-b-2 border-gray-300 pb-3
      focus:border-black focus:outline-none
      transition text-sm sm:text-base
      bg-transparent hover-target
    `,
    
    // Label styles
    label: `
      block text-xs font-semibold mb-2
      tracking-wider uppercase
    `,
    
    // Textarea
    textarea: `
      w-full border-b-2 border-gray-300 pb-3
      focus:border-black focus:outline-none
      transition text-sm sm:text-base
      resize-none bg-transparent hover-target
    `,
    
    // Select/Dropdown trigger
    select: `
      w-full border-b-2 border-gray-300 pb-3
      focus:border-black focus:outline-none
      transition text-sm sm:text-base
      bg-transparent hover-target
    `,
  },

  // ==================
  // BADGES/TAGS
  // ==================
  badges: {
    // Category badge (like "E-COMMERCE")
    category: `
      text-xs font-semibold tracking-widest
      text-gray-600 uppercase
    `,
    
    // Technology tag
    tag: `
      px-3 py-1.5 bg-gray-100
      text-xs sm:text-sm font-semibold
      inline-block
    `,
    
    // Number badge (like "01")
    number: `
      text-xs font-semibold tracking-wider
      text-gray-600
    `,
  },

  // ==================
  // SECTIONS
  // ==================
  sections: {
    // Standard section wrapper
    wrapper: `
      py-16 sm:py-20 md:py-24
    `,
    
    // Section container
    container: `
      max-w-6xl mx-auto px-4 sm:px-6 lg:px-12
    `,
    
    // Section header (centered)
    header: `
      text-center mb-12 sm:mb-16
    `,
    
    // Section title
    title: `
      text-3xl sm:text-4xl md:text-5xl font-bold
      mb-4 sm:mb-5
    `,
    
    // Section description
    description: `
      text-base sm:text-lg text-gray-600
    `,
  },

  // ==================
  // NAVIGATION
  // ==================
  navigation: {
    // Fixed navbar
    navbar: `
      fixed w-full z-50 top-0
      bg-white bg-opacity-90 backdrop-blur-sm
      border-b border-gray-200
    `,
    
    // Nav link
    link: `
      text-sm lg:text-base text-gray-800
      hover:text-gray-600 font-medium
      underline-animate transition hover-target
    `,
    
    // Logo
    logo: `
      text-xl sm:text-2xl font-bold hover-target
    `,
  },

  // ==================
  // GRID LAYOUTS
  // ==================
  grids: {
    // Two column (common pattern)
    twoColumn: `
      grid lg:grid-cols-2
      gap-8 sm:gap-10 md:gap-12
      items-center
    `,
    
    // Feature grid (2x2)
    features: `
      grid grid-cols-2 gap-4 sm:gap-6
    `,
    
    // Stats grid
    stats: `
      grid grid-cols-2 md:grid-cols-4
      gap-8 sm:gap-10 text-center
    `,
    
    // Projects list
    projects: `
      space-y-12 sm:space-y-16 md:space-y-20
    `,
  },

  // ==================
  // TEXT STYLES
  // ==================
  text: {
    // Heading 1
    h1: `
      text-4xl sm:text-5xl md:text-6xl lg:text-7xl
      font-bold leading-none
    `,
    
    // Heading 2
    h2: `
      text-3xl sm:text-4xl md:text-5xl
      font-bold
    `,
    
    // Heading 3
    h3: `
      text-2xl sm:text-3xl md:text-4xl
      font-bold
    `,
    
    // Body large
    bodyLarge: `
      text-base sm:text-lg text-gray-600
      leading-relaxed
    `,
    
    // Body regular
    body: `
      text-sm sm:text-base text-gray-700
      leading-relaxed
    `,
    
    // Small text
    small: `
      text-xs sm:text-sm text-gray-600
    `,
    
    // Stroke text (outline)
    stroke: `
      text-stroke
    `,
  },

  // ==================
  // EFFECTS
  // ==================
  effects: {
    // Image with reveal animation
    imageReveal: `
      image-reveal rounded-lg overflow-hidden
      shadow-2xl hover-target
    `,
    
    // Underline animation
    underlineAnimate: `
      underline-animate
    `,
    
    // Magnetic button
    magnetic: `
      magnetic-btn
    `,
    
    // Hover target (for custom cursor)
    hoverTarget: `
      hover-target
    `,
  },
}

export default componentStyles