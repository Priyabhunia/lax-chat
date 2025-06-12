'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSidebar } from './sidebar';

import { Button } from '@/frontend/components/ui/button';

export default function ThemeToggler() {
  const { setTheme, theme } = useTheme();
  const { position } = useSidebar();
  
  // Determine button position based on sidebar position
  const buttonPosition = position === 'right' ? 'left-4' : 'right-4';
  
  console.log('ThemeToggler rendering:', { position, buttonPosition, theme });

  // Use useEffect to log when the component mounts
  React.useEffect(() => {
    console.log('ThemeToggler mounted');
    
    // Log the button element to check if it's in the DOM
    setTimeout(() => {
      const button = document.querySelector('button[aria-label="Toggle theme"]');
      console.log('ThemeToggler button found in DOM:', !!button);
      if (button) {
        const rect = button.getBoundingClientRect();
        console.log('ThemeToggler button position:', { 
          top: rect.top, 
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      }
    }, 500);
    
    return () => {
      console.log('ThemeToggler unmounted');
    };
  }, []);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={`fixed top-4 ${buttonPosition} z-50`}
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
