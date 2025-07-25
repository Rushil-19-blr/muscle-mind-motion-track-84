import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Zap, CheckCircle2, RotateCcw } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  emoji: string;
}

interface DailyChallengeWidgetProps {
  challenge?: Challenge;
}

const dailyChallenges: Challenge[] = [
  {
    id: 'pushups',
    title: 'Push-up Power Hour',
    description: '10 push-ups every hour',
    target: 10,
    current: 7,
    unit: 'hours',
    emoji: '💪'
  },
  {
    id: 'water',
    title: 'Hydration Station',
    description: 'Drink 8 glasses of water',
    target: 8,
    current: 5,
    unit: 'glasses',
    emoji: '💧'
  },
  {
    id: 'steps',
    title: 'Step Challenge',
    description: 'Take 10,000 steps',
    target: 10000,
    current: 6500,
    unit: 'steps',
    emoji: '👟'
  },
  {
    id: 'stretching',
    title: 'Stretch & Flex',
    description: '5 minutes of stretching',
    target: 5,
    current: 3,
    unit: 'minutes',
    emoji: '🧘‍♀️'
  }
];

export const DailyChallengeWidget: React.FC<DailyChallengeWidgetProps> = ({ 
  challenge 
}) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [currentChallenge, setCurrentChallenge] = useState<Challenge>(
    challenge || dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)]
  );

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  const progressPercentage = Math.min((currentChallenge.current / currentChallenge.target) * 100, 100);
  const isCompleted = currentChallenge.current >= currentChallenge.target;

  const handleProgress = () => {
    if (!isCompleted) {
      const increment = currentChallenge.id === 'steps' ? 100 : 1;
      setCurrentChallenge(prev => ({
        ...prev,
        current: Math.min(prev.current + increment, prev.target)
      }));
    }
  };

  const resetChallenge = () => {
    const newChallenge = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
    setCurrentChallenge(newChallenge);
  };

  return (
    <Card className="p-4 sm:p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
          <span className="font-semibold text-sm sm:text-base">Daily Challenge</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetChallenge}
            className="p-1.5 sm:p-2 hover:bg-muted/50 h-7 w-7 sm:h-auto sm:w-auto active:scale-95 transition-transform"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
            {timeLeft} left
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{currentChallenge.emoji}</div>
          <div>
            <h3 className="font-bold text-lg">{currentChallenge.title}</h3>
            <p className="text-sm text-muted-foreground">{currentChallenge.description}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {currentChallenge.current}/{currentChallenge.target} {currentChallenge.unit}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          
          <Progress 
            value={progressPercentage} 
            className="h-3"
          />
        </div>

        {isCompleted ? (
          <div className="flex items-center justify-center gap-2 py-2 bg-success/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="font-medium text-success">Challenge Complete! 🎉</span>
          </div>
        ) : (
          <Button 
            onClick={handleProgress}
            variant="outline"
            className="w-full h-12 sm:h-auto py-3 active:scale-95 transition-transform text-sm sm:text-base"
          >
            Mark Progress (+{currentChallenge.id === 'steps' ? '100' : '1'} {currentChallenge.id === 'steps' ? currentChallenge.unit : currentChallenge.unit.slice(0, -1)})
          </Button>
        )}
      </div>
    </Card>
  );
};