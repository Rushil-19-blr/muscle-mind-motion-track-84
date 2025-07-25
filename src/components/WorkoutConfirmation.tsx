import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Play } from 'lucide-react';

interface WorkoutConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
  workoutName: string;
  exercises: number;
  duration: number;
}

export const WorkoutConfirmation: React.FC<WorkoutConfirmationProps> = ({
  onConfirm,
  onCancel,
  workoutName,
  exercises,
  duration
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartWorkout = () => {
    setIsStarting(true);
    setCountdown(5);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      onConfirm();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onConfirm]);

  const circumference = 2 * Math.PI * 45; // radius of 45
  const strokeDasharray = circumference;
  const strokeDashoffset = countdown !== null 
    ? circumference - (circumference * (5 - countdown)) / 5 
    : circumference;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 flex items-center justify-center">
      <Card className="w-full max-w-lg p-8 bg-glass/30 backdrop-blur-glass border-glass-border shadow-elevated text-center animate-scale-in">
        <div className="space-y-6">
          {countdown !== null ? (
            // Countdown View
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Get Ready!</h2>
              
              {/* Countdown Circle */}
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="transparent"
                    className="text-muted-foreground/20"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="text-accent transition-all duration-1000 ease-linear"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-accent">{countdown}</span>
                </div>
              </div>
              
              <p className="text-lg text-muted-foreground">
                Starting your workout in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            </div>
          ) : (
            // Confirmation View
            <div className="space-y-6">
              <div className="w-16 h-16 bg-gradient-to-r from-accent to-accent-glow rounded-2xl flex items-center justify-center mx-auto">
                <Play className="w-8 h-8 text-accent-foreground" />
              </div>
              
              <h1 className="text-3xl font-bold">Ready to Start?</h1>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-accent">{workoutName}</h2>
                <p className="text-muted-foreground">
                  {exercises} exercises • {duration} minutes
                </p>
              </div>
              
              <p className="text-lg text-muted-foreground">
                Let's crush this workout! 💪
              </p>
              
              <div className="flex gap-3 justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="min-w-[120px]"
                >
                  Not Now
                </Button>
                <Button
                  variant="accent"
                  onClick={handleStartWorkout}
                  className="min-w-[120px] flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Workout
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};