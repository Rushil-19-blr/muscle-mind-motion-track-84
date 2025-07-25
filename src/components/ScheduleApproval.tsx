import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Edit3, Calendar, Clock, Target, Sparkles, Dumbbell, ChevronRight } from 'lucide-react';
import { WorkoutPlan } from '@/services/GoogleAIService';
import { googleAIService } from '@/services/GoogleAIService';
import { useToast } from '@/hooks/use-toast';

interface ScheduleApprovalProps {
  workoutPlan: WorkoutPlan;
  onApprove: (plan: WorkoutPlan) => void;
  onModify: (plan: WorkoutPlan) => void;
  isOpen: boolean;
  onClose: () => void;
  showSignUp?: boolean;
}

export const ScheduleApproval: React.FC<ScheduleApprovalProps> = ({
  workoutPlan,
  onApprove,
  onModify,
  isOpen,
  onClose,
  showSignUp = false
}) => {
  const [isModifying, setIsModifying] = useState(false);
  const [modifications, setModifications] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleApprove = () => {
    onApprove(workoutPlan);
    toast({
      title: "Plan Approved! 🎉",
      description: "Your personalized workout plan is now active.",
    });
  };

  const handleModify = async () => {
    if (!modifications.trim()) {
      toast({
        title: "Please enter modifications",
        description: "Tell us what you'd like to change about your plan.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const modifiedPlan = await googleAIService.adaptWorkoutPlan(workoutPlan, modifications);
      onModify(modifiedPlan);
      setIsModifying(false);
      setModifications('');
      toast({
        title: "Plan Modified! ✨",
        description: "Your workout plan has been updated based on your feedback.",
      });
    } catch (error) {
      toast({
        title: "Error modifying plan",
        description: "Please try again or approve the current plan.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 flex items-center justify-center">
      <Card className="w-full max-w-6xl max-h-[90vh] bg-glass/95 backdrop-blur-glass border-glass-border shadow-elevated">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-accent" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Your AI-Generated Workout Plan
              </h1>
            </div>
            <p className="text-muted-foreground">
              Review your personalized plan and make any adjustments before starting
            </p>
          </div>

          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Plan Overview */}
              <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                <h3 className="text-xl font-bold mb-3">{workoutPlan.name}</h3>
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

              {/* Quick Schedule Preview */}
              <Card className="p-4 bg-glass/30 backdrop-blur-glass border-glass-border">
                <h4 className="font-semibold mb-3">Weekly Schedule</h4>
                <div className="space-y-3">
                  {workoutPlan.days.map((day, index) => (
                    <WorkoutDayCard key={index} day={day} />
                  ))}
                </div>
              </Card>

              {/* Program Notes */}
              {workoutPlan.notes && (
                <Card className="p-4 bg-accent/10 border-accent/20">
                  <h4 className="font-semibold text-accent mb-2">Program Notes</h4>
                  <p className="text-sm text-muted-foreground">{workoutPlan.notes}</p>
                </Card>
              )}

              {/* Modification Section */}
              {isModifying && (
                <Card className="p-4 bg-glass/30 backdrop-blur-glass border-glass-border">
                  <h4 className="font-semibold mb-3">Modify Your Plan</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="modifications">
                        What would you like to change about this plan?
                      </Label>
                      <Textarea
                        id="modifications"
                        placeholder="E.g., I want more cardio, replace deadlifts with rack pulls, add more arm exercises, train 5 days instead of 4..."
                        value={modifications}
                        onChange={(e) => setModifications(e.target.value)}
                        className="mt-2 min-h-[100px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleModify} 
                        disabled={isLoading}
                        className="flex items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate Modified Plan
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsModifying(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-glass-border mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsModifying(true)}
              disabled={isModifying || isLoading}
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Modify Plan
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Back to Onboarding
              </Button>
              <Button 
                variant="accent" 
                onClick={handleApprove}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {showSignUp ? "Create Account & Save Plan" : "Approve & Start"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

interface WorkoutDayCardProps {
  day: any;
}

const WorkoutDayCard: React.FC<WorkoutDayCardProps> = ({ day }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="bg-glass/20 backdrop-blur-glass border-glass-border overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-glass/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="min-w-[80px] justify-center">
              {day.day}
            </Badge>
            <div>
              <p className="font-medium text-primary">{day.name}</p>
              <p className="text-xs text-muted-foreground">
                {day.exercises.length} exercises • {day.duration}min
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{day.duration} min</span>
            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-glass-border/50">
          <div className="space-y-3 mt-3">
            {day.exercises.map((exercise: any, exerciseIndex: number) => (
              <div key={exerciseIndex} className="p-3 bg-glass/30 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    {exercise.name}
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {exercise.muscleGroups.map((muscle: string, muscleIndex: number) => (
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
                  <p className="text-xs text-muted-foreground italic">
                    {exercise.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};