# Tailwind Configuration Merge Guide

## Custom Colors to Add

Add these custom colors to your existing `tailwind.config.js` under `theme.extend.colors`:

```javascript
colors: {
  'teal-heart': '#10b981',
  'accent-lime': '#34d399',
  'deep-green': '#059669',
  'bg-black': '#15141f',
  'secondary-dark': '#1c1b2d',
  'success-green': '#4ade80',
}
```

## Custom Animations to Add

Add these animations to your existing `tailwind.config.js` under `theme.extend.animation`:

```javascript
animation: {
  'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
  'float': 'float 3s ease-in-out infinite',
  'slide-up': 'slide-up 0.5s ease-out',
}
```

## Custom Keyframes to Add

Add these keyframes to your existing `tailwind.config.js` under `theme.extend.keyframes`:

```javascript
keyframes: {
  'glow-pulse': {
    '0%, 100%': {
      boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
    },
    '50%': {
      boxShadow: '0 0 40px rgba(16, 185, 129, 0.8), 0 0 60px rgba(52, 211, 153, 0.4)',
    },
  },
  'float': {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-20px)' },
  },
  'slide-up': {
    '0%': { transform: 'translateY(30px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
}
```

## Dark Mode Setting

Ensure your tailwind config has dark mode enabled:

```javascript
darkMode: 'class',
```

## Complete Example

Here's what your merged config should look like:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ... your existing colors
        'teal-heart': '#10b981',
        'accent-lime': '#34d399',
        'deep-green': '#059669',
        'bg-black': '#15141f',
        'secondary-dark': '#1c1b2d',
        'success-green': '#4ade80',
      },
      animation: {
        // ... your existing animations
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        // ... your existing keyframes
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(16, 185, 129, 0.8), 0 0 60px rgba(52, 211, 153, 0.4)',
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
          },
      },
    },
  },
  plugins: [
    // ... your existing plugins
  ],
};
```
