# Dark Mode Implementation

This CV now includes intelligent dark mode support that automatically detects and responds to your system's theme preferences.

## Features

### 🌙 Automatic System Detection
- Automatically detects your system's dark/light mode preference
- Switches themes seamlessly when you change your system settings
- No manual configuration required

### 🎨 Smooth Transitions
- Smooth color transitions between themes (0.3s ease)
- Respects `prefers-reduced-motion` for accessibility
- Maintains visual hierarchy in both themes

### 💾 User Preference Memory
- Remembers your manual theme choice in localStorage
- Manual selection overrides system preference
- Persists across browser sessions

### ⌨️ Keyboard Shortcut
- Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac) to toggle themes
- Accessible and quick theme switching

## Theme Colors

### Light Mode (Ceramic)
- Primary: `#6d6e8a`
- Text: `#3F4650`
- Background: `#f5f5f5`

### Dark Mode
- Primary: `#8b8ca8`
- Text: `#e4e6ea`
- Background: `#1a1d23`

## Optional Theme Toggle Button

If you want to add a visible theme toggle button to the sidebar, include this in your sidebar:

```html
{% include theme-toggle.html %}
```

Add this line to `_includes/sidebar.html` where you want the toggle button to appear.

## PDF Generation

The PDF generation automatically uses light mode for optimal print quality and readability, regardless of the current theme setting.

## Browser Support

- Modern browsers with CSS custom properties support
- Graceful fallback for older browsers
- Works with `prefers-color-scheme` media query

## Technical Implementation

The dark mode system uses:
- CSS custom properties (CSS variables) for theme switching
- JavaScript for system preference detection
- localStorage for user preference persistence
- Smooth CSS transitions for theme changes

## Accessibility

- Maintains proper contrast ratios in both themes
- Respects user's motion preferences
- Keyboard accessible theme switching
- Screen reader friendly (proper ARIA labels)