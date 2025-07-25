import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  currentPage: string;
  direction?: 'left' | 'right' | 'none';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  currentPage,
  direction = 'none'
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (direction !== 'none') {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 400);
      return () => clearTimeout(timer);
    }
  }, [currentPage, direction]);

  return (
    <div 
      className={cn(
        "min-h-screen transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] will-change-transform",
        isTransitioning && direction === 'left' && "transform -translate-x-full opacity-90",
        isTransitioning && direction === 'right' && "transform translate-x-full opacity-90",
        !isTransitioning && "transform translate-x-0 opacity-100"
      )}
      style={{
        backfaceVisibility: 'hidden',
        perspective: '1000px'
      }}
    >
      {children}
    </div>
  );
};