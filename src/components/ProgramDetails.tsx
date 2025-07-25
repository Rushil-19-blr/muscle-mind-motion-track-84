import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Target, Dumbbell, FileText } from 'lucide-react';
import { WorkoutPlan } from '@/services/GoogleAIService';

interface ProgramDetailsProps {
  workoutPlan: WorkoutPlan;
}

export const ProgramDetails: React.FC<ProgramDetailsProps> = ({ workoutPlan }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!workoutPlan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="justify-start h-12">
          <FileText className="w-4 h-4" />
          <div className="text-left">
            <p className="font-medium">Program Details</p>
            <p className="text-xs opacity-70">View full program overview</p>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-glass/95 backdrop-blur-glass border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {workoutPlan.name}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Program Overview */}
            <Card className="p-4 bg-glass/30 backdrop-blur-glass border-glass-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <p className="text-sm text-muted-foreground">Days per week</p>
                    <p className="font-medium">{workoutPlan.days.length} days</p>
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
              <Card className="p-4 bg-accent/10 border-accent/20">
                <h3 className="font-semibold text-accent mb-2">Program Notes</h3>
                <p className="text-sm text-muted-foreground">{workoutPlan.notes}</p>
              </Card>
            )}

            {/* Workout Days */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Weekly Schedule</h3>
              {workoutPlan.days.map((day, dayIndex) => (
                <Card key={dayIndex} className="p-4 bg-glass/20 backdrop-blur-glass border-glass-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{day.day}</h4>
                      <p className="text-primary font-medium">{day.name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {day.duration} min
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="p-3 bg-glass/30 rounded-lg border border-glass-border">
                        <div className="flex items-start justify-between mb-2">
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
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
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
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {exercise.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};