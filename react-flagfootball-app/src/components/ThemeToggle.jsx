import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Get theme from localStorage or default to light
    const savedTheme = localStorage.getItem('flagfit-theme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('flagfit-theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="sm"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className="flex items-center gap-2"
    >
      {theme === 'light' ? (
        <>
          <MoonIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Dark</span>
        </>
      ) : (
        <>
          <SunIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Light</span>
        </>
      )}
    </Button>
  );
};

export default ThemeToggle; 