import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Dumbbell, Target, Zap, Trophy, Timer, Heart } from 'lucide-react';

const motivationalQuotes = [
  "Your body can do it. It's your mind you need to convince.",
  "The groundwork for all happiness is good health.",
  "Take care of your body. It's the only place you have to live.",
  "Fitness is not about being better than someone else. It's about being better than you used to be.",
  "The only bad workout is the one that didn't happen.",
  "Your health is an investment, not an expense.",
  "Strong is the new beautiful.",
  "Progress, not perfection.",
  "Every workout is progress.",
  "Believe in yourself and all that you are."
];

const workoutIcons = [
  { icon: Dumbbell, color: 'text-primary' },
  { icon: Target, color: 'text-secondary' },
  { icon: Zap, color: 'text-accent' },
  { icon: Trophy, color: 'text-warning' },
  { icon: Timer, color: 'text-success' },
  { icon: Heart, color: 'text-destructive' }
];

interface LoadingAnimationProps {
  message?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  message = "Generating your personalized workout plan..." 
}) => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % motivationalQuotes.length);
    }, 3000);

    const iconInterval = setInterval(() => {
      setCurrentIconIndex((prev) => (prev + 1) % workoutIcons.length);
    }, 1000);

    return () => {
      clearInterval(quoteInterval);
      clearInterval(iconInterval);
    };
  }, []);

  const CurrentIcon = workoutIcons[currentIconIndex].icon;
  const iconColor = workoutIcons[currentIconIndex].color;

  return (
    <Card className="w-full max-w-md p-8 bg-glass/30 backdrop-blur-glass border-glass-border shadow-elevated text-center">
      <div className="space-y-6">
        {/* Animated Icon */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping">
            <CurrentIcon className={`w-16 h-16 mx-auto ${iconColor} opacity-20`} />
          </div>
          <CurrentIcon className={`w-16 h-16 mx-auto ${iconColor} animate-bounce`} />
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        {/* Main Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Creating Your Plan</h2>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>

        {/* Motivational Quote */}
        <div className="min-h-[60px] flex items-center justify-center">
          <blockquote 
            key={currentQuoteIndex}
            className="text-sm italic text-accent animate-fade-in"
          >
            "{motivationalQuotes[currentQuoteIndex]}"
          </blockquote>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full bg-primary animate-pulse`}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};