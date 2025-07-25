
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dumbbell, Clock, Target, CheckCircle2, X } from 'lucide-react';
import { WorkoutPlan } from '@/services/GoogleAIService';
import { CompletedWorkout } from '@/services/FirestoreService';

interface DailyWorkoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  workoutPlan: WorkoutPlan | null;
  completedWorkout: CompletedWorkout | null;
}

export const DailyWorkoutDialog: React.FC<DailyWorkoutDialogProps> = ({
  isOpen,
  onClose,
  date,
  workoutPlan,
  completedWorkout
}) => {
  if (!date || !workoutPlan) return null;

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const plannedWorkout = workoutPlan.days.find(day => {
    const planDay = day.day.toLowerCase().trim();
    return planDay === dayName || planDay.includes(dayName) || dayName.includes(planDay);
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getExerciseCompletionData = (exerciseName: string) => {
    if (!completedWorkout) return null;
    return completedWorkout.exercises.find(ex => 
      ex.name.toLowerCase() === exerciseName.toLowerCase()
    );
  };

  if (!plannedWorkout) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{formatDate(date)}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">😴</div>
            <h3 className="text-lg font-semibold mb-2">Rest Day</h3>
            <p className="text-muted-foreground">No workout scheduled for today. Take time to recover!</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            {formatDate(date)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Workout Header */}
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{plannedWorkout.name}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {plannedWorkout.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {plannedWorkout.exercises.length} exercises
                  </span>
                </div>
              </div>
              {completedWorkout && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-medium">Completed</span>
                </div>
              )}
            </div>
          </Card>

          {/* Completion Stats */}
          {completedWorkout && (
            <Card className="p-4 bg-success/10 border-success/20">
              <h4 className="font-semibold text-success mb-3">Workout Results</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-1 font-medium">{completedWorkout.duration} min</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Volume:</span>
                  <span className="ml-1 font-medium">{completedWorkout.totalVolume.toFixed(0)} kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Exercises:</span>
                  <span className="ml-1 font-medium">{completedWorkout.exercises.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Sets:</span>
                  <span className="ml-1 font-medium">
                    {completedWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Exercises List */}
          <ScrollArea className="max-h-[50vh] overflow-y-auto">
            <div className="space-y-4">
              <h4 className="font-semibold">Exercises</h4>
              {plannedWorkout.exercises.map((exercise, index) => {
                const completionData = getExerciseCompletionData(exercise.name);
                
                return (
                  <Card key={index} className="p-4 bg-glass/20 border-glass-border/50">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h5 className="font-medium flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-primary" />
                          {exercise.name}
                          {completionData && (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          )}
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {exercise.muscleGroups.map((muscle, muscleIndex) => (
                            <Badge key={muscleIndex} variant="outline" className="text-xs">
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Planned vs Actual */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Planned */}
                        <div className="space-y-2">
                          <h6 className="text-sm font-medium text-muted-foreground">Planned</h6>
                          <div className="grid grid-cols-3 gap-2 text-sm">
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
                          </div>
                        </div>

                        {/* Actual (if completed) */}
                        {completionData && (
                          <div className="space-y-2">
                            <h6 className="text-sm font-medium text-success">Completed</h6>
                            <div className="space-y-1">
                              {completionData.sets.map((set, setIndex) => (
                                <div key={setIndex} className="flex flex-col sm:flex-row sm:justify-between text-sm bg-success/10 px-3 py-2 rounded gap-1">
                                  <span className="font-medium">Set {setIndex + 1}:</span>
                                  <span className="font-medium text-right">
                                    {set.reps} reps @ {set.weight}kg
                                    {set.restTime > 0 && (
                                      <span className="text-muted-foreground ml-2">
                                        (rest: {set.restTime}s)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {exercise.notes && (
                        <p className="text-xs text-muted-foreground italic">
                          {exercise.notes}
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
