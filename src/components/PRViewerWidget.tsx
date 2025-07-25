import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Trophy, TrendingUp } from 'lucide-react';

interface PersonalRecord {
  exercise: string;
  weight: number;
  reps: number;
  date: Date;
  isNewPR?: boolean;
  progression: number[]; // Array of weights for sparkline
}

interface PRViewerWidgetProps {
  personalRecords?: PersonalRecord[];
}

export const PRViewerWidget: React.FC<PRViewerWidgetProps> = ({ 
  personalRecords = []
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Mock PR data if none provided
  const mockPRs: PersonalRecord[] = [
    {
      exercise: 'Bench Press',
      weight: 120,
      reps: 5,
      date: new Date('2025-07-01'),
      isNewPR: true,
      progression: [90, 95, 100, 105, 115, 120]
    },
    {
      exercise: 'Squat',
      weight: 150,
      reps: 3,
      date: new Date('2025-06-28'),
      progression: [120, 125, 135, 140, 145, 150]
    },
    {
      exercise: 'Deadlift',
      weight: 180,
      reps: 1,
      date: new Date('2025-06-25'),
      progression: [150, 160, 165, 170, 175, 180]
    },
    {
      exercise: 'Overhead Press',
      weight: 70,
      reps: 8,
      date: new Date('2025-06-30'),
      progression: [50, 55, 60, 65, 68, 70]
    },
    {
      exercise: 'Barbell Row',
      weight: 95,
      reps: 6,
      date: new Date('2025-07-02'),
      progression: [70, 75, 80, 85, 90, 95]
    }
  ];

  const prs = personalRecords.length > 0 ? personalRecords : mockPRs;
  const currentPR = prs[currentIndex];

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < prs.length - 1) {
      nextPR();
    }
    if (isRightSwipe && currentIndex > 0) {
      prevPR();
    }
  };

  const nextPR = () => {
    setCurrentIndex((prev) => (prev + 1) % prs.length);
  };

  const prevPR = () => {
    setCurrentIndex((prev) => (prev - 1 + prs.length) % prs.length);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Simple sparkline component
  const Sparkline = ({ data }: { data: number[] }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 48; // 48px width
      const y = 20 - ((value - min) / range) * 16; // 20px height, 2px padding
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="50" height="20" className="text-accent">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="drop-shadow-sm"
        />
        {data.map((value, index) => {
          const x = (index / (data.length - 1)) * 48;
          const y = 20 - ((value - min) / range) * 16;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              fill="currentColor"
              className={index === data.length - 1 ? 'fill-accent' : 'fill-muted-foreground/50'}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <Card className="p-4 sm:p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
          <span className="font-semibold text-sm sm:text-base">Personal Records</span>
        </div>
        {currentPR.isNewPR && (
          <Badge variant="default" className="bg-accent text-accent-foreground animate-pulse text-xs">
            NEW!
          </Badge>
        )}
      </div>

      {/* PR Card */}
      <div
        className="relative cursor-pointer active:scale-95 transition-transform"
        onClick={toggleExpanded}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className={`
            bg-gradient-to-br from-card/50 to-muted/30 rounded-lg p-3 sm:p-4 
            border border-border/50 shadow-lg transition-all duration-300
            ${isExpanded ? 'scale-105' : 'active:scale-98'}
          `}
          style={{ minHeight: isExpanded ? '200px' : '120px' }}
        >
          {/* Exercise name */}
          <div className="text-lg sm:text-xl font-bold mb-2">{currentPR.exercise}</div>
          
          {/* PR display */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {currentPR.weight} kg
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                × {currentPR.reps} rep{currentPR.reps !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                <span className="text-xs text-muted-foreground hidden sm:inline">Trend</span>
              </div>
              <Sparkline data={currentPR.progression} />
            </div>
          </div>

          {/* Expanded details */}
          {isExpanded && (
            <div className="mt-4 p-3 bg-muted/20 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">
                Set on {currentPR.date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="text-sm">
                <div className="font-medium">Progression:</div>
                <div className="flex items-center gap-2 mt-1">
                  {currentPR.progression.map((weight, index) => (
                    <span 
                      key={index} 
                      className={`
                        text-xs px-2 py-1 rounded
                        ${index === currentPR.progression.length - 1 
                          ? 'bg-primary text-primary-foreground font-bold' 
                          : 'bg-muted text-muted-foreground'
                        }
                      `}
                    >
                      {weight}kg
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation arrows */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevPR();
              }}
              disabled={currentIndex === 0}
              className="p-1 rounded-full bg-background/80 border border-border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 -right-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextPR();
              }}
              disabled={currentIndex === prs.length - 1}
              className="p-1 rounded-full bg-background/80 border border-border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {prs.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              w-2 h-2 rounded-full transition-all duration-200
              ${index === currentIndex 
                ? 'bg-accent scale-125' 
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }
            `}
          />
        ))}
      </div>
    </Card>
  );
};