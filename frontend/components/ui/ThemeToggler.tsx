'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSidebar } from './sidebar';

import { Button } from '@/frontend/components/ui/button';

// Memoize the entire component to prevent unnecessary re-renders
export default React.memo(function ThemeToggler() {
  const { setTheme, theme } = useTheme();
  const { position } = useSidebar();
  
  // Memoize button position to prevent re-renders
  const buttonPosition = React.useMemo(() => 
    position === 'right' ? 'left-4' : 'right-4'
  , [position]);
  
  // Handle theme toggle
  const toggleTheme = React.useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Manually update the HTML class for immediate visual feedback
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Store in localStorage (next-themes should do this, but we'll ensure it happens)
    try {
      localStorage.setItem('theme', newTheme);
    } catch (e) {
      console.error('Error saving theme to localStorage:', e);
    }
  }, [theme, setTheme]);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={`fixed top-4 ${buttonPosition} z-50`}
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
});
