/**
 * Intelligent Dark Mode System
 * Automatically detects and applies system theme preferences
 */

(function() {
  'use strict';

  // Theme management
  const ThemeManager = {
    // Check if user has a saved preference
    getSavedTheme: function() {
      return localStorage.getItem('cv-theme');
    },

    // Save user preference
    saveTheme: function(theme) {
      localStorage.setItem('cv-theme', theme);
    },

    // Get system preference
    getSystemTheme: function() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },

    // Apply theme to document
    applyTheme: function(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        const colors = {
          light: '#6d6e8a',
          dark: '#8b8ca8'
        };
        metaThemeColor.setAttribute('content', colors[theme] || colors.light);
      }

      // Dispatch custom event for other scripts that might need to know about theme changes
      window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme: theme } 
      }));
    },

    // Initialize theme system
    init: function() {
      // Determine which theme to use
      const savedTheme = this.getSavedTheme();
      const systemTheme = this.getSystemTheme();
      const initialTheme = savedTheme || systemTheme;

      // Apply initial theme
      this.applyTheme(initialTheme);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', (e) => {
          // Only auto-switch if user hasn't set a manual preference
          if (!this.getSavedTheme()) {
            this.applyTheme(e.matches ? 'dark' : 'light');
          }
        });
      } 
      // Fallback for older browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener((e) => {
          if (!this.getSavedTheme()) {
            this.applyTheme(e.matches ? 'dark' : 'light');
          }
        });
      }

      // Optional: Add keyboard shortcut (Ctrl/Cmd + Shift + D) to toggle theme
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          this.toggleTheme();
        }
      });
    },

    // Toggle between light and dark themes
    toggleTheme: function() {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      this.applyTheme(newTheme);
      this.saveTheme(newTheme);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
  } else {
    ThemeManager.init();
  }

  // Make ThemeManager globally available for manual control
  window.CVThemeManager = ThemeManager;

  // Prevent flash of unstyled content by applying theme as early as possible
  const savedTheme = localStorage.getItem('cv-theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const initialTheme = savedTheme || systemTheme;
  
  document.documentElement.setAttribute('data-theme', initialTheme);

})();