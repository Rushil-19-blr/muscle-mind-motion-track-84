import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Bot, 
  Edit3, 
  Save, 
  X, 
  Dumbbell, 
  Clock, 
  Target,
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  Sparkles,
  XCircle
} from 'lucide-react';
import { WorkoutPlan, Exercise, WorkoutDay } from '@/services/GoogleAIService';
import { googleAIService } from '@/services/GoogleAIService';
import { useToast } from '@/hooks/use-toast';

interface ModifyScheduleProps {
  workoutPlan: WorkoutPlan | null;
  onBack: () => void;
  onPlanUpdated: (plan: WorkoutPlan) => void;
  userData: any;
}

export const ModifySchedule: React.FC<ModifyScheduleProps> = ({
  workoutPlan,
  onBack,
  onPlanUpdated,
  userData
}) => {
  const [modificationMode, setModificationMode] = useState<'select' | 'rex' | 'manual' | 'review'>('select');
  const [rexModifications, setRexModifications] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingModification, setPendingModification] = useState<WorkoutPlan | null>(null);
  const [originalPlan, setOriginalPlan] = useState<WorkoutPlan | null>(workoutPlan);
  const [editingExercise, setEditingExercise] = useState<{
    dayIndex: number;
    exerciseIndex: number;
    exercise: Exercise;
  } | null>(null);
  const [addingExercise, setAddingExercise] = useState<{
    dayIndex: number;
    exercise: Exercise;
  } | null>(null);
  const [addingDay, setAddingDay] = useState(false);
  const [newDay, setNewDay] = useState({
    day: '',
    name: '',
    duration: 60
  });
  const [localPlan, setLocalPlan] = useState<WorkoutPlan | null>(workoutPlan);
  const [modifiedExercises, setModifiedExercises] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    type: 'exercise' | 'day';
    dayIndex: number;
    exerciseIndex?: number;
  } | null>(null);
  const { toast } = useToast();

  // Helper function to compare plans and detect changes
  const getChangeStatus = (newExercise: Exercise, newDayIndex: number) => {
    if (!originalPlan) return 'new';
    
    const originalDay = originalPlan.days[newDayIndex];
    if (!originalDay) return 'new';
    
    const originalExercise = originalDay.exercises.find(ex => ex.name === newExercise.name);
    if (!originalExercise) return 'new';
    
    // Check if exercise was modified
    if (originalExercise.sets !== newExercise.sets ||
        originalExercise.reps !== newExercise.reps ||
        originalExercise.weight !== newExercise.weight ||
        originalExercise.restTime !== newExercise.restTime) {
      return 'modified';
    }
    
    return 'unchanged';
  };

  const getRemovedExercises = () => {
    if (!originalPlan || !pendingModification) return [];
    
    const removedExercises: Array<{exercise: Exercise, dayName: string}> = [];
    
    originalPlan.days.forEach((originalDay, dayIndex) => {
      const newDay = pendingModification.days[dayIndex];
      if (newDay) {
        originalDay.exercises.forEach(originalExercise => {
          const stillExists = newDay.exercises.some(newEx => newEx.name === originalExercise.name);
          if (!stillExists) {
            removedExercises.push({
              exercise: originalExercise,
              dayName: originalDay.day
            });
          }
        });
      }
    });
    
    return removedExercises;
  };

  const handleRexModification = async () => {
    if (!rexModifications.trim() || !workoutPlan) {
      toast({
        title: "Please enter modifications",
        description: "Tell Rex what you'd like to change about your plan.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const modifiedPlan = await googleAIService.adaptWorkoutPlan(workoutPlan, rexModifications);
      setPendingModification(modifiedPlan);
      setModificationMode('review');
      toast({
        title: "Plan Modified!",
        description: "Rex has created a new version of your workout plan. Please review the changes.",
      });
    } catch (error) {
      console.error('Error modifying plan:', error);
      toast({
        title: "Error modifying plan",
        description: "Please try again or use manual editing.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveModification = async () => {
    if (pendingModification) {
      // Re-estimate durations for all days after Rex modifications
      const updatedPlan = { ...pendingModification };
      updatedPlan.days = updatedPlan.days.map(day => ({
        ...day,
        duration: estimateDurationFromExercises(day.exercises)
      }));
      
      onPlanUpdated(updatedPlan);
      setModificationMode('select');
      setPendingModification(null);
      setRexModifications('');
      toast({
        title: "Plan Updated! 🎉",
        description: "Your workout plan has been successfully modified.",
      });
    }
  };

  const handleRejectModification = () => {
    setPendingModification(null);
    setModificationMode('rex');
    toast({
      title: "Changes Rejected",
      description: "Your original workout plan remains unchanged.",
    });
  };

  const handleExerciseEdit = (dayIndex: number, exerciseIndex: number) => {
    if (!localPlan) return;
    
    const exercise = localPlan.days[dayIndex].exercises[exerciseIndex];
    setEditingExercise({ dayIndex, exerciseIndex, exercise: { ...exercise } });
  };

  const handleAddExercise = (dayIndex: number) => {
    const newExercise: Exercise = {
      name: '',
      sets: 3,
      reps: '8-12',
      weight: '',
      restTime: '60-90 seconds',
      notes: '',
      muscleGroups: []
    };
    setAddingExercise({ dayIndex, exercise: newExercise });
  };

  const saveNewExercise = async () => {
    if (!addingExercise || !localPlan || !addingExercise.exercise.name.trim()) {
      toast({
        title: "Exercise name required",
        description: "Please enter an exercise name.",
        variant: "destructive",
      });
      return;
    }

    const updatedPlan = { ...localPlan };
    updatedPlan.days[addingExercise.dayIndex].exercises.push(addingExercise.exercise);
    
    // Update duration for this day based on new exercise count
    const dayExercises = updatedPlan.days[addingExercise.dayIndex].exercises;
    updatedPlan.days[addingExercise.dayIndex].duration = estimateDurationFromExercises(dayExercises);
    
    setLocalPlan(updatedPlan);
    setAddingExercise(null);
    
    toast({
      title: "Exercise Added",
      description: "New exercise has been added successfully.",
    });
  };

  const handleAddDay = () => {
    if (!localPlan) return;
    
    if (localPlan.days.length >= 7) {
      toast({
        title: "Maximum days reached",
        description: "You can't add more than 7 workout days.",
        variant: "destructive",
      });
      return;
    }
    
    setAddingDay(true);
  };

  const sortDaysByWeekOrder = (days: WorkoutDay[]): WorkoutDay[] => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.sort((a, b) => {
      const indexA = dayOrder.indexOf(a.day);
      const indexB = dayOrder.indexOf(b.day);
      return indexA - indexB;
    });
  };

  const estimateDurationFromExercises = (exercises: Exercise[]): number => {
    if (exercises.length === 0) return 0; // No duration for empty day
    
    let totalDuration = 0;
    let warmupCooldown = 10; // Base warm-up/cool-down time
    
    exercises.forEach(exercise => {
      // Check for explicit duration in reps field (e.g., "30 minutes", "45 mins")
      const repsDurationMatch = exercise.reps.match(/(\d+)\s*(min|minutes?|mins?)/i);
      if (repsDurationMatch) {
        totalDuration += parseInt(repsDurationMatch[1]) * exercise.sets;
        return;
      }
      
      // Check for explicit duration in weight field (e.g., "10 minutes", "5 mins")
      const weightDurationMatch = exercise.weight.match(/(\d+)\s*(min|minutes?|mins?)/i);
      if (weightDurationMatch) {
        totalDuration += parseInt(weightDurationMatch[1]) * exercise.sets;
        // Add rest time between sets if specified
        const restMatch = exercise.restTime.match(/(\d+)/);
        if (restMatch && exercise.sets > 1) {
          const restSeconds = parseInt(restMatch[0]);
          const restMinutes = Math.ceil(restSeconds / 60);
          totalDuration += restMinutes * (exercise.sets - 1);
        }
        return;
      }
      
      // Check for time-based reps (e.g., "60 seconds", "2 minutes")
      const timeMatch = exercise.reps.match(/(\d+)\s*(sec|seconds?|secs?)/i);
      if (timeMatch) {
        const timeInMinutes = Math.ceil(parseInt(timeMatch[1]) / 60);
        totalDuration += timeInMinutes * exercise.sets;
        // Add rest time between sets
        const restMatch = exercise.restTime.match(/(\d+)/);
        if (restMatch && exercise.sets > 1) {
          totalDuration += Math.ceil(parseInt(restMatch[0]) / 60) * (exercise.sets - 1);
        }
        return;
      }
      
      // For regular strength exercises with sets and reps
      const repsMatch = exercise.reps.match(/(\d+)/);
      if (repsMatch) {
        // Estimate time per set based on rep count (roughly 2-3 seconds per rep)
        const reps = parseInt(repsMatch[0]);
        const timePerSet = Math.max(1, Math.ceil(reps * 0.05)); // Convert to minutes
        totalDuration += timePerSet * exercise.sets;
        
        // Add rest time between sets
        const restMatch = exercise.restTime.match(/(\d+)/);
        if (restMatch && exercise.sets > 1) {
          const restMinutes = Math.ceil(parseInt(restMatch[0]) / 60);
          totalDuration += restMinutes * (exercise.sets - 1);
        }
      } else {
        // Fallback for exercises without clear rep structure
        totalDuration += 2 * exercise.sets;
      }
    });
    
    return Math.round(totalDuration + warmupCooldown);
  };

  const estimateDurationWithAI = async (exercises: Exercise[]): Promise<number> => {
    if (exercises.length === 0) return 0; // No duration for empty day
    
    // First try the improved local estimation
    const localEstimate = estimateDurationFromExercises(exercises);
    
    // For most cases, the local estimation should be sufficient
    // Only use AI for complex scenarios or as fallback
    try {
      const exerciseData = exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        restTime: ex.restTime,
        muscleGroups: ex.muscleGroups
      }));
      
      const prompt = `Estimate the total workout duration in minutes for these exercises (including warm-up and cool-down):
${exerciseData.map(ex => `- ${ex.name}: ${ex.sets} sets of ${ex.reps}, rest: ${ex.restTime}, muscles: ${ex.muscleGroups.join(', ')}`).join('\n')}

IMPORTANT: If any exercise has explicit duration in the reps field (like "30 minutes", "45 mins"), use that exact duration.

Consider:
- Warm-up time (5-10 minutes)
- Exercise execution time
- Rest periods between sets
- Cool-down/stretching (5-10 minutes)
- Transitions between exercises

Return only the estimated total duration as a number (in minutes).`;

      const response = await googleAIService.adaptWorkoutPlan({
        id: `temp-${Date.now()}`,
        name: 'Duration Estimate',
        goals: [],
        duration: '4-6 weeks',
        notes: 'Temporary plan for duration estimation',
        days: [{
          day: 'Estimate',
          name: 'Duration Calculation',
          duration: 0,
          exercises: exercises
        }]
      }, prompt);
      
      // Try to extract number from the AI response
      const durationMatch = response.name.match(/\d+/) || response.duration.match(/\d+/);
      const duration = durationMatch ? parseInt(durationMatch[0]) : 0;
      
      // Prefer local estimate if AI gives unreasonable results
      if (!duration || duration < 10 || Math.abs(duration - localEstimate) > 60) {
        return localEstimate;
      }
      
      return Math.max(10, Math.min(120, duration)); // Between 10-120 minutes
    } catch (error) {
      console.error('Error estimating duration with AI:', error);
      // Fallback to improved local calculation
      return localEstimate;
    }
  };

  const saveNewDay = async () => {
    if (!localPlan || !newDay.day.trim() || !newDay.name.trim()) {
      toast({
        title: "Day information required",
        description: "Please enter day and workout name.",
        variant: "destructive",
      });
      return;
    }

    const updatedPlan = { ...localPlan };
    updatedPlan.days.push({
      day: newDay.day,
      name: newDay.name,
      duration: estimateDurationFromExercises([]), // Start with empty exercise list
      exercises: []
    });
    
    // Sort days in proper order
    updatedPlan.days = sortDaysByWeekOrder(updatedPlan.days);
    
    setLocalPlan(updatedPlan);
    setAddingDay(false);
    setNewDay({ day: '', name: '', duration: 60 });
    
    toast({
      title: "Day Added",
      description: "New workout day has been added successfully.",
    });
  };

  const handleDeleteExercise = (dayIndex: number, exerciseIndex: number) => {
    setShowDeleteConfirm({ type: 'exercise', dayIndex, exerciseIndex });
  };

  const handleDeleteDay = (dayIndex: number) => {
    setShowDeleteConfirm({ type: 'day', dayIndex });
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm || !localPlan) return;

    const updatedPlan = { ...localPlan };
    
    if (showDeleteConfirm.type === 'exercise' && showDeleteConfirm.exerciseIndex !== undefined) {
      updatedPlan.days[showDeleteConfirm.dayIndex].exercises.splice(showDeleteConfirm.exerciseIndex, 1);
      
      // Update duration for this day after exercise deletion
      const dayExercises = updatedPlan.days[showDeleteConfirm.dayIndex].exercises;
      updatedPlan.days[showDeleteConfirm.dayIndex].duration = estimateDurationFromExercises(dayExercises);
      
      toast({
        title: "Exercise Deleted",
        description: "Exercise has been removed successfully.",
      });
    } else if (showDeleteConfirm.type === 'day') {
      updatedPlan.days.splice(showDeleteConfirm.dayIndex, 1);
      toast({
        title: "Day Deleted",
        description: "Workout day has been removed successfully.",
      });
    }
    
    setLocalPlan(updatedPlan);
    setShowDeleteConfirm(null);
  };

  const saveExerciseEdit = async () => {
    if (!editingExercise || !localPlan) return;

    const updatedPlan = { ...localPlan };
    updatedPlan.days[editingExercise.dayIndex].exercises[editingExercise.exerciseIndex] = editingExercise.exercise;
    
    // Update duration for this day based on current exercise count
    const dayExercises = updatedPlan.days[editingExercise.dayIndex].exercises;
    updatedPlan.days[editingExercise.dayIndex].duration = estimateDurationFromExercises(dayExercises);
    
    const exerciseKey = `${editingExercise.dayIndex}-${editingExercise.exerciseIndex}`;
    setModifiedExercises(prev => new Set(prev).add(exerciseKey));
    
    setTimeout(() => {
      setModifiedExercises(prev => {
        const newSet = new Set(prev);
        newSet.delete(exerciseKey);
        return newSet;
      });
    }, 3000);
    
    setLocalPlan(updatedPlan);
    setEditingExercise(null);
    
    toast({
      title: "Exercise Updated",
      description: "Your exercise has been modified successfully.",
    });
  };

  const savePlan = () => {
    if (localPlan) {
      onPlanUpdated(localPlan);
      toast({
        title: "Plan Saved! 💾",
        description: "Your modified workout plan has been saved.",
      });
    }
  };

  if (!workoutPlan) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center ml-16">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Workout Plan Found</h2>
          <p className="text-muted-foreground mb-4">Please complete onboarding first.</p>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  // Selection Mode - Choose modification type
  if (modificationMode === 'select') {
    return (
      <div className="min-h-screen bg-background p-4 ml-16">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Modify Your Schedule</h1>
          </div>

          {/* Current Plan Display */}
          <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
            <h2 className="text-xl font-semibold mb-4">Current Plan: {workoutPlan.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Training Days</p>
                  <p className="font-medium">{workoutPlan.days.length} days/week</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{workoutPlan.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Goals</p>
                  <div className="flex flex-wrap gap-1">
                    {workoutPlan.goals.map((goal, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Weekly Schedule Overview */}
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {workoutPlan.days.map((day, dayIndex) => (
                  <div key={dayIndex} className="flex items-center justify-between p-3 bg-glass/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="min-w-[60px] justify-center">
                        {day.day}
                      </Badge>
                      <div>
                        <p className="font-medium">{day.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {day.exercises.length} exercises
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {day.duration} min
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Modification Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Rex AI Modification */}
            <Card className="p-8 bg-glass/30 backdrop-blur-glass border-glass-border hover:shadow-elevated transition-all duration-300 cursor-pointer group"
                  onClick={() => setModificationMode('rex')}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-accent to-accent-glow rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Bot className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Suggest Changes with Rex</h3>
                <p className="text-muted-foreground">
                  Tell Rex what you'd like to change about your current plan and let AI suggest intelligent modifications.
                </p>
                <Button variant="accent" className="w-full">
                  Use Rex AI
                </Button>
              </div>
            </Card>

            {/* Manual Edit */}
            <Card className="p-8 bg-glass/30 backdrop-blur-glass border-glass-border hover:shadow-elevated transition-all duration-300 cursor-pointer group"
                  onClick={() => setModificationMode('manual')}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Edit3 className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Manual Edit</h3>
                <p className="text-muted-foreground">
                  Manually edit individual exercises, sets, reps, and weights in your schedule.
                </p>
                <Button variant="default" className="w-full">
                  Edit Manually
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Rex AI Modification Mode
  if (modificationMode === 'rex') {
    return (
      <div className="min-h-screen bg-background p-4 ml-16">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setModificationMode('select')} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-accent" />
              <h1 className="text-3xl font-bold">Modify with Rex AI</h1>
            </div>
          </div>

          {/* Rex Modification Interface */}
          <Card className="p-8 bg-glass/30 backdrop-blur-glass border-glass-border">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-accent to-accent-glow rounded-2xl flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-accent-foreground" />
                </div>
                <h2 className="text-2xl font-bold">Tell Rex What to Change</h2>
                <p className="text-muted-foreground">
                  Describe what you'd like to modify about your current workout plan
                </p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="modifications">What would you like to change?</Label>
                <Textarea
                  id="modifications"
                  placeholder="E.g., I want more cardio, replace deadlifts with rack pulls, add more arm exercises, train 5 days instead of 4, focus more on upper body..."
                  value={rexModifications}
                  onChange={(e) => setRexModifications(e.target.value)}
                  className="min-h-[120px]"
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleRexModification} 
                    disabled={isLoading || !rexModifications.trim()}
                    variant="accent"
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
                    onClick={() => setModificationMode('select')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>


            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Plan Review Mode - Show modified plan for approval
  if (modificationMode === 'review' && pendingModification) {
    return (
      <div className="min-h-screen bg-background p-4 ml-16">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pr-32">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setModificationMode('rex')} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-accent" />
                <h1 className="text-3xl font-bold">Review Modified Plan</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRejectModification} variant="outline" className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Cancel Changes
              </Button>
              <Button onClick={handleApproveModification} variant="accent" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Approve Plan
              </Button>
            </div>
          </div>

          {/* Modification Summary */}
          <Card className="p-4 bg-accent/10 border-accent/20">
            <h3 className="font-semibold text-accent mb-2">Rex's Modifications</h3>
            <p className="text-sm text-muted-foreground">
              Based on your request: "{rexModifications}"
            </p>
          </Card>

          {/* Legend */}
          <Card className="p-4 bg-glass/20 backdrop-blur-glass border-glass-border">
            <h3 className="font-semibold mb-3">Changes Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success/20 border border-success/40 rounded"></div>
                <span className="text-success">New exercises</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-warning/20 border border-warning/40 rounded"></div>
                <span className="text-warning">Modified exercises</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive/20 border border-destructive/40 rounded"></div>
                <span className="text-destructive">Removed exercises</span>
              </div>
            </div>
          </Card>

          {/* Removed Exercises (if any) */}
          {getRemovedExercises().length > 0 && (
            <Card className="p-4 bg-destructive/10 border-destructive/20">
              <h3 className="font-semibold text-destructive mb-3">Removed Exercises</h3>
              <div className="space-y-2">
                {getRemovedExercises().map((item, index) => (
                  <div key={index} className="p-2 bg-destructive/20 rounded text-sm">
                    <span className="font-medium">{item.exercise.name}</span>
                    <span className="text-destructive/80 ml-2">from {item.dayName}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Modified Plan with Change Indicators */}
          <ScrollArea className="h-[50vh]">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Modified Plan</h3>
              {pendingModification.days.map((day, dayIndex) => (
                <Card key={dayIndex} className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-semibold">{day.day}</h4>
                      <p className="text-accent font-medium">{day.name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {day.duration} min
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {day.exercises.map((exercise, exerciseIndex) => {
                      const changeStatus = getChangeStatus(exercise, dayIndex);
                      
                      return (
                        <Card 
                          key={exerciseIndex} 
                          className={`p-4 border-2 transition-all ${
                            changeStatus === 'new' 
                              ? 'bg-success/10 border-success/40' 
                              : changeStatus === 'modified'
                              ? 'bg-warning/10 border-warning/40'
                              : 'bg-glass/20 border-glass-border/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h5 className="font-medium flex items-center gap-2">
                              <Dumbbell className="w-4 h-4 text-primary" />
                              {exercise.name}
                              {changeStatus === 'new' && (
                                <Badge className="bg-success text-success-foreground text-xs">NEW</Badge>
                              )}
                              {changeStatus === 'modified' && (
                                <Badge className="bg-warning text-warning-foreground text-xs">MODIFIED</Badge>
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
                        </Card>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Manual Edit Mode
  if (modificationMode === 'manual') {
    return (
      <div className="min-h-screen bg-background p-4 ml-16">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pr-32">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setModificationMode('select')} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-bold">Manual Edit</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddDay} variant="secondary" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Day
              </Button>
              <Button onClick={savePlan} variant="accent" className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Workout Days */}
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6">
              {localPlan?.days.map((day, dayIndex) => (
                <Card key={dayIndex} className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{day.day}</h3>
                      <p className="text-primary font-medium">{day.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {day.duration} min
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddExercise(dayIndex)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Exercise
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDay(dayIndex)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete Day
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {day.exercises.map((exercise, exerciseIndex) => {
                      const exerciseKey = `${dayIndex}-${exerciseIndex}`;
                      const isModified = modifiedExercises.has(exerciseKey);
                      
                      return (
                        <Card 
                          key={exerciseIndex} 
                          className={`p-4 border-glass-border/50 transition-all duration-300 ${
                            isModified ? 'bg-accent/10 border-accent/30 shadow-glow' : 'bg-glass/20'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <Dumbbell className="w-4 h-4 text-primary" />
                              {exercise.name}
                            </h4>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExerciseEdit(dayIndex, exerciseIndex)}
                                className="flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteExercise(dayIndex, exerciseIndex)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </Button>
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
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {exercise.muscleGroups.map((muscle, muscleIndex) => (
                              <Badge key={muscleIndex} variant="outline" className="text-xs">
                                {muscle}
                              </Badge>
                            ))}
                          </div>
                          
                          {exercise.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              {exercise.notes}
                            </p>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Exercise Edit Dialog */}
        {editingExercise && (
          <Dialog open={!!editingExercise} onOpenChange={() => setEditingExercise(null)}>
            <DialogContent className="max-w-md bg-glass/95 backdrop-blur-glass border-glass-border">
              <DialogHeader>
                <DialogTitle>Edit Exercise</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exerciseName">Exercise Name</Label>
                  <Input
                    id="exerciseName"
                    placeholder="Enter exercise name"
                    value={editingExercise.exercise.name}
                    onChange={(e) => setEditingExercise(prev => prev ? {
                      ...prev,
                      exercise: { ...prev.exercise, name: e.target.value }
                    } : null)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sets">Sets</Label>
                    <Input
                      id="sets"
                      type="number"
                      placeholder="3"
                      value={editingExercise.exercise.sets}
                      onChange={(e) => setEditingExercise(prev => prev ? {
                        ...prev,
                        exercise: { ...prev.exercise, sets: parseInt(e.target.value) || 0 }
                      } : null)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reps">Reps</Label>
                    <Input
                      id="reps"
                      placeholder="8-12"
                      value={editingExercise.exercise.reps}
                      onChange={(e) => setEditingExercise(prev => prev ? {
                        ...prev,
                        exercise: { ...prev.exercise, reps: e.target.value }
                      } : null)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      placeholder="60kg or bodyweight"
                      value={editingExercise.exercise.weight}
                      onChange={(e) => setEditingExercise(prev => prev ? {
                        ...prev,
                        exercise: { ...prev.exercise, weight: e.target.value }
                      } : null)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="restTime">Rest Time</Label>
                    <Input
                      id="restTime"
                      placeholder="60-90 seconds"
                      value={editingExercise.exercise.restTime}
                      onChange={(e) => setEditingExercise(prev => prev ? {
                        ...prev,
                        exercise: { ...prev.exercise, restTime: e.target.value }
                      } : null)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Form cues and tips"
                    value={editingExercise.exercise.notes}
                    onChange={(e) => setEditingExercise(prev => prev ? {
                      ...prev,
                      exercise: { ...prev.exercise, notes: e.target.value }
                    } : null)}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingExercise(null)}>
                  Cancel
                </Button>
                <Button onClick={saveExerciseEdit} variant="accent">
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Exercise Dialog */}
        {addingExercise && (
          <Dialog open={!!addingExercise} onOpenChange={() => setAddingExercise(null)}>
            <DialogContent className="max-w-md bg-glass/95 backdrop-blur-glass border-glass-border">
              <DialogHeader>
                <DialogTitle>Add New Exercise</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newExerciseName">Exercise Name</Label>
                  <Input
                    id="newExerciseName"
                    placeholder="Enter exercise name"
                    value={addingExercise.exercise.name}
                    onChange={(e) => setAddingExercise(prev => prev ? {
                      ...prev,
                      exercise: { ...prev.exercise, name: e.target.value }
                    } : null)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newSets">Sets</Label>
                    <Input
                      id="newSets"
                      type="number"
                      placeholder="3"
                      value={addingExercise.exercise.sets}
                      onChange={(e) => setAddingExercise(prev => prev ? {
                        ...prev,
                        exercise: { ...prev.exercise, sets: parseInt(e.target.value) || 0 }
                      } : null)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newReps">Reps</Label>
                    <Input
                      id="newReps"
                      placeholder="8-12"
                      value={addingExercise.exercise.reps}
                      onChange={(e) => setAddingExercise(prev => prev ? {
                        ...prev,
                        exercise: { ...prev.exercise, reps: e.target.value }
                      } : null)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newWeight">Weight</Label>
                    <Input
                      id="newWeight"
                      placeholder="60kg or bodyweight"
                      value={addingExercise.exercise.weight}
                      onChange={(e) => setAddingExercise(prev => prev ? {
                        ...prev,
                        exercise: { ...prev.exercise, weight: e.target.value }
                      } : null)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newRestTime">Rest Time</Label>
                    <Input
                      id="newRestTime"
                      placeholder="60-90 seconds"
                      value={addingExercise.exercise.restTime}
                      onChange={(e) => setAddingExercise(prev => prev ? {
                        ...prev,
                        exercise: { ...prev.exercise, restTime: e.target.value }
                      } : null)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newNotes">Notes</Label>
                  <Textarea
                    id="newNotes"
                    placeholder="Form cues and tips"
                    value={addingExercise.exercise.notes}
                    onChange={(e) => setAddingExercise(prev => prev ? {
                      ...prev,
                      exercise: { ...prev.exercise, notes: e.target.value }
                    } : null)}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setAddingExercise(null)}>
                  Cancel
                </Button>
                <Button onClick={saveNewExercise} variant="accent">
                  Add Exercise
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Day Dialog */}
        {addingDay && (
          <Dialog open={addingDay} onOpenChange={setAddingDay}>
            <DialogContent className="max-w-md bg-glass/95 backdrop-blur-glass border-glass-border">
              <DialogHeader>
                <DialogTitle>Add New Workout Day</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dayName">Day</Label>
                  <Select value={newDay.day} onValueChange={(value) => setNewDay(prev => ({ ...prev, day: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                     <SelectContent>
                       {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                         const isDisabled = localPlan?.days.some(existingDay => existingDay.day === day);
                         return (
                           <SelectItem 
                             key={day} 
                             value={day} 
                             disabled={isDisabled}
                           >
                             {day} {isDisabled && '(Already scheduled)'}
                           </SelectItem>
                         );
                       })}
                     </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="workoutName">Workout Name</Label>
                  <Input
                    id="workoutName"
                    placeholder="e.g., Upper Body Strength"
                    value={newDay.name}
                    onChange={(e) => setNewDay(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                 <div className="space-y-2">
                   <Label className="text-sm text-muted-foreground">Duration</Label>
                   <p className="text-sm text-muted-foreground">
                     Duration will be automatically estimated based on exercises added to this day.
                   </p>
                 </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setAddingDay(false)}>
                  Cancel
                </Button>
                <Button onClick={saveNewDay} variant="accent">
                  Add Day
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
            <DialogContent className="max-w-md bg-glass/95 backdrop-blur-glass border-glass-border">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Are you sure you want to delete this {showDeleteConfirm.type}? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button onClick={confirmDelete} variant="destructive">
                  Delete {showDeleteConfirm.type === 'exercise' ? 'Exercise' : 'Day'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  return null;
};