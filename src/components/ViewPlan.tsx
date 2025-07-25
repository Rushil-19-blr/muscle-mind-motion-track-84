import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Target, 
  Dumbbell,
  FileText,
  List
} from 'lucide-react';
import { WorkoutPlan } from '@/services/GoogleAIService';
import { CalendarView } from '@/components/CalendarView';

interface ViewPlanProps {
  workoutPlan: WorkoutPlan | null;
  onBack: () => void;
  onModifySchedule?: () => void;
}

export const ViewPlan: React.FC<ViewPlanProps> = ({ workoutPlan, onBack, onModifySchedule }) => {
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list');

  if (!workoutPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-4">No Workout Plan Found</h2>
          <p className="text-muted-foreground mb-4">Complete your onboarding to generate a personalized workout schedule.</p>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-2 sm:p-4">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Your Workout Plan</h1>
          </div>
          
          {/* Inline Edit Button - mobile optimized */}
          {onModifySchedule && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onModifySchedule}
              className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary hover:text-primary px-3 sm:px-4 py-2 h-8 sm:h-10 rounded-full text-xs sm:text-sm" 
            >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="hidden sm:inline">Edit Schedule</span>
            <span className="sm:hidden">Edit</span>
          </Button>
          )}
        </div>

        {/* Plan Overview */}
        <Card className="p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 backdrop-blur-glass">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">{workoutPlan.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{workoutPlan.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Training Days</p>
                <p className="font-medium">{workoutPlan.days.length} days/week</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Goals</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {workoutPlan.goals.map((goal, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Program Notes */}
        {workoutPlan.notes && (
          <Card className="p-6 bg-accent/10 border-accent/20">
            <h3 className="font-semibold text-accent mb-2">Program Notes</h3>
            <p className="text-sm text-muted-foreground">{workoutPlan.notes}</p>
          </Card>
        )}

        {/* View Toggle & Content */}
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'list' | 'calendar')} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Weekly Schedule</h3>
                {workoutPlan.days.map((day, dayIndex) => (
                  <Card key={dayIndex} className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-semibold">{day.day}</h4>
                        <p className="text-primary font-medium">{day.name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {day.duration} min
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <Card key={exerciseIndex} className="p-4 bg-glass/20 border-glass-border/50">
                          <div className="flex items-start justify-between mb-3">
                            <h5 className="font-medium flex items-center gap-2">
                              <Dumbbell className="w-4 h-4 text-primary" />
                              {exercise.name}
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {exercise.muscleGroups.map((muscle, muscleIndex) => (
                                <Badge key={muscleIndex} variant="outline" className="text-xs">
                                  {muscle}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-2">
                            <div>
                              <span className="text-muted-foreground">Sets:</span>
                              <span className="ml-1 font-medium">{exercise.sets}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Reps:</span>
                              <span className="ml-1 font-medium">{exercise.reps}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Weight:</span>
                              <span className="ml-1 font-medium">{exercise.weight}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Rest:</span>
                              <span className="ml-1 font-medium">{exercise.restTime}</span>
                            </div>
                          </div>
                          
                          {exercise.notes && (
                            <p className="text-xs text-muted-foreground italic mt-2">
                              {exercise.notes}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <div className="flex justify-center">
              <CalendarView workoutPlan={workoutPlan} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};