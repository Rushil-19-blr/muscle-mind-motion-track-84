import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, RotateCcw } from 'lucide-react';

interface CaloriesBurnedWidgetProps {
  caloriesBurned?: number;
}

interface FoodEquivalent {
  name: string;
  emoji: string;
  calories: number;
  funFact: string;
}

const foodEquivalents: FoodEquivalent[] = [
  { name: 'Apple', emoji: '🍎', calories: 95, funFact: 'That\'s like the fiber in 4 apples!' },
  { name: 'Pizza Slice', emoji: '🍕', calories: 285, funFact: 'Or the cheese on 2.5 pizza slices!' },
  { name: 'Banana', emoji: '🍌', calories: 105, funFact: 'That\'s the potassium in 6 bananas!' },
  { name: 'Donut', emoji: '🍩', calories: 250, funFact: 'Or the sugar in 3 glazed donuts!' },
  { name: 'Cookie', emoji: '🍪', calories: 150, funFact: 'That\'s like 4 chocolate chip cookies!' }
];

export const CaloriesBurnedWidget: React.FC<CaloriesBurnedWidgetProps> = ({ 
  caloriesBurned = 420 
}) => {
  const [selectedFood, setSelectedFood] = useState(0);
  const [animatedIcons, setAnimatedIcons] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const currentFood = foodEquivalents[selectedFood];
  const foodCount = Math.floor(caloriesBurned / currentFood.calories);
  const remainder = caloriesBurned % currentFood.calories;
  const fractionalPart = remainder / currentFood.calories;

  // Animate food icons appearing
  useEffect(() => {
    setAnimatedIcons([]);
    const iconCount = Math.min(foodCount + (fractionalPart > 0 ? 1 : 0), 8); // Max 8 icons for display
    
    for (let i = 0; i < iconCount; i++) {
      setTimeout(() => {
        setAnimatedIcons(prev => [...prev, i]);
      }, i * 150);
    }
  }, [foodCount, fractionalPart, selectedFood]);

  // Show confetti for high calorie burns
  useEffect(() => {
    if (caloriesBurned > 500) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [caloriesBurned]);

  const nextFood = () => {
    setSelectedFood((prev) => (prev + 1) % foodEquivalents.length);
  };

  // Long press handlers
  const handleTouchStart = () => {
    setIsLongPressing(false);
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      if (navigator.vibrate) navigator.vibrate(50);
      nextFood();
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setTimeout(() => setIsLongPressing(false), 150);
  };

  const renderFoodIcons = () => {
    const iconsToShow = Math.min(foodCount + (fractionalPart > 0 ? 1 : 0), 8);
    const icons = [];

    for (let i = 0; i < iconsToShow; i++) {
      const isPartial = i === foodCount && fractionalPart > 0;
      const isAnimated = animatedIcons.includes(i);
      
      icons.push(
        <div
          key={i}
          className={`
            text-4xl transition-all duration-300 transform
            ${isAnimated ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
            ${isPartial ? 'opacity-60' : ''}
            hover:scale-110
          `}
          style={{
            filter: isPartial ? `grayscale(${1 - fractionalPart})` : 'none'
          }}
        >
          {currentFood.emoji}
        </div>
      );
    }

    if (foodCount > 8) {
      icons.push(
        <div key="more" className="text-lg text-muted-foreground flex items-center">
          +{foodCount - 7} more
        </div>
      );
    }

    return icons;
  };

  return (
    <Card 
      className={`p-4 sm:p-6 bg-glass/30 backdrop-blur-glass border-glass-border relative overflow-hidden select-none cursor-pointer transition-all duration-200 ${
        isLongPressing ? 'scale-95 bg-primary/10' : 'active:scale-98'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1000}ms`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
          <span className="font-semibold text-sm sm:text-base">Calories Burned</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            nextFood();
          }}
          className="p-1.5 sm:p-2 hover:bg-muted/50 h-7 w-7 sm:h-auto sm:w-auto active:scale-95 transition-transform"
        >
          <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* Main calorie display */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="text-xl sm:text-3xl font-bold mb-2">
          You burned <span className="text-red-500">{caloriesBurned}</span> kcal today!
        </div>
        <div className="text-sm sm:text-lg text-muted-foreground">
          That's like {foodCount}{fractionalPart > 0 && '.5'} {currentFood.name.toLowerCase()}{foodCount !== 1 ? 's' : ''} {currentFood.emoji}
        </div>
      </div>

      {/* Food visualization */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 min-h-[50px] sm:min-h-[60px]">
        {renderFoodIcons()}
      </div>

      {/* Fun fact */}
      <div className="text-center mb-3">
        <div className="text-xs sm:text-sm text-muted-foreground italic">
          {currentFood.funFact}
        </div>
      </div>

      {/* Food selector indicators */}
      <div className="flex justify-center gap-2 mt-3 sm:mt-4">
        {foodEquivalents.map((food, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFood(index);
            }}
            className={`
              w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full transition-colors duration-200 active:scale-125
              ${index === selectedFood ? 'bg-primary' : 'bg-muted-foreground/30'}
            `}
          />
        ))}
      </div>
      
      {/* Mobile hint */}
      <div className="text-center mt-2 sm:hidden">
        <span className="text-xs text-muted-foreground opacity-60">
          Hold card to change food
        </span>
      </div>
    </Card>
  );
};