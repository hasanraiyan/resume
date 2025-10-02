# Design Document

## Overview

This design outlines the refactoring approach to improve code maintainability, security, and user experience in the portfolio application. The solution focuses on three key areas: creating a reusable GSAP animation hook, properly utilizing environment variables, and fixing UI layout issues with technology tags.

## Architecture

### Custom Hook Architecture

The `useScrollFadeIn` hook will encapsulate the common GSAP scroll-triggered animation pattern used across multiple components. This hook will:

- Accept configuration parameters for customization
- Handle GSAP registration and cleanup automatically
- Provide consistent animation behavior across components
- Support different target selectors and animation properties

### Environment Variable Management

The application will properly utilize Next.js environment variables for configuration management:

- Formspree ID will be accessed via `process.env.NEXT_PUBLIC_FORMSPREE_ID`
- Environment variables will be validated at runtime
- Fallback values will be provided for development

### UI Layout Improvements

The technology tags layout will be enhanced to prevent wrapping issues:

- Implement proper flex container constraints
- Add responsive design considerations
- Ensure consistent spacing and alignment

## Components and Interfaces

### useScrollFadeIn Hook Interface

```javascript
const useScrollFadeIn = ({
  trigger,           // CSS selector for trigger element
  targets,           // CSS selector for animated elements  
  startPosition = 'top 80%',
  endPosition = 'bottom 20%',
  animationProps = {
    opacity: 0,
    y: 50,
    duration: 1,
    stagger: 0.2
  }
}) => {
  // Hook implementation
}
```

### Component Integration Pattern

Components will use the hook with minimal configuration:

```javascript
// Before (repetitive)
useEffect(() => {
  gsap.registerPlugin(ScrollTrigger)
  // ... complex animation setup
}, [])

// After (clean)
useScrollFadeIn({
  trigger: '#about',
  targets: '#about .grid.lg\\:grid-cols-2 > *'
})
```

### Environment Variable Access Pattern

```javascript
// Before (hardcoded)
const [state, handleFormspreeSubmit] = useForm("mrbykylg")

// After (environment-based)
const [state, handleFormspreeSubmit] = useForm(process.env.NEXT_PUBLIC_FORMSPREE_ID)
```

## Data Models

### Animation Configuration Model

```javascript
const AnimationConfig = {
  trigger: String,        // Required: CSS selector for scroll trigger
  targets: String,        // Required: CSS selector for animated elements
  startPosition: String,  // Optional: ScrollTrigger start position
  endPosition: String,    // Optional: ScrollTrigger end position
  animationProps: {
    opacity: Number,      // Starting opacity
    y: Number,           // Starting Y position
    duration: Number,    // Animation duration
    stagger: Number      // Stagger delay between elements
  }
}
```

### Component Mapping Model

```javascript
const ComponentAnimations = {
  'About.js': {
    trigger: '#about',
    targets: '#about .grid.lg\\:grid-cols-2 > *'
  },
  'Work.js': {
    trigger: '#work',
    targets: '#work .space-y-12 > *'
  },
  'Contact.js': {
    trigger: '#contact',
    targets: '#contact .max-w-3xl > *'
  },
  'Hero.js': {
    trigger: '#home',
    targets: '#home .max-w-6xl > div > div'
  },
  'Stats.js': {
    trigger: '.stats-section',
    targets: '.stats-section .max-w-6xl > *'
  }
}
```

## Error Handling

### Hook Error Handling

The custom hook will include robust error handling:

- Graceful degradation when GSAP is not available
- DOM element existence validation
- ScrollTrigger registration error handling
- Cleanup on component unmount

### Environment Variable Validation

```javascript
const validateEnvironmentVariables = () => {
  if (!process.env.NEXT_PUBLIC_FORMSPREE_ID) {
    console.warn('NEXT_PUBLIC_FORMSPREE_ID not found in environment variables')
    return false
  }
  return true
}
```

### UI Layout Fallbacks

CSS fallbacks will be implemented for older browsers:

- Flexbox fallbacks for grid layouts
- Progressive enhancement for advanced CSS features
- Responsive breakpoint handling

## Testing Strategy

### Hook Testing

The `useScrollFadeIn` hook will be tested using:

- React Testing Library for hook behavior
- Mock GSAP functions for animation testing
- DOM manipulation validation
- Cleanup verification

### Integration Testing

Component integration will be verified through:

- Visual regression testing for animations
- Cross-browser compatibility testing
- Responsive design validation
- Performance impact measurement

### Environment Variable Testing

Environment configuration will be tested via:

- Development environment validation
- Production build verification
- Missing variable handling
- Fallback behavior testing

## Implementation Details

### File Structure

```
src/
├── hooks/
│   └── useScrollFadeIn.js     # Custom animation hook
├── components/
│   ├── About.js               # Updated to use hook
│   ├── Work.js                # Updated to use hook
│   ├── Contact.js             # Updated to use hook + env vars
│   ├── Hero.js                # Updated to use hook
│   └── Stats.js               # Updated to use hook
└── utils/
    └── validation.js          # Environment variable validation
```

### CSS Improvements for Tag Layout

The technology tags section will use improved CSS:

```css
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tag-more-indicator {
  flex-shrink: 0;
  white-space: nowrap;
}
```

### Performance Considerations

- Lazy loading of GSAP plugins
- Debounced scroll event handling
- Minimal DOM queries
- Efficient cleanup procedures

## Migration Strategy

### Phase 1: Hook Creation
1. Create `useScrollFadeIn` hook
2. Add comprehensive tests
3. Validate hook functionality

### Phase 2: Component Migration
1. Update one component at a time
2. Verify animation behavior matches original
3. Test responsive behavior

### Phase 3: Environment Variable Integration
1. Update Contact.js to use environment variable
2. Add validation and error handling
3. Test form submission functionality

### Phase 4: UI Layout Fixes
1. Implement CSS improvements for tag layout
2. Test across different screen sizes
3. Verify cross-browser compatibility

This design ensures a systematic approach to refactoring while maintaining all existing functionality and improving code quality.