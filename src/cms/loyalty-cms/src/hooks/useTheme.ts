import { useEffect, useState } from 'react';

const THEMES = {
  dark: 'libraries/components/src/assets/layout/styles/theme/ioc-dark/theme.css',
  light: 'libraries/components/src/assets/layout/styles/theme/ioc-light/theme.css',
};

const useTheme = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Get the theme from localStorage or default to 'dark'
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    // Dynamically load the theme CSS file
    const themeLink = document.getElementById('app-theme') as HTMLLinkElement;

    if (themeLink) {
      themeLink.href = THEMES[theme];
    } else {
      // Create a <link> element to load the theme CSS
      const link = document.createElement('link');
      link.id = 'app-theme';
      link.rel = 'stylesheet';
      link.href = THEMES[theme];
      document.head.appendChild(link);
    }

    // Save the theme to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle between dark and light themes
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
};

export default useTheme;
