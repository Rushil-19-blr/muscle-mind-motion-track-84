import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, RefreshCw, Share2 } from 'lucide-react';

interface Quote {
  text: string;
  author: string;
  category: 'motivation' | 'strength' | 'mindset' | 'success';
}

interface MoodBoosterWidgetProps {
  customQuotes?: Quote[];
}

const motivationalQuotes: Quote[] = [
  {
    text: "The groundwork for all happiness is good health.",
    author: "Leigh Hunt",
    category: "motivation"
  },
  {
    text: "Take care of your body. It's the only place you have to live.",
    author: "Jim Rohn",
    category: "mindset"
  },
  {
    text: "A healthy outside starts from the inside.",
    author: "Robert Urich",
    category: "mindset"
  },
  {
    text: "Your body can do it. It's your mind you need to convince.",
    author: "Unknown",
    category: "strength"
  },
  {
    text: "Fitness is not about being better than someone else. It's about being better than you used to be.",
    author: "Khloe Kardashian",
    category: "motivation"
  },
  {
    text: "The successful warrior is the average person with laser-like focus.",
    author: "Bruce Lee",
    category: "success"
  },
  {
    text: "Don't put off tomorrow what you can do today.",
    author: "Benjamin Franklin",
    category: "motivation"
  },
  {
    text: "The only bad workout is the one that didn't happen.",
    author: "Unknown",
    category: "motivation"
  },
  {
    text: "Strength does not come from physical capacity. It comes from an indomitable will.",
    author: "Mahatma Gandhi",
    category: "strength"
  },
  {
    text: "What seems impossible today will one day become your warm-up.",
    author: "Unknown",
    category: "motivation"
  }
];

export const MoodBoosterWidget: React.FC<MoodBoosterWidgetProps> = ({ 
  customQuotes = [] 
}) => {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartTime = useRef<number>(0);

  const allQuotes = [...motivationalQuotes, ...customQuotes];

  // Set initial quote and daily rotation
  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('quote-date');
    const savedQuoteIndex = localStorage.getItem('quote-index');
    
    if (savedDate === today && savedQuoteIndex) {
      // Use saved quote for today
      const index = parseInt(savedQuoteIndex);
      if (index < allQuotes.length) {
        setCurrentQuote(allQuotes[index]);
      } else {
        getRandomQuote();
      }
    } else {
      // New day, get new quote
      getRandomQuote();
    }
  }, []);

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * allQuotes.length);
    const quote = allQuotes[randomIndex];
    setCurrentQuote(quote);
    
    // Save to localStorage
    const today = new Date().toDateString();
    localStorage.setItem('quote-date', today);
    localStorage.setItem('quote-index', randomIndex.toString());
  };

  const refreshQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      getRandomQuote();
      setIsAnimating(false);
    }, 300);
  };

  const shareQuote = async () => {
    if (!currentQuote) return;
    
    const shareText = `"${currentQuote.text}" - ${currentQuote.author}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Daily Motivation',
          text: shareText,
        });
      } catch (err) {
        // Fallback to clipboard
        copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Long press handlers for mobile
  const handleTouchStart = () => {
    touchStartTime.current = Date.now();
    setIsLongPressing(false);
    
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      refreshQuote();
    }, 600); // 600ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Small delay to show animation
    setTimeout(() => {
      setIsLongPressing(false);
    }, 150);
  };

  const handleTouchCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  };

  const getCategoryEmoji = (category: Quote['category']) => {
    switch (category) {
      case 'motivation': return '🔥';
      case 'strength': return '💪';
      case 'mindset': return '🧠';
      case 'success': return '🏆';
      default: return '✨';
    }
  };

  const getCategoryColor = (category: Quote['category']) => {
    switch (category) {
      case 'motivation': return 'text-red-500';
      case 'strength': return 'text-blue-500';
      case 'mindset': return 'text-purple-500';
      case 'success': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  if (!currentQuote) {
    return (
      <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-muted-foreground">Loading inspiration...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`p-4 sm:p-6 bg-glass/30 backdrop-blur-glass border-glass-border transition-all duration-200 select-none cursor-pointer ${
        isLongPressing ? 'scale-95 bg-primary/10 shadow-lg' : 'active:scale-98 hover:bg-glass/40'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchCancel}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
          <span className="font-semibold text-sm sm:text-base">Daily Inspiration</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              shareQuote();
            }}
            className="p-1.5 sm:p-2 hover:bg-muted/50 h-7 w-7 sm:h-auto sm:w-auto"
          >
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              refreshQuote();
            }}
            className="p-1.5 sm:p-2 hover:bg-muted/50 h-7 w-7 sm:h-auto sm:w-auto"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isAnimating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <span className="text-xl sm:text-2xl">{getCategoryEmoji(currentQuote.category)}</span>
            <span className={`text-xs sm:text-sm font-medium ${getCategoryColor(currentQuote.category)}`}>
              {currentQuote.category.charAt(0).toUpperCase() + currentQuote.category.slice(1)}
            </span>
          </div>
          
          <blockquote className="text-sm sm:text-lg font-medium leading-relaxed mb-3 sm:mb-4 italic">
            "{currentQuote.text}"
          </blockquote>
          
          <div className="text-right">
            <cite className="text-xs sm:text-sm text-muted-foreground not-italic">
              — {currentQuote.author}
            </cite>
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs text-muted-foreground opacity-70">
            <span className="hidden sm:inline">Hold card to refresh • </span>
            <span className="sm:hidden">Hold to refresh • </span>
            Tap share to spread motivation
          </div>
        </div>
      </div>
    </Card>
  );
};