import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Calendar, 
  Edit3, 
  BarChart3
} from 'lucide-react';

interface BottomNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  currentPage, 
  onNavigate 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      
      setIsScrolled(scrollingDown && currentScrollY > 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { 
      id: 'dashboard', 
      icon: Home, 
      label: 'Dashboard',
      action: () => onNavigate('dashboard')
    },
    { 
      id: 'view-schedule', 
      icon: Calendar, 
      label: 'Schedule',
      action: () => onNavigate('view-schedule')
    },
    { 
      id: 'progress-charts', 
      icon: BarChart3, 
      label: 'Charts',
      action: () => onNavigate('progress-charts')
    }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div 
        className={cn(
          "flex items-center justify-center gap-2 px-6 py-3 bg-glass/95 backdrop-blur-glass border border-glass-border rounded-full shadow-elevated transition-all duration-300 ease-in-out",
          isScrolled ? "scale-90 py-2" : "scale-100"
        )}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="icon"
              onClick={item.action}
              className={cn(
                "relative min-w-[44px] min-h-[44px] w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 p-3",
                isActive 
                  ? "bg-accent text-accent-foreground shadow-glow scale-110" 
                  : "text-muted-foreground hover:text-foreground hover:bg-glass/30",
                isScrolled && "min-w-[40px] min-h-[40px] w-10 h-10"
              )}
            >
              <Icon className={cn(
                "transition-all duration-300",
                isScrolled ? "w-4 h-4" : "w-5 h-5"
              )} />
              
              {/* Active indicator glow */}
              {isActive && (
                <div className="absolute inset-0 rounded-full bg-accent/20 animate-glow-pulse" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};