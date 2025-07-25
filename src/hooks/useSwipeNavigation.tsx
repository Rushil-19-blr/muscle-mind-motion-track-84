import { useEffect, useRef, useCallback } from 'react';

interface SwipeNavigationProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
  velocityThreshold?: number;
}

export const useSwipeNavigation = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  velocityThreshold = 0.4
}: SwipeNavigationProps) => {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMove = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchMove.current = null;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;
    
    const touch = e.touches[0];
    touchMove.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const finalX = touchMove.current?.x || touch.clientX;
    const finalY = touchMove.current?.y || touch.clientY;
    
    const deltaX = finalX - touchStart.current.x;
    const deltaY = finalY - touchStart.current.y;
    const deltaTime = Date.now() - touchStart.current.time;
    const distance = Math.abs(deltaX);
    
    // Prevent accidental swipes during vertical scrolling
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
      touchStart.current = null;
      return;
    }

    // Calculate velocity (pixels per millisecond)
    const velocity = distance / Math.max(deltaTime, 1);
    
    // Trigger swipe if either distance or velocity threshold is met
    const shouldSwipe = distance > threshold || velocity > velocityThreshold;
    
    if (shouldSwipe && Math.abs(deltaX) > Math.abs(deltaY)) {
      // Add slight delay for smooth animation
      requestAnimationFrame(() => {
        if (deltaX > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
      });
    }

    touchStart.current = null;
    touchMove.current = null;
  }, [onSwipeLeft, onSwipeRight, threshold, velocityThreshold]);

  useEffect(() => {
    const options = { passive: true };
    
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return null;
};