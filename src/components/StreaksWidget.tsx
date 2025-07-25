import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Flame, X, Award } from 'lucide-react';

interface StreakDay {
  date: Date;
  completed: boolean;
  workoutName?: string;
  isRestDay?: boolean;
}

interface StreaksWidgetProps {
  streakData?: StreakDay[];
}

export const StreaksWidget: React.FC<StreaksWidgetProps> = ({ streakData = [] }) => {
  const [animatingDays, setAnimatingDays] = useState<Set<number>>(new Set());
  const [showTooltip, setShowTooltip] = useState<{ index: number; day: StreakDay } | null>(null);

  // Generate 14 days of data, combining real data with rest days
  const generateStreakData = (): StreakDay[] => {
    const days: StreakDay[] = [];
    const today = new Date();
    
    // Create a map of completed workouts by date for quick lookup
    const workoutMap = new Map(
      streakData.map(workout => [
        workout.date.toISOString().split('T')[0], 
        workout
      ])
    );
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Check if there's a workout for this date
      const workoutForDay = workoutMap.get(dateString);
      const isRestDay = date.getDay() === 0 || date.getDay() === 6; // Weekends as rest days
      
      days.push({
        date,
        completed: !!workoutForDay,
        workoutName: workoutForDay?.workoutName,
        isRestDay: isRestDay // A day is a rest day if it's a weekend
      });
    }
    
    return days;
  };

  const [days] = useState<StreakDay[]>(generateStreakData());

  // Animate streak fill on mount
  useEffect(() => {
    const completedDays = days.map((day, index) => day.completed ? index : -1).filter(i => i !== -1);
    
    completedDays.forEach((dayIndex, animIndex) => {
      setTimeout(() => {
        setAnimatingDays(prev => new Set([...prev, dayIndex]));
      }, animIndex * 200);
    });
  }, [days]);

  // Calculate current streak
  const calculateStreak = () => {
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].completed && !days[i].isRestDay) {
        streak++;
      } else if (!days[i].isRestDay) {
        break;
      }
    }
    return streak;
  };

  // Calculate this week's workout progress
  const calculateThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday
    endOfWeek.setHours(23, 59, 59, 999);
    
    const thisWeekDays = days.filter(day => {
      const dayTime = day.date.getTime();
      return dayTime >= startOfWeek.getTime() && dayTime <= endOfWeek.getTime();
    });
    
    const completedWorkouts = thisWeekDays.filter(d => d.completed && !d.isRestDay).length;
    const totalPlannedWorkouts = thisWeekDays.filter(d => !d.isRestDay).length;
    
    return { completedWorkouts, totalPlannedWorkouts };
  };

  const currentStreak = calculateStreak();
  const isStreakMilestone = currentStreak >= 7;
  const thisWeekProgress = calculateThisWeek();

  const handleDayClick = (index: number, day: StreakDay) => {
    if (showTooltip?.index === index) {
      setShowTooltip(null);
    } else {
      setShowTooltip({ index, day });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="p-4 sm:p-6 bg-glass/30 backdrop-blur-glass border-glass-border relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
          <span className="font-semibold text-sm sm:text-base">Workout Streak</span>
        </div>
        {isStreakMilestone && (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full">
            <Award className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
              {currentStreak >= 30 ? '30 Day Master!' : currentStreak >= 14 ? '2 Week Champion!' : '1 Week Hero!'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xl sm:text-2xl font-bold text-orange-500">{currentStreak}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">day streak</div>
        </div>
        <div className="text-right">
          <div className="text-xs sm:text-sm text-muted-foreground">This week</div>
          <div className="text-base sm:text-lg font-bold">
            {thisWeekProgress.completedWorkouts}/{thisWeekProgress.totalPlannedWorkouts}
          </div>
        </div>
      </div>

      {/* Streak visualization */}
      <div className="relative">
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 touch-pan-x">
          {days.map((day, index) => {
            const isAnimating = animatingDays.has(index);
            const dayOfWeek = day.date.toLocaleDateString('en-US', { weekday: 'short' });
            
            return (
              <div
                key={index}
                className="flex flex-col items-center gap-1 min-w-[36px] sm:min-w-[44px] cursor-pointer active:scale-95 transition-transform"
                onClick={() => handleDayClick(index, day)}
              >
                {/* Day label */}
                <div className="text-xs text-muted-foreground">
                  {dayOfWeek.slice(0, 2)}
                </div>
                
                {/* Streak circle */}
                <div
                  className={`
                    relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center
                    transition-all duration-300 transform
                    ${day.completed && !day.isRestDay
                      ? 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-500 shadow-glow' 
                      : day.isRestDay
                      ? 'bg-muted/30 border-muted-foreground/30'
                      : 'bg-transparent border-muted-foreground/30'
                    }
                    ${isAnimating ? 'scale-110 animate-glow-pulse' : 'active:scale-90'}
                  `}
                >
                  {day.completed && !day.isRestDay ? (
                    <div className="relative">
                      <img 
                        src="/lovable-uploads/5de2f87a-cf94-440e-999e-8162db28c2a0.png" 
                        alt="Flame"
                        className="w-4 h-4 sm:w-6 sm:h-6 filter brightness-110"
                      />
                      {isAnimating && (
                        <div className="absolute inset-0 w-4 h-4 sm:w-6 sm:h-6 animate-pulse">
                          <Flame className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-300" />
                        </div>
                      )}
                    </div>
                  ) : day.isRestDay ? (
                    <div className="text-xs text-muted-foreground">R</div>
                  ) : (
                    <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                  )}
                </div>
                
                {/* Date */}
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {formatDate(day.date)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-popover border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
              <div className="text-sm font-medium">
                {formatDate(showTooltip.day.date)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {showTooltip.day.isRestDay
                  ? 'Rest Day 😴'
                  : showTooltip.day.completed
                  ? `${showTooltip.day.workoutName} completed 🔥`
                  : 'Workout missed ❌'
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};