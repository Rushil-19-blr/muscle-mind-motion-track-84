import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Palette } from 'lucide-react';

export const QuickThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check current theme
    const currentTheme = document.documentElement.classList.contains('dark');
    setIsDark(currentTheme);
  }, []);

  const toggleTheme = () => {
    setIsAnimating(true);
    
    setTimeout(() => {
      const newTheme = !isDark;
      setIsDark(newTheme);
      
      if (newTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
      }
      
      setIsAnimating(false);
    }, 150);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative p-2 hover:bg-muted/50 transition-all duration-200"
    >
      <div className={`transition-all duration-300 ${isAnimating ? 'scale-0 rotate-180' : 'scale-100 rotate-0'}`}>
        {isDark ? (
          <Sun className="w-4 h-4 text-yellow-500" />
        ) : (
          <Moon className="w-4 h-4 text-blue-500" />
        )}
      </div>
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Palette className="w-4 h-4 animate-spin text-primary" />
        </div>
      )}
    </Button>
  );
};